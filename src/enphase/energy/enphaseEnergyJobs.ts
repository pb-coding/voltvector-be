import cron from "node-cron";
import enphaseEnergyService from "./enphaseEnergyService";
import { log } from "../../middleware/logEvents";

const cronStartMessage = "Cron job [starting]:";
const cronEndMessage = "Cron job [finished]:";

// cron job that runs every 15 minutes to fetch enphase energy data
// added 5 minute offset to give enphase time to update their data first and get the latest data
cron.schedule("5,20,35,50 * * * *", () => {
  log("Cron job (starting): Fetch enphase data");
  enphaseEnergyService.updateEnergyDataJob();
  log("Cron job (finished): Fetch enphase data");
});

// TODO: implement cron job that verifies for consistency of data once a day.
// if the backend is down for more than 24 hours, gaps need to be identified and specifically requested from enphase to be filled.
cron.schedule("0 5 * * *", () => {
  log("Verify enphase data", cronStartMessage);
  enphaseEnergyService.verifyEnergyDataConsistencyJob();
  log("Verify enphase data", cronEndMessage);
});
