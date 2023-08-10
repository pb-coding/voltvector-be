import cron from "node-cron";
import enphaseEnergyService from "./enphaseEnergyService";

// */15 * * * *
cron.schedule("*/1 * * * *", () => {
  console.log("Cron job (starting): Fetch enphase data");
  enphaseEnergyService.updateEnergyDataJob();
  console.log("Cron job (finished): Fetch enphase data");
});
