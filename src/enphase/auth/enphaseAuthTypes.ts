import { EnphaseApp, UserEnphaseApp } from "@prisma/client";

export type ExtendedUserEnphaseApp =
  | {
      app: EnphaseApp;
    } & UserEnphaseApp;
