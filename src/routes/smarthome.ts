import { Router } from "express";
import { Role } from "@prisma/client";

import smartHomeController from "../smarthome/smartHomeController";
import authorize from "../middleware/authorize";

const smartHomeRouter = Router();

smartHomeRouter.get(
  "/providers",
  authorize([Role.USER]),
  smartHomeController.handleGetAuthorizedSmartHomeProviderRequest
);

smartHomeRouter.post(
  "/providers",
  authorize([Role.USER]),
  smartHomeController.handleAddSmartHomeAuthRequest
);

smartHomeRouter.delete(
  "/providers",
  authorize([Role.USER]),
  smartHomeController.handleDeleteSmartHomeAuthRequest
);

export default smartHomeRouter;
