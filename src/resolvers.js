const GraphQLJSON = require('graphql-type-json');
// const { PubSub, withFilter } = require('graphql-subscriptions');

// const pubsub = new PubSub();

const { ALLOWED_PHONE_NUMBERS_FOR_GUESTS } = require('./env');

const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    unixTimestamp() {
      return Math.round(+new Date() / 1000);
    },
  },

  Mutation: {
    generateSipConfig: (_, { input: { phoneNumber } }) => {
      if (ALLOWED_PHONE_NUMBERS_FOR_GUESTS.indexOf(phoneNumber) === -1) {
        throw new Error(`Cannot provide auth for calling ${phoneNumber} to guests. Please login.`);
      }
      return {
        config: {
          host: 'dev.callthem.online',
          port: '7443',
          user: '1007',
          password: '31337',
          iceServers: [
            {
              urls: 'turn:free.nikulin.website:5349?transport=tcp',
              username: 'free',
              credential: 'denis',
            },
          ],
          extraHeaders: {
            invite: [`X-Token: ${42}`],
          },
        },
      };
    },
  },

  // Subscription: {},
};

module.exports = resolvers;
