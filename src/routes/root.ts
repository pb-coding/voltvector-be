import express, { Router, Request, Response } from "express";
import * as path from "path";

const rootRouter = Router();

rootRouter.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

rootRouter.get("/test", (req: Request, res: Response) => {
  res.send("test");
});

export default rootRouter;
