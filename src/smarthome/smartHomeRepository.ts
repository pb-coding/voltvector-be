import { prisma } from "../lib/prisma";

import { SmartHomeProviderType } from "./smartHomeTypes";

const querySmartHomeAuthByUserId = async (
  userId: number,
  includeSensitiveData: boolean = false
) => {
  const smartHomeAuth = await prisma.smartHomeAuth.findMany({
    where: {
      userId: userId,
    },
    select: {
      id: true,
      provider: true,
      userId: true,
      email: includeSensitiveData,
      password: includeSensitiveData,
      createdAt: true,
      updatedAt: true,
    },
  });
  return smartHomeAuth;
};

const querySmartHomeAuthByProviderAndUserId = async (
  provider: SmartHomeProviderType,
  userId: number,
  includeSensitiveData: boolean = false
) => {
  const smartHomeAuth = await prisma.smartHomeAuth.findMany({
    where: {
      provider: provider,
      userId: userId,
    },
    select: {
      id: true,
      provider: true,
      userId: true,
      email: includeSensitiveData,
      password: includeSensitiveData,
      createdAt: true,
      updatedAt: true,
    },
  });
  return smartHomeAuth;
};

const saveSmartHomeAuth = async (
  provider: SmartHomeProviderType,
  userId: number,
  email: string,
  password: string
) => {
  const smartHomeAuth = await prisma.smartHomeAuth.create({
    data: {
      provider: provider,
      userId: userId,
      email: email,
      password: password,
    },
    select: {
      id: true,
      provider: true,
      userId: true,
      email: false,
      password: false,
      createdAt: true,
      updatedAt: true,
    },
  });
  return smartHomeAuth;
};

const deleteSmartHomeAuthByProviderAndUserId = async (
  provider: SmartHomeProviderType,
  userId: number
) => {
  const smartHomeAuth = await prisma.smartHomeAuth.deleteMany({
    where: {
      provider: provider,
      userId: userId,
    },
  });
  return smartHomeAuth;
};

const merossRepository = {
  querySmartHomeAuthByUserId,
  querySmartHomeAuthByProviderAndUserId,
  saveSmartHomeAuth,
  deleteSmartHomeAuthByProviderAndUserId,
};

export default merossRepository;
