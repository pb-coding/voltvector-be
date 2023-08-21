import { Router } from "express";
import { Role } from "@prisma/client";

import enphaseEnergyController from "../enphase/energy/enphaseEnergyController";
import authorize from "../middleware/authorize";

const energyRouter = Router();

// TODO: use frontend axios to request enphase oauth flow for authorization
energyRouter.get(
  "/",
  authorize([Role.USER]),
  enphaseEnergyController.handleEnphaseEnergyGetRequest
);

energyRouter.get(
  "/triggerUpdateJob",
  authorize([Role.ADMIN]),
  enphaseEnergyController.triggerUpdateEnergyDataJob
);

energyRouter.get(
  "/triggerVerificationJob",
  authorize([Role.ADMIN]),
  enphaseEnergyController.triggerDataVerificationJob
);

export default energyRouter;
