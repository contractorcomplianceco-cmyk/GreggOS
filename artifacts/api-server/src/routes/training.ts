import { Router, type IRouter, type Request, type Response } from "express";
import { strParam } from "../lib/http";
import { db, trainingModulesTable } from "@workspace/db";
import { asc, eq } from "drizzle-orm";
import { UpdateTrainingModuleBody } from "@workspace/api-zod";
import { toTrainingModule } from "../lib/mappers";

const router: IRouter = Router();

router.get("/training-modules", async (_req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(trainingModulesTable)
    .orderBy(asc(trainingModulesTable.sortOrder));
  res.json(rows.map(toTrainingModule));
});

router.patch(
  "/training-modules/:moduleId",
  async (req: Request, res: Response) => {
    const moduleId = strParam(req, "moduleId");
    const body = UpdateTrainingModuleBody.parse(req.body);

    const updates: Record<string, unknown> = {};
    if (body.completed !== undefined) {
      updates["completed"] = body.completed;
      updates["completedAt"] = body.completed ? new Date() : null;
    }

    const updated = await db
      .update(trainingModulesTable)
      .set(updates)
      .where(eq(trainingModulesTable.id, moduleId))
      .returning();
    const row = updated[0];
    if (!row) {
      res.status(404).json({ error: "Training module not found" });
      return;
    }
    res.json(toTrainingModule(row));
  },
);

export default router;
