import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as express from "express";
import { graphqlExpress } from "graphql-server-express";
import { makeExecutableSchema } from "graphql-tools";

import * as passport from "passport";
import { env } from "./config";

import resolvers from "./resolvers";
import typeDefs from "./schema";

import { authenticate } from "./authenticator";

const executableSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
const corsOptions = {
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  origin: (origin, callback) => {
    // FIXME all origins are temporary allowed, weak security
    callback(null, true);
  },
  preflightContinue: false,
};

const httpServer = express();
httpServer.use(cors(corsOptions));

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.serializeUser((user, done) => {
  done(null, user);
});

httpServer.use(bodyParser.urlencoded({ extended: true }));
httpServer.use(passport.initialize());

httpServer.use("/login", authenticate);

const getTokenFromRequest = (req) =>
  req.body.token || req.params.token || req.headers.token;
httpServer.use(
  "/graphql",
  bodyParser.json(),
  graphqlExpress((request) => ({
    schema: executableSchema,
    context: { token: getTokenFromRequest(request) },
  })),
);

httpServer.listen(
  env.GRAPHQL_PORT, //
  () => console.log(`HTTP Server is now running on port ${env.GRAPHQL_PORT}`),
);
