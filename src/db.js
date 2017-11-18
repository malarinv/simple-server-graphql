const mongoose = require('mongoose');

const {
  MONGO_URL,
} = require('./env');


const options = {
  useMongoClient: true,
  autoIndex: false,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 500,
  poolSize: 1,
  bufferMaxEntries: 0,
};

mongoose.connect(MONGO_URL, options);


mongoose.Promise = global.Promise;

const User = mongoose.model('User', {
  name: String, paypalCode: String, paypalId: String, token: String, updated: Date, created: Date,
});
const Event = mongoose.model('Event', {
  type: String, login: String, action: String, destination: String, comment: String, created: Date,
});


module.exports = {
  User,
  Event,
};
