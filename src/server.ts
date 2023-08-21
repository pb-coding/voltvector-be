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
import userRouter from "./routes/user";

// Initialize cron jobs
import "./enphase/energy/enphaseEnergyJobs";

// Initialite Meross devices

import { MerossCloud } from "./meross/merossCloud";

const options = {
  email: "your_email",
  password: "your_password",
  logger: console.log,
  localHttpFirst: false,
  onlyLocalForGet: false,
  timeout: 3000,
};

const meross = new MerossCloud(options);

meross.on("deviceInitialized", (deviceId, deviceDef, device) => {
  console.log("New device " + deviceId + ": " + JSON.stringify(deviceDef));

  device.on("connected", () => {
    console.log("DEV: " + deviceId + " connected");

    if (deviceId === "2205069445274951080148e1e991c9f0") {
      device.getSystemAbilities((err: any, res: any) => {
        console.log("Abilities: " + JSON.stringify(res));

        device.getSystemAllData((err: any, res: any) => {
          console.log("All-Data: " + JSON.stringify(res));
        });
      });
      setTimeout(() => {
        console.log("toggle ...");
        device.controlToggleX(1, true, (err: any, res: any) => {
          console.log(
            "Toggle Response: err: " + err + ", res: " + JSON.stringify(res)
          );
        });
      }, 2000);
    }
  });

  device.on("close", (error: any) => {
    console.log("DEV: " + deviceId + " closed: " + error);
  });

  device.on("error", (error: any) => {
    console.log("DEV: " + deviceId + " error: " + error);
  });

  device.on("reconnect", () => {
    console.log("DEV: " + deviceId + " reconnected");
  });

  device.on("data", (namespace: any, payload: any) => {
    console.log(
      "DEV: " +
        deviceId +
        " " +
        namespace +
        " - data: " +
        JSON.stringify(payload)
    );
  });
});

meross.on("connected", (deviceId) => {
  console.log(deviceId + " connected");
});

meross.on("close", (deviceId, error) => {
  console.log(deviceId + " closed: " + error);
});

meross.on("error", (deviceId, error) => {
  console.log(deviceId + " error: " + error);
});

meross.on("reconnect", (deviceId) => {
  console.log(deviceId + " reconnected");
});

meross.on("data", (deviceId, payload) => {
  console.log(deviceId + " data: " + JSON.stringify(payload));
});

meross.connect((error) => {
  console.log("connect error: " + error);
});

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
app.use("/user", userRouter);

app.all("*", (req: Request, res: Response) => {
  res.status(404).send("Not Found");
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
