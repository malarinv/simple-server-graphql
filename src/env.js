const envalid = require('envalid');

module.exports = envalid.cleanEnv(process.env, {
  GRAPHQL_PORT: envalid.port({ default: 4000 }),
  GRAPHQL_SUBSCIPTION_PORT: envalid.port({
    default: 4001,
    desc: 'subscription port (websocket)',
  }),
});
