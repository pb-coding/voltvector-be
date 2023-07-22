import { Request, Response, NextFunction } from "express";
import { logEvents } from "./logEvents";

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // TODO: Handle loads of different errors
  logEvents(`${err.name}: ${err.message}`, "errorLog.txt");
  console.error(err);
  res.status(err.status || 500).send({
    error: {
      message: err.message || "Something went wrong!",
    },
  });
};

export const asyncHandler = (fn: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;
