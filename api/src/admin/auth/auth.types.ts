import type { AdminRole } from '../../generated/prisma/enums.js';

/** The signed-in admin attached to each authenticated request. */
export interface AdminPrincipal {
  id: string;
  login: string;
  role: AdminRole;
  sessionId: string;
}
