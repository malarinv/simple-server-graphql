import * as mongoose from "mongoose";
import { env } from "./config";

const options = {
  autoIndex: false,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 500,
  poolSize: 1,
  bufferMaxEntries: 0,
};

mongoose.connect(env.MONGO_URL, options);

export interface MongooseUser {
  name: string;
  paypalCode: string;
  paypalId: string;
  token: string;
  updated: Date;
  created: Date;
}
export const User = mongoose.model<MongooseUser & mongoose.Document>(
  "User",
  new mongoose.Schema({
    name: {
      type: String,
    },
    paypalCode: {
      type: String,
    },
    paypalId: {
      type: String,
    },
    token: {
      type: String,
    },
    updated: {
      type: Date,
    },
    created: {
      type: Date,
    },
  }),
);

export interface MongooseEvent {
  type: string;
  login: string;
  action: string;
  destination: string;
  comment: string;
  created;
}
export const Event = mongoose.model<MongooseEvent & mongoose.Document>(
  "Event",
  new mongoose.Schema({
    type: {
      type: String,
    },
    login: {
      type: String,
    },
    action: {
      type: String,
    },
    destination: {
      type: String,
    },
    comment: {
      type: String,
    },
    created: {
      type: Date,
    },
  }),
);
