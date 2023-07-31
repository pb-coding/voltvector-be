import cron from "node-cron";
import enphaseEnergyService from "./enphaseEnergyService";

cron.schedule("*/15 * * * *", () => {
  console.log("Cron job (starting): Fetch enphase data");
  enphaseEnergyService.fetchEnergyData();
  console.log("Cron job (finished): Fetch enphase data");
});
