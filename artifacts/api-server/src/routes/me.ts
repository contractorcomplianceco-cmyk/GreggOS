import { Router, type IRouter, type Request, type Response } from "express";
import type { AuthedRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/me", (req: Request, res: Response) => {
  const user = (req as AuthedRequest).localUser;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    active: user.active,
  });
});

export default router;
