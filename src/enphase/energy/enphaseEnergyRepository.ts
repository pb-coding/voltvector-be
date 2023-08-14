import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

import { EnergyInterval } from "./enphaseEnergyTypes";

const queryEnergyDataByUserId = async (userId: number) => {
  const energyData = await prisma.energyData.findMany({
    where: {
      userId: userId,
    },
    select: {
      id: true,
      userId: true,
      userAppId: true,
      systemId: true,
      endDate: true,
      production: true,
      consumption: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return energyData;
};

const saveEnergyData = async (
  userId: number,
  userAppId: number,
  systemId: number,
  energyData: EnergyInterval[]
) => {
  const data = energyData.map((interval) => {
    return {
      userId: userId,
      userAppId: userAppId,
      systemId: systemId.toString(),
      endDate: new Date(interval.end_at * 1000),
      production: interval.production,
      consumption: interval.consumption,
    };
  });

  // currently prisma bulk upserts are not available. This is a workaround.
  data.forEach(async (interval) => {
    const upsertedInterval = await prisma.energyData.upsert({
      where: {
        userId_endDate: {
          userId: interval.userId,
          endDate: interval.endDate,
        },
      },
      update: { endDate: interval.endDate }, // dummy update to trigger upsert
      create: interval,
    });
  });
  return data.length;
};

const queryEnergyDataByUserIdAndDateInterval = async (
  userId: number,
  startDate: Date,
  endDate: Date,
  selectedFields?: Partial<Prisma.EnergyDataSelect>
) => {
  const energyData = await prisma.energyData.findMany({
    where: {
      userId: userId,
      endDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: selectedFields,
    orderBy: {
      endDate: "asc",
    },
  });
  return energyData;
};

const enphaseEnergyRepository = {
  queryEnergyDataByUserId,
  saveEnergyData,
  queryEnergyDataByUserIdAndDateInterval,
};

export default enphaseEnergyRepository;
