import { Router, type IRouter, type Request, type Response } from "express";
import { db, auditLinksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SetAuditLinkBody } from "@workspace/api-zod";
import { toAuditLink } from "../lib/mappers";
import { logActivity } from "../lib/activity";
import { actorOf, type AuthedRequest } from "../middlewares/auth";
import { strParam } from "../lib/http";

const router: IRouter = Router();

router.get(
  "/clients/:clientId/audit-link",
  async (req: Request, res: Response) => {
    const clientId = strParam(req, "clientId");
    const rows = await db
      .select()
      .from(auditLinksTable)
      .where(eq(auditLinksTable.clientId, clientId))
      .limit(1);
    res.json(rows[0] ? toAuditLink(rows[0]) : null);
  },
);

router.put(
  "/clients/:clientId/audit-link",
  async (req: Request, res: Response) => {
    const clientId = strParam(req, "clientId");
    const body = SetAuditLinkBody.parse(req.body);
    const actor = actorOf(req);
    const userId = (req as AuthedRequest).localUser?.id ?? null;

    const values = {
      clientId,
      portalAuditId: body.portalAuditId,
      portalClientName: body.portalClientName ?? "",
      matchMethod: body.matchMethod ?? "manual",
      confirmedByUserId: userId,
      confirmedAt: new Date(),
    };

    const upserted = await db
      .insert(auditLinksTable)
      .values(values)
      .onConflictDoUpdate({
        target: auditLinksTable.clientId,
        set: {
          portalAuditId: values.portalAuditId,
          portalClientName: values.portalClientName,
          matchMethod: values.matchMethod,
          confirmedByUserId: values.confirmedByUserId,
          confirmedAt: values.confirmedAt,
        },
      })
      .returning();
    const row = upserted[0]!;
    await logActivity(db, {
      actorUserId: actor.id,
      actorLabel: actor.label,
      action: "linked",
      entityType: "audit_link",
      entityId: row.id,
      clientId,
      summary: `Linked audit #${body.portalAuditId}`,
    });
    res.json(toAuditLink(row));
  },
);

router.delete(
  "/clients/:clientId/audit-link",
  async (req: Request, res: Response) => {
    const clientId = strParam(req, "clientId");
    await db
      .delete(auditLinksTable)
      .where(eq(auditLinksTable.clientId, clientId));
    const actor = actorOf(req);
    await logActivity(db, {
      actorUserId: actor.id,
      actorLabel: actor.label,
      action: "unlinked",
      entityType: "audit_link",
      clientId,
      summary: "Removed audit link",
    });
    res.json({ ok: true });
  },
);

export default router;
