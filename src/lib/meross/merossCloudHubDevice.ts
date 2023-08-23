// thanks to https://github.com/Apollon77/meross-cloud for the meross cloud implementation
// thanks to https://github.com/arandall/meross/blob/main/doc/protocol.md for the protocol documentation

import { MerossCloudDevice } from "./merossCloudDevice";

export class MerossCloudHubDevice extends MerossCloudDevice {
  subDeviceList: any;
  constructor(cloudInstance: any, dev: any, subDeviceList: any) {
    super(cloudInstance, dev);

    this.subDeviceList = subDeviceList;
  }

  getHubBattery(callback: any) {
    const payload = { battery: [] };
    return this.publishMessage(
      "GET",
      "Appliance.Hub.Battery",
      payload,
      callback
    );
  }

  getMts100All(ids: any, callback: any) {
    const payload = { all: [] as any[] };
    ids.forEach((id: any) => payload.all.push({ id: id }));
    return this.publishMessage(
      "GET",
      "Appliance.Hub.Mts100.All",
      payload,
      callback
    );
  }

  controlHubToggleX(subId: any, onoff: any, callback: any) {
    const payload = { togglex: [{ id: subId, onoff: onoff ? 1 : 0 }] };
    return this.publishMessage(
      "SET",
      "Appliance.Hub.ToggleX",
      payload,
      callback
    );
  }

  controlHubMts100Mode(subId: any, mode: any, callback: any) {
    const payload = { mode: [{ id: subId, state: mode }] };
    return this.publishMessage(
      "SET",
      "Appliance.Hub.Mts100.Mode",
      payload,
      callback
    );
  }

  controlHubMts100Temperature(subId: any, temp: any, callback: any) {
    temp.id = subId;
    const payload = { temperature: [temp] };
    return this.publishMessage(
      "SET",
      "Appliance.Hub.Mts100.Temperature",
      payload,
      callback
    );
  }
}
