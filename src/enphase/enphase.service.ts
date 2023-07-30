import { prisma } from "../lib/prisma";
import enphaseClient from "./enphase.client";
import enphaseApps from "./enphase.applications";

const retrieveAndSaveEnphaseAuthTokens = async (
  userId: number,
  applicationName: string,
  code: string
) => {
  // TODO: check if user exists

  const enphaseAuthTokens = await enphaseClient.requestEnphaseTokensByAuthCode(
    userId,
    applicationName,
    code
  );
  console.log(`enphaseAuthTokens: ${enphaseAuthTokens}`);
  if (
    !enphaseAuthTokens ||
    !enphaseAuthTokens.access_token ||
    !enphaseAuthTokens.refresh_token
  ) {
    return false;
  }

  await saveEnphaseAuthTokens(
    userId,
    applicationName,
    enphaseAuthTokens.access_token,
    enphaseAuthTokens.refresh_token
  );

  return true;
};

const saveEnphaseAuthTokens = async (
  userId: number,
  applicationName: string,
  accessToken: string,
  refreshToken: string
) => {
  const app = await prisma.enphaseApp.upsert({
    where: { name: applicationName },
    update: {},
    create: { name: applicationName },
  });

  const userEnphaseApp = await prisma.userEnphaseApp.upsert({
    where: {
      userId_appId: {
        userId: userId,
        appId: app.id,
      },
    },
    update: {
      accessToken: accessToken,
      refreshToken: refreshToken,
    },
    create: {
      userId: userId,
      appId: app.id,
      accessToken: accessToken,
      refreshToken: refreshToken,
    },
    include: {
      app: true,
    },
  });

  console.log(`Saved enphaseAuthTokens: ${userEnphaseApp}`);
  return userEnphaseApp;
};

/**
 * This function returns all enphase apps with their client ids and the date when the user last authorized the app.
 * The frontend can use this information to determine if the user has authorized the app and if the authorization is still valid.
 * @param userId
 * @returns
 */
const getEnphaseAppsByUserId = async (userId: number) => {
  const userEnphaseApps = await querySavedEnphaseAppsByUserId(userId);
  const userAppMap = new Map(userEnphaseApps.map((app) => [app.app.name, app]));

  const allEnphaseAppsClientIds = enphaseApps.map((app) => {
    const userEnphaseApp = userAppMap.get(app.name);

    return {
      name: app.name,
      clientId: app.clientId,
      issueDate: userEnphaseApp?.updatedAt ?? null,
    };
  });

  console.log(
    `allEnphaseAppsClientIds for user ${userId}: ${allEnphaseAppsClientIds}`
  );
  return allEnphaseAppsClientIds;
};

const querySavedEnphaseAppsByUserId = async (userId: number) => {
  console.log(`Querying saved enphase apps for user ${userId}`);
  const userEnphaseApps = await prisma.userEnphaseApp.findMany({
    where: {
      userId: userId,
    },
    include: {
      app: true,
    },
  });
  console.log(`Got userEnphaseApps: ${userEnphaseApps}`);
  return userEnphaseApps;
};

const enphaseService = {
  retrieveAndSaveEnphaseAuthTokens,
  saveEnphaseAuthTokens,
  getEnphaseAppsByUserId,
};
export default enphaseService;
