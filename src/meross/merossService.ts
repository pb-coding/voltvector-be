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
          reject(error);
        }
      } else {
        resolve(response);
      }
    });
  });
};

const getDevicePowerHistory = async (
  device: MerossCloudDevice
): Promise<GetControlPowerConsumptionXResponse> => {
  let errorCount = 0;
  return new Promise((resolve, reject) => {
    device.getControlPowerConsumptionX(
      (error: any, response: GetControlPowerConsumptionXResponse) => {
        if (error) {
          errorCount++;
          if (errorCount <= 1) {
            // Only retry once
            console.log("Error fetching device power consumption. Retrying...");
            getDevicePowerHistory(device)
              .then((success) => resolve(success))
              .catch((error) => reject(error));
            return;
          } else {
            // unssuccessful after 2 tries
            console.log(
              "Get Device Power Consumption Response: Error: " +
                error +
                " Error Count: " +
                errorCount
            );
            reject(error);
          }
        } else {
          resolve(response);
        }
      }
    );
  });
};

const getDeviceElectricity = async (
  device: MerossCloudDevice
): Promise<GetControlElectricityResponse> => {
  let errorCount = 0;
  return new Promise((resolve, reject) => {
    device.getControlElectricity(
      (error: any, response: GetControlElectricityResponse) => {
        if (error) {
          errorCount++;
          if (errorCount <= 1) {
            // Only retry once
            console.log("Error fetching device electricity. Retrying...");
            getDeviceElectricity(device)
              .then((success) => resolve(success))
              .catch((error) => reject(error));
            return;
          } else {
            // unssuccessful after 2 tries
            console.log(
              "Get Device Electricity Response: Error: " +
                error +
                " Error Count: " +
                errorCount
            );
            reject(error);
          }
        } else {
          resolve(response);
        }
      }
    );
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
          reject(error);
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
  getDevicePowerHistory,
  getDeviceElectricity,
  toggleDevice,
};

export default merossService;
