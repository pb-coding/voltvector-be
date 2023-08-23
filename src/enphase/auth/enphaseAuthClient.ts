import axios, { AxiosResponse } from "axios";
import { Buffer } from "buffer";
import enphaseAppsClient from "./enphaseAuthClient";
import enphaseApps from "./enphaseApps";

interface EnphaseAuthTokens {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: string;
  scope: string;
  enl_uid: string;
  enl_cid: string;
  enl_password_last_changed: string;
  is_internal_app: boolean;
  app_type: string;
  jti: string;
}

const findEnphaseApp = (applicationName: string) => {
  const app = enphaseApps.find((app) => app.name === applicationName);
  if (!app) throw new Error(`No app found for ${applicationName}`);
  return app;
};

const createAuthorizationHeader = (clientId: string, clientSecret: string) => {
  const authorization: string = `Basic ${Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64")}`;
  return authorization;
};

const requestEnphaseTokensByAuthCode = async (
  userId: number,
  applicationName: string,
  code: string
): Promise<EnphaseAuthTokens> => {
  const grantType = "authorization_code";
  const redirectUri = `http://localhost:3001/enphase/oauth?userid=${userId}&appname=${applicationName}`;
  const app = enphaseAppsClient.findEnphaseApp(applicationName);
  const authorization = createAuthorizationHeader(
    app.clientId,
    app.clientSecret
  );

  const response: AxiosResponse = await axios.post(
    process.env.ENPHASE_TOKEN_URL || "",
    null,
    {
      headers: {
        Authorization: authorization,
      },
      params: {
        grant_type: grantType,
        redirect_uri: redirectUri,
        code: code,
      },
    }
  );

  return response.data as EnphaseAuthTokens;
};

const requestRefreshedTokensByRefreshToken = async (
  applicationName: string,
  refreshToken: string
): Promise<EnphaseAuthTokens> => {
  const grantType = "refresh_token";

  const app = enphaseAppsClient.findEnphaseApp(applicationName);
  const authorization = createAuthorizationHeader(
    app.clientId,
    app.clientSecret
  );

  const response: AxiosResponse = await axios.post(
    "https://api.enphaseenergy.com/oauth/token",
    null,
    {
      headers: {
        Authorization: authorization,
      },
      params: {
        grant_type: grantType,
        refresh_token: refreshToken,
      },
    }
  );

  return response.data as EnphaseAuthTokens;
};

export const enphaseAuthClient = {
  findEnphaseApp,
  requestEnphaseTokensByAuthCode,
  requestRefreshedTokensByRefreshToken,
};

export default enphaseAuthClient;
