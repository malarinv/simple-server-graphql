import * as express from 'express';
import * as passport from 'passport';
var paypal = require('paypal-rest-sdk');
import * as jwt from 'jsonwebtoken';
import {env} from '../config';
// import { Event, User } from "../db";
import {Event, User} from '../db';
const {openIdConnect} = paypal;

export type RequestWithTelegramUser = express.Request&{
  user: {
    id: string; first_name: string; last_name: string; username: string;
    photo_url: string;
    auth_date: string;
    hash: string;
  };
};

export type RequestWithPaypalDetails = express.Request&{
  user_id: string;
  name: string;
  birthday: string;
  token: string;
};

export const TelegramCallback = ({query: user}: RequestWithTelegramUser) => {
  console.log('telegram callback', user.first_name);
  passport.authenticate('telegram');
  console.log("CREATING USER LOGIN EVENT RECORD for user ", user.first_name)
  Event.create({
    type: 'USER',
    login: user.username,
    action: 'CREATED',
    created: new Date(),
  });

  const theToken = jwt.sign(
    {
      paypalId: user.hash,
      user: user.username,
    },
    env.SIGNATURE, {expiresIn: '1000'});

console.log('Telegram THE TOKEN:', theToken)

  return `You logged in! Hello ${user.first_name}!`;
};

// OpenID configuration
paypal.configure({
  mode: env.PAYPAL_MODE,
  openid_client_id: env.PAYPAL_CLIENT_ID,
  openid_client_secret: env.PAYPAL_CLIENT_SECRET,
  openid_redirect_uri: env.PAYPAL_REDIRECT_URL,
});

export const PaypalCallback = async (req, res) => {
  console.log('callback handle:');
  const paypalCode = req.query.code;
  Event.create({
    type: 'LOGIN',
    action: 'CALBACK CHECK',
    created: new Date(),
  });

  if (paypalCode) {
    console.log('auth OK for:', paypalCode);
    Event.create({
      type: 'LOGIN',
      login: paypalCode,
      action: 'CALBACK OK',
      created: new Date(),
    });

    try {
      const userOk = await getUserDetails(paypalCode);
      console.log('AFTER AWAIT')
      const paypalId = userOk.user_id.split('/').slice(-1)[0];

      const options = {upsert: true, new: true, setDefaultsOnInsert: true};
      const newUser = {
        paypalId,
        token: 'NewUserTokenGenerate()',
        name: userOk.name,
        updated: new Date(),
      };
      const existingUser = {paypalId};

      const theToken = await new Promise((resolve, reject) => {
        User.findOneAndUpdate(
            existingUser,
            newUser,
            options,
            (error, user) => {
              if (error) {
                console.log('ERROR DB', error.message);
                reject (error)
              };
              // do something with document
              console.log('User:', user && user.token);
              console.log('User name is:', userOk.name);
              console.log('PayPal user_id:', paypalId);
              Event.create({
                type: 'USER',
                login: paypalId,
                action: 'CREATED',
                created: new Date(),
              });
              const theToken = jwt.sign(
                  {
                    paypalId,
                    user: userOk.name,
                  },
                  env.SIGNATURE, {expiresIn: '1000'});

              console.log('THE TOKEN:', theToken)
              // const theToken = `invite ${userOk.name} ${paypalId}`;
              // res.cookie('token', theToken);
              // res.redirect('/');
              resolve(theToken)
            },
        );
      });
      res.cookie('token', theToken);
      res.redirect('/');

        return theToken
    } catch (e) {
      console.log('E! ', e);
    }
  } else {
    Event.create({
      type: 'LOGIN',
      action: 'FAILED TO PROCESS USER',
      created: new Date(),
    });

    res.redirect('/sorry');
  }
};

const getUserDetails = (authCode): Promise<RequestWithPaypalDetails> =>
    new Promise((resolve, reject) => {
      console.log('verifying user code:', authCode);

      openIdConnect.tokeninfo.create(authCode, (error, tokeninfo) => {
        if (error) {
          console.log('error in starrting the request:', error);
          reject(error);
        } else {
          openIdConnect.userinfo.get(
              tokeninfo.access_token, (userInfoError, userinfo) => {
                if (userInfoError) {
                  console.log(
                      'error in processing the request: ', userInfoError);
                  reject(userInfoError);
                } else {
                  console.log('new Token:', tokeninfo);
                  console.log('User Info:', userinfo);
                  console.log('Given Name:', userinfo.name);
                  // Logout url
                  console.log('LOGOUT URL: ', openIdConnect.logoutUrl({
                    'id_token': tokeninfo.id_token
                  }));
                  resolve(userinfo);
                }
              });
        }
      });
    });
