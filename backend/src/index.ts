import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { env, corsOrigins } from "@/config/env";
import { errorMiddleware } from "@/middleware/error.middleware";
import { authRoutes } from "@/modules/auth/auth.routes";
import { transactionsRoutes } from "@/modules/transactions/transactions.routes";
import { summaryRoutes } from "@/modules/summary/summary.routes";
import { masterDataRoutes } from "@/modules/master-data/master-data.routes";
import { usersRoutes } from "@/modules/users/users.routes";

const app = new Elysia()
  .use(cors({ origin: corsOrigins, credentials: true }))
  .use(errorMiddleware)
  .get("/", () => ({ name: "Catatan Harian API", status: "ok" }))
  .get("/health", () => ({ status: "ok", time: new Date().toISOString() }))
  .use(authRoutes)
  .use(transactionsRoutes)
  .use(summaryRoutes)
  .use(masterDataRoutes)
  .use(usersRoutes)
  .listen(env.PORT);

console.log(`🚀 Catatan Harian API jalan di http://localhost:${app.server?.port}`);

export type App = typeof app;
