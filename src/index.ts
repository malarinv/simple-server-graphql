import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as express from "express";
import { graphqlExpress } from "graphql-server-express";
import { makeExecutableSchema } from "graphql-tools";
import * as jwt from "jsonwebtoken";
import * as passport from "passport";
import * as TelegramStrategy from "passport-telegram-official";
import * as paypal from "paypal-rest-sdk";
import { env } from "./config";
import { Event, User } from "./db";
import resolvers from "./resolvers";
import typeDefs from "./schema";

const { openIdConnect } = paypal as any;
const throwError = () => {
  throw new TypeError(
    "Please provide your credentials through BOT_TOKEN and BOT_NAME environment variable. Also set PORT to 80",
  );
};

const botToken = "TO:KEN" || throwError();
const botName = "BOTNAME" || throwError();

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

paypal.configure({
  mode: env.PAYPAL_MODE,
  client_id: env.PAYPAL_CLIENT_ID,
  client_secret: env.PAYPAL_CLIENT_SECRET,
});

const getUserDetails = (
  authCode,
): Promise<{
  user_id: string;
  name: string;
  verified_account: boolean;
}> =>
  new Promise((resolve, reject) => {
    console.log("verifying user code:", authCode);

    openIdConnect.tokeninfo.create(authCode, (error, tokeninfo) => {
      if (error) {
        console.log("error in starting the request:", error);
        reject(error);
      } else {
        openIdConnect.userinfo.get(
          tokeninfo.access_token,
          (userInfoError, userinfo) => {
            if (userInfoError) {
              console.log("error in processing the request: ", userInfoError);
              reject(userInfoError);
            } else {
              console.log("new Token:", tokeninfo);
              console.log("User Info:", userinfo);
              console.log("Given Name:", userinfo.given_name);
              // Logout url
              console.log(
                "LOGOUT URL: ",
                openIdConnect.logoutUrl({ id_token: tokeninfo.id_token }),
              );
              resolve(userinfo);
            }
          },
        );
      }
    });
  });

const httpServer = express();
httpServer.use(cors(corsOptions));
console.log("Date now:", new Date());

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.use(
  new TelegramStrategy(
    { botToken, passReqToCallback: true },
    (req, user, done) => {
      console.log(user);

      req.user = user;
      done(null, user);
    },
  ),
);

httpServer.use(bodyParser.urlencoded({ extended: true }));
httpServer.use(passport.initialize());

type RequestWithTelegramUser = express.Request & {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    photo_url: string;
    auth_date: string;
    hash: string;
  };
};

httpServer.use(
  "/login/callback",
  passport.authenticate("telegram"),
  (req: RequestWithTelegramUser, res) => {
    console.log("CALLBACK");
    res.send(`You logged in! Hello ${req.user.first_name}!`);
  },
);

// Here we create page with auth widget
httpServer.use("/login", (req, res) => {
  console.log("login in attempt");
  res.send(`<html>
<head></head>
<body>
  <div id="widget">
      <script 
         async 
         src="https://telegram.org/js/telegram-widget.js?4"
         data-telegram-login="${botName}"
         data-size="medium"
         data-auth-url="https://TELEGRAMAUTHCALLBACKURL.me/login/callback"
         data-request-access="write"
       ></script>
  </div>
</body>
</html>`);
});

/* GET home page. */
httpServer.get("/loginpaypal", (req, res) => {
  // paypal
  const redirectUrl = openIdConnect.authorizeUrl({
    scope: "openid https://uri.paypal.com/services/paypalattributes profile",
    redirect_uri: `https://${req.hostname}${env.PAYPAL_REDIRECT_URL}`,
  });

  Event.create({
    type: "LOGIN",
    action: "LOGIN REQUEST",
    created: new Date(),
  });

  console.log("redirecting to:", redirectUrl);
  res.redirect(redirectUrl);
});

httpServer.get("/loginpaypal/callback", async (req, res) => {
  const paypalCode = req.query.code;
  Event.create({
    type: "LOGIN",
    action: "CALBACK CHECK",
    created: new Date(),
  });

  if (paypalCode) {
    console.log("auth OK for:", paypalCode);
    Event.create({
      type: "LOGIN",
      login: paypalCode,
      action: "CALBACK OK",
      created: new Date(),
    });

    try {
      const userOk = await getUserDetails(paypalCode);
      const paypalId = userOk.user_id.split("/").slice(-1)[0];

      const options = { upsert: true, new: true, setDefaultsOnInsert: true };
      const newUser = {
        paypalId,
        token: "NewUserTokenGenerate()",
        name: userOk.name,
        updated: new Date(),
      };
      const existingUser = { paypalId };

      User.findOneAndUpdate(existingUser, newUser, options, (error, user) => {
        if (error || !user) {
          return;
        }
        // do something with document
        console.log(user.token);
        console.log("User name is:", userOk.name);
        console.log("PayPal user_id:", paypalId);
        Event.create({
          type: "USER",
          login: paypalId.split("/").slice(-1)[0],
          action: "CREATED",
          created: new Date(),
        });
        const theToken = jwt.sign(
          {
            paypalId,
            user: userOk.name,
          },
          env.SIGNATURE,
          { expiresIn: "1h" },
        );

        // const theToken = `invite ${userOk.name} ${paypalId}`;
        res.cookie("token", theToken);
        res.redirect("/");
      });

      return;
    } catch (e) {
      console.log("E! ", e);
    }
  }
  Event.create({
    type: "LOGIN",
    action: "FAILED TO PROCESS USER",
    created: new Date(),
  });

  res.redirect("/sorry");
});

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
