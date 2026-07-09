import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import { verifySessionToken } from "./kimi/session";

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
    // Authenticate user from request
    ctx.user = await authenticateRequest(opts.req.headers);

    // Extract access token from session for AI API calls
    const cookieHeader = opts.req.headers.get("cookie") || "";
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    if (sessionMatch) {
      const session = await verifySessionToken(decodeURIComponent(sessionMatch[1]));
      if (session) {
        ctx.accessToken = session.accessToken;
      }
    }
  } catch {
    // Authentication is optional — public endpoints still work
  }

  return ctx;
}
