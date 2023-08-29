import { Router } from "express";
import { Role } from "@prisma/client";

import smartHomeController from "../smarthome/smartHomeController";
import authorize from "../middleware/authorize";

const smartHomeRouter = Router();

smartHomeRouter.get(
  "/providers",
  authorize([Role.USER]),
  smartHomeController.handleGetAuthorizedProvidersRequest
);

smartHomeRouter.post(
  "/providers",
  authorize([Role.USER]),
  smartHomeController.handleAddProviderAuthRequest
);

smartHomeRouter.delete(
  "/providers",
  authorize([Role.USER]),
  smartHomeController.handleDeleteProviderAuthRequest
);

smartHomeRouter.get(
  "/devicelist",
  authorize([Role.USER]),
  smartHomeController.handleGetDevicelistRequest
);

smartHomeRouter.post(
  "/devicelist",
  authorize([Role.USER]),
  smartHomeController.handleAddDeviceToListRequest
);

smartHomeRouter.delete(
  "/devicelist",
  authorize([Role.USER]),
  smartHomeController.handleDeleteDeviceFromListRequest
);

export default smartHomeRouter;
