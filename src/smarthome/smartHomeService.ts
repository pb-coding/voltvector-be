import smartHomeRepository from "./smartHomeRepository";
import merossService from "./provider/meross/merossService";
import {
  SmartHomeProviderEnum,
  SmartHomeProviderType,
  SmartHomeProviderOverview,
} from "./smartHomeTypes";
import { log } from "../middleware/logEvents";
import { clearCacheForUser } from "./provider/meross/merossEventHandlers";
import { de } from "date-fns/locale";

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

const getSmartHomeDevicelistForUser = async (userId: number) => {
  const smartHomeDeviceList =
    await smartHomeRepository.querySmartHomeDevicelistByUserId(userId);
  return smartHomeDeviceList;
};

const getSmartHomeDevicelistByDeviceId = async (
  userId: number,
  deviceId: string
) => {
  const smartHomeDevice =
    await smartHomeRepository.querySmartHomeDevicelistByDeviceId(
      userId,
      deviceId
    );
  return smartHomeDevice;
};

const getPairedSmartHomeDevicesByProvider = async (
  userId: number,
  provider: SmartHomeProviderType
) => {
  if (provider === SmartHomeProviderEnum.MEROSS) {
    const devices = await merossService.getDevicesByUserId(userId);
    return devices;
  }
  throw new Error(`Invalid provider: ${provider}`);
};

const saveInSmartHomeDevicelist = async (
  userId: number,
  provider: SmartHomeProviderType,
  deviceId: string
) => {
  const pairedDevices = await getPairedSmartHomeDevicesByProvider(
    userId,
    provider
  );

  const deviceIsOnline = pairedDevices.find(
    (device) => device.uuid === deviceId
  );

  if (!deviceIsOnline) {
    throw new Error(
      `Can not save an unpaired device (${deviceId}) for user ${userId}.`
    );
  }

  const deviceAlreadySaved = await getSmartHomeDevicelistByDeviceId(
    userId,
    deviceId
  );

  if (deviceAlreadySaved) {
    throw new Error(`Device ${deviceId} already saved for user ${userId}.`);
  }

  const createdDevice = await smartHomeRepository.saveSmartHomeDevice(
    userId,
    provider,
    deviceId
  );
  return createdDevice;
};

const deleteDeviceFromList = async (userId: number, deviceId: string) => {
  const deletedDevice = await smartHomeRepository.deleteDeviceFromDevicelist(
    userId,
    deviceId
  );
  return deletedDevice;
};

const smartHomeService = {
  verifyCurrentSmartHomeProviderConnection,
  getSmartHomeProviderOverviewForUser,
  userHasSmartHomeAuthForProvider,
  verifySmartHomeAuthCredentials,
  addSmartHomeAuth,
  deleteSmartHomeProviderAuthForUser,
  getSmartHomeDevicelistForUser,
  getSmartHomeDevicelistByDeviceId,
  getPairedSmartHomeDevicesByProvider,
  saveInSmartHomeDevicelist,
  deleteDeviceFromList,
};

export default smartHomeService;
