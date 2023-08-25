import smartHomeRepository from "./smartHomeRepository";
import merossService from "./provider/meross/merossService";
import {
  SmartHomeProviderEnum,
  SmartHomeProviderType,
  SmartHomeProviderOverview,
} from "./smartHomeTypes";
import { log } from "../middleware/logEvents";
import { clearCacheForUser } from "./provider/meross/merossEventHandlers";

const getSmartHomeProviderOverviewForUser = async (
  userId: number
): Promise<SmartHomeProviderOverview[]> => {
  const includeSensitiveData = false;
  const allProviders = Object.values(SmartHomeProviderEnum);
  const smartHomeAuth = await smartHomeRepository.querySmartHomeAuthByUserId(
    userId,
    includeSensitiveData
  );
  const savedProviders = smartHomeAuth.map((auth) => auth.provider);
  const authorizedProviders = await Promise.all(
    savedProviders.filter(
      async (provider) =>
        await verifyCurrentSmartHomeProviderConnection(userId, provider)
    )
  );
  const providerOverview = allProviders.map((provider) => {
    return {
      provider,
      saved: savedProviders.includes(provider),
      authorized: authorizedProviders.includes(provider),
    };
  });
  return providerOverview;
};

const userHasSmartHomeAuthForProvider = async (
  userId: number,
  provider: SmartHomeProviderType
): Promise<boolean> => {
  const includeSensitiveData = false;
  const smartHomeAuth =
    await smartHomeRepository.querySmartHomeAuthByProviderAndUserId(
      provider,
      userId,
      includeSensitiveData
    );
  if (smartHomeAuth.length > 0) {
    return true;
  }
  return false;
};

const verifyCurrentSmartHomeProviderConnection = async (
  userId: number,
  provider: SmartHomeProviderType
): Promise<boolean> => {
  if (provider === SmartHomeProviderEnum.MEROSS) {
    const isAuthenticated = await merossService.verifyCurrentMerossConnection(
      userId
    );
    return isAuthenticated;
  }
  log("Smart Home", `Invalid provider: ${provider}`, userId);
  return false;
};

const verifySmartHomeAuthCredentials = async (
  userId: number,
  email: string,
  password: string,
  provider: SmartHomeProviderType
): Promise<boolean> => {
  if (provider === SmartHomeProviderEnum.MEROSS) {
    const isValid = await merossService.verifyMerossAuthCredentials(
      userId,
      email,
      password
    );
    return isValid;
  }
  log("Smart Home", `Invalid provider: ${provider}`);
  return false;
};

const addSmartHomeAuth = async (
  userId: number,
  email: string,
  password: string,
  provider: SmartHomeProviderType
) => {
  try {
    return await smartHomeRepository.saveSmartHomeAuth(
      provider,
      userId,
      email,
      password
    );
  } catch (error) {
    throw new Error(`Smart Home: Error saving smart home auth to db: ${error}`);
  }
};

const deleteSmartHomeProviderAuthForUser = async (
  userId: number,
  provider: SmartHomeProviderType
) => {
  try {
    const deletedAuth =
      await smartHomeRepository.deleteSmartHomeAuthByProviderAndUserId(
        provider,
        userId
      );
    if (provider === SmartHomeProviderEnum.MEROSS) {
      await clearCacheForUser(userId);
    }
    return deletedAuth;
  } catch (error) {
    throw new Error(
      `Smart Home: Error deleting smart home auth from db: ${error}`
    );
  }
};

const smartHomeService = {
  verifyCurrentSmartHomeProviderConnection,
  getSmartHomeProviderOverviewForUser,
  userHasSmartHomeAuthForProvider,
  verifySmartHomeAuthCredentials,
  addSmartHomeAuth,
  deleteSmartHomeProviderAuthForUser,
};

export default smartHomeService;
