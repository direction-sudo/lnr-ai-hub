import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
  accessToken?: string;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  try {
    // Authenticate and extract both user + access token
    const result = await authenticateRequest(opts.req.headers);
    if (result) {
      ctx.user = result.user;
      ctx.accessToken = result.accessToken;
    }
  } catch (err) {
    // Authentication is optional — public endpoints still work
    console.warn("[context] Auth error:", err);
  }

  return ctx;
}
