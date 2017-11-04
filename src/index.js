const express = require('express');
const bodyParser = require('body-parser');
const { graphqlExpress } = require('graphql-server-express');
const { makeExecutableSchema } = require('graphql-tools');
const { createServer } = require('http');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const cors = require('cors');

const typeDefs = require('./schema');
const resolvers = require('./resolvers');

const executableSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const { GRAPHQL_PORT, GRAPHQL_SUBSCIPTION_PORT } = require('./env');

const corsOptions = {
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  origin: (origin, callback) => {
    // FIXME all origins are temporary allowed, weak security
    callback(null, true);
  },
  preflightContinue: false,
};

const httpServer = express();
httpServer.use(cors(corsOptions));

httpServer.use(
  /^\/$/,
  bodyParser.json({ limit: '1mb' }),
  graphqlExpress({ schema: executableSchema }),
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
