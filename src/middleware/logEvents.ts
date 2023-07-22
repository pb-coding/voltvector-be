import { Request, Response, NextFunction } from "express";
import { format } from "date-fns";
import { v4 as uuid } from "uuid";
import * as fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";

export const logEvents = async (message: string, logName: string) => {
  const dateTime = format(new Date(), "yyyy-MM-dd HH:mm:ss");
  const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

  try {
    if (!fs.existsSync(path.join(__dirname, "..", "logs"))) {
      await fsPromises.mkdir(path.join(__dirname, "..", "logs"));
    }

    await fsPromises.appendFile(
      path.join(__dirname, "..", "logs", logName),
      logItem
    );
  } catch (error) {
    console.error(error);
  }
};
export const logger = (req: Request, res: Response, next: NextFunction) => {
  logEvents(`${req.method}\t${req.headers.origin}\t${req.url}`, "reqLog.txt");
  console.log(`${req.method} ${req.path}`);
  next();
};

export default logger;
