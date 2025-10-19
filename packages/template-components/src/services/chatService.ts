/**
 * Chat service for handling SSE streaming and API communication.
 *
 * This service provides a clean async generator interface for streaming chat responses
 * from the backend, handling SSE parsing, error management, and command delimiter parsing.
 */

import type { ChatRequest } from "../components/chat/types";

// Event types that the service can emit
export type StreamEvent =
  | { type: "content"; data: string }
  | { type: "widget"; widget: string; indices?: number[] }
  | { type: "message_break" }
  | { type: "done"; conversationId: string }
  | { type: "error"; error: string };

export interface ChatServiceParams {
  message: string;
  conversationId?: string;
  username: string;
  apiBaseUrl: string;
  publicToken: string;
}

/**
 * Stream chat response from the backend using SSE.
 *
 * This async generator yields events as they arrive from the server:
 * - content: Text chunks to display
 * - widget: Widget rendering commands
 * - message_break: Signal to create a new message bubble
 * - done: Stream completed successfully
 * - error: An error occurred
 *
 * @param params - Chat request parameters
 * @yields StreamEvent objects
 * @throws Error for network or fetch failures
 */
export async function* streamChatResponse(
  params: ChatServiceParams
): AsyncGenerator<StreamEvent, void, unknown> {
  const { message, conversationId, username, apiBaseUrl, publicToken } = params;

  // Validate required parameters
  if (!publicToken) {
    yield {
      type: "error",
      error: "Chat is unavailable. Please refresh the page to continue.",
    };
    return;
  }

  if (!username || !apiBaseUrl) {
    yield {
      type: "error",
      error: "Invalid chat configuration. Please check your settings.",
    };
    return;
  }

  // Prepare request
  const chatRequest: ChatRequest = {
    message,
    conversation_id: conversationId,
  };

  const url = `${apiBaseUrl}/public/chat/${encodeURIComponent(username)}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${publicToken}`,
  };

  let response: Response;

  // Make fetch request
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(chatRequest),
    });
  } catch (fetchError) {
    // Network error (no internet, CORS, etc.)
    yield {
      type: "error",
      error:
        "Unable to connect to the chat service. Please check your internet connection.",
    };
    return;
  }

  // Handle HTTP errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const retryMessage = retryAfter
        ? `Please try again in ${retryAfter} seconds.`
        : "Please try again in a few minutes.";
      yield {
        type: "error",
        error: `You've reached the rate limit. ${retryMessage}`,
      };
      return;
    } else if (response.status === 404) {
      yield {
        type: "error",
        error: "Portfolio not found. Please check the username and try again.",
      };
      return;
    } else if (response.status === 403) {
      yield {
        type: "error",
        error: "This portfolio's chat is private and requires authentication.",
      };
      return;
    } else if (response.status === 400) {
      const message =
        errorData?.detail?.message || errorData?.message || "Invalid request";
      yield {
        type: "error",
        error: `${message}. Please try rephrasing your message.`,
      };
      return;
    } else if (response.status >= 500) {
      yield {
        type: "error",
        error:
          "The chat service is temporarily unavailable. Please try again in a moment.",
      };
      return;
    } else {
      yield {
        type: "error",
        error: "Something went wrong. Please try again.",
      };
      return;
    }
  }

  // Parse SSE stream
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    yield {
      type: "error",
      error: "No response body received from server.",
    };
    return;
  }

  let pending = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      pending += decoder.decode(value, { stream: true });

      // Process complete SSE events (delimited by \n\n)
      let newlineIdx: number;
      while ((newlineIdx = pending.indexOf("\n\n")) >= 0) {
        const rawEvent = pending.slice(0, newlineIdx).trim();
        pending = pending.slice(newlineIdx + 2);

        // Skip empty events
        if (!rawEvent.startsWith("data: ")) continue;

        const payload = rawEvent.slice(6);

        let parsed: any;
        try {
          parsed = JSON.parse(payload);
        } catch (e) {
          console.error("Error parsing SSE data:", e);
          continue;
        }

        // Handle different event types
        if (parsed.type === "content") {
          yield { type: "content", data: parsed.data };
        } else if (parsed.type === "cmd") {
          const command = parsed.data as string;

          if (command === "MSG_BREAK") {
            yield { type: "message_break" };
          } else if (command.startsWith("WIDGET:")) {
            // Parse widget command: WIDGET:name or WIDGET:name:0,1
            const parts = command.slice(7).split(":");
            const widgetName = parts[0];
            const indicesStr = parts[1];

            let indices: number[] | undefined = undefined;
            if (indicesStr) {
              const nums = indicesStr
                .split(",")
                .map((s) => Number(s.trim()))
                .filter((n) => Number.isInteger(n));
              if (nums.length) indices = nums;
            }

            yield { type: "widget", widget: widgetName, indices };
          }
        } else if (parsed.type === "done") {
          const conversationId = parsed.data?.conversation_id;
          yield { type: "done", conversationId };
          return;
        } else if (parsed.type === "error") {
          const errorMessage =
            typeof parsed.data === "string"
              ? parsed.data
              : "An error occurred while processing your message.";
          yield { type: "error", error: errorMessage };
          return;
        }
      }
    }
  } catch (error) {
    console.error("Stream parsing error:", error);
    yield {
      type: "error",
      error: "An error occurred while receiving the response.",
    };
  }
}
