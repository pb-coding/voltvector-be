import { Router } from "express";
import { Role } from "@prisma/client";

import enphaseController from "../enphase/auth/enphaseAuthController";
import authorize from "../middleware/authorize";

const enphaseRouter = Router();

// TODO: use frontend axios to request enphase oauth flow for authorization
enphaseRouter.get("/oauth", enphaseController.handleEnphaseOauthRequest);
enphaseRouter.get(
  "/apps",
  authorize([Role.USER]),
  enphaseController.handleEnphaseAppsRequest
);

export default enphaseRouter;
