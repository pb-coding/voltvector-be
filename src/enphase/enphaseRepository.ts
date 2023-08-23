import { prisma } from "../lib/prisma";

const saveEnphaseApiRequest = async (
  userAppId: number,
  userId: number,
  endpoint: string
) => {
  const savedEnphaseApiRequest = await prisma.enphaseApiRequests.create({
    data: {
      userAppId,
      userId,
      endpoint,
    },
  });
  return savedEnphaseApiRequest;
};

const queryEnphaseApiRequestsByUserId = async (userId: number) => {
  const enphaseApiRequests = await prisma.enphaseApiRequests.findMany({
    where: {
      userId,
    },
  });
  return enphaseApiRequests;
};

const enphaseRepository = {
  saveEnphaseApiRequest,
  queryEnphaseApiRequestsByUserId,
};

export default enphaseRepository;
