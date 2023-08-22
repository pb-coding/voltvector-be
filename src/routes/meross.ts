import { Router } from "express";
import { Role } from "@prisma/client";

import merossController from "../meross/merossController";
import authorize from "../middleware/authorize";

const merossRouter = Router();

merossRouter.get(
  "/devices",
  authorize([Role.USER]),
  merossController.handleGetDevicesRequest
);

export default merossRouter;
