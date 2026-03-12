import type { SessionPayload } from "@salt/types";

declare global {
  namespace Express {
    interface Request {
      authSession: SessionPayload | null;
    }
  }
}

export {};
