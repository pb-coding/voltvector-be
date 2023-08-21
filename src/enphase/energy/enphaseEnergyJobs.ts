import cron from "node-cron";
import enphaseEnergyService from "./enphaseEnergyService";

// cron job that runs every 15 minutes to fetch enphase energy data
// added 5 minute offset to give enphase time to update their data first and get the latest data
cron.schedule("5,20,35,50 * * * *", () => {
  console.log("Cron job (starting): Fetch enphase data");
  enphaseEnergyService.updateEnergyDataJob();
  console.log("Cron job (finished): Fetch enphase data");
});

// TODO: implement cron job that verifies for consistency of data once a day.
// if the backend is down for more than 24 hours, gaps need to be identified and specifically requested from enphase to be filled.
cron.schedule("0 5 * * *", () => {
  console.log("Cron job (starting): Verify enphase data");
  enphaseEnergyService.verifyEnergyDataConsistencyJob();
  console.log("Cron job (finished): Verify enphase data");
});
