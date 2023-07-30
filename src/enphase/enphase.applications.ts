// currently up to 9 enphase apps are supported to increase the rate limit
// TODO: later, admins should be able to manage amount of apps via the frontend

const development = {
  name: "development",
  clientId: process.env.ENPHASE_DEV_CLIENT_ID as string,
  clientSecret: process.env.ENPHASE_DEV_CLIENT_SECRET as string,
  apiKey: process.env.ENPHASE_DEV_API_KEY as string,
};

const production1 = {
  name: "production-1",
  clientId: process.env.ENPHASE_PRODUCTION_1_CLIENT_ID as string,
  clientSecret: process.env.ENPHASE_PRODUCTION_1_CLIENT_SECRET as string,
  apiKey: process.env.ENPHASE_PRODUCTION_1_API_KEY as string,
};

const production2 = {
  name: "production-2",
  clientId: process.env.ENPHASE_PRODUCTION_2_CLIENT_ID as string,
  clientSecret: process.env.ENPHASE_PRODUCTION_2_CLIENT_SECRET as string,
  apiKey: process.env.ENPHASE_PRODUCTION_2_API_KEY as string,
};

const production3 = {
  name: "production-3",
  clientId: process.env.ENPHASE_PRODUCTION_3_CLIENT_ID as string,
  clientSecret: process.env.ENPHASE_PRODUCTION_3_CLIENT_SECRET as string,
  apiKey: process.env.ENPHASE_PRODUCTION_3_API_KEY as string,
};

const production4 = {
  name: "production-4",
  clientId: process.env.ENPHASE_PRODUCTION_4_CLIENT_ID as string,
  clientSecret: process.env.ENPHASE_PRODUCTION_4_CLIENT_SECRET as string,
  apiKey: process.env.ENPHASE_PRODUCTION_4_API_KEY as string,
};

const consumption1 = {
  name: "consumption-1",
  clientId: process.env.ENPHASE_CONSUMPTION_1_CLIENT_ID as string,
  clientSecret: process.env.ENPHASE_CONSUMPTION_1_CLIENT_SECRET as string,
  apiKey: process.env.ENPHASE_CONSUMPTION_1_API_KEY as string,
};

const consumption2 = {
  name: "consumption-2",
  clientId: process.env.ENPHASE_CONSUMPTION_2_CLIENT_ID as string,
  clientSecret: process.env.ENPHASE_CONSUMPTION_2_CLIENT_SECRET as string,
  apiKey: process.env.ENPHASE_CONSUMPTION_2_API_KEY as string,
};

const consumption3 = {
  name: "consumption-3",
  clientId: process.env.ENPHASE_CONSUMPTION_3_CLIENT_ID as string,
  clientSecret: process.env.ENPHASE_CONSUMPTION_3_CLIENT_SECRET as string,
  apiKey: process.env.ENPHASE_CONSUMPTION_3_API_KEY as string,
};

const consumption4 = {
  name: "consumption-4",
  clientId: process.env.ENPHASE_CONSUMPTION_4_CLIENT_ID as string,
  clientSecret: process.env.ENPHASE_CONSUMPTION_4_CLIENT_SECRET as string,
  apiKey: process.env.ENPHASE_CONSUMPTION_4_API_KEY as string,
};

export const enphaseApps = [
  development,
  production1,
  production2,
  production3,
  production4,
  consumption1,
  consumption2,
  consumption3,
  consumption4,
];

export default enphaseApps;
