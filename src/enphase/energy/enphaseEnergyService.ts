import {
  differenceInMinutes,
  isBefore,
  addMinutes,
  startOfDay,
  addDays,
} from "date-fns";

import enphaseService from "../enphaseService";
import enphaseRepository from "../enphaseRepository";
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
} from "./enphaseEnergyTypes";
import { log } from "../../middleware/logEvents";

const userIdsToUpdate = [Number(process.env.ADMIN_USER_ID) ?? 2]; // For now we fetch data only for the admin user TODO: fetch all users from db
const solarSystemId = 3447361; // TODO: get solarSystemId from db
const MAX_RETRIES = 3;

/**
 * identify users for which energy data fetching is available (currently Admin user only)
 * for each user:
 * - check the amount of authorized user enphase apps - otherwise skip user
 * - refresh access token of the user enphase app if needed
 * - fetch production and consumption data
 * - merge production and consumption data to energy data
 * - merge energy data into db and update user's energy data
 */
const updateEnergyDataJob = async (
  selectedUserIds?: number[],
  dayToFetchDate?: Date
) => {
  const userIds = !selectedUserIds ? userIdsToUpdate : selectedUserIds;

  for (const userId of userIds) {
    try {
      const activeEnphaseApp = await identifyEnphaseApp(userId);

      if (!activeEnphaseApp) {
        log(
          "Job (update energy)",
          `No enphase app for user with id ${userId} found. Skipping user.`
        );
        continue;
      }

      const productionData = await getEnphaseData<ProductionDataResponse>(
        enphaseEnergyClient.requestProductionData,
        activeEnphaseApp,
        solarSystemId,
        dayToFetchDate
      );

      const consumptionData = await getEnphaseData<ConsumptionDataResponse>(
        enphaseEnergyClient.requestConsumptionData,
        activeEnphaseApp,
        solarSystemId,
        dayToFetchDate
      );

      const energyData = mergeProductionAndConsumptionData(
        productionData.intervals,
        consumptionData.intervals
      );

      log(
        "Job (update energy)",
        `Fetched energy data for user ${userId} using ${activeEnphaseApp.app.name} (id: ${activeEnphaseApp.id}).`
      );

      const updatedRows = await enphaseEnergyRepository.saveEnergyData(
        userId,
        activeEnphaseApp.id,
        solarSystemId,
        energyData
      );
    } catch (error) {
      log(
        "Job (update energy)",
        `Error processing data for user with id ${userId}. Error: ${error}`
      );
    }
  }
};

const verifyEnergyDataConsistencyJob = async (
  selectedUserIds: number[] | null = null,
  readOnly?: boolean
) => {
  const userIds = !selectedUserIds ? userIdsToUpdate : selectedUserIds;

  for (const userId of userIds) {
    const fullEnergyDataOfUser = await getEnergyData(userId);

    const daysWithGaps: Date[] = [];
    fullEnergyDataOfUser.forEach((energyData, index) => {
      if (index === 0) return;
      const previous = fullEnergyDataOfUser[index - 1];
      const previousEndDate = previous.endDate;
      const currentEndDate = energyData.endDate;
      if (!previousEndDate || !currentEndDate) return;
      const difference = differenceInMinutes(currentEndDate, previousEndDate);
      if (difference > 15) {
        log(
          "Job (verify energy)",
          `Found gap of ${difference} minutes between ${previousEndDate} and ${currentEndDate}`
        );
        const dayWithGaps = startOfDay(addMinutes(previousEndDate, 15));
        daysWithGaps.push(dayWithGaps);

        const differenceInDays = difference / 60 / 24;
        if (differenceInDays > 1) {
          log(
            "Job (verify energy)",
            "Gap is bigger than 1 day: " + differenceInDays
          );
          const amountOfDaysMissing = Math.floor(differenceInDays) + 1;
          for (let i = 1; i < amountOfDaysMissing; i++) {
            const dayWithGaps = startOfDay(addDays(previousEndDate, i));
            daysWithGaps.push(dayWithGaps);
          }
        }
      }
    });
    const uniqueDaysWithGaps = [
      ...new Set(daysWithGaps.map((date) => date.getTime())),
    ].map((time) => new Date(time));
    if (uniqueDaysWithGaps.length === 0) {
      log("Job (update energy)", "No gaps found.");
      return;
    }
    log("Job (update energy)", "Found days with gaps:");
    console.log(uniqueDaysWithGaps);

    if (readOnly) {
      log("Job (update energy)", "Read only mode, not updating energy data.");
      return;
    }

    for (const day of uniqueDaysWithGaps) {
      await updateEnergyDataJob([userId], day);
    }
  }
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
    return;
  }

  // all enphase apps the user has authorized that have a not expired refresh token
  const activeUserApps = authorizedUserApps.filter(
    (userApp: ExtendedUserEnphaseApp) =>
      userApp.app.name !== null &&
      userApp.refreshToken !== null &&
      isNotExpired(userApp.updatedAt, oneWeekInMillis)
  );

  if (activeUserApps.length === 0) {
    log(
      "Job (update energy)",
      `No authorized apps for user ${userId} found. Skipping user.`
    );
    return;
  }

  // identify if enphase apps where used previously for the given user
  const enphaseApiRequest =
    await enphaseRepository.queryEnphaseApiRequestsByUserId(userId);

  if (!enphaseApiRequest || enphaseApiRequest.length == 0) {
    // if no apps were used previously, return the first authorized enphase app
    return activeUserApps[0];
  }

  // identify previously used enphase apps for the given user
  const priorUserAppUsages = enphaseApiRequest.map((entry) => [
    entry.userAppId,
    entry.updatedAt,
  ]);

  // use unused enphase apps first if available
  const unusedUserEnphaseApps = activeUserApps.filter(
    (userApp: ExtendedUserEnphaseApp) =>
      !priorUserAppUsages.some(
        (appDateInterval) => appDateInterval[0] === userApp.id
      )
  );

  // if unused enphase apps are available, return the first one
  if (unusedUserEnphaseApps.length > 0) {
    return unusedUserEnphaseApps[0];
  }

  // identify the latest interval for each enphase app
  const latestUserAppUsages = priorUserAppUsages.reduce((acc, curr) => {
    const userAppId = curr[0] as number;
    const updatedAt = curr[1] as Date;

    // If the userAppId isn't in the accumulator or the existing date is older, update it
    if (!acc[userAppId] || isBefore(acc[userAppId], updatedAt)) {
      acc[userAppId] = updatedAt;
    }

    return acc;
  }, {} as Record<number, Date>);

  const latestUsages = Object.entries(latestUserAppUsages).map(
    ([userAppId, updatedAt]) => [parseInt(userAppId), updatedAt]
  );

  const longestUnusedApp = latestUsages.reduce((oldest, current) => {
    if (isBefore(current[1], oldest[1])) {
      return current;
    }
    return oldest;
  });

  const longestUnusedUserEnphaseAppId = longestUnusedApp[0];

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
  getEnphaseDataFunction: (
    accessToken: string,
    solarSystemId: number,
    apiKey: string,
    dayToFetchDate?: Date
  ) => Promise<EnphaseDataType>,
  enphaseApp: ExtendedUserEnphaseApp,
  solarSystemId: number,
  dayToFetchDate?: Date
): Promise<EnphaseDataType> => {
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
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
        throw Error("Essential data of enphase app missing..");

      data = await getEnphaseDataFunction(
        accessToken,
        solarSystemId,
        apiKey,
        dayToFetchDate
      );

      await enphaseService.logEnphaseApiRequest(
        freshEnphaseApp,
        getEnphaseDataFunction.name
      );
      return data as EnphaseDataType;
    } catch (error) {
      retries++;
      log(
        "Job (getEnphaseData)",
        `Error while fetching data. Attempt: ${retries}. Error: ${error}`
      );
      if (retries === MAX_RETRIES)
        throw new Error(`Failed to fetch data after ${MAX_RETRIES} attempts.`);
    }
  }
  throw new Error("Failed to retrieve data.");
};

/**
 * Merges production and consumption data into comprehensive energy data.
 * Consumption data is the base, production data is merged into it, since production data can be longer than consumption data.
 * @param productionIntervals
 * @param consumptionIntervals
 * @returns energy data
 */
const mergeProductionAndConsumptionData = (
  productionIntervals: ProductionInterval[],
  consumptionIntervals: ConsumptionInterval[]
): EnergyInterval[] => {
  return consumptionIntervals.map((consumptionInterval) => {
    const productionInterval = productionIntervals.find(
      (it) => it.end_at === consumptionInterval.end_at
    );
    return {
      end_at: consumptionInterval.end_at,
      production: productionInterval?.wh_del ?? 0,
      consumption: consumptionInterval.enwh,
    };
  });
};

const getEnergyData = async (userId: number, startAt?: Date, endAt?: Date) => {
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

  if (!startAt || !endAt) {
    const energyData = await enphaseEnergyRepository.queryEnergyDataByUserId(
      userId
    );
    return energyData;
  }

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
  verifyEnergyDataConsistencyJob,
  getEnergyData,
};

export default enphaseEnergyService;
