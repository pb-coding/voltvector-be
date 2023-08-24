import { DeviceDefinitionType } from "../lib/meross/types";
import { MerossCloudDevice } from "../lib/meross/merossCloudDevice";
import {
  getAllDevicesForUser,
  getDeviceByIdForUser,
} from "./merossEventHandlers";
import {
  MerossDeviceInfoType,
  GetControlPowerConsumptionXResponse,
  GetControlElectricityResponse,
} from "../lib/meross/types";

const retryPromise = async <T>(
  fn: () => Promise<T>,
  retries = 2
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      if (error instanceof Error) {
        console.log(
          `Meross Error (publish Message): ${error.message}! Retrying...`
        );
      }
      return retryPromise(fn, retries - 1);
    } else {
      throw error;
    }
  }
};

const getDevicesByUserId = async (userId: number) => {
  const devices = await getAllDevicesForUser(userId);

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
  return await getDeviceByIdForUser(userId, deviceId);
};

const getDeviceInfo = async (
  device: MerossCloudDevice
): Promise<MerossDeviceInfoType> => {
  return retryPromise(() => device.getSystemAllData());
};

const getDevicePowerHistory = async (
  device: MerossCloudDevice
): Promise<GetControlPowerConsumptionXResponse> => {
  return retryPromise(() => device.getControlPowerConsumptionX());
};

const getDeviceElectricity = async (
  device: MerossCloudDevice
): Promise<GetControlElectricityResponse> => {
  return retryPromise(() => device.getControlElectricity());
};

const toggleDevice = async (
  device: MerossCloudDevice,
  desiredDeviceState: boolean
) => {
  return retryPromise(() => device.controlToggleX(0, desiredDeviceState));
};

const merossService = {
  getDevicesByUserId,
  getDeviceByUserAndDeviceId,
  getDeviceInfo,
  getDevicePowerHistory,
  getDeviceElectricity,
  toggleDevice,
};

export default merossService;
