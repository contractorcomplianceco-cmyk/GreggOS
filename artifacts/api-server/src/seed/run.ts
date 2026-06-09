import { seedDatabase } from "./seedDatabase";
import { logger } from "../lib/logger";

seedDatabase()
  .then(() => {
    logger.info("Database seeded");
    process.exit(0);
  })
  .catch((err) => {
    logger.error({ err }, "Seed failed");
    process.exit(1);
  });
