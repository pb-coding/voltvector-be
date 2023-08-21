import enphaseRepository from "./enphaseRepository";
import { ExtendedUserEnphaseApp } from "./auth/enphaseAuthTypes";

const logEnphaseApiRequest = async (
  userApp: ExtendedUserEnphaseApp,
  endpoint: string
) => {
  const { id, userId } = userApp;

  await enphaseRepository.saveEnphaseApiRequest(id, userId, endpoint);
};

const enphaseService = {
  logEnphaseApiRequest,
};

export default enphaseService;
