import { Request, Response, NextFunction } from "express";

import { validateRequestParams } from "../utils/helpers";
import merossService from "./merossService";
import { asyncHandler } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../auth/authTypes";

const handleGetDevicesRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let decodedId = req.id;

    validateRequestParams(
      [{ name: "decoded user id", param: decodedId, expectedType: "numeric" }],
      res
    );

    let devices = merossService.getDevicesByUserId(decodedId as number);
    console.log(`devices: ${devices}`);
    res.json(devices);
  }
);

const handleGetDeviceByIdRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let decodedId = req.id;
    let deviceId = req.params.id;

    validateRequestParams(
      [
        { name: "decoded user id", param: decodedId, expectedType: "numeric" },
        { name: "provided user id", param: deviceId, expectedType: "numeric" },
      ],
      res
    );

    let device = merossService.getDeviceByUserAndDeviceId(decodedId as number);
    console.log(`device: ${deviceId}`);
    res.json(devices);
  }
);

const merossController = {
  handleGetDevicesRequest,
};

export default merossController;
