const GraphQLJSON = require('graphql-type-json');
const jwt = require('jsonwebtoken');
// const { PubSub, withFilter } = require('graphql-subscriptions');

// const pubsub = new PubSub();
const { User, Event } = require('./db'); // type: String, login: String, action: String, destination: String, created: Date,

const { ALLOWED_PHONE_NUMBERS_FOR_GUESTS, SIGNATURE, SIPSIGNATURE } = require('./env');

const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    unixTimestamp() {
      return Math.round(+new Date() / 1000);
    },

    user(obj, args, { token }) {
      if (!token) { return null; }
      const decoded = jwt.verify(token, SIGNATURE);
      console.log('LOGIN TOKEN REQUEST:', decoded);
      if (User.findOne({ paypalId: decoded.paypalId })) {
        return {
          id: decoded.paypalId,
          displayName: decoded.name,
        };
      }
      console.log('user not found');
      return null;
    },
  },

  Mutation: {
    generateSipConfig: (_, { input: { phoneNumber } }, { token }) => {
      Event.create({
        type: 'REQUEST', action: 'PROCESS CALL REQUEST', destination: phoneNumber, created: new Date(),
      });
      console.log('TOKEN ISsss:', token);

      if (ALLOWED_PHONE_NUMBERS_FOR_GUESTS.indexOf(phoneNumber) === -1) {
        Event.create({
          type: 'REQUEST', action: 'FAIL', destination: phoneNumber, created: new Date(),
        });

        throw new Error(`Cannot provide auth for calling ${phoneNumber} to guests.`);
      }

      try {
        const decoded = jwt.verify(token, SIGNATURE);
        console.log('SipRequst Toke decoded;', decoded);
        Event.create({
          type: 'CALL', login: decoded.user, action: 'SUCCESS', destination: phoneNumber, created: new Date(),
        });

        User.findOne({ paypalId: decoded.paypalId }, (err, user) => {
          console.log('USER FOUND:', user);
        });

        const sipToken = jwt.sign({
          paypalId: decoded.paypalId,
          destination: phoneNumber,
        }, SIPSIGNATURE, { expiresIn: '1m' });

        console.log('SIPTOKEN:', sipToken);
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
              invite: [`X-Token: ${sipToken}`],
            },
          },
        };
      } catch (err) {
        throw new Error(`Cannot process you call to ${phoneNumber}. Please log in`);
      }
    },

    verifyToken(_, { input: token }) {
      console.log('TOKEN to verify:', token);
      Event.create({
        type: 'VERIFY', login: token, action: 'REQUEST', created: new Date(),
      });

      try {
        const decoded = jwt.verify(token, SIPSIGNATURE);
        console.log('DECODED:', decoded); // bar
        if (User.findOne({ id: decoded.paypalId })) {
          console.log('user found. dialling:', decoded.destination);
        } else {
          console.log('user not found');
        }
        Event.create({
          type: 'VERIFY', login: token, action: 'SUCCESS', destination: decoded.destination, created: new Date(),
        });

        return true;
      } catch (err) {
        Event.create({
          type: 'VERIFY', login: token, action: 'FAIL', created: new Date(),
        });

        return false;
      }
    },

  },

  // Subscription: {},
};

module.exports = resolvers;
