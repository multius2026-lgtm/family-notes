import { Elysia, t } from "elysia";
import { z } from "zod";
import { authMiddleware } from "@/middleware/auth.middleware";
import {
  listIncomeSources,
  createIncomeSource,
  deleteIncomeSource,
  listExpenseCategories,
  createExpenseCategory,
  deleteExpenseCategory,
} from "./master-data.service";

const createSourceSchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  defaultPeriodType: z.enum(["daily", "weekly", "monthly"]).optional(),
});
const createCategorySchema = z.object({ name: z.string().min(1), icon: z.string().optional() });

export const masterDataRoutes = new Elysia()
  .use(authMiddleware)
  .get("/income-sources", async ({ userId }) => listIncomeSources(userId))
  .post(
    "/income-sources",
    async ({ userId, body, set }) => {
      const input = createSourceSchema.parse(body);
      const row = await createIncomeSource(userId, input);
      set.status = 201;
      return row;
    },
    { body: t.Any() }
  )
  .delete("/income-sources/:id", async ({ userId, params }) => deleteIncomeSource(userId, params.id))
  .get("/expense-categories", async ({ userId }) => listExpenseCategories(userId))
  .post(
    "/expense-categories",
    async ({ userId, body, set }) => {
      const input = createCategorySchema.parse(body);
      const row = await createExpenseCategory(userId, input);
      set.status = 201;
      return row;
    },
    { body: t.Any() }
  )
  .delete("/expense-categories/:id", async ({ userId, params }) => deleteExpenseCategory(userId, params.id));
