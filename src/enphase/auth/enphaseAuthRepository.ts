import { prisma } from "../../lib/prisma";

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

const queryEnphaseAppById = async (userAppId: number) => {
  const userEnphaseApp = await prisma.userEnphaseApp.findUnique({
    where: {
      id: userAppId,
    },
    include: {
      app: true,
    },
  });
  console.log(`Got userEnphaseApp: ${userEnphaseApp}`);
  return userEnphaseApp;
};

const enphaseAuthRepository = {
  saveEnphaseAuthTokens,
  querySavedEnphaseAppsByUserId,
  queryEnphaseAppById,
};

export default enphaseAuthRepository;
