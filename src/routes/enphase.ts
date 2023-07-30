import { Router } from "express";
import { Role } from "@prisma/client";

import enphaseController from "../enphase/enphase.controller";
import authorize from "../middleware/authorize";

const enphaseRouter = Router();

enphaseRouter.get("/oauth", enphaseController.handleEnphaseOauthRequest);
enphaseRouter.get(
  "/apps",
  authorize([Role.USER]),
  enphaseController.handleEnphaseAppsRequest
);

export default enphaseRouter;
