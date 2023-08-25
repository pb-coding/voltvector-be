import { randomBytes } from "crypto";

export const ENCRYPTION_SECRET =
  process.env.ENCRYPTION_SECRET || randomBytes(32).toString("hex");
