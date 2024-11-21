import { H3Event, createError, getHeader } from "h3";

export async function requireUserSession(event: H3Event) {
  try {
    const userId = getHeader(event, 'x-user-id');
    if (!userId) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized",
      });
    }
    return { userId };
  } catch (error) {
    console.error("User session error:", error);
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }
}
