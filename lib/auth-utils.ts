import { createAuth } from "./auth";

export async function requireAuth(request: Request, db: any) {
  const auth = createAuth(db);

  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      throw new Response(null, {
        status: 302,
        headers: {
          Location: "/login",
        },
      });
    }

    return session;
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    throw new Response(null, {
      status: 302,
      headers: {
        Location: "/login",
      },
    });
  }
}

export async function getOptionalAuth(request: Request, db: any) {
  const auth = createAuth(db);

  try {
    return await auth.api.getSession({
      headers: request.headers,
    });
  } catch (error) {
    return null;
  }
}
