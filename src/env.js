const _ = require('lodash');
const envalid = require('envalid');

const listOfPhoneNumbers = envalid.makeValidator((value) => {
  if (_.isString(value)) {
    const valueWithoutSpaces = value.replace(/\s+/g, '');
    if (!valueWithoutSpaces.length) {
      return [];
    }
    if (/^(\+?\d+)(,\+?\d+)*$/.test(valueWithoutSpaces)) {
      return valueWithoutSpaces.split(',');
    }
  }
  throw new Error('Wrong format for the list of phone numbers');
});

const callbackPath = envalid.makeValidator((value) => {
  if (_.isString(value) && value.length > 1 && value[0] === '/' && !value.includes('//')) {
    return value;
  }

  throw new Error('Wrong format for the callback URL');
});

module.exports = envalid.cleanEnv(process.env, {
  GRAPHQL_PORT: envalid.port({ default: 4000 }),
  ALLOWED_PHONE_NUMBERS_FOR_GUESTS: listOfPhoneNumbers({
    default: '6004',
    example: '+4400000,+723331',
  }),
  GRAPHQL_SUBSCIPTION_PORT: envalid.port({
    default: 4001,
    desc: 'subscription port (websocket)',
  }),
  PAYPAL_MODE: envalid.str({
    default: 'sandbox',
    desc: 'paypal environment sandbox | live',
  }),
  PAYPAL_CLIENT_ID: envalid.str({
    default: 'NULL',
    desc: 'paypal client id',
  }),
  PAYPAL_CLIENT_SECRET: envalid.str({
    default: 'NULL',
    desc: 'paypal client secret',
  }),
  PAYPAL_REDIRECT_URL: callbackPath({
    default: '/login/callback?code=paypalcode',
    desc: 'paypal redirect url',
  }),
  MONGO_URL: envalid.str({
    default: 'mongodb://localhost/callthemonline',
    desc: 'mongodb default connection details',
  }),
  SIGNATURE: envalid.str({
    default: 'somesignature',
    desc: 'crash if insecure.',
  }),
  SIPSIGNATURE: envalid.str({
    default: 'somesipsignature',
    desc: 'crash if insecure.',
  }),
  SIP_SERVER: envalid.str({
    default: '192.168.1.72',
    desc: 'SIP server hostname.',
  }),

});
