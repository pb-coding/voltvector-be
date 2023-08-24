// thanks to https://github.com/Apollon77/meross-cloud for the meross cloud implementation
// thanks to https://github.com/arandall/meross/blob/main/doc/protocol.md for the protocol documentation

import { MerossCloudDevice } from "./merossCloudDevice";

export class MerossCloudHubDevice extends MerossCloudDevice {
  subDeviceList: any;
  constructor(cloudInstance: any, dev: any, subDeviceList: any) {
    super(cloudInstance, dev);

    this.subDeviceList = subDeviceList;
  }

  async getHubBattery() {
    const payload = { battery: [] };
    return await this.publishMessage("GET", "Appliance.Hub.Battery", payload);
  }

  async getMts100All(ids: any) {
    const payload = { all: [] as any[] };
    ids.forEach((id: any) => payload.all.push({ id: id }));
    return await this.publishMessage(
      "GET",
      "Appliance.Hub.Mts100.All",
      payload
    );
  }

  async controlHubToggleX(subId: any, onoff: any) {
    const payload = { togglex: [{ id: subId, onoff: onoff ? 1 : 0 }] };
    return await this.publishMessage("SET", "Appliance.Hub.ToggleX", payload);
  }

  async controlHubMts100Mode(subId: any, mode: any) {
    const payload = { mode: [{ id: subId, state: mode }] };
    return await this.publishMessage(
      "SET",
      "Appliance.Hub.Mts100.Mode",
      payload
    );
  }

  async controlHubMts100Temperature(subId: any, temp: any) {
    temp.id = subId;
    const payload = { temperature: [temp] };
    return await this.publishMessage(
      "SET",
      "Appliance.Hub.Mts100.Temperature",
      payload
    );
  }
}
