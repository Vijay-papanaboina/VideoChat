import cron from "node-cron";
import { deleteExpiredTemporaryRooms } from "../src/services/roomService.js";

/**
 * Initialize background jobs
 */
export const initJobs = () => {
  console.log("⏰ Initializing background jobs...");

  /**
   * Room Cleanup Job
   * Runs every hour to delete expired temporary rooms
   * Schedule: "0 * * * *" (At minute 0 past every hour)
   */
  cron.schedule("0 * * * *", async () => {
    console.log("🧹 Running scheduled room cleanup job...");
    try {
      const count = await deleteExpiredTemporaryRooms();
      if (count > 0) {
        console.log(`✅ Cleanup complete. Removed ${count} rooms.`);
      } else {
        console.log("ℹ️ Cleanup complete. No expired rooms found.");
      }
    } catch (error) {
      console.error("❌ Error in room cleanup job:", error);
    }
  });

  console.log("✅ Room cleanup job scheduled (runs hourly)");
};
