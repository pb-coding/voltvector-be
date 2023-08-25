import { Request, Response, NextFunction } from "express";

import { validateRequestParams } from "../../../utils/helpers";
import merossService from "./merossService";
import { asyncHandler } from "../../../middleware/errorHandler";
import { AuthenticatedRequest } from "../../../auth/authTypes";

const handleGetDevicesRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let decodedId = req.id;

    validateRequestParams(
      [{ name: "decoded user id", param: decodedId, expectedType: "numeric" }],
      res
    );

    let devices = await merossService.getDevicesByUserId(decodedId as number);
    res.json(devices);
  }
);

const handleGetDeviceRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let decodedId = req.id;
    let deviceId = req.params.deviceId;

    validateRequestParams(
      [
        { name: "decoded user id", param: decodedId, expectedType: "numeric" },
        { name: "device id", param: deviceId, expectedType: "string" },
      ],
      res
    );

    const device = await merossService.getDeviceByUserAndDeviceId(
      decodedId as number,
      deviceId as string
    );

    if (!device) {
      res.status(404).json("Device not found");
      return;
    }

    const deviceInfo = await merossService.getDeviceInfo(device);
    if (!deviceInfo) {
      res.status(500).json("Getting device info failed");
      return;
    }

    const devicePowerHistory = await merossService.getDevicePowerHistory(
      device
    );

    const deviceElectricity = await merossService.getDeviceElectricity(device);

    // TODO: consider devices with multiple toggle states
    const deviceInfoOverview = {
      id: deviceInfo.all.system.hardware.uuid,
      onlineStatus: deviceInfo.all.system.online.status,
      deviceType: deviceInfo.all.system.hardware.type,
      toggleStatus: deviceInfo.all.digest.togglex[0].onoff,
      powerHistory: devicePowerHistory,
      electricity: deviceElectricity,
    };
    res.json(deviceInfoOverview);
  }
);

const handlePutDeviceRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let decodedId = req.id;
    let deviceId = req.params.deviceId;
    let setValue = req.body.set;

    validateRequestParams(
      [
        { name: "decoded user id", param: decodedId, expectedType: "numeric" },
        { name: "device id", param: deviceId, expectedType: "string" },
      ],
      res
    );

    // const deviceId = "2205069445274951080148e1e991c9f0";

    const device = await merossService.getDeviceByUserAndDeviceId(
      decodedId as number,
      deviceId as string
    );

    if (!device) {
      res.status(404).json("Device not found");
      return;
    }

    if (setValue !== "on" && setValue !== "off") {
      res.status(400).json("Invalid set value");
      return;
    }

    const desiredDeviceState = setValue === "on" ? true : false;

    const success = await merossService.toggleDevice(
      device,
      desiredDeviceState
    );
    if (!success) res.status(500).json("Toggling device failed");
    else res.send(`Setting device ${deviceId} to ${setValue} was successful`);
  }
);

const merossController = {
  handleGetDevicesRequest,
  handlePutDeviceRequest,
  handleGetDeviceRequest,
};

export default merossController;
