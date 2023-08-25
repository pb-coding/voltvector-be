import { MerossCloud } from "../../../lib/meross/merossCloud";
import { MerossCloudDevice } from "../../../lib/meross/merossCloudDevice";
import { DeviceDefinitionType } from "../../../lib/meross/types";
import { log } from "../../../middleware/logEvents";

type MerossConnectionCacheType = {
  [key: number]: MerossCloud;
};

let merossConnectionCache: MerossConnectionCacheType = {};

/*const getUserMerossCredentials = (userId: number) => {
  // TODO: get credentials from DB

  return {
    email: process.env.MEROSS_EMAIL ?? "setEmailInEnv",
    password: process.env.MEROSS_PASSWORD ?? "setPasswordInEnv",
  };
};*/

export const initializeMerossConnection = async (
  userId: number,
  email: string,
  password: string
): Promise<MerossCloud> => {
  if (merossConnectionCache[userId]) {
    log("Meross", "using cached connection", userId);
    return merossConnectionCache[userId];
  }

  const options = {
    email: email,
    password: password,
    logger: log,
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
      log("Meross", `New device ${deviceId} initialized`, userId);

      device.on("connected", () => {
        log("Meross", `DEV: ${deviceId} connected`, userId);
      });

      device.on("close", (error: any) => {
        log("Meross", `DEV: ${deviceId} closed:  ${error}`, userId);
      });

      device.on("error", (error: any) => {
        log("Meross", `DEV: ${deviceId} closed:  ${error}`, userId);
      });

      device.on("reconnect", () => {
        log("Meross", `DEV: ${deviceId} reconnected`, userId);
      });

      device.on("data", (namespace: any, payload: any) => {
        log(
          "Meross",
          `DEV: ${deviceId} ${namespace} - data: ${
            (JSON.stringify(payload), userId)
          }`
        );
      });
    }
  );

  /*meross.on("connected", (deviceId: string) => {
    log("Meross", `${deviceId} connected`, userId);
  });*/

  meross.on("close", (deviceId: string, error) => {
    log("Meross", `${deviceId} closed: ${error}`, userId);
    clearCacheForUser(userId); // TODO: does this need to be async?
  });

  meross.on("error", (deviceId: string, error) => {
    log("Meross", `${deviceId} error: ${error}`, userId);
    clearCacheForUser(userId); // TODO: does this need to be async?
  });

  meross.on("reconnect", (deviceId: string) => {
    log("Meross", `${deviceId} reconnected`, userId);
  });

  meross.on("data", (deviceId: string, payload) => {
    log("Meross", `${deviceId} data: ${JSON.stringify(payload)}`, userId);
  });
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
