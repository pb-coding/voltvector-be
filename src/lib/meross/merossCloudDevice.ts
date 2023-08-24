// thanks to https://github.com/Apollon77/meross-cloud for the meross cloud implementation
// thanks to https://github.com/arandall/meross/blob/main/doc/protocol.md for the protocol documentation

import EventEmitter from "events";

import { MerossCloud } from "./merossCloud";
import {
  DeviceDefinitionType,
  GetControlPowerConsumptionXResponse,
  GetControlElectricityResponse,
  LightData,
  ThermostatModeData,
  MerossDeviceInfoType,
  Message,
  MessageId,
  WaitingMessageIds,
} from "./types";

export class MerossCloudDevice extends EventEmitter {
  clientResponseTopic: string | null;
  waitingMessageIds: WaitingMessageIds;
  dev: DeviceDefinitionType;
  cloudInst: MerossCloud;
  deviceConnected: boolean;
  knownLocalIp: string | null;
  constructor(cloudInstance: MerossCloud, dev: DeviceDefinitionType) {
    super();

    this.clientResponseTopic = null;
    this.waitingMessageIds = {};

    this.dev = dev;
    this.cloudInst = cloudInstance;

    this.deviceConnected = false;
    this.knownLocalIp = null;
  }

  handleMessage(message: Message) {
    if (!this.deviceConnected || !message || !message.header) return;
    const { header } = message;
    const { messageId, method, namespace, from } = header;

    if (!from || !from.includes(this.dev.uuid)) return;

    if (this.waitingMessageIds[messageId]) {
      const { resolve, reject } = this.waitingMessageIds[messageId];

      if (message.payload) {
        resolve(message.payload);
      } else {
        reject(new Error("Invalid response"));
      }

      delete this.waitingMessageIds[messageId];
    } else if (method === "PUSH") {
      this.emit("data", namespace, message.payload || message);
    }

    this.emit("rawData", message);
  }

  /**
   * @deprecated
   */
  connect(): void {
    this.deviceConnected = true;
  }

  /**
   * @deprecated
   */
  disconnect() {
    this.deviceConnected = false;
  }

  setKnownLocalIp(ip: string): void {
    this.knownLocalIp = ip;
  }

  removeKnownLocalIp(): void {
    this.knownLocalIp = "";
  }

  async publishMessage(
    method: "GET" | "SET",
    namespace: string,
    payload: any
  ): Promise<any> {
    const data = this.cloudInst.encodeMessage(method, namespace, payload);
    const messageId: MessageId = data.header.messageId;

    const responsePromise = new Promise((resolve, reject) => {
      this.waitingMessageIds[messageId] = {
        resolve: resolve,
        reject: reject,
      };

      setTimeout(() => {
        reject(new Error("Timeout"));
        delete this.waitingMessageIds[messageId];
      }, this.cloudInst.timeout * 2);
    });

    try {
      await this.cloudInst.sendMessage(this.dev, this.knownLocalIp, data);
      this.emit("rawSendData", data);
      return await responsePromise;
    } catch (error) {
      throw error;
    }
  }

  async getSystemAllData(): Promise<MerossDeviceInfoType> {
    return await this.publishMessage("GET", "Appliance.System.All", {});
  }

  async getSystemDebug(): Promise<any> {
    // {"debug":{"system":{"version":"2.1.2","sysUpTime":"114h16m34s","localTimeOffset":7200,"localTime":"Mon Oct 15 16:23:03 2018","suncalc":"7:42;19:49"},"network":{"linkStatus":"connected","signal":50,"ssid":"ApollonHome","gatewayMac":"34:31:c4:73:3c:7f","innerIp":"192.168.178.86","wifiDisconnectCount":1},"cloud":{"activeServer":"iot.meross.com","mainServer":"iot.meross.com","mainPort":2001,"secondServer":"smart.meross.com","secondPort":2001,"userId":64416,"sysConnectTime":"Mon Oct 15 08:06:40 2018","sysOnlineTime":"6h16m23s","sysDisconnectCount":5,"pingTrace":[]}}}
    return await this.publishMessage("GET", "Appliance.System.Debug", {});
  }

  async getSystemAbilities(): Promise<any> {
    // {"payloadVersion":1,"ability":{"Appliance.Config.Key":{},"Appliance.Config.WifiList":{},"Appliance.Config.Wifi":{},"Appliance.Config.Trace":{},"Appliance.System.All":{},"Appliance.System.Hardware":{},"Appliance.System.Firmware":{},"Appliance.System.Debug":{},"Appliance.System.Online":{},"Appliance.System.Time":{},"Appliance.System.Ability":{},"Appliance.System.Runtime":{},"Appliance.System.Report":{},"Appliance.System.Position":{},"Appliance.System.DNDMode":{},"Appliance.Control.Multiple":{"maxCmdNum":5},"Appliance.Control.ToggleX":{},"Appliance.Control.TimerX":{"sunOffsetSupport":1},"Appliance.Control.TriggerX":{},"Appliance.Control.Bind":{},"Appliance.Control.Unbind":{},"Appliance.Control.Upgrade":{},"Appliance.Digest.TriggerX":{},"Appliance.Digest.TimerX":{}}}
    return await this.publishMessage("GET", "Appliance.System.Ability", {});
  }

  async getSystemReport(): Promise<any> {
    return await this.publishMessage("GET", "Appliance.System.Report", {});
  }

  async getSystemRuntime(): Promise<any> {
    // Wifi Strength
    // "payload": {
    // 		"runtime": {
    // 			"signal": 86
    // 		}
    // 	}
    return await this.publishMessage("GET", "Appliance.System.Runtime", {});
  }

  async getSystemDNDMode(): Promise<any> {
    // DND Mode (LED)
    // "payload": {
    // 		"DNDMode": {
    // 			"mode": 0
    // 		}
    // 	}
    return await this.publishMessage("GET", "Appliance.System.DNDMode", {});
  }

  async setSystemDNDMode(onoff: boolean): Promise<any> {
    const payload = { DNDMode: { mode: onoff ? 1 : 0 } };
    return await this.publishMessage(
      "SET",
      "Appliance.System.DNDMode",
      payload
    );
  }

  async getOnlineStatus(): Promise<any> {
    return await this.publishMessage("GET", "Appliance.System.Online", {});
  }

  async getConfigWifiList(): Promise<any> {
    // {"wifiList":[]}
    return await this.publishMessage("GET", "Appliance.Config.WifiList", {});
  }

  async getConfigTrace(): Promise<any> {
    // {"trace":{"ssid":"","code":0,"info":""}}
    return await this.publishMessage("GET", "Appliance.Config.Trace", {});
  }

  async getControlPowerConsumption(): Promise<any> {
    return await this.publishMessage(
      "GET",
      "Appliance.Control.Consumption",
      {}
    );
  }

  async getControlPowerConsumptionX(): Promise<GetControlPowerConsumptionXResponse> {
    return await this.publishMessage(
      "GET",
      "Appliance.Control.ConsumptionX",
      {}
    );
  }

  async getControlElectricity(): Promise<GetControlElectricityResponse> {
    return await this.publishMessage(
      "GET",
      "Appliance.Control.Electricity",
      {}
    );
  }

  async controlToggle(onoff: boolean): Promise<any> {
    const payload = { toggle: { onoff: onoff ? 1 : 0 } };
    return await this.publishMessage(
      "SET",
      "Appliance.Control.Toggle",
      payload
    );
  }

  async controlToggleX(channel: number, onoff: boolean): Promise<any> {
    const payload = { togglex: { channel: channel, onoff: onoff ? 1 : 0 } };
    return await this.publishMessage(
      "SET",
      "Appliance.Control.ToggleX",
      payload
    );
  }

  async controlSpray(channel: number, mode: number): Promise<any> {
    const payload = { spray: { channel: channel, mode: mode || 0 } };
    return await this.publishMessage("SET", "Appliance.Control.Spray", payload);
  }

  async controlRollerShutterPosition(
    channel: number,
    position: number
  ): Promise<any> {
    const payload = { position: { position: position, channel: channel } };
    return await this.publishMessage(
      "SET",
      "Appliance.RollerShutter.Position",
      payload
    );
  }

  async controlRollerShutterUp(channel: number): Promise<any> {
    return this.controlRollerShutterPosition(channel, 100);
  }

  async controlRollerShutterDown(channel: number): Promise<any> {
    return this.controlRollerShutterPosition(channel, 0);
  }

  async controlRollerShutterStop(channel: number): Promise<any> {
    return this.controlRollerShutterPosition(channel, -1);
  }

  async getRollerShutterState(): Promise<any> {
    return await this.publishMessage(
      "GET",
      "Appliance.RollerShutter.State",
      {}
    );
  }

  async getFilterMaintenance(): Promise<any> {
    return await this.publishMessage(
      "GET",
      "Appliance.Control.FilterMaintenance",
      {}
    );
  }

  async getPhysicalLockState(): Promise<any> {
    return await this.publishMessage(
      "GET",
      "Appliance.Control.PhysicalLock",
      {}
    );
  }

  async controlPhysicalLock(channel: number, locked: boolean): Promise<any> {
    const payload = {
      lock: { channel: channel, onoff: locked ? 1 : 0, uuid: this.dev.uuid },
    };
    return await this.publishMessage(
      "SET",
      "Appliance.GarageDoor.State",
      payload
    );
  }

  async getFanState(): Promise<any> {
    return await this.publishMessage("GET", "Appliance.Control.Fan", {});
  }

  async controlFan(
    channel: number,
    speed: number,
    maxSpeed: number
  ): Promise<any> {
    const payload = {
      fan: [
        {
          channel: channel,
          speed: speed,
          maxSpeed: maxSpeed,
          uuid: this.dev.uuid,
        },
      ],
    };
    return await this.publishMessage("SET", "Appliance.Control.Fan", payload);
  }

  async getRollerShutterPosition(): Promise<any> {
    return await this.publishMessage(
      "GET",
      "Appliance.RollerShutter.Position",
      {}
    );
  }

  async controlGarageDoor(channel: number, open: boolean): Promise<any> {
    const payload = {
      state: { channel: channel, open: open ? 1 : 0, uuid: this.dev.uuid },
    };
    return await this.publishMessage(
      "SET",
      "Appliance.GarageDoor.State",
      payload
    );
  }

  // {"light":{"capacity":6,"channel":0,"rgb":289,"temperature":80,"luminance":100}}
  async controlLight(light: LightData): Promise<any> {
    const payload = { light: light };
    return await this.publishMessage("SET", "Appliance.Control.Light", payload);
  }

  async controlDiffusorSpray(
    type: string,
    channel: number,
    mode: number
  ): Promise<any> {
    const payload = {
      spray: [{ channel: channel, mode: mode || 0, uuid: this.dev.uuid }],
    };
    return await this.publishMessage(
      "SET",
      "Appliance.Control.Diffuser.Spray",
      payload
    );
  }

  async controlDiffusorLight(type: string, light: LightData): Promise<any> {
    light.uuid = this.dev.uuid;
    const payload = { light: [light] };
    return await this.publishMessage(
      "SET",
      "Appliance.Control.Diffuser.Light",
      payload
    );
  }

  async controlThermostatMode(
    channel: number,
    modeData: ThermostatModeData
  ): Promise<any> {
    modeData.channel = channel;
    const payload = { mode: [modeData] };
    return await this.publishMessage(
      "SET",
      "Appliance.Control.Thermostat.Mode",
      payload
    );
  }
}
