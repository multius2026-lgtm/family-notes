import { Elysia, t } from "elysia";
import { registerSchema, loginSchema, refreshSchema } from "./auth.schema";
import { registerUser, loginUser, refreshTokenPair, logoutUser } from "./auth.service";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .post(
    "/register",
    async ({ body, set }) => {
      const input = registerSchema.parse(body);
      const result = await registerUser(input);
      set.status = 201;
      return result;
    },
    { body: t.Any() }
  )
  .post(
    "/login",
    async ({ body }) => {
      const input = loginSchema.parse(body);
      return loginUser(input);
    },
    { body: t.Any() }
  )
  .post(
    "/refresh",
    async ({ body }) => {
      const input = refreshSchema.parse(body);
      return refreshTokenPair(input.refreshToken);
    },
    { body: t.Any() }
  )
  .post(
    "/logout",
    async ({ body }) => {
      const input = refreshSchema.parse(body);
      return logoutUser(input.refreshToken);
    },
    { body: t.Any() }
  );
