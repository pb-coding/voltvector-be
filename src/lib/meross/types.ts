// thanks to https://github.com/Apollon77/meross-cloud for the meross cloud implementation
// thanks to https://github.com/arandall/meross/blob/main/doc/protocol.md for the protocol documentation

import mqtt from "mqtt";
import { MerossCloudDevice } from "./merossCloudDevice";

export type Callback<T> = (error: Error | null, data: T) => void;
export type CallbackOptionalData<T> = (error: Error | null, data?: T) => void;
export type ErrorCallback = (error: Error | null) => void;
export type DeviceInitializedEvent = "deviceInitialized";

export type DeviceInitializedCallback = (
  deviceId: string,
  deviceDef: DeviceDefinitionType,
  device: MerossCloudDevice
) => void;

export interface DeviceDefinitionType {
  uuid: string;
  onlineStatus: number;
  devName: string;
  devIconId: string;
  bindTime: number;
  deviceType: string;
  subType: string;
  channels: Array<Record<string, any>>;
  region: string;
  fmwareVersion: string;
  hdwareVersion: string;
  userDevIcon: string;
  iconType: number;
  skillNumber: string;
  domain: string;
  reservedDomain: string;
  cluster: number;
  hardwareCapabilities: any[];
}

export type MerossDeviceListType = {
  [key: string]: MerossCloudDevice;
};

/*export interface Devices {
  [key: string]: any;
}*/

export type DeviceList = DeviceDefinitionType[];

export interface GetControlPowerConsumptionXResponse {
  consumptionx: {
    /**
     * date in Y-m-d format
     */
    date: string;
    /**
     * start timestamp of period, utc.
     * has to be multiplied by 1000 to use on new Date(time)
     */
    time: number;
    /**
     * Usage value in watt hours
     */
    value: number;
  }[];
}
export interface GetControlElectricityResponse {
  electricity: {
    /**
     * it is assumed this is to support an appliance with multiple sockets
     */
    channel: number;
    /**
     * current in decimilliAmp. Has to get divided by 10000 to get Amp(s)
     */
    current: number;
    /**
     * voltage in deciVolt. Has to get divided by 10 to get Volt(s)
     */
    voltage: number;
    /**
     * power in milliWatt. Has to get divided by 1000 to get Watt(s)
     */
    power: number;
    config: {
      voltageRatio: number;
      electricityRatio: number;
    };
  };
}

export interface CloudOptions {
  email: string;
  password: string;
  logger?: Function;
  localHttpFirst?: boolean;
  onlyLocalForGet?: boolean;
  timeout?: number;
}

export interface LightData {
  uuid: string;
  channel: number;
  capacity: number;
  gradual: number;
  rgb?: number;
  temperature?: number;
  luminance?: number;
}

export interface ThermostatModeData {
  channel: number;
  heatTemp?: number;
  coolTemp?: number;
  manualTemp?: number;
  ecoTemp?: number;
  targetTemp?: number;
  mode?: number;
  onoff?: number;
}

export type MerossDeviceInfoType = {
  all: {
    system: {
      hardware: {
        type: string;
        subType: string;
        version: string;
        chipType: string;
        uuid: string;
        macAddress: string;
      };
      firmware: {
        version: string;
        compileTime: string;
        encrypt: number;
        wifiMac: string;
        innerIp: string;
        server: string;
        port: number;
        userId: number;
      };
      time: {
        timestamp: number;
        timezone: string;
        timeRule: Array<[number, number, number]>;
      };
      online: {
        status: number;
        bindId: string;
        who: number;
      };
    };
    digest: {
      togglex: Array<{
        channel: number;
        onoff: number;
        lmTime: number;
      }>;
    };
  };
};

export type LoginResponse = {
  userid: number;
  email: string;
  key: string;
  token: string;
};

export interface MqttConnection {
  client: mqtt.MqttClient | null;
  deviceList: string[]; // Array of device UUIDs
  silentReInitialization?: boolean; // Optional based on usage
}

export type MqttConnectionsType = {
  [domain: string]: MqttConnection;
};

export type LoginParameters = {
  email: string;
  password: string;
  mobileInfo: {
    deviceModel: string;
    mobileOsVersion: string;
    mobileOs: string;
    uuid: string;
    carrier: string;
  };
};

export type UuidParameters = {
  uuid: string;
};

export type ParameterObject = LoginParameters | UuidParameters | {};

export type Message = {
  header: {
    messageId: string;
    method: "GET" | "SET" | "PUSH";
    namespace: string;
    from?: string;
  };
  payload?: any;
};

export type MessageId = string;

export type WaitingMessageIds = {
  [messageId: MessageId]: {
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  };
};
