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

export const initializeMerossConnectionForUser = async (
  userId: number
): Promise<MerossCloud> => {
  if (merossConnectionCache[userId]) {
    console.log("using cached meross connection for user: " + userId);
    return merossConnectionCache[userId];
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
  attachEventListeners(meross, userId);

  try {
    await meross.connect();

    const connectionLifetime = 3600000; // 1 hour

    setTimeout(async () => {
      await clearCacheForUser(userId);
    }, connectionLifetime);

    merossConnectionCache[userId] = meross;

    return meross;
  } catch (error) {
    console.error(`Meross (userId: ${userId}): connect error: ${error}`);
    await clearCacheForUser(userId);
    throw new Error(`Meross (userId: ${userId}): connect error: ${error}`);
  }
};

const attachEventListeners = (meross: MerossCloud, userId: number) => {
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
        console.log(`Meross: (userId: ${userId}): DEV: ${deviceId} connected`);
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
    clearCacheForUser(userId); // TODO: does this need to be async?
  });

  meross.on("error", (deviceId: string, error) => {
    console.log(`Meross (userId: ${userId}): ${deviceId} error: ${error}`);
    clearCacheForUser(userId); // TODO: does this need to be async?
  });

  meross.on("reconnect", (deviceId: string) => {
    console.log(`Meross (userId: ${userId}): ${deviceId} reconnected`);
    console.log(deviceId + " reconnected");
  });

  meross.on("data", (deviceId: string, payload) => {
    console.log(
      `Meross (userId: ${userId}): ${deviceId} data: ${JSON.stringify(payload)}`
    );
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

export const clearCacheForUser = async (userId: number) => {
  const merossConnection = merossConnectionCache[userId];
  if (!merossConnection) {
    return;
  }
  await merossConnection.logout();
  merossConnection.removeAllListeners();
  delete merossConnectionCache[userId];
};

export const clearEntireCache = () => {
  merossConnectionCache = {};
};
