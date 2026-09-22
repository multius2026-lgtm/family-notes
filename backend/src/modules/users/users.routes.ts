import { Elysia, t } from "elysia";
import { z } from "zod";
import { authMiddleware } from "@/middleware/auth.middleware";
import { getProfile, updateProfile } from "./users.service";

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  weeklyTarget: z.number().nullable().optional(),
});

export const usersRoutes = new Elysia()
  .use(authMiddleware)
  .get("/me", async ({ userId }) => getProfile(userId))
  .patch(
    "/me",
    async ({ userId, body }) => {
      const input = updateProfileSchema.parse(body);
      return updateProfile(userId, input);
    },
    { body: t.Any() }
  );
