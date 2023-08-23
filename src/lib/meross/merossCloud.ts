// thanks to https://github.com/Apollon77/meross-cloud for the meross cloud implementation
// thanks to https://github.com/arandall/meross/blob/main/doc/protocol.md for the protocol documentation
// TODO: cleanup and type!

"use strict";

import * as mqtt from "mqtt";
import * as crypto from "crypto";
import request from "request";
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
  CallbackOptionalData,
  Callback,
  DeviceDefinitionType,
  DeviceList,
} from "./types";

const SECRET = process.env.MEROSS_SECRET ?? "setSecretInEnv";
const MEROSS_URL = "https://iot.meross.com";
const LOGIN_URL = `${MEROSS_URL}/v1/Auth/Login`;
const LOGOUT_URL = `${MEROSS_URL}/v1/Profile/logout`;
const DEV_LIST = `${MEROSS_URL}/v1/Device/devList`;
const SUBDEV_LIST = `${MEROSS_URL}/v1/Hub/getSubDevices`;

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
  /*
        email
        password
        localHttpFirst
        timeout
    */

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

  authenticatedPost(
    url: string,
    paramsData: ParameterObject,
    callback: CallbackOptionalData<any>
  ) {
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
    this.options.logger &&
      this.options.logger(`HTTP-Call: ${JSON.stringify(options)}`);
    // Perform the request.
    request(options, (error, response, body) => {
      if (!error && response && response.statusCode === 200 && body) {
        this.options.logger && this.options.logger(`HTTP-Response OK: ${body}`);
        try {
          body = JSON.parse(body);
        } catch (err) {
          body = {};
        }

        if (body.apiStatus === 0) {
          return callback && callback(null, body.data);
        }
        return (
          callback &&
          callback(
            new Error(
              `${body.apiStatus} (${getErrorMessage(body.apiStatus)})${
                body.info ? ` - ${body.info}` : ""
              }`
            )
          )
        );
      }
      this.options.logger &&
        this.options.logger(
          `HTTP-Response Error: ${error} / Status=${
            response ? response.statusCode : "--"
          }`
        );
      return callback && callback(error);
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

  connect(callback: Callback<number>): void {
    if (!this.options.email) {
      return callback && callback(new Error("Email missing"), 0);
    }
    if (!this.options.password) {
      return callback && callback(new Error("Password missing"), 0);
    }
    const logIdentifier = generateRandomString(30) + uuidv4();
    //'0b11b194f83724b614a6975b112f63cee2f098-8125-40c7-a280-5115913d9887';// '%030x' % random.randrange(16 ** 30) + str(uuid.uuid4())
    // 54dp8pv70pz0a94ye8c1q5j13nhtb55dc30135-0cd6-4801-bc13-8608120b05d6
    // aa965f72dc01d414d8efa8360bade3  36894452-c55b-4f10-8ca3-c60edba97728
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

    this.authenticatedPost(
      LOGIN_URL,
      data,
      (err: any, loginResponse: LoginResponse) => {
        // console.log(loginResponse);
        if (err) {
          callback && callback(err, 0);
          return;
        }
        if (!loginResponse) {
          callback &&
            callback(new Error("No valid Login Response data received"), 0);
          return;
        }
        this.token = loginResponse.token;
        this.key = loginResponse.key;
        this.userId = loginResponse.userid.toString();
        this.userEmail = loginResponse.email;
        this.authenticated = true;

        this.authenticatedPost(
          DEV_LIST,
          {},
          (err: any, deviceList: DeviceList) => {
            // console.log(JSON.stringify(deviceList, null, 2));
            let initCounter = 0;
            let deviceListLength = 0;
            if (deviceList && Array.isArray(deviceList)) {
              deviceListLength = deviceList.length;
              deviceList.forEach((dev) => {
                //const deviceType = dev.deviceType;
                if (dev.deviceType.startsWith("msh300")) {
                  this.options.logger &&
                    this.options.logger(`${dev.uuid} Detected Hub`);
                  this.authenticatedPost(
                    SUBDEV_LIST,
                    { uuid: dev.uuid },
                    (err: any, subDeviceList: any) => {
                      this.connectDevice(
                        new MerossCloudHubDevice(this, dev, subDeviceList),
                        dev
                      );
                      initCounter++;
                      if (initCounter === deviceListLength)
                        callback && callback(null, deviceListLength);
                    }
                  );
                } else {
                  this.connectDevice(new MerossCloudDevice(this, dev), dev);
                  initCounter++;
                }
              });
            }

            if (initCounter === deviceListLength)
              callback && callback(null, deviceListLength);
          }
        );
      }
    );

    /*
        /app/64416/subscribe <-- {"header":{"messageId":"b5da1e168cba7a681afcff82eaf703c8","namespace":"Appliance.System.Online","timestamp":1539614195,"method":"PUSH","sign":"b16c2c4cbb5acf13e6b94990abf5b140","from":"/appliance/1806299596727829081434298f15a991/subscribe","payloadVersion":1},"payload":{"online":{"status":2}}}
        /app/64416/subscribe <-- {"header":{"messageId":"4bf5dfaaa0898243a846c1f2a93970fe","namespace":"Appliance.System.Online","timestamp":1539614201,"method":"PUSH","sign":"f979692120e7165b2116abdfd464ca83","from":"/appliance/1806299596727829081434298f15a991/subscribe","payloadVersion":1},"payload":{"online":{"status":1}}}
        /app/64416/subscribe <-- {"header":{"messageId":"46182b62a9377a8cc0147f22262a23f3","namespace":"Appliance.System.Report","method":"PUSH","payloadVersion":1,"from":"/appliance/1806299596727829081434298f15a991/publish","timestamp":1539614201,"timestampMs":78,"sign":"048fad34ca4d00875a026e33b16caf1b"},"payload":{"report":[{"type":"1","value":"0","timestamp":1539614201}]}}
        TIMEOUT
        err: Error: Timeout, res: undefined
        /app/64416/subscribe <-- {"header":{"messageId":"8dbe0240b2c03dcefda87a758a228d21","namespace":"Appliance.Control.ToggleX","method":"PUSH","payloadVersion":1,"from":"/appliance/1806299596727829081434298f15a991/publish","timestamp":1539614273,"timestampMs":27,"sign":"0f1ab22db05842eb94714b669b911aff"},"payload":{"togglex":{"channel":1,"onoff":1,"lmTime":1539614273}}}
        /app/64416/subscribe <-- {"header":{"messageId":"6ecacf6453bb0a4256f8bf1f5dd1d835","namespace":"Appliance.Control.ToggleX","method":"PUSH","payloadVersion":1,"from":"/appliance/1806299596727829081434298f15a991/publish","timestamp":1539614276,"timestampMs":509,"sign":"b8281d71ef8ab5420a1382af5ff9fc34"},"payload":{"togglex":{"channel":1,"onoff":0,"lmTime":1539614276}}}

        {"header":{"messageId":"98fee66789f75eb0e149f2a5116f919c","namespace":"Appliance.Control.ToggleX","method":"PUSH","payloadVersion":1,"from":"/appliance/1806299596727829081434298f15a991/publish","timestamp":1539633281,"timestampMs":609,"sign":"dd6bf3acee81a6c46f6fedd02515ddf3"},"payload":{"togglex":[{"channel":0,"onoff":0,"lmTime":1539633280},{"channel":1,"onoff":0,"lmTime":1539633280},{"channel":2,"onoff":0,"lmTime":1539633280},{"channel":3,"onoff":0,"lmTime":1539633280},{"channel":4,"onoff":0,"lmTime":1539633280}]}}
        */
  }

  logout(callback: any): void {
    if (!this.authenticated || !this.token) {
      return callback && callback(new Error("Not authenticated"), 0);
    }
    this.authenticatedPost(LOGOUT_URL, {}, (err: any, logoutResponse: any) => {
      //console.log(logoutResponse);
      if (err) {
        callback && callback(err, 0);
        return;
      }
      this.token = null;
      this.key = null;
      this.userId = null;
      this.userEmail = null;
      this.authenticated = false;

      callback && callback();
    });
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

    this.options.logger &&
      this.options.logger(
        `MQTT-Cloud-Call ${dev.uuid}: ${JSON.stringify(data)}`
      );
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

  sendMessageHttp(
    dev: DeviceDefinitionType,
    ip: string,
    payload: any,
    callback: any
  ) {
    const options = {
      url: `http://${ip}/config`,
      method: "POST",
      json: payload,
      timeout: this.timeout,
    };
    this.options.logger &&
      this.options.logger(
        `HTTP-Local-Call ${dev.uuid}: ${JSON.stringify(options)}`
      );
    // Perform the request.
    request(options, (error, response, body) => {
      if (!error && response && response.statusCode === 200 && body) {
        this.options.logger &&
          this.options.logger(
            `HTTP-Local-Response OK ${dev.uuid}: ${JSON.stringify(body)}`
          );
        if (body) {
          setImmediate(() => {
            this.devices[dev.uuid].handleMessage(body);
          });
          return callback && callback(null);
        }
        return (
          callback && callback(new Error(`${body.apiStatus}: ${body.info}`))
        );
      }
      this.options.logger &&
        this.options.logger(
          `HTTP-Local-Response Error ${dev.uuid}: ${error} / Status=${
            response ? response.statusCode : "--"
          }`
        );
      return callback && callback(error);
    });
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

  sendMessage(dev: DeviceDefinitionType, ip: string, data: any, callback: any) {
    if (this.localHttpFirst && ip) {
      this.sendMessageHttp(dev, ip, data, (err: any) => {
        let res = !err;
        const isGetMessage =
          data && data.header && data.header.method === "GET";
        let resendToCloud =
          !isGetMessage || (isGetMessage && !this.onlyLocalForGet);
        if (err && resendToCloud) {
          res = this.sendMessageMqtt(dev, data);
        }
        callback && callback(res);
      });
    } else {
      callback && callback(this.sendMessageMqtt(dev, data));
    }
  }
}
