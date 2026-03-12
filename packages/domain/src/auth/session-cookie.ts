import { createHmac, timingSafeEqual } from "node:crypto";

import { sessionCookieSchema } from "@salt/validation";

export const SESSION_COOKIE_NAME = "salt_session";

type SessionCookiePayload = {
  userId: string;
};

function signValue(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSessionToken(payload: SessionCookiePayload, secret: string) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signValue(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string, secret: string) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as unknown;

    return sessionCookieSchema.parse(payload);
  } catch {
    return null;
  }
}
