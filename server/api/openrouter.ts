// server/api/openRouterChat.ts
import { defineEventHandler, readBody, createError } from "h3";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { messages, max_tokens } = body;
  const model = body.model || "NO MODEL SPECIFIED";
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    throw createError({
      statusCode: 500,
      message: "OpenRouter API key is not configured",
    });
  }

  if (!messages || !Array.isArray(messages)) {
    throw createError({
      statusCode: 400,
      message: "Invalid or missing messages array",
    });
  }

  try {
    console.log("Using openrouter LLM model:", model);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: max_tokens || 4096,
        }),
      }
    );

    const responseData = await response.json();
    if (!response.ok) {
      console.error("OpenRouter API error:", response.status, responseData);
      throw createError({
        statusCode: response.status,
        message:
          responseData.error?.message || "Failed to fetch from OpenRouter",
      });
    }

    return {
      success: true,
      message: "Message generated successfully",
      data: responseData,
    };
  } catch (error) {
    console.error("Error connecting to OpenRouter:", error);
    return {
      success: false,
      message: "Failed to connect to OpenRouter",
      error: (error as Error).message || "Unknown error",
    };
  }
});
