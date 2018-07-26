import * as passport from "passport";
import { env } from "../config";

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.serializeUser((user, done) => {
  done(null, user);
});

export const AuthPaypal = () => {
  console.log("Telegram auth request");

  return `<span id='lippButton'></span>
  <script src='https://www.paypalobjects.com/js/external/api.js'></script>
  <script>
  paypal.use( ['login'], function (login) {
    login.render ({
      "appid":"${env.PAYPAL_CLIENT_ID}",
      "authend":"sandbox",
      "scopes":"openid profile",
      "containerid":"lippButton",
      "locale":"en-us",
      "returnurl":"http://localhost:4000/login/paypal/callback"
    });
  });
  </script>`;
};
