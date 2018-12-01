import * as envalid from "envalid";
import * as _ from "lodash";

const listOfPhoneNumbers = envalid.makeValidator<string[]>(
  (value): string[] => {
    if (_.isArray(value)) {
      return value;
    }
    if (_.isString(value)) {
      const valueWithoutSpaces = value.replace(/\s+/g, "");
      if (!valueWithoutSpaces.length) {
        return [];
      }
      if (/^(\+?\d+)(,\+?\d+)*$/.test(valueWithoutSpaces)) {
        return valueWithoutSpaces.split(",");
      }
    }
    throw new Error("Wrong format for the list of phone numbers");
  },
);

const callbackPath = envalid.makeValidator((value) => {
  if (
    _.isString(value) &&
    value.length > 1 &&
    value[0] === "/" &&
    !value.includes("//")
  ) {
    return value;
  }

  throw new Error("Wrong format for the callback URL");
});

export const env = envalid.cleanEnv(process.env, {
  GRAPHQL_PORT: envalid.port({ default: 4000 }),
  ALLOWED_PHONE_NUMBERS_FOR_GUESTS: listOfPhoneNumbers({
    default: ["3600"],
    desc: "comma-separated phone numbers and prefixes",
    example: "+4400000,+723331",
  }),
  PAYPAL_MODE: envalid.str({
    default: "sandbox",
    desc: "paypal environment sandbox | live",
  }),
  PAYPAL_CLIENT_ID: envalid.str({
    default: "NULL",
    desc: "paypal client id",
  }),
  PAYPAL_CLIENT_SECRET: envalid.str({
    default: "NULL",
    desc: "paypal client secret",
  }),
  PAYPAL_REDIRECT_PATH: callbackPath({
    default: "/callback",
    desc: "paypal redirect path",
  }),
  PAYPAL_REDIRECT_URL: envalid.str({
    default: "http://localhost/callback",
    desc: "paypal redirect URL",
  }),
  MONGO_URL: envalid.str({
    default: "mongodb://localhost/callthemonline",
    desc: "mongodb default connection details",
  }),
  SIGNATURE: envalid.str({
    desc: "crash if insecure.",
  }),
  SIP_SIGNATURE: envalid.str({
    desc: "crash if insecure.",
  }),
  SIP_SERVER: envalid.str({
    default: "callthem.online",
    desc: "SIP server hostname.",
  }),
  TELEGRAM_TOKEN: envalid.str({
    default: "SECURE:TOKEN",
    desc: "Telegram Token.",
  }),
  TELEGRAM_BOT: envalid.str({
    default: "telegram_bot_name",
    desc: "Telegram Bot name.",
  }),
  TELEGRAM_REDIRECT_PATH: callbackPath({
    default: "/login/telegram/callback",
    desc: "Telegram callback path.",
  }),
});
