import { AuthPaypal } from "./paypal";
import { AuthTelegram } from "./telegram";
import { PaypalCallback, TelegramCallback } from "./callback";

export const authenticate = (req, res) => {
  console.log("REQ:", req.path);

  let response;
  switch (req.path) {
    case "/telegram":
      response = AuthTelegram();
      break;
    case "/telegram/callback":
      response = TelegramCallback(req);
      break;
    case "/paypal":
      response = AuthPaypal(req, res);
      break;
    case "/paypal/callback":
      response = PaypalCallback(req, res);
      break;
    default:
      response = AuthTelegram;
      break;
  }
  res.send(response);
};
