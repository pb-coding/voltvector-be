import enphaseAuthClient from "../auth/enphaseAuthClient";
import enphaseAuthRepository from "../auth/enphaseAuthRepository";
import enphaseAuthService from "../auth/enphaseAuthService";
import { isNotExpired } from "../../utils/helpers";
import { oneDayinMillis, oneWeekInMillis } from "../../utils/constants";
import { prisma } from "../../lib/prisma";
import { ExtendedUserEnphaseApp } from "../auth/enphaseAuthTypes";

const queryEnergyDataByUserId = async (userId: number) => {
  const energyData = await prisma.energyData.findMany({
    where: {
      userId: userId,
    },
    select: {
      id: true,
      userId: true,
      userAppId: true,
      systemId: true,
      endDate: true,
      production: true,
      consumption: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return energyData;
};

/**
 * This function identifies the longest unused enphase app for the given user and app name.
 * Goal is to cycle through the enphase apps so that we don't hit the enphase API rate limit.
 * @param userId
 * @param appName
 * @returns longest unused but authorized enphase app for the given user and app name
 */
const identifyEnphaseApp = async (userId: number, appName: string) => {
  // all enphase apps the user had authorized at some point in time
  console.log(`userId: ${userId} appName: ${appName}`);
  const userEnphaseApps =
    await enphaseAuthService.querySavedEnphaseAppsByUserId(userId);

  console.log(`userEnphaseApps: ${JSON.stringify(userEnphaseApps)}`);
  if (userEnphaseApps.length === 0) {
    console.log(
      `No enphase apps for user with id ${userId} found. Skipping user.`
    );
    return;
  }

  // all enphase apps the user has authorized that have a not expired refresh token and meet the app name criteria
  const authorizedEnphaseApps = userEnphaseApps.filter(
    (userApp) =>
      userApp.app.name !== null &&
      userApp.app.name.includes(appName) &&
      userApp.refreshToken !== null &&
      isNotExpired(userApp.updatedAt, oneWeekInMillis)
  );
  console.log(
    `authorizedEnphaseApps: ${JSON.stringify(authorizedEnphaseApps)}`
  );

  if (authorizedEnphaseApps.length === 0) {
    console.log(
      `No authorized enphase apps for ${appName} for user with id ${userId} found. Skipping user.`
    );
    return;
  }

  // identify if enphase apps where used previously for the given user
  const energyData = await queryEnergyDataByUserId(userId);
  if (!energyData || energyData.length == 0) {
    // if no apps were used previously, return the first authorized enphase app
    return authorizedEnphaseApps[0];
  }

  // identify previously used enphase apps for the given user
  const usedUserEnphaseApps = energyData.map((entry) => [
    entry.userAppId,
    entry.updatedAt,
  ]);
  console.log(`usedUserEnphaseApps: ${JSON.stringify(usedUserEnphaseApps)}`);

  // use unused enphase apps first if available
  const unusedUserEnphaseApps = authorizedEnphaseApps.filter(
    (userApp) =>
      !usedUserEnphaseApps.some(
        (appDateArray) => appDateArray[0] === userApp.id
      )
  );
  console.log(
    `unusedUserEnphaseApps: ${JSON.stringify(unusedUserEnphaseApps)}`
  );

  // if unused enphase apps are available, return the first one
  if (unusedUserEnphaseApps.length > 0) {
    return unusedUserEnphaseApps[0];
  }

  // if no unused enphase apps are available, return the longest unused enphase app
  const longestUnusedUserEnphaseApp = usedUserEnphaseApps.reduce(
    (accumulator, currentValue) => {
      if (currentValue[1] < accumulator[1]) {
        return accumulator;
      } else {
        return currentValue;
      }
    }
  );

  const longestUnusedUserEnphaseAppId = longestUnusedUserEnphaseApp[0];

  return authorizedEnphaseApps.find(
    (authorizedApp) => authorizedApp.id === longestUnusedUserEnphaseAppId
  );
};

const verifyAuthTokensAndRefreshIfNeeded = async (
  enphaseApp: ExtendedUserEnphaseApp
) => {
  const accessToken = enphaseApp.accessToken;
  const refreshToken = enphaseApp.refreshToken;
  const updatedAt = enphaseApp.updatedAt;

  if (isNotExpired(updatedAt, oneDayinMillis)) {
    return;
  }

  // const newTokens = await enphaseAuthClient.requestRefreshedTokensByRefreshToken(refreshToken, enphaseApp.app.name);

  await enphaseAuthService.retrieveAndSaveEnphaseAuthTokensByRefreshToken(
    enphaseApp.userId,
    enphaseApp.app.name,
    refreshToken
  );
  return;
};

const getEnphaseData = async (enphaseApp: ExtendedUserEnphaseApp) => {
  await verifyAuthTokensAndRefreshIfNeeded(enphaseApp);
  const freshEnphaseApp = await enphaseAuthRepository.queryEnphaseAppById(
    enphaseApp.id
  );
  const data = fetchEnphaseData(accessToken);
  return data;
};

const mergeProductionAndConsumptionData = (
  productionData,
  consumptionData
) => {};

/**
 * identify users for which energy data fetching is available (currently Admin user only)
 * for each user:
 * - check the amount of authorized enphase production and consumption apps - otherwise skip user
 * - refresh access token of the userApp if needed
 * - fetch production and consumption data
 * - merge production and consumption data to energy data
 * - merge energy data into db and update user's energy data
 */
const updateEnergyDataJob = () => {
  const userIds = [2]; // For now we fetch data only for user with id 2

  userIds.forEach(async (userId) => {
    const productionEnphaseApp = await identifyEnphaseApp(userId, "production");
    const consumptionEnphaseApp = await identifyEnphaseApp(
      userId,
      "consumption"
    );
    if (!productionEnphaseApp || !consumptionEnphaseApp) {
      console.log(
        `No production or consumption enphase app for user with id ${userId} found. Skipping user.`
      );
      return;
    }
    console.log(
      `productionEnphaseApp: ${JSON.stringify(productionEnphaseApp)}`
    );
    console.log(
      `consumptionEnphaseApp: ${JSON.stringify(consumptionEnphaseApp)}`
    );

    const productionData = getEnphaseData(productionEnphaseApp);
    const consumptionData = getEnphaseData(consumptionEnphaseApp);

    const energyData = mergeProductionAndConsumptionData(
      productionData,
      consumptionData
    );

    // save energy data to db
  });

  // const enphaseApps = get
  // const responsibleApps = enphaseAppTimeplan.filter((app) => {}
};

const enphaseEnergyService = {
  updateEnergyDataJob,
};

export default enphaseEnergyService;
