import { AuthPaypal } from "./paypal";
import { AuthTelegram } from "./telegram";
import { PaypalCallback, TelegramCallback } from "./callback";

export const authenticate = async (req, res) => {
  console.log("REQ:", req.path);

  let response;
  switch (req.path) {
    case "/telegram":
      response = AuthTelegram();
      res.send(response);
      break;
    case "/telegram/callback":
      response = TelegramCallback(req);
      res.send(response);
      break;
    case "/paypal":
      response = AuthPaypal();
      res.send(response);
      break;
    case "/paypal/callback":
      response = await PaypalCallback(req, res);
      break;
    default:
      console.log("DEFAULT FORWARD")
      response = AuthTelegram;
      res.send(response);
      break;
  }
};
