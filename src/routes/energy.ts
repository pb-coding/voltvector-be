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

export default energyRouter;
