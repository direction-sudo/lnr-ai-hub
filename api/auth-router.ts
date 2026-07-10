import { createRouter, authedQuery, publicQuery } from "./middleware";

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),

  logout: authedQuery.mutation(async ({ ctx }) => {
    // Set an expired session cookie to clear it
    ctx.resHeaders.set(
      "Set-Cookie",
      "session=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict"
    );
    if (process.env.NODE_ENV === "production") {
      ctx.resHeaders.set(
        "Set-Cookie",
        "session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict"
      );
    }
    return { success: true };
  }),
});
