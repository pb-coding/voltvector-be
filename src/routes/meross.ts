import { Router } from "express";
import { Role } from "@prisma/client";

import merossController from "../smarthome/provider/meross/merossController";
import authorize from "../middleware/authorize";

const merossRouter = Router();

merossRouter.get(
  "/devices",
  authorize([Role.USER]),
  merossController.handleGetDevicesRequest
);

merossRouter.get(
  "/device/:deviceId",
  authorize([Role.USER]),
  merossController.handleGetDeviceRequest
);

merossRouter.put(
  "/device/:deviceId",
  authorize([Role.USER]),
  merossController.handlePutDeviceRequest
);

export default merossRouter;
