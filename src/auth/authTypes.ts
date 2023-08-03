import { Request } from "express";
import { RefreshToken, Role } from "@prisma/client";

export type RefreshTokenType = RefreshToken;
export type RoleType = Role;

export interface AuthPayloadType {
  user: {
    id: number;
    roles: RoleType[];
  };
}

export interface AuthenticatedRequest extends Request {
  id?: number;
  roles?: RoleType[];
}
