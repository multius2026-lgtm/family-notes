import { Elysia } from "elysia";
import { authMiddleware } from "@/middleware/auth.middleware";
import { getDailySummary, getWeeklySummary, getTrend, getByCategory, getMonthlySummary } from "./summary.service";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export const summaryRoutes = new Elysia({ prefix: "/summary" })
  .use(authMiddleware)
  .get("/daily", async ({ userId, query }) => {
    const date = (query.date as string) || todayStr();
    return getDailySummary(userId, date);
  })
  .get("/weekly", async ({ userId, query }) => {
    return getWeeklySummary(userId, query.week as string | undefined);
  })
  .get("/trend", async ({ userId, query }) => {
    const range = String(query.range || "30d");
    const days = Number(range.replace("d", "")) || 30;
    return getTrend(userId, days);
  })
  .get("/by-category", async ({ userId, query }) => {
    const from = (query.from as string) || todayStr();
    const to = (query.to as string) || todayStr();
    return getByCategory(userId, from, to);
  })
  .get("/monthly", async ({ userId, query }) => {
    const now = new Date();
    const year = Number(query.year) || now.getFullYear();
    const month = Number(query.month) || now.getMonth() + 1;
    return getMonthlySummary(userId, year, month);
  });
