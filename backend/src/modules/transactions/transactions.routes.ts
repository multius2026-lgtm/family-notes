import { Elysia, t } from "elysia";
import { authMiddleware } from "@/middleware/auth.middleware";
import { createTransactionSchema, updateTransactionSchema, listTransactionsQuerySchema } from "./transactions.schema";
import { listTransactions, createTransaction, updateTransaction, deleteTransaction } from "./transactions.service";

export const transactionsRoutes = new Elysia({ prefix: "/transactions" })
  .use(authMiddleware)
  .get("/", async ({ userId, query }) => {
    const parsed = listTransactionsQuerySchema.parse(query);
    return listTransactions(userId, parsed);
  })
  .post(
    "/",
    async ({ userId, body, set }) => {
      const input = createTransactionSchema.parse(body);
      const row = await createTransaction(userId, input);
      set.status = 201;
      return row;
    },
    { body: t.Any() }
  )
  .put(
    "/:id",
    async ({ userId, params, body }) => {
      const input = updateTransactionSchema.parse(body);
      return updateTransaction(userId, params.id, input);
    },
    { body: t.Any() }
  )
  .delete("/:id", async ({ userId, params }) => deleteTransaction(userId, params.id));
