const express = require('express');
const bodyParser = require('body-parser');
const { graphqlExpress } = require('graphql-server-express');
const { makeExecutableSchema } = require('graphql-tools');
const { createServer } = require('http');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const cors = require('cors');
const paypal = require('paypal-rest-sdk');

const { openIdConnect } = paypal;

const typeDefs = require('./schema');
const resolvers = require('./resolvers');

const executableSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const {
  GRAPHQL_PORT,
  GRAPHQL_SUBSCIPTION_PORT,
  PAYPAL_MODE,
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
  PAYPAL_REDIRECT_URL,
} = require('./env');

const corsOptions = {
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  origin: (origin, callback) => {
    // FIXME all origins are temporary allowed, weak security
    callback(null, true);
  },
  preflightContinue: false,
};

paypal.configure({
  'mode': PAYPAL_MODE,
  'openid_client_id': PAYPAL_CLIENT_ID,
  'openid_client_secret': PAYPAL_CLIENT_SECRET,
  'openid_redirect_uri': PAYPAL_REDIRECT_URL,
});

const getUserDetails = (authCode) => new Promise((resolve, reject) => {
  console.log('verifying user code:', authCode);

  openIdConnect.tokeninfo.create(authCode, (error, tokeninfo) => {
    if (error) {
      console.log('error in starrting the request:', error);
      reject(error);
    } else {
      openIdConnect.userinfo.get(tokeninfo.access_token, (userInfoError, userinfo) => {
        if (userInfoError) {
          console.log('error in processing the request: ', userInfoError);
          reject(userInfoError);
        } else {
          console.log('new Token:', tokeninfo);
          console.log('User Info:', userinfo);
          console.log('Given Name:', userinfo.given_name);
          // Logout url
          console.log('LOGOUT URL: ', openIdConnect.logoutUrl({ 'id_token': tokeninfo.id_token }));
          resolve(userinfo.given_name);
        }
      });
    }
  });
});


const httpServer = express();
httpServer.use(cors(corsOptions));

/* GET home page. */
httpServer.get('/login', (req, res) => {
  const redirectUrl = openIdConnect.authorizeUrl({ 'scope': 'openid https://uri.paypal.com/services/paypalattributes profile' });
  console.log('redirecting to:', redirectUrl);
  res.redirect(redirectUrl);
});

httpServer.get('/login/callback', async (req, res) => {
  const paypalToken = req.query.code;
  if (paypalToken) {
    console.log('auth OK for:', paypalToken);
    try {
      const userOk = await getUserDetails(paypalToken);
      console.log('User name is:', userOk);
      res.cookie('token', userOk);
      res.redirect('/');
      return;
    } catch (e) {
      console.log('E! ', e);
    }
  }
  res.redirect('/sorry');
});


const getTokenFromRequest = (req) => req.body.token || req.params.token || req.headers.token;
httpServer.use(
  /^\/$/,
  bodyParser.json(),
  graphqlExpress((request) => ({
    schema: executableSchema,
    context: { token: getTokenFromRequest(request) },
  })),
);

// WebSocket server for subscriptions
const websocketServer = createServer((request, response) => {
  response.writeHead(404);
  response.write('This is a websocket server, please connect using a websocket');
  response.end();
});

SubscriptionServer.create(
  {
    schema: executableSchema,
    execute,
    subscribe,
  },
  {
    server: websocketServer,
  },
);

httpServer.listen(
  GRAPHQL_PORT, //
  () => console.log(`HTTP Server is now running on port ${GRAPHQL_PORT}`),
);

websocketServer.listen(
  GRAPHQL_SUBSCIPTION_PORT, //
  () => console.log(`Websocket Server is now running on port ${GRAPHQL_SUBSCIPTION_PORT}`),
);
