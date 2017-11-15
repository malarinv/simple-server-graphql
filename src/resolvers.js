const GraphQLJSON = require('graphql-type-json');
// const { PubSub, withFilter } = require('graphql-subscriptions');

// const pubsub = new PubSub();
const { Event } = require('./db'); // type: String, login: String, action: String, destination: String, created: Date,

const { ALLOWED_PHONE_NUMBERS_FOR_GUESTS } = require('./env');

const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    unixTimestamp() {
      return Math.round(+new Date() / 1000);
    },

    user(obj, args, { token }) {
      if (!token) { return null; }
      return {
        id: 111111,
        displayName: token,
      };
    },
  },

  Mutation: {
    generateSipConfig: (_, { input: { phoneNumber } }, { token }) => {
      Event.create({
        type: 'REQUEST', action: 'PROCESS CALL REQUEST', destination: phoneNumber, created: new Date(),
      });
      console.log('TOKEN ISsss:', token);
      if ((token === 'undefined' || !token) && ALLOWED_PHONE_NUMBERS_FOR_GUESTS.indexOf(phoneNumber) === -1) {
        Event.create({
          type: 'REQUEST', action: 'FAIL', destination: phoneNumber, created: new Date(),
        });

        throw new Error(`Cannot provide auth for calling ${phoneNumber} to guests. Please login.`);
      }
      Event.create({
        type: 'CALL', login: token, action: 'SUCCESS', destination: phoneNumber, created: new Date(),
      });

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
            invite: [`X-Token: ${token}`],
          },
        },
      };
    },

    verifyToken(_, { input: token }) {
      console.log('TOKEN to verify:', token);
      if (token === 'invite') {
        return true;
      }
      return false;
    },

  },

  // Subscription: {},
};

module.exports = resolvers;
