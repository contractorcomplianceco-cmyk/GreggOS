import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", router);

app.use(
  (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
    const name =
      err && typeof err === "object" && "name" in err
        ? (err as { name?: string }).name
        : undefined;
    if (name === "ZodError") {
      const issues =
        err && typeof err === "object" && "issues" in err
          ? (err as { issues?: unknown }).issues
          : undefined;
      res.status(400).json({ error: "Validation failed", issues });
      return;
    }
    req.log.error({ err }, "Unhandled error");
    res.status(500).json({ error: "Internal server error" });
  },
);

export default app;
