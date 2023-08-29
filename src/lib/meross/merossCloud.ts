// thanks to https://github.com/Apollon77/meross-cloud for the meross cloud implementation
// thanks to https://github.com/arandall/meross/blob/main/doc/protocol.md for the protocol documentation
// TODO: cleanup and type!

"use strict";

import * as mqtt from "mqtt";
import * as crypto from "crypto";
import request from "request";
import { promisify } from "util";
import EventEmitter from "events";
import { v4 as uuidv4 } from "uuid";

import { getErrorMessage } from "./errorMessages";
import { MerossCloudDevice } from "./merossCloudDevice";
import { MerossCloudHubDevice } from "./merossCloudHubDevice";
import {
  ParameterObject,
  LoginParameters,
  LoginResponse,
  CloudOptions,
  MqttConnectionsType,
  MerossDeviceListType,
  DeviceDefinitionType,
  DeviceList,
} from "./types";

const SECRET = process.env.MEROSS_SECRET ?? "setSecretInEnv";
const MEROSS_URL = "https://iot.meross.com";
const LOGIN_URL = `${MEROSS_URL}/v1/Auth/Login`;
const LOGOUT_URL = `${MEROSS_URL}/v1/Profile/logout`;
const DEV_LIST = `${MEROSS_URL}/v1/Device/devList`;
const SUBDEV_LIST = `${MEROSS_URL}/v1/Hub/getSubDevices`;

const requestAsync = promisify(request);

function generateRandomString(length: number) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  while (nonce.length < length) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

function encodeParams(parameters: ParameterObject) {
  const jsonstring = JSON.stringify(parameters);
  return Buffer.from(jsonstring).toString("base64");
}

export class MerossCloud extends EventEmitter {
  options: CloudOptions;
  token: string | null;
  key: string | null;
  userId: string | null;
  userEmail: string | null;
  authenticated: boolean;
  localHttpFirst: boolean;
  onlyLocalForGet: boolean;
  timeout: number;
  mqttConnections: MqttConnectionsType;
  devices: MerossDeviceListType;
  clientResponseTopic: string | null;

  constructor(options: CloudOptions) {
    super();

    this.options = options || {};
    this.token = null;
    this.key = null;
    this.userId = null;
    this.userEmail = null;
    this.authenticated = false;

    this.localHttpFirst = !!options.localHttpFirst;
    this.onlyLocalForGet = this.localHttpFirst
      ? !!options.onlyLocalForGet
      : false;

    this.timeout = options.timeout || 10000;

    this.mqttConnections = {};
    this.devices = {};
    this.clientResponseTopic = null;
  }

  async authenticatedPost(url: string, paramsData: ParameterObject) {
    const nonce = generateRandomString(16);
    const timestampMillis = Date.now();
    const loginParams = encodeParams(paramsData);

    // Generate the md5-hash (called signature)
    const datatosign = SECRET + timestampMillis + nonce + loginParams;
    const md5hash = crypto.createHash("md5").update(datatosign).digest("hex");
    const headers = {
      Authorization: `Basic ${this.token || ""}`,
      vender: "meross",
      AppVersion: "0.4.4.4",
      AppType: "MerossIOT",
      AppLanguage: "EN",
      "User-Agent": "MerossIOT/0.4.4.4",
    };

    const payload = {
      params: loginParams,
      sign: md5hash,
      timestamp: timestampMillis,
      nonce: nonce,
    };

    const options = {
      url: url,
      method: "POST",
      headers: headers,
      form: payload,
      timeout: this.timeout,
    };

    /*this.options.logger &&
      this.options.logger("Meross", `HTTP-Call: ${JSON.stringify(options)}`);*/

    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (!error && response && response.statusCode === 200 && body) {
          /*this.options.logger &&
            this.options.logger("Meross", `HTTP-Response OK: ${body}`);*/
          try {
            body = JSON.parse(body);
          } catch (err) {
            body = {};
          }

          if (body.apiStatus === 0) {
            resolve(body.data);
          } else {
            const error = new Error(
              `${body.apiStatus} (${getErrorMessage(body.apiStatus)})${
                body.info ? ` - ${body.info}` : ""
              }`
            );
            reject(error);
          }
        } else {
          this.options.logger &&
            this.options.logger(
              "Meross Error",
              `HTTP-Response Error: ${error} / Status=${
                response ? response.statusCode : "--"
              }`
            );
          reject(error);
        }
      });
    });
  }

  connectDevice(
    deviceObj: MerossCloudDevice | MerossCloudHubDevice,
    dev: DeviceDefinitionType
  ) {
    const deviceId = dev.uuid;
    this.devices[deviceId] = deviceObj;
    this.devices[deviceId].on("connected", () => {
      this.emit("connected", deviceId);
    });
    this.devices[deviceId].on("close", (error: any) => {
      this.emit("close", deviceId, error);
    });
    this.devices[deviceId].on("error", (error: any) => {
      if (!this.listenerCount("error")) return;
      this.emit("error", error, deviceId);
    });
    this.devices[deviceId].on("reconnect", () => {
      this.emit("reconnect", deviceId);
    });
    this.devices[deviceId].on("data", (namespace: any, payload: any) => {
      this.emit("data", deviceId, namespace, payload);
    });
    this.devices[deviceId].on("rawData", (message: string) => {
      this.emit("rawData", deviceId, message);
    });
    this.emit("deviceInitialized", deviceId, dev, this.devices[deviceId]);

    this.initMqtt(dev);
    this.devices[deviceId].connect();
  }

  async connect(): Promise<number> {
    try {
      if (!this.options.email) {
        throw new Error("Meross: Email missing");
      }
      if (!this.options.password) {
        throw new Error("Meross: Password missing");
      }
      const logIdentifier = generateRandomString(30) + uuidv4();
      const data = {
        email: this.options.email,
        password: this.options.password,
        mobileInfo: {
          deviceModel: "",
          mobileOsVersion: "",
          mobileOs: process.platform,
          uuid: logIdentifier,
          carrier: "",
        },
      } satisfies LoginParameters;
      //console.log(JSON.stringify(data));

      const loginResponse: LoginResponse = (await this.authenticatedPost(
        LOGIN_URL,
        data
      )) as LoginResponse;

      if (!loginResponse) {
        throw new Error("No valid Login Response data received");
      }

      this.token = loginResponse.token;
      this.key = loginResponse.key;
      this.userId = loginResponse.userid.toString();
      this.userEmail = loginResponse.email;
      this.authenticated = true;

      const deviceList: DeviceList = (await this.authenticatedPost(
        DEV_LIST,
        {}
      )) as DeviceList;

      let initCounter = 0;
      let deviceListLength = 0;

      if (deviceList && Array.isArray(deviceList)) {
        deviceListLength = deviceList.length;

        for (const dev of deviceList) {
          if (dev.deviceType.startsWith("msh300")) {
            this.options.logger &&
              this.options.logger("Meross", `${dev.uuid} Detected Hub`);
            const subDeviceList = await this.authenticatedPost(SUBDEV_LIST, {
              uuid: dev.uuid,
            });
            this.connectDevice(
              new MerossCloudHubDevice(this, dev, subDeviceList),
              dev
            );
            initCounter++;
          } else {
            this.connectDevice(new MerossCloudDevice(this, dev), dev);
            initCounter++;
          }
        }
      }

      if (initCounter !== deviceListLength) {
        throw new Error("Initialization count mismatch");
      }

      return deviceListLength;
    } catch (error) {
      console.error(error);
      return 0;
    }
  }

  async logout(): Promise<void> {
    if (!this.authenticated || !this.token) {
      console.log("Meross: Already logged out");
    }

    try {
      await this.authenticatedPost(LOGOUT_URL, {});

      this.token = null;
      this.key = null;
      this.userId = null;
      this.userEmail = null;
      this.authenticated = false;
    } catch (error) {
      console.error(error);
      throw error; // TODO: check if this needs to be handled
    }
  }

  getDevice(uuid: string): MerossCloudDevice {
    return this.devices[uuid];
  }

  getAllDevices(): MerossDeviceListType {
    return this.devices;
  }

  disconnectAll(force: boolean): void {
    for (const deviceId in this.devices) {
      if (!this.devices.hasOwnProperty(deviceId)) continue;
      this.devices[deviceId].disconnect(); // removed "force" parameter
    }
    for (const domain of Object.keys(this.mqttConnections)) {
      this.mqttConnections[domain]?.client?.end(force);
    }
  }

  initMqtt(dev: DeviceDefinitionType) {
    const domain = dev.domain || "eu-iot.meross.com"; // reservedDomain ???
    if (!this.mqttConnections[domain] || !this.mqttConnections[domain].client) {
      const appId = crypto
        .createHash("md5")
        .update(`API${uuidv4()}`)
        .digest("hex");
      const clientId = `app:${appId}`;

      if (!this.userId || !this.key) {
        throw new Error("UserId or Key is missing.");
      }
      // Password is calculated as the MD5 of USERID concatenated with KEY
      const hashedPassword = crypto
        .createHash("md5")
        .update(this.userId + this.key)
        .digest("hex");

      if (!this.mqttConnections[domain]) {
        this.mqttConnections[domain] = {
          client: null,
          deviceList: [],
        };
      }
      if (this.mqttConnections[domain].client) {
        this.mqttConnections[domain]?.client?.end(true);
      }
      this.mqttConnections[domain].client = mqtt.connect({
        protocol: "mqtts",
        host: domain,
        port: 2001,
        clientId: clientId,
        username: this.userId ?? "",
        password: hashedPassword,
        rejectUnauthorized: true,
        keepalive: 30,
        reconnectPeriod: 5000,
      });
      this.mqttConnections[domain].deviceList =
        this.mqttConnections[domain].deviceList || [];
      if (!this.mqttConnections[domain].deviceList.includes(dev.uuid)) {
        this.mqttConnections[domain].deviceList.push(dev.uuid);
      }

      this.mqttConnections[domain]?.client?.on("connect", () => {
        //console.log("Connected. Subscribe to user topics");

        this.mqttConnections[domain].client?.subscribe(
          `/app/${this.userId}/subscribe`,
          (err: any) => {
            if (err) {
              this.emit("error", err);
            }
            //console.log('User Subscribe Done');
          }
        );

        this.clientResponseTopic = `/app/${this.userId}-${appId}/subscribe`;

        this.mqttConnections[domain]?.client?.subscribe(
          this.clientResponseTopic,
          (err: any) => {
            if (err) {
              this.emit("error", err);
            }
            //console.log('User Response Subscribe Done');
          }
        );

        this.mqttConnections[domain].deviceList.forEach((devId: string) => {
          this.devices[devId] &&
            this.devices[devId].emit(
              this.mqttConnections[domain].silentReInitialization
                ? "reconnect"
                : "connected"
            );
        });
        this.mqttConnections[domain].silentReInitialization = false;
      });

      this.mqttConnections[domain]?.client?.on("error", (error: any) => {
        if (error && error.toString().includes("Server unavailable")) {
          this.mqttConnections[domain].silentReInitialization = true;
          this.mqttConnections[domain]?.client?.end(true);
          if (this.mqttConnections[domain].deviceList.length) {
            setImmediate(() => {
              this.mqttConnections[domain].client = null;
              if (this.mqttConnections[domain].deviceList.length) {
                this.initMqtt(
                  this.devices[this.mqttConnections[domain].deviceList[0]].dev // TODO: check if this is correct - added .dev
                );
              }
            });
          }
        }
        this.mqttConnections[domain].deviceList.forEach((devId: string) => {
          this.devices[devId] &&
            this.devices[devId].emit("error", error ? error.toString() : null);
        });
      });
      this.mqttConnections[domain]?.client?.on("close", () => {
        if (this.mqttConnections[domain].silentReInitialization) {
          return;
        }
        this.mqttConnections[domain].deviceList.forEach((devId: string) => {
          this.devices[devId] && this.devices[devId].emit("close", null);
        });
      });
      this.mqttConnections[domain]?.client?.on("reconnect", () => {
        this.mqttConnections[domain].deviceList.forEach((devId: any) => {
          this.devices[devId] && this.devices[devId].emit("reconnect");
        });
      });

      this.mqttConnections[domain]?.client?.on(
        "message",
        (topic: any, message: any) => {
          if (!message) return;
          // message is Buffer
          //console.log(topic + ' <-- ' + message.toString());
          try {
            message = JSON.parse(message.toString());
          } catch (err) {
            this.emit("error", `JSON parse error: ${err}`);
            return;
          }

          if (!message.header.from) return;
          const fromArr = message.header.from.split("/");
          if (this.devices[fromArr[2]]) {
            this.devices[fromArr[2]].handleMessage(message);
          }
        }
      );
    } else {
      if (!this.mqttConnections[domain].deviceList.includes(dev.uuid)) {
        this.mqttConnections[domain].deviceList.push(dev.uuid);
      }
      if (this.mqttConnections[domain]?.client?.connected) {
        setImmediate(() => {
          this.devices[dev.uuid] && this.devices[dev.uuid].emit("connected");
        });
      }
    }
  }

  sendMessageMqtt(dev: DeviceDefinitionType, data: any) {
    if (
      !this.mqttConnections[dev.domain] ||
      !this.mqttConnections[dev.domain].client
    ) {
      return false;
    }

    /*this.options.logger &&
      this.options.logger(
        `MQTT-Cloud-Call ${dev.uuid}: ${JSON.stringify(data)}`
      );*/
    this.mqttConnections[dev.domain]?.client?.publish(
      `/appliance/${dev.uuid}/subscribe`,
      JSON.stringify(data),
      undefined,
      (err: any) => {
        if (err) {
          this.devices[dev.uuid] && this.devices[dev.uuid].emit("error", err);
        }
      }
    );
    return true;
  }

  async sendMessageHttp(dev: DeviceDefinitionType, ip: string, payload: any) {
    const options = {
      url: `http://${ip}/config`,
      method: "POST",
      json: payload,
      timeout: this.timeout,
    };

    /*this.options.logger &&
      this.options.logger(
        `HTTP-Local-Call ${dev.uuid}: ${JSON.stringify(options)}`
      );*/

    const response = await requestAsync(options);

    if (response && response.statusCode === 200 && response.body) {
      /*this.options.logger &&
        this.options.logger(
          `HTTP-Local-Response OK ${dev.uuid}: ${JSON.stringify(response.body)}`
        );*/

      if (response.body) {
        setImmediate(() => {
          this.devices[dev.uuid].handleMessage(response.body);
        });
      } else {
        throw new Error(`${response.body.apiStatus}: ${response.body.info}`);
      }
    } else {
      const errorMessage = response
        ? `${response.statusCode} - ${response.statusMessage}`
        : "No response received";
      this.options.logger &&
        this.options.logger(
          "Meross Error",
          `HTTP-Local-Response Error ${dev.uuid}: ${errorMessage}`
        );
      throw new Error(errorMessage);
    }
  }

  encodeMessage(method: any, namespace: any, payload: any) {
    const messageId = crypto
      .createHash("md5")
      .update(generateRandomString(16))
      .digest("hex");
    const timestamp = Math.round(new Date().getTime() / 1000); //int(round(time.time()))

    const signature = crypto
      .createHash("md5")
      .update(messageId + this.key + timestamp)
      .digest("hex");

    return {
      header: {
        from: this.clientResponseTopic,
        messageId: messageId, // Example: "122e3e47835fefcd8aaf22d13ce21859"
        method: method, // Example: "GET",
        namespace: namespace, // Example: "Appliance.System.All",
        payloadVersion: 1,
        sign: signature, // Example: "b4236ac6fb399e70c3d61e98fcb68b74",
        timestamp: timestamp,
      },
      payload: payload,
    };
  }

  async sendMessage(dev: DeviceDefinitionType, ip: string | null, data: any) {
    if (this.localHttpFirst && ip) {
      try {
        await this.sendMessageHttp(dev, ip, data);
        return true;
      } catch (err) {
        const isGetMessage =
          data && data.header && data.header.method === "GET";
        const resendToCloud =
          !isGetMessage || (isGetMessage && !this.onlyLocalForGet);

        if (resendToCloud) {
          return this.sendMessageMqtt(dev, data);
        }
        return false;
      }
    } else {
      return this.sendMessageMqtt(dev, data);
    }
  }
}
