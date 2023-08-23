import { MerossCloud } from "../lib/meross/merossCloud";
import { MerossCloudDevice } from "../lib/meross/merossCloudDevice";
import { DeviceDefinitionType } from "../lib/meross/types";

type MerossConnectionCacheType = {
  [key: number]: MerossCloud;
};

let merossConnectionCache: MerossConnectionCacheType = {};

const getUserMerossCredentials = (userId: number) => {
  // TODO: get credentials from DB

  return {
    email: process.env.MEROSS_EMAIL ?? "setEmailInEnv",
    password: process.env.MEROSS_PASSWORD ?? "setPasswordInEnv",
  };
};

export const initializeMerossConnectionForUser = (
  userId: number
): Promise<MerossCloud> => {
  return new Promise((resolve, reject) => {
    try {
      if (merossConnectionCache[userId]) {
        console.log("using cached meross connection for user: " + userId);
        resolve(merossConnectionCache[userId]);
        return;
      }

      const credentials = getUserMerossCredentials(userId);
      const options = {
        email: credentials.email,
        password: credentials.password,
        logger: console.log,
        localHttpFirst: false,
        onlyLocalForGet: false,
        timeout: 3000,
      };

      const meross = new MerossCloud(options);

      meross.on(
        "deviceInitialized",
        (
          deviceId: string,
          deviceDef: DeviceDefinitionType,
          device: MerossCloudDevice
        ) => {
          console.log(
            `Meross: (userId: ${userId}): New device ${deviceId} initialized`
          );

          device.on("connected", () => {
            console.log(
              `Meross: (userId: ${userId}): DEV: ${deviceId} connected`
            );
          });

          device.on("close", (error: any) => {
            console.log(
              `Meross: (userId: ${userId}): DEV: ${deviceId} closed:  ${error}`
            );
          });

          device.on("error", (error: any) => {
            console.log(
              `Meross: (userId: ${userId}): DEV: ${deviceId} closed:  ${error}`
            );
          });

          device.on("reconnect", () => {
            console.log(
              `Meross: (userId: ${userId}): DEV: ${deviceId} reconnected`
            );
          });

          device.on("data", (namespace: any, payload: any) => {
            console.log(
              `Meross: (userId: ${userId}): DEV: ${deviceId} ${namespace} - data: ${JSON.stringify(
                payload
              )}`
            );
          });
        }
      );

      meross.on("connected", (deviceId: string) => {
        console.log(`Meross: (userId: ${userId}): ${deviceId} connected`);
      });

      meross.on("close", (deviceId: string, error) => {
        console.log(`Meross (userId: ${userId}): ${deviceId} closed: ${error}`);
        clearCacheForUser(userId);
      });

      meross.on("error", (deviceId: string, error) => {
        console.log(`Meross (userId: ${userId}): ${deviceId} error: ${error}`);
        clearCacheForUser(userId);
      });

      meross.on("reconnect", (deviceId: string) => {
        console.log(`Meross (userId: ${userId}): ${deviceId} reconnected`);
        console.log(deviceId + " reconnected");
      });

      meross.on("data", (deviceId: string, payload) => {
        console.log(
          `Meross (userId: ${userId}): ${deviceId} data: ${JSON.stringify(
            payload
          )}`
        );
      });

      meross.connect((error) => {
        if (error) {
          console.log(`Meross (userId: ${userId}): connect error: ${error}`);
          clearCacheForUser(userId);
          reject(
            new Error(`Meross (userId: ${userId}): connect error: ${error}`)
          );
          return;
        }

        resolve(meross);
      });

      const connectionLifetime = 3600000; // e.g., 1 hour
      setTimeout(() => {
        clearCacheForUser(userId);
      }, connectionLifetime);

      merossConnectionCache[userId] = meross;
      if (!meross) {
        throw new Error(
          "Error initializing Meross connection for user: " + userId
        );
      }
    } catch (error) {
      reject(
        new Error(
          "Error initializing Meross connection for user: " +
            userId +
            " error: " +
            error
        )
      );
    }
  });
};

export const getAllDevicesForUser = async (userId: number) => {
  const merossConnection = await initializeMerossConnectionForUser(userId);

  if (!merossConnection) {
    throw new Error("Meross connection not initialized for this user.");
  }
  const devices = merossConnection.getAllDevices();
  // merossConnection.logout(console.log("Meross logout"));
  return devices;
};

export const getDeviceByIdForUser = async (
  userId: number,
  deviceId: string
) => {
  const merossConnection = await initializeMerossConnectionForUser(userId);

  if (!merossConnection) {
    throw new Error("Meross connection not initialized for this user.");
  }
  const device = merossConnection.getDevice(deviceId);
  // merossConnection.logout(console.log("Meross logout"));
  return device;
};

export const clearCacheForUser = (userId: number) => {
  const merossConnection = merossConnectionCache[userId];
  if (!merossConnection) {
    return;
  }
  merossConnection.logout(
    console.log(`Meross (userId: ${userId}) logging out.`)
  );
  merossConnection.removeAllListeners();
  delete merossConnectionCache[userId];
};

export const clearEntireCache = () => {
  merossConnectionCache = {};
};
