import { cookies } from "next/headers";
import { db } from "./db";
import { SESSION_COOKIE, verifySession } from "./auth";

export interface SessionContext {
  user: { id: string; email: string; name: string | null };
  org: { id: string; name: string };
  projectId: string;
}

// Resolve the signed-in user, their first organization, and a default project.
// Returns null when there is no valid session.
export async function getSessionContext(): Promise<SessionContext | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = await verifySession(token);
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: { organization: { include: { projects: { take: 1, orderBy: { createdAt: "asc" } } } } },
        take: 1,
      },
    },
  });
  if (!user || user.memberships.length === 0) return null;

  const org = user.memberships[0].organization;
  let projectId = org.projects[0]?.id;
  if (!projectId) {
    const project = await db.project.create({
      data: { name: "Default project", organizationId: org.id },
    });
    projectId = project.id;
  }

  return {
    user: { id: user.id, email: user.email, name: user.name },
    org: { id: org.id, name: org.name },
    projectId,
  };
}
