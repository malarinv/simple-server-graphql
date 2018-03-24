const GraphQLJSON = require('graphql-type-json');
const jwt = require('jsonwebtoken');
// const { PubSub, withFilter } = require('graphql-subscriptions');

// const pubsub = new PubSub();
const { User, Event } = require('./db'); // type: String, login: String, action: String, destination: String, created: Date,

const {
  ALLOWED_PHONE_NUMBERS_FOR_GUESTS, SIGNATURE, SIPSIGNATURE, SIP_SERVER,
} = require('./env');

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
    generateSipConfig: async (_, { input: { phoneNumber } }, { token }) => {
      Event.create({
        type: 'REQUEST', comment: `Token: ${token}`, action: 'PROCESS CALL REQUEST', destination: phoneNumber, created: new Date(),
      });
      console.log('TOKEN ISsss:', token);

      let sipToken;

      try {
        const decoded = jwt.verify(token, SIGNATURE);
        console.log('SipRequst Token decoded;', decoded);
        Event.create({
          type: 'CALL', login: decoded.user, action: 'SUCCESS', destination: phoneNumber, created: new Date(),
        });

        const user = await User.findOne({ paypalId: decoded.paypalId });
        if (!user) {
          throw new Error(`User with paypalId ${decoded.paypalId}`);
        }
        console.log('USER FOUND:', user);
        Event.create({
          type: 'REQUEST', comment: `User: ${user.name}`, login: decoded.paypalId, action: 'PROCESS CALL', destination: phoneNumber, created: new Date(),
        });

        sipToken = jwt.sign({
          paypalId: decoded.paypalId,
          destination: phoneNumber,
        }, SIPSIGNATURE, { expiresIn: '1m' });
      } catch (e) {
        const re = new RegExp(ALLOWED_PHONE_NUMBERS_FOR_GUESTS.join('|').replace(/\+/g, '\\+'));
        if (re.test(phoneNumber)) {
          console.log('Whitelisted number: ', phoneNumber);
          sipToken = jwt.sign({
            paypalId: null,
            destination: phoneNumber,
          }, SIPSIGNATURE, { expiresIn: '1m' });
        } else {
          console.log('CALL ATTEMPT REJECTED');
          Event.create({
            type: 'REQUEST', action: 'PROCESS CALL REJECTED', destination: phoneNumber, created: new Date(),
          });

          throw new Error(`Unverified users cannot call ${phoneNumber}`);
        }
      }
      return {
        config: {
          host: SIP_SERVER,
          user: '1007',
          port: 8443,
          autoRegister: false,
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
