import { SmartHomeProvider, SmartHomeAuth } from "@prisma/client";

export type SmartHomeAuthType = SmartHomeAuth;
export type SmartHomeProviderType = SmartHomeProvider;
export const SmartHomeProviderEnum = SmartHomeProvider;
export type SmartHomeProviderOverview = {
  provider: SmartHomeProviderType;
  saved: boolean;
  authorized: boolean;
};
