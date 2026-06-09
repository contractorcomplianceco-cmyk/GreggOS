import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meRouter from "./me";
import clientsRouter from "./clients";
import auditLinksRouter from "./auditLinks";
import callNotesRouter from "./callNotes";
import tasksRouter from "./tasks";
import signalsRouter from "./signals";
import escalationsRouter from "./escalations";
import activityRouter from "./activity";
import viewStateRouter from "./viewState";
import adminRouter from "./admin";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.use(healthRouter);

router.use(requireAuth);

router.use(meRouter);
router.use(clientsRouter);
router.use(auditLinksRouter);
router.use(callNotesRouter);
router.use(tasksRouter);
router.use(signalsRouter);
router.use(escalationsRouter);
router.use(activityRouter);
router.use(viewStateRouter);
router.use(adminRouter);

export default router;
