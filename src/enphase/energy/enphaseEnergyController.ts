import { Response } from "express";
import dateFns from "date-fns";

import { AuthenticatedRequest } from "../../auth/authTypes";
import { asyncHandler } from "../../middleware/errorHandler";
import { validateRequestParams } from "../../utils/helpers";
import enphaseEnergyService from "./enphaseEnergyService";

const handleEnphaseEnergyGetRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    let startAt = req.query.startAt;
    let endAt = req.query.endAt;
    let decodedId = req.id;

    validateRequestParams(
      [
        { name: "startAt", param: startAt, expectedType: "date" },
        { name: "endAt", param: endAt, expectedType: "date" },
        { name: "decoded user id", param: decodedId, expectedType: "numeric" },
      ],
      res
    );

    const startAtDate = new Date(startAt as string);
    const endAtDate = new Date(endAt as string);
    const userId = decodedId as number;

    const enphaseEnergy = await enphaseEnergyService.getEnergyData(
      userId,
      startAtDate,
      endAtDate
    );
    res.json(enphaseEnergy);
  }
);

const enphaseEnergyController = {
  handleEnphaseEnergyGetRequest,
};

export default enphaseEnergyController;
