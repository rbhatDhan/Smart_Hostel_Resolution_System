import cron from "node-cron";
import { runSlaCheck } from "./slaService.js";

let task = null;
let running = false;

const safeRun = async (source) => {
  if (running) return; // never overlap runs
  running = true;
  try {
    const result = await runSlaCheck();
    if (result.breached || result.warned) {
      console.log(`[sla:${source}] breached=${result.breached} warned=${result.warned}`);
    }
  } catch (err) {
    console.error(`[sla:${source}] failed:`, err.message);
  } finally {
    running = false;
  }
};

// In-process scheduler. Needs a long-running server (Render, Railway, VPS, Docker).
// On serverless platforms use the secured HTTP endpoint instead (see cronRoutes.js).
export const startSlaCron = () => {
  if (process.env.ENABLE_CRON === "false") {
    console.log("SLA cron disabled (ENABLE_CRON=false)");
    return;
  }

  const schedule = process.env.SLA_CRON_SCHEDULE || "*/10 * * * *";
  if (!cron.validate(schedule)) {
    console.error(`Invalid SLA_CRON_SCHEDULE "${schedule}" - SLA cron not started`);
    return;
  }

  task = cron.schedule(schedule, () => safeRun("cron"));
  console.log(`SLA cron scheduled: ${schedule}`);

  // catch up on anything that expired while the server was down
  setTimeout(() => safeRun("startup"), 5000);
};

export const stopSlaCron = () => task?.stop();
