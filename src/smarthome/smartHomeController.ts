import { Response } from "express";

import smartHomeService from "./smartHomeService";
import { AuthenticatedRequest } from "../auth/authTypes";
import { asyncHandler } from "../middleware/errorHandler";
import { encrypt, decrypt, validateRequestParams } from "../utils/helpers";
import { ENCRYPTION_SECRET } from "../utils/envs";
import { SmartHomeProviderEnum, SmartHomeProviderType } from "./smartHomeTypes";

const handleGetAuthorizedSmartHomeProviderRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const decodedId = req.id;

    validateRequestParams(
      [{ name: "decoded user id", param: decodedId, expectedType: "numeric" }],
      res
    );

    const providerOverview =
      await smartHomeService.getSmartHomeProviderOverviewForUser(
        decodedId as number
      );
    res.json(providerOverview);
  }
);

const handleAddSmartHomeAuthRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const decodedId = req.id;
    const { email, password, provider } = req.body;

    validateRequestParams(
      [
        { name: "decoded user id", param: decodedId, expectedType: "numeric" },
        { name: "email", param: email, expectedType: "string" },
        { name: "password", param: password, expectedType: "string" },
        { name: "provider", param: provider, expectedType: "string" },
      ],
      res
    );

    if (provider !== SmartHomeProviderEnum.MEROSS) {
      res.status(400).json({ error: "Invalid provider" });
      return;
    }
    const secret = ENCRYPTION_SECRET as string;

    const encryptedEmail = await encrypt(email, secret);
    const encryptedPassword = await encrypt(password, secret);

    const selectedProvider =
      SmartHomeProviderEnum[provider as SmartHomeProviderType];

    const alreadyExists =
      await smartHomeService.userHasSmartHomeAuthForProvider(
        decodedId as number,
        selectedProvider
      );

    if (alreadyExists) {
      res.status(400).json({
        error:
          "User already has smart home auth for this provider. To override, please delete it first.",
      });
      return;
    }

    const isValidSmartHomeAuth =
      await smartHomeService.verifySmartHomeAuthCredentials(
        decodedId as number,
        email as string,
        password as string,
        selectedProvider
      );

    if (!isValidSmartHomeAuth) {
      res.status(400).json({
        error: "Invalid auth for smart home provider: " + selectedProvider,
      });
      return;
    }

    const createdProvider = await smartHomeService.addSmartHomeAuth(
      decodedId as number,
      encryptedEmail,
      encryptedPassword,
      selectedProvider
    );
    res.json(createdProvider);
  }
);

const handleDeleteSmartHomeAuthRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const decodedId = req.id;
    const { provider } = req.body;

    validateRequestParams(
      [
        { name: "decoded user id", param: decodedId, expectedType: "numeric" },
        { name: "provider", param: provider, expectedType: "string" },
      ],
      res
    );

    const selectedProvider =
      SmartHomeProviderEnum[provider as SmartHomeProviderType];

    if (!selectedProvider) {
      res.status(400).json({ error: "Invalid provider" });
      return;
    }

    const deletedProvider =
      await smartHomeService.deleteSmartHomeProviderAuthForUser(
        decodedId as number,
        selectedProvider
      );

    res.json(deletedProvider);
  }
);

const smartHomeController = {
  handleAddSmartHomeAuthRequest,
  handleGetAuthorizedSmartHomeProviderRequest,
  handleDeleteSmartHomeAuthRequest,
};

export default smartHomeController;
