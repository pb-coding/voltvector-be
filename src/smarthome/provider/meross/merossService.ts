import { DeviceDefinitionType } from "../../../lib/meross/types";
import { MerossCloudDevice } from "../../../lib/meross/merossCloudDevice";
import {
  clearCacheForUser,
  initializeMerossConnection,
} from "./merossEventHandlers";
import smartHomeRepository from "../../smartHomeRepository";
import {
  MerossDeviceInfoType,
  GetControlPowerConsumptionXResponse,
  GetControlElectricityResponse,
} from "../../../lib/meross/types";
import { log } from "../../../middleware/logEvents";
import { SmartHomeProviderEnum } from "../../smartHomeTypes";
import { ENCRYPTION_SECRET } from "../../../utils/envs";
import { decrypt } from "../../../utils/helpers";

const verifyCurrentMerossConnection = async (userId: number) => {
  // TODO: it is possible that there is a stale connection in cache.
  // clearing cache would work, but it would also cause a lot of auth requests to meross.
  // currently we rely on the believe that clearing cache periodically should prevent stale connections.
  // if not: find an alternative solution that does not allow ddosing auth requests to prevent banns etc.
  const merossConnection = await getMerossConnectionForUser(userId);
  const isAuthenticated = merossConnection.authenticated;
  return isAuthenticated;
};

const verifyMerossAuthCredentials = async (
  userId: number,
  email: string,
  password: string
) => {
  await clearCacheForUser(userId);

  const merossConnection = await initializeMerossConnection(
    userId,
    email,
    password
  );
  const isAuthenticated = await merossConnection.authenticated;
  return isAuthenticated;
};

const getMerossConnectionForUser = async (userId: number) => {
  const includeSensitiveData = true;
  const merossAuth =
    await smartHomeRepository.querySmartHomeAuthByProviderAndUserId(
      SmartHomeProviderEnum.MEROSS,
      userId,
      includeSensitiveData
    );

  // TODO: handle error response
  if (merossAuth.length === 0) {
    throw new Error(`Meross auth not found for user ${userId}.`);
  }

  if (merossAuth.length > 1) {
    throw new Error(`Multiple Meross auth found for user ${userId}.`);
  }

  const { email: encryptedEmail, password: encryptedPassword } = merossAuth[0];
  const decryptedEmail = await decrypt(encryptedEmail, ENCRYPTION_SECRET);
  const decryptedPassword = await decrypt(encryptedPassword, ENCRYPTION_SECRET);

  const merossConnection = await initializeMerossConnection(
    userId,
    decryptedEmail,
    decryptedPassword
  );

  if (!merossConnection) {
    throw new Error(`Meross connection not initialized for user ${userId}.`);
  }

  return merossConnection;
};

const retryPromise = async <T>(
  fn: () => Promise<T>,
  retries = 2
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      if (error instanceof Error) {
        log("Meross Error (publish Message)", `${error.message}! Retrying...`);
      }
      return retryPromise(fn, retries - 1);
    } else {
      throw error;
    }
  }
};

const getDevicesByUserId = async (userId: number) => {
  const merossConnection = await getMerossConnectionForUser(userId);
  const devices = merossConnection.getAllDevices();

  return Object.values(devices).map(
    (device) =>
      ({
        uuid: device.dev.uuid,
        devName: device.dev.devName,
        deviceType: device.dev.deviceType,
        onlineStatus: device.dev.onlineStatus,
      } satisfies Partial<DeviceDefinitionType>)
  );
};

const getDeviceByUserAndDeviceId = async (userId: number, deviceId: string) => {
  const merossConnection = await getMerossConnectionForUser(userId);
  const device = merossConnection.getDevice(deviceId);
  return device;
};

const getDeviceInfo = async (device: MerossCloudDevice) =>
  retryPromise<MerossDeviceInfoType>(() => device.getSystemAllData());

const getDevicePowerHistory = async (device: MerossCloudDevice) =>
  retryPromise<GetControlPowerConsumptionXResponse>(() =>
    device.getControlPowerConsumptionX()
  );

const getDeviceElectricity = async (device: MerossCloudDevice) =>
  retryPromise<GetControlElectricityResponse>(() =>
    device.getControlElectricity()
  );

const toggleDevice = async (
  device: MerossCloudDevice,
  desiredDeviceState: boolean
) => retryPromise(() => device.controlToggleX(0, desiredDeviceState));

const merossService = {
  verifyCurrentMerossConnection,
  verifyMerossAuthCredentials,
  getMerossConnectionForUser,
  getDevicesByUserId,
  getDeviceByUserAndDeviceId,
  getDeviceInfo,
  getDevicePowerHistory,
  getDeviceElectricity,
  toggleDevice,
};

export default merossService;
