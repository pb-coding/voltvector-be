import { Request, Response } from "express";

import { asyncHandler } from "../middleware/errorHandler";
import enphaseService from "./enphase.service";

type ExpectedParameterTypeObject = {
  name: string;
  param: any; // We validate the type of this parameter using the validateRequestParams function
  expectedType: string;
};

/**
 * This function validates if the expected parameters are provided and if they are of the expected type.
 * @param requestParameter object containing the parameter name, the parameter itself and the expected type.
 * @param res provide the response object so that we can return an error if the validation fails
 */
const validateRequestParams = (
  requestParameter: ExpectedParameterTypeObject[],
  res: Response
) => {
  requestParameter.forEach((paramObject) => {
    if (paramObject.expectedType === "numeric") {
      if (!paramObject.param || paramObject.param == "")
        return res
          .status(400)
          .json({ error: `No ${paramObject.name} provided.` });

      if (isNaN(Number(paramObject.param)))
        return res
          .status(400)
          .json({ error: `Invalid ${paramObject.name} provided.` });
    } else if (paramObject.expectedType === "string") {
      if (!paramObject.param || paramObject.param == "")
        return res
          .status(400)
          .json({ error: `No ${paramObject.name} provided.` });

      if (typeof paramObject.param !== "string")
        return res
          .status(400)
          .json({ error: `Invalid ${paramObject.name} provided.` });
    }
  });
};

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

export const enphaseController = {
  handleEnphaseOauthRequest,
  handleEnphaseAppsRequest,
};

export default enphaseController;
