import { Router, type IRouter, type Request, type Response } from "express";
import { db, activityLogTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { toActivity } from "../lib/mappers";

const router: IRouter = Router();

router.get("/activity", async (req: Request, res: Response) => {
  const clientId = (req.query["clientId"] as string | undefined)?.trim();
  const limitRaw = Number(req.query["limit"]);
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 50;

  const rows = await db
    .select()
    .from(activityLogTable)
    .where(clientId ? eq(activityLogTable.clientId, clientId) : undefined)
    .orderBy(desc(activityLogTable.createdAt))
    .limit(limit);
  res.json(rows.map(toActivity));
});

export default router;
