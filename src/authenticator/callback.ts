import * as express from "express";
import * as passport from "passport";
var paypal = require("paypal-rest-sdk");
import * as jwt from "jsonwebtoken";
import { env } from "../config";
// import { Event, User } from "../db";
import { Event } from "../db";

export type RequestWithTelegramUser = express.Request & {
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

export const TelegramCallback = ({ query: user }: RequestWithTelegramUser) => {
  console.log("telegram callback", user.first_name);
  passport.authenticate("telegram");
  return `You logged in! Hello ${user.first_name}!`;
};

// OpenID configuration
paypal.configure({
  openid_client_id: env.PAYPAL_CLIENT_ID,
  openid_client_secret: env.PAYPAL_CLIENT_SECRET,
  openid_redirect_uri: "http://localhost:4000/paypal/callback",
});

export const PaypalCallback = (req, res) => {
  console.log("callback handle:");
  const paypalCode = req.query.code;
  Event.create({
    type: "LOGIN",
    action: "CALBACK CHECK",
    created: new Date(),
  });

  if (paypalCode) {
    console.log("CODE:", paypalCode);
    try {
      const token = paypal.openIdConnect.tokeninfo.create(paypalCode, function(
        error,
        tokeninfo,
      ) {
        console.log("INFO:", tokeninfo);
        console.log("acc", tokeninfo.access_token);
        console.log(
          "LOGOUT URL:",
          paypal.openIdConnect.logoutUrl(tokeninfo.id_token),
        );
        // Get userinfo with Access code
        paypal.openIdConnect.userinfo.get(tokeninfo.access_token, function(
          error,
          userinfo,
        ) {
          console.log(userinfo);
          const paypalId = userinfo.user_id.split("/").slice(-1)[0];
          const paypalName = userinfo.name;

          console.log("Paypal login %s, name %s", paypalId, paypalName);
          const theToken = jwt.sign(
            {
              paypalId,
              user: userinfo.name,
            },
            env.SIGNATURE,
            { expiresIn: "1h" },
          );
          console.log("TOKEN", theToken);
          return theToken;
          //   res.cookie("token", theToken);
        });
      });

      console.log("TOKEN THERE TO SET HEADER:", token);
      return res.redirect("/");
    } catch (e) {
      console.log("E! ", e);
    }
  } else {
    Event.create({
      type: "LOGIN",
      action: "FAILED TO PROCESS USER",
      created: new Date(),
    });

    res.redirect("/sorry");
  }
};
