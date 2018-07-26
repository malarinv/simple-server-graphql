import { env } from "../config";
import * as passport from "passport";
import TelegramStrategy = require("passport-telegram-official");

const throwError = () => {
  throw new TypeError(
    "Please provide your credentials through BOT_TOKEN and BOT_NAME environment variable. Also set PORT to 80",
  );
};

const botName = env.TELEGRAM_BOT || throwError();
const botToken = env.TELEGRAM_TOKEN || throwError();

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.use(
  "telegram",
  new TelegramStrategy(
    { botToken, passReqToCallback: true },
    (req, user, done) => {
      console.log(user);

      req.user = user;
      done(null, user, null);
    },
  ),
);

export const AuthTelegram = () => {
  console.log("Telegram auth request");

  return `<html>
    <head></head>
    <body>
      <div id="widget">
          <script 
             async 
             src="https://telegram.org/js/telegram-widget.js?4"
             data-telegram-login="${botName}"
             data-size="medium"
             data-auth-url="${env.TELEGRAM_REDIRECT_PATH}"
             data-request-access="write"
           ></script>
      </div>
    </body>
    </html>`;
};
