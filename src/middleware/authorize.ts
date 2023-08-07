import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

import {
  AuthPayloadType,
  AuthenticatedRequest,
  RoleType,
} from "../auth/authTypes";

const authorize = (requiredRoles: RoleType[]) => {
  return function verifyJWT(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    const authHeader = req.headers["authorization"];
    console.log(`Auth Header: ${authHeader}`);
    if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);

    const token = authHeader.split(" ")[1];

    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string,
      (err: any, decoded: any) => {
        const payload = decoded as AuthPayloadType;
        if (err) return res.sendStatus(401);
        const userRoles = payload.user.roles;
        const isAuthorized = verifyRoles(requiredRoles, userRoles);

        // adds the user id to the request object so that we can use it in the controller
        req.id = payload.user.id;
        req.roles = payload.user.roles;

        console.log(`user is authorized: ${isAuthorized}`);
        if (!isAuthorized) return res.sendStatus(403);
        next();
      }
    );
  };
};

const verifyRoles = (
  requiredRoles: RoleType[],
  userRoles: RoleType[]
): boolean =>
  requiredRoles.every((requiredRole) => {
    if (!userRoles.includes(requiredRole)) return false;
    return true;
  });

export const isAdmin = (roles: RoleType[] | undefined) =>
  roles ? roles.includes(Role.ADMIN) : false;

export const isUser = (roles: RoleType[] | undefined) =>
  roles ? roles.includes(Role.USER) : false;

export default authorize;
