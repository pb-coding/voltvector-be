import enphaseAuthClient from "./enphaseAuthClient";
import enphaseAuthRepository from "./enphaseAuthRepository";
import enphaseApps from "./enphaseApps";

const retrieveAndSaveEnphaseAuthTokens = async (
  userId: number,
  applicationName: string,
  code: string
) => {
  // TODO: check if user exists

  const enphaseAuthTokens =
    await enphaseAuthClient.requestEnphaseTokensByAuthCode(
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

  await enphaseAuthRepository.saveEnphaseAuthTokens(
    userId,
    applicationName,
    enphaseAuthTokens.access_token,
    enphaseAuthTokens.refresh_token
  );

  return true;
};

const retrieveAndSaveEnphaseAuthTokensByRefreshToken = async (
  userId: number,
  applicationName: string,
  refreshToken: string
) => {
  const newTokens =
    await enphaseAuthClient.requestRefreshedTokensByRefreshToken(
      applicationName,
      refreshToken
    );

  if (!newTokens || !newTokens.access_token || !newTokens.refresh_token) {
    throw new Error("Could not retrieve new tokens from enphase.");
  }

  await enphaseAuthRepository.saveEnphaseAuthTokens(
    userId,
    applicationName,
    newTokens.access_token,
    newTokens.refresh_token
  );

  return newTokens.access_token;
};

/**
 * This function returns all enphase apps with their client ids and the date when the user last authorized the app.
 * The frontend can use this information to determine if the user has authorized the app and if the authorization is still valid.
 * @param userId
 * @returns
 */
const getEnphaseAppsOverviewByUserId = async (userId: number) => {
  const userEnphaseApps =
    await enphaseAuthRepository.querySavedEnphaseAppsByUserId(userId);
  const userAppMap = new Map(userEnphaseApps.map((app) => [app.app.name, app]));

  const allEnphaseAppsClientIds = enphaseApps.map((app) => {
    const userEnphaseApp = userAppMap.get(app.name);

    return {
      name: app.name,
      clientId: app.clientId,
      issueDate: userEnphaseApp?.updatedAt ?? null,
    };
  });
  return allEnphaseAppsClientIds;
};

const enphaseAuthService = {
  retrieveAndSaveEnphaseAuthTokens,
  retrieveAndSaveEnphaseAuthTokensByRefreshToken,
  getEnphaseAppsOverviewByUserId,
};
export default enphaseAuthService;
