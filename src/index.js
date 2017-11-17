const express = require('express');
const bodyParser = require('body-parser');
const { graphqlExpress } = require('graphql-server-express');
const { makeExecutableSchema } = require('graphql-tools');
const { createServer } = require('http');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const cors = require('cors');
const paypal = require('paypal-rest-sdk');
const jwt = require('jsonwebtoken');

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
  SIGNATURE,
} = require('./env');

const { User, Event } = require('./db');

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
          resolve(userinfo);
        }
      });
    }
  });
});


const httpServer = express();
httpServer.use(cors(corsOptions));
console.log('Date now:', new Date());

/* GET home page. */
httpServer.get('/login', (req, res) => {
  const redirectUrl = openIdConnect.authorizeUrl({ 'scope': 'openid https://uri.paypal.com/services/paypalattributes profile' });
  Event.create({
    type: 'LOGIN', action: 'LOGIN REQUEST', created: new Date(),
  });

  console.log('redirecting to:', redirectUrl);
  res.redirect(redirectUrl);
});

httpServer.get('/login/callback', async (req, res) => {
  const paypalCode = req.query.code;
  Event.create({
    type: 'LOGIN', action: 'CALBACK CHECK', created: new Date(),
  });

  if (paypalCode) {
    console.log('auth OK for:', paypalCode);
    Event.create({
      type: 'LOGIN', login: paypalCode, action: 'CALBACK OK', created: new Date(),
    });

    try {
      const userOk = await getUserDetails(paypalCode);
      const paypalId = userOk.user_id.split('/').slice(-1)[0];

      const options = { upsert: true, new: true, setDefaultsOnInsert: true };
      const newUser = {
        paypalId, token: 'NewUserTokenGenerate()', name: userOk.name, updated: new Date(),
      };
      const existingUser = { paypalId };

      User.findOneAndUpdate(
        existingUser,
        newUser,
        options,
        (error, user) => {
          if (error) return;
          // do something with document
          console.log(user.token);
          console.log('User name is:', userOk.given_name);
          console.log('PayPal user_id:', paypalId);
          Event.create({
            type: 'USER', login: paypalId.split('/').slice(-1)[0], action: 'CREATED', created: new Date(),
          });
          const theToken = jwt.sign({
            paypalId,
            user: userOk.name,
          }, SIGNATURE, { expiresIn: '1h' });

          // const theToken = `invite ${userOk.name} ${paypalId}`;
          res.cookie('token', theToken);
          res.redirect('/');
        },

      );

      return;
    } catch (e) {
      console.log('E! ', e);
    }
  }
  Event.create({
    type: 'LOGIN', action: 'FAILED TO PROCESS USER', created: new Date(),
  });

  res.redirect('/sorry');
});


const getTokenFromRequest = (req) => req.body.token || req.params.token || req.headers.token;
httpServer.use(
  '/graphql',
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
