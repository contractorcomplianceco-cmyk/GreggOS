import { Router, type IRouter, type Request, type Response } from "express";
import { db, userViewStateTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import type { AuthedRequest } from "../middlewares/auth";
import { strParam } from "../lib/http";

const router: IRouter = Router();

router.get("/view-state/:scope", async (req: Request, res: Response) => {
  const scope = strParam(req, "scope");
  const user = (req as AuthedRequest).localUser!;
  const rows = await db
    .select()
    .from(userViewStateTable)
    .where(
      and(
        eq(userViewStateTable.userId, user.id),
        eq(userViewStateTable.scope, scope),
      ),
    )
    .limit(1);
  res.json({
    scope,
    lastSeenAt: rows[0] ? rows[0].lastSeenAt.toISOString() : null,
  });
});

router.post("/view-state/:scope/seen", async (req: Request, res: Response) => {
  const scope = strParam(req, "scope");
  const user = (req as AuthedRequest).localUser!;
  const now = new Date();
  await db
    .insert(userViewStateTable)
    .values({ userId: user.id, scope, lastSeenAt: now })
    .onConflictDoUpdate({
      target: [userViewStateTable.userId, userViewStateTable.scope],
      set: { lastSeenAt: now },
    });
  res.json({ scope, lastSeenAt: now.toISOString() });
});

export default router;
