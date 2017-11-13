const mongoose = require('mongoose');

const {
  MONGO_URL,
} = require('./env');


mongoose.connect(MONGO_URL, { useMongoClient: true });
mongoose.Promise = global.Promise;

const User = mongoose.model('User', {
  name: String, paypalCode: String, paypalId: String, token: String, updated: Date, created: Date,
});
const Event = mongoose.model('Event', {
  type: String, login: String, action: String, destination: String, created: Date,
});


module.exports = {
  User,
  Event,
};
