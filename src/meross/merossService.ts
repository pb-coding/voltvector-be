import { getAllDevices } from "./merossEventHandlers";

const getDevicesByUserId = (userId: number) => {
  console.log(`userId: ${userId}`);
  // TODO: implement user specific devices
  return getAllDevices();
};

const merossService = {
  getDevicesByUserId,
};

export default merossService;
