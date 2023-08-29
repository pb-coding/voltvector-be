import { Response } from "express";

import smartHomeService from "./smartHomeService";
import { AuthenticatedRequest } from "../auth/authTypes";
import { asyncHandler } from "../middleware/errorHandler";
import { encrypt, validateRequestParams } from "../utils/helpers";
import { ENCRYPTION_SECRET } from "../utils/envs";
import { SmartHomeProviderEnum, SmartHomeProviderType } from "./smartHomeTypes";

const handleGetAuthorizedProvidersRequest = asyncHandler(
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

const handleAddProviderAuthRequest = asyncHandler(
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

const handleDeleteProviderAuthRequest = asyncHandler(
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

const handleGetDevicelistRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const decodedId = req.id;

    validateRequestParams(
      [{ name: "decoded user id", param: decodedId, expectedType: "numeric" }],
      res
    );

    const devicelist = await smartHomeService.getSmartHomeDevicelistForUser(
      decodedId as number
    );

    res.json(devicelist);
  }
);

const handleAddDeviceToListRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const decodedId = req.id;
    const { provider, deviceId } = req.body;

    validateRequestParams(
      [
        { name: "decoded user id", param: decodedId, expectedType: "numeric" },
        { name: "provider", param: provider, expectedType: "string" },
        { name: "deviceId", param: deviceId, expectedType: "string" },
      ],
      res
    );

    const selectedProvider =
      SmartHomeProviderEnum[provider as SmartHomeProviderType];

    if (!selectedProvider) {
      res.status(400).json({ error: "Invalid provider" });
      return;
    }

    const createdDevice = await smartHomeService.saveInSmartHomeDevicelist(
      decodedId as number,
      selectedProvider,
      deviceId as string
    );

    res.json(createdDevice);
  }
);

const handleDeleteDeviceFromListRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const decodedId = req.id;
    const { deviceId } = req.body;

    validateRequestParams(
      [
        { name: "decoded user id", param: decodedId, expectedType: "numeric" },
        { name: "deviceId", param: deviceId, expectedType: "string" },
      ],
      res
    );

    const deletedDevice = await smartHomeService.deleteDeviceFromList(
      decodedId as number,
      deviceId as string
    );

    res.json(deletedDevice);
  }
);

const smartHomeController = {
  handleAddProviderAuthRequest,
  handleGetAuthorizedProvidersRequest,
  handleDeleteProviderAuthRequest,
  handleGetDevicelistRequest,
  handleAddDeviceToListRequest,
  handleDeleteDeviceFromListRequest,
};

export default smartHomeController;
