import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// TODO: Identify user not by email but by id or username
interface AuthenticatedRequest extends Request {
  email?: string;
}

const verifyJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.sendStatus(401);
  console.log(authHeader);
  const token = authHeader.split(" ")[1];
  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET as string,
    (err: any, decoded: any) => {
      if (err) return res.sendStatus(403);
      req.email = decoded.email;
      next();
    }
  );
};

export default verifyJWT;
