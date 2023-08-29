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

const querySmartHomeDevicelistByUserId = async (userId: number) => {
  const smartHomeDevices = await prisma.smartHomeDevices.findMany({
    where: {
      userId: userId,
    },
    select: {
      id: true,
      userId: true,
      provider: true,
      deviceId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return smartHomeDevices;
};

const querySmartHomeDevicelistByDeviceId = async (
  userId: number,
  deviceId: string
) => {
  const smartHomeDevice = await prisma.smartHomeDevices.findFirst({
    where: {
      userId: userId,
      deviceId: deviceId,
    },
    select: {
      id: true,
      userId: true,
      provider: true,
      deviceId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return smartHomeDevice;
};

const saveSmartHomeDevice = async (
  userId: number,
  provider: SmartHomeProviderType,
  deviceId: string
) => {
  const smartHomeDevice = await prisma.smartHomeDevices.create({
    data: {
      userId: userId,
      provider: provider,
      deviceId: deviceId,
    },
    select: {
      id: true,
      userId: true,
      provider: true,
      deviceId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return smartHomeDevice;
};

const deleteDeviceFromDevicelist = async (userId: number, deviceId: string) => {
  const smartHomeDevice = await prisma.smartHomeDevices.deleteMany({
    where: {
      userId: userId,
      deviceId: deviceId,
    },
  });
  return smartHomeDevice;
};

const smartHomeRepository = {
  querySmartHomeAuthByUserId,
  querySmartHomeAuthByProviderAndUserId,
  saveSmartHomeAuth,
  deleteSmartHomeAuthByProviderAndUserId,
  querySmartHomeDevicelistByUserId,
  saveSmartHomeDevice,
  querySmartHomeDevicelistByDeviceId,
  deleteDeviceFromDevicelist,
};

export default smartHomeRepository;
