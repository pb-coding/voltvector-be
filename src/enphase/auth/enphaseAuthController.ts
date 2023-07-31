import { Request, Response } from "express";

import { asyncHandler } from "../../middleware/errorHandler";
import enphaseService from "./enphaseAuthService";
import { validateRequestParams } from "../../utils/helpers";

const handleEnphaseOauthRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.query.userid;
    const appName = req.query.appname;
    const code = req.query.code;

    console.log(`Got request with params: ${id}, ${appName}, ${code}`);

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

    console.log(`Got authCode ${authCode} for userId: ${userId}`);

    const success = await enphaseService.retrieveAndSaveEnphaseAuthTokens(
      userId,
      applicationName,
      authCode
    );
    console.log(`Success: ${success}`);
    if (!success)
      return res.status(400).json({ error: "Invalid oauth code provided." });
    res.redirect("http://localhost:3000/settings/enphase");
  }
);

const handleEnphaseAppsRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.query.userid;

    validateRequestParams(
      [{ name: "user id", param: id, expectedType: "numeric" }],
      res
    );

    const userId = Number(id);

    const apps = await enphaseService.getEnphaseAppsByUserId(Number(userId));
    res.json(apps);
  }
);

export const enphaseAuthController = {
  handleEnphaseOauthRequest,
  handleEnphaseAppsRequest,
};

export default enphaseAuthController;
