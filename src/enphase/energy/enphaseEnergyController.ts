import { Response, NextFunction } from "express";

import { AuthenticatedRequest } from "../../auth/authTypes";
import { asyncHandler } from "../../middleware/errorHandler";
import { validateRequestParams } from "../../utils/helpers";
import enphaseEnergyService from "./enphaseEnergyService";
import { isAdmin } from "../../middleware/authorize";

const handleEnphaseEnergyGetRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    let startAt = req.query.startAt;
    let endAt = req.query.endAt;
    let decodedId = req.id;

    validateRequestParams(
      [{ name: "decoded user id", param: decodedId, expectedType: "numeric" }],
      res
    );
    const userId = decodedId as number;

    if (startAt && endAt) {
      validateRequestParams(
        [
          { name: "startAt", param: startAt, expectedType: "date" },
          { name: "endAt", param: endAt, expectedType: "date" },
        ],
        res
      );
      const startAtDate = new Date(startAt as string);
      const endAtDate = new Date(endAt as string);

      const selectedEnergyData = await enphaseEnergyService.getEnergyData(
        userId,
        startAtDate,
        endAtDate
      );
      res.json(selectedEnergyData);
    } else {
      const allEnergyData = await enphaseEnergyService.getEnergyData(userId);
      res.json(allEnergyData);
    }
  }
);

const triggerUpdateEnergyDataJob = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.id;
    const providedUserId = req.query.userId;
    const dayToFetch = req.query.dayToFetch;
    const roles = req.roles;

    if (!providedUserId || !dayToFetch) {
      enphaseEnergyService.updateEnergyDataJob();
      res
        .status(202)
        .json({ message: "Job trigger accepted: update energy data" });
      return;
    }

    if (!isAdmin(roles) && providedUserId !== userId?.toString()) {
      res.status(403).json({
        error: "You are not authorized to trigger this job for other users",
      });
      return;
    }

    // TODO: validate userId
    // TODO: validate date format

    const dayToFetchDate = new Date(dayToFetch as string);

    enphaseEnergyService.updateEnergyDataJob(
      [Number(providedUserId)],
      dayToFetchDate
    );

    res
      .status(202)
      .json({ message: "Job trigger accepted: update energy data" });
    enphaseEnergyService.updateEnergyDataJob();
  }
);

const triggerDataVerificationJob = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // TODO: implement check for specific users: let userIdsParam = req.query.userIds;
    let readOnlyParam = req.query.readOnly;

    let readOnly = false;
    if (readOnlyParam && readOnlyParam === "true") {
      readOnly = true;
    }

    res
      .status(202)
      .json({ message: "Job trigger accepted: verify energy data" });
    enphaseEnergyService.verifyEnergyDataConsistencyJob(null, readOnly);
  }
);

const enphaseEnergyController = {
  handleEnphaseEnergyGetRequest,
  triggerUpdateEnergyDataJob,
  triggerDataVerificationJob,
};

export default enphaseEnergyController;
