import { CronTask } from "../schema/cron";

import { cronTasks } from "./tasks";
import config from "../config";

export async function runTasks(tasks?: (string | CronTask)[]) {

  if (!tasks) tasks = cronTasks;

  for (let task of tasks) {

    if (typeof task === "string") {
      let taskName = task;
      task = cronTasks.find(cronTask => cronTask.id === task);
      if (!task) throw new Error(`Task ${taskName} not found.`);
    }

    console.log("\n===================================");
    console.log("Task: " + task.name);
    console.log("===================================");

    try {
      await task.exec();
      console.log("Task finished.");
    } catch (err) {
      console.error("Error: " + err.message);
    }

    await new Promise((resolve, reject) => setTimeout(resolve, config.cron.jobDelay * 1000));

  }

}