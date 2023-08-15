import enphaseAuthClient from "../auth/enphaseAuthClient";
import enphaseAuthRepository from "../auth/enphaseAuthRepository";
import enphaseAuthService from "../auth/enphaseAuthService";
import enphaseEnergyClient from "./enphaseEnergyClient";
import enphaseEnergyRepository from "./enphaseEnergyRepository";
import enphaseApps from "../auth/enphaseApps";
import { isNotExpired } from "../../utils/helpers";
import { oneDayinMillis, oneWeekInMillis } from "../../utils/constants";
import { ExtendedUserEnphaseApp } from "../auth/enphaseAuthTypes";
import {
  ConsumptionDataResponse,
  ConsumptionInterval,
  EnergyInterval,
  ProductionDataResponse,
  ProductionInterval,
  EnphaseRequestKind,
} from "./enphaseEnergyTypes";

/**
 * identify users for which energy data fetching is available (currently Admin user only)
 * for each user:
 * - check the amount of authorized user enphase apps - otherwise skip user
 * - refresh access token of the user enphase app if needed
 * - fetch production and consumption data
 * - merge production and consumption data to energy data
 * - merge energy data into db and update user's energy data
 */
const updateEnergyDataJob = () => {
  const userIds = [1]; // For now we fetch data only for user with id 1
  const solarSystemId = 3447361; // TODO: get solarSystemId from db

  userIds.forEach(async (userId) => {
    const activeEnphaseApp = await identifyEnphaseApp(userId);

    if (!activeEnphaseApp) {
      console.log(
        `No enphase app for user with id ${userId} found. Skipping user.`
      );
      return;
    }
    console.log(
      `Identified enphase app ${activeEnphaseApp.app.name} to make request for user with id ${userId}.`
    );

    const productionData = await getEnphaseData<ProductionDataResponse>(
      activeEnphaseApp,
      solarSystemId,
      "production" as EnphaseRequestKind
    );
    const consumptionData = await getEnphaseData<ConsumptionDataResponse>(
      activeEnphaseApp,
      solarSystemId,
      "consumption" as EnphaseRequestKind
    );

    const energyData = mergeProductionAndConsumptionData(
      productionData.intervals,
      consumptionData.intervals
    );

    console.log(`Fetched ${energyData.length} energy data intervals.`);

    const updatedRows = await enphaseEnergyRepository.saveEnergyData(
      userId,
      activeEnphaseApp.id,
      solarSystemId,
      energyData
    );
    console.log(`Updated ${updatedRows} rows.`);
  });
};

/**
 * This function identifies the longest unused enphase app for the given user and app name.
 * Goal is to cycle through the enphase apps so that we don't hit the enphase API rate limit.
 * @param userId
 * @param appName
 * @returns longest unused but authorized enphase app for the given user and app name
 */
const identifyEnphaseApp = async (userId: number) => {
  // all enphase apps the user had authorized at some point in time
  const authorizedUserApps =
    await enphaseAuthRepository.querySavedEnphaseAppsByUserId(userId);

  if (authorizedUserApps.length === 0) {
    console.log(
      `No enphase apps for user with id ${userId} found. Skipping user.`
    );
    return;
  }
  console.log(
    `Found ${authorizedUserApps.length} authorized user enphase apps for user ${userId}`
  );

  // all enphase apps the user has authorized that have a not expired refresh token
  const activeUserApps = authorizedUserApps.filter(
    (userApp: ExtendedUserEnphaseApp) =>
      userApp.app.name !== null &&
      userApp.refreshToken !== null &&
      isNotExpired(userApp.updatedAt, oneWeekInMillis)
  );

  if (activeUserApps.length === 0) {
    console.log(
      `No authorized enphase apps for user with id ${userId} found. Skipping user.`
    );
    return;
  }
  console.log(
    `Found ${activeUserApps.length} active user enphase apps for user ${userId}`
  );

  // identify if enphase apps where used previously for the given user
  const energyData = await enphaseEnergyRepository.queryEnergyDataByUserId(
    userId
  );
  if (!energyData || energyData.length == 0) {
    // if no apps were used previously, return the first authorized enphase app
    return activeUserApps[0];
  }

  // identify previously used enphase apps for the given user
  const existingIntervals = energyData.map((entry) => [
    entry.userAppId,
    entry.updatedAt,
  ]);
  console.log(
    `Found ${existingIntervals.length} existing intervals for user with id ${userId}.`
  );

  // use unused enphase apps first if available
  const unusedUserEnphaseApps = activeUserApps.filter(
    (userApp: ExtendedUserEnphaseApp) =>
      !existingIntervals.some(
        (appDateInterval) => appDateInterval[0] === userApp.id
      )
  );
  console.log(
    `Found ${unusedUserEnphaseApps.length} unused user enphase apps for user with id ${userId}.`
  );

  // if unused enphase apps are available, return the first one
  if (unusedUserEnphaseApps.length > 0) {
    return unusedUserEnphaseApps[0];
  }

  // if no unused enphase apps are available, return the longest unused enphase app
  const longestUnusedUserEnphaseApp = existingIntervals.reduce(
    (accumulator, currentValue) => {
      if (currentValue[1] < accumulator[1]) {
        return accumulator;
      } else {
        return currentValue;
      }
    }
  );

  const longestUnusedUserEnphaseAppId = longestUnusedUserEnphaseApp[0];

  return activeUserApps.find(
    (authorizedApp: ExtendedUserEnphaseApp) =>
      authorizedApp.id === longestUnusedUserEnphaseAppId
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

const getEnphaseData = async <EnphaseDataType>(
  enphaseApp: ExtendedUserEnphaseApp,
  solarSystemId: number,
  requestKind: EnphaseRequestKind
): Promise<EnphaseDataType> => {
  await verifyAuthTokensAndRefreshIfNeeded(enphaseApp);
  const freshEnphaseApp = await enphaseAuthRepository.queryEnphaseAppById(
    enphaseApp.id
  );

  let data;
  const accessToken = freshEnphaseApp?.accessToken;
  const apiKey = enphaseApps.find(
    (app) => app.name === freshEnphaseApp?.app.name
  )?.apiKey;

  if (!accessToken || !solarSystemId || !apiKey)
    throw "Essential data of enphase app missing..";

  if (requestKind === ("production" as EnphaseRequestKind)) {
    data = await enphaseEnergyClient.requestProductionData(
      accessToken,
      solarSystemId,
      apiKey
    );
  } else if (requestKind === ("consumption" as EnphaseRequestKind)) {
    data = await enphaseEnergyClient.requestConsumptionData(
      accessToken,
      solarSystemId,
      apiKey
    );
  } else {
    throw new Error("Invalid enphase app.");
  }
  console.log(`App ${freshEnphaseApp?.app.name} made a request.`);
  return data as EnphaseDataType;
};

const mergeProductionAndConsumptionData = (
  productionIntervals: ProductionInterval[],
  consumptionIntervals: ConsumptionInterval[]
): EnergyInterval[] => {
  return productionIntervals.map((productionInterval) => {
    const consumptionInterval = consumptionIntervals.find(
      (it) => it.end_at === productionInterval.end_at
    );
    return {
      end_at: productionInterval.end_at,
      production: productionInterval.wh_del,
      consumption: consumptionInterval?.enwh ?? 0,
    };
  });
};

const getEnergyData = async (userId: number, startAt: Date, endAt: Date) => {
  const selectedFields = {
    id: true,
    userId: false,
    userAppId: false,
    systemId: true,
    endDate: true,
    production: true,
    consumption: true,
    createdAt: false,
    updatedAt: false,
  };

  const energyData =
    await enphaseEnergyRepository.queryEnergyDataByUserIdAndDateInterval(
      userId,
      startAt,
      endAt,
      selectedFields
    );
  return energyData;
};

const enphaseEnergyService = {
  updateEnergyDataJob,
  getEnergyData,
};

export default enphaseEnergyService;
