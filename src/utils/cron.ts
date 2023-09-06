import { log } from "../middleware/logEvents";

type AsyncCronJobFunction = () => Promise<void>;

const cronStartMessage = "Cron job [starting]:";
const cronEndMessage = "Cron job [finished]:";

export const handleCronJob = (
  jobFunction: AsyncCronJobFunction,
  jobName: string
) => {
  return async () => {
    try {
      log(cronStartMessage, jobName);
      await jobFunction();
      log(cronEndMessage, jobName);
    } catch (error) {
      let errorMessage = "Unknown error occurred in cron job.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      log("Cron Error:", errorMessage);
      // Handle or log the error as needed
    }
  };
};
