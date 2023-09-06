import cron from "node-cron";
import enphaseEnergyService from "./enphaseEnergyService";
import { handleCronJob } from "../../utils/cron";

// cron job that runs every 15 minutes to fetch enphase energy data
// added 5 minute offset to give enphase time to update their data first and get the latest data
cron.schedule(
  "5,20,35,50 * * * *",
  handleCronJob(enphaseEnergyService.updateEnergyDataJob, "Fetch enphase data")
);

// if the backend is down for more than 24 hours, gaps need to be identified and specifically requested from enphase to be filled.
cron.schedule(
  "0 5 * * *",
  handleCronJob(
    enphaseEnergyService.verifyEnergyDataConsistencyJob,
    "Verify enphase data"
  )
);
