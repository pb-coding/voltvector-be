import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { AuthPayloadType, RoleType } from "../auth/auth.types";

interface AuthenticatedRequest extends Request {
  id?: number;
  role?: string;
}
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

export default authorize;
