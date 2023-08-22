// thanks to https://github.com/Apollon77/meross-cloud for the Meross Cloud API

import express, { Request, Response } from "express";
import app from "./lib/app";
import * as path from "path";
import logger from "./middleware/logEvents";
import errorHandler from "./middleware/errorHandler";
import credentials from "./middleware/credentials";
import cors from "cors";
import corsOptions from "./config/corsOptions";
import cookieParser from "cookie-parser";
import rootRouter from "./routes/root";
import authRouter from "./routes/auth";
import enphaseRouter from "./routes/enphase";
import energyRouter from "./routes/energy";
import merossRouter from "./routes/meross";
import userRouter from "./routes/user";

// Initialize cron jobs
import "./enphase/energy/enphaseEnergyJobs";

const PORT = process.env.PORT || 3001;

app.use(logger);

app.use(credentials);

app.use(cors(corsOptions));

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "..", "public")));

app.use(cookieParser());

app.use("/", rootRouter);
app.use("/auth", authRouter);
app.use("/enphase", enphaseRouter);
app.use("/energy", energyRouter);
app.use("/meross", merossRouter);
app.use("/user", userRouter);

app.all("*", (req: Request, res: Response) => {
  res.status(404).send("Not Found");
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
