import { Request, Response } from "express";

import { asyncHandler } from "../../middleware/errorHandler";
import enphaseService from "./enphaseAuthService";
import { validateRequestParams } from "../../utils/helpers";
import { AuthenticatedRequest } from "../../auth/authTypes";

const handleEnphaseOauthRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.query.userid;
    const appName = req.query.appname;
    const code = req.query.code;

    validateRequestParams(
      [
        { name: "user id", param: id, expectedType: "numeric" },
        { name: "application name", param: appName, expectedType: "string" },
        { name: "auth code", param: code, expectedType: "string" },
      ],
      res
    );

    const userId = Number(id);
    const authCode = code as string;
    const applicationName = appName as string;

    const success = await enphaseService.retrieveAndSaveEnphaseAuthTokens(
      userId,
      applicationName,
      authCode
    );

    if (!success)
      return res.status(400).json({ error: "Invalid oauth code provided." });
    res.redirect("http://localhost:3000/settings/enphase");
  }
);

const handleEnphaseAppsRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const id = req.id;

    validateRequestParams(
      [{ name: "decoded id", param: id, expectedType: "numeric" }],
      res
    );

    const userId = Number(id);

    const apps = await enphaseService.getEnphaseAppsOverviewByUserId(
      Number(userId)
    );
    res.json(apps);
  }
);

export const enphaseAuthController = {
  handleEnphaseOauthRequest,
  handleEnphaseAppsRequest,
};

export default enphaseAuthController;
