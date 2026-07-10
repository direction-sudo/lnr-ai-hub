import * as jose from "jose";
import { env } from "../lib/env";
import type { SessionPayload } from "./types";

const JWT_ALG = "HS256";
const JWT_EXPIRY = "7d"; // Match cookie max-age of 7 days

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  const secret = new TextEncoder().encode(env.appSecret);
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .setAudience(env.appId)
    .setIssuer(env.appId)
    .sign(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  if (!token) {
    console.warn("[session] No token provided for verification.");
    return null;
  }
  try {
    const secret = new TextEncoder().encode(env.appSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
      clockTolerance: 60, // 60 second clock skew tolerance
      audience: env.appId,
      issuer: env.appId,
    });
    
    const { unionId, clientId, accessToken } = payload;
    if (!unionId || !clientId) {
      console.warn("[session] JWT payload missing required fields.");
      return null;
    }
    return { unionId: String(unionId), clientId: String(clientId), accessToken: accessToken as string | undefined } as SessionPayload;
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      console.warn("[session] JWT expired.");
    } else if (error instanceof jose.errors.JWTInvalid) {
      console.warn("[session] JWT invalid.");
    } else {
      console.warn("[session] JWT verification failed:", error);
    }
    return null;
  }
}
