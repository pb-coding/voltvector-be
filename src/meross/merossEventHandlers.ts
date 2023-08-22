import { MerossCloud } from "./merossCloud";
import { Devices } from "./types";

const options = {
  email: process.env.MEROSS_EMAIL ?? "setEmailInEnv",
  password: process.env.MEROSS_PASSWORD ?? "setEmailInPasswordEnv",
  logger: console.log,
  localHttpFirst: false,
  onlyLocalForGet: false,
  timeout: 3000,
};

const meross = new MerossCloud(options);

export const registerMerossEvents = () => {
  meross.on("deviceInitialized", (deviceId, deviceDef, device) => {
    console.log("New device " + deviceId + ": " + JSON.stringify(deviceDef));

    device.on("connected", () => {
      console.log("DEV: " + deviceId + " connected");
      devices[deviceId as string] = device;

      if (deviceId === "2205069445274951080148e1e991c9f0") {
        device.getSystemAbilities((err: any, res: any) => {
          console.log("Abilities: " + JSON.stringify(res));

          device.getSystemAllData((err: any, res: any) => {
            console.log("All-Data: " + JSON.stringify(res));
          });
        });
        setTimeout(() => {
          console.log("toggle ...");
          device.controlToggleX(0, false, (err: any, res: any) => {
            console.log(
              "Toggle Response: err: " + err + ", res: " + JSON.stringify(res)
            );
          });
        }, 2000);
      }
    });

    device.on("close", (error: any) => {
      console.log("DEV: " + deviceId + " closed: " + error);
    });

    device.on("error", (error: any) => {
      console.log("DEV: " + deviceId + " error: " + error);
    });

    device.on("reconnect", () => {
      console.log("DEV: " + deviceId + " reconnected");
    });

    device.on("data", (namespace: any, payload: any) => {
      console.log(
        "DEV: " +
          deviceId +
          " " +
          namespace +
          " - data: " +
          JSON.stringify(payload)
      );
    });
  });

  meross.on("connected", (deviceId) => {
    console.log(deviceId + " connected");
  });

  meross.on("close", (deviceId, error) => {
    console.log(deviceId + " closed: " + error);
  });

  meross.on("error", (deviceId, error) => {
    console.log(deviceId + " error: " + error);
  });

  meross.on("reconnect", (deviceId) => {
    console.log(deviceId + " reconnected");
  });

  meross.on("data", (deviceId, payload) => {
    console.log(deviceId + " data: " + JSON.stringify(payload));
  });

  meross.connect((error) => {
    console.log("connect error: " + error);
  });
};

const devices: Devices = {};

export const getDeviceById = (deviceId: string) => {
  return devices[deviceId];
};

export const getAllDevices = () => {
  return devices;
};
