const GraphQLJSON = require('graphql-type-json');
const jwt = require('jsonwebtoken');
// const { PubSub, withFilter } = require('graphql-subscriptions');

// const pubsub = new PubSub();
const { User, Event } = require('./db'); // type: String, login: String, action: String, destination: String, created: Date,

const { ALLOWED_PHONE_NUMBERS_FOR_GUESTS, SIGNATURE } = require('./env');

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

      try {
        const decoded = jwt.verify(token, SIGNATURE);
        console.log('DECODED:', decoded); // bar
        if (User.findOne({ paypalId: decoded.paypalId })) {
          console.log('user found');
        } else {
          console.log('user not found');
        }
        return true;
      } catch (err) {
        return false;
      }
    },

  },

  // Subscription: {},
};

module.exports = resolvers;
