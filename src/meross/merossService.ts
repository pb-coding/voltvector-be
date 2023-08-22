import { DeviceDefinition } from "../lib/meross/merossCloud";
import {
  getAllDevicesForUser,
  getDeviceByIdForUser,
} from "./merossEventHandlers";
import {
  MerossCloudDevice,
  MerossDeviceInfoType,
} from "../lib/meross/merossCloud";

const getDevicesByUserId = async (userId: number) => {
  const devices = await getAllDevicesForUser(userId);

  return Object.values(devices).map(
    (device) =>
      ({
        uuid: device.dev.uuid,
        devName: device.dev.devName,
        deviceType: device.dev.deviceType,
        onlineStatus: device.dev.onlineStatus,
      } satisfies Partial<DeviceDefinition>)
  );
};

const getDeviceByUserAndDeviceId = async (userId: number, deviceId: string) => {
  console.log(`userId: ${userId}, deviceId: ${deviceId}`);
  return await getDeviceByIdForUser(userId, deviceId);
};

const getDeviceInfo = async (device: MerossCloudDevice) => {
  let errorCount = 0;
  return new Promise((resolve, reject) => {
    device.getSystemAllData((error: any, response: MerossDeviceInfoType) => {
      if (error) {
        errorCount++;
        if (errorCount <= 1) {
          // Only retry once
          console.log("Error fetching device info. Retrying...");
          getDeviceInfo(device)
            .then((success) => resolve(success))
            .catch((error) => reject(error));
          return;
        } else {
          // unssuccessful after 2 tries
          console.log(
            "Get Device Info Response: Error: " +
              error +
              " Error Count: " +
              errorCount
          );
          resolve(false);
        }
      } else {
        resolve(response);
      }
    });
  });
};

const toggleDevice = (
  device: MerossCloudDevice,
  desiredDeviceState: boolean
) => {
  let errorCount = 0;
  return new Promise((resolve, reject) => {
    device.controlToggleX(0, desiredDeviceState, (error: any) => {
      if (error) {
        errorCount++;

        if (errorCount <= 1) {
          console.log("Error toggling device. Retrying...");
          // Only retry once
          toggleDevice(device, desiredDeviceState)
            .then((success) => resolve(success))
            .catch((error) => reject(error));
          return;
        } else {
          // unssuccessful after 2 tries
          console.log(
            "Toggle Response: Error: " + error + " Error Count: " + errorCount
          );
          resolve(false);
        }
      } else {
        // success
        resolve(true);
      }
    });
  });
};

const merossService = {
  getDevicesByUserId,
  getDeviceByUserAndDeviceId,
  getDeviceInfo,
  toggleDevice,
};

export default merossService;
