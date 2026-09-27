import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { internal } from "@/convex/_generated/api";
import { createConvexAdminClient } from "@/lib/convex-admin";
import { openai } from "@/config/OpenAi";
import { runAgentChat } from "@/lib/agent-chat-runtime";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ publicAgentId: string }>;
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Expose-Headers": "X-Agent-Conversation-Id",
  };
}

function jsonError(message: string, status: number, headers: HeadersInit = {}) {
  return NextResponse.json(
    { error: message },
    { status, headers: { ...corsHeaders(), ...headers } }
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { publicAgentId } = await context.params;
    if (!/^[A-Za-z0-9_-]{40,64}$/.test(publicAgentId)) {
      return jsonError("Published agent not found.", 404);
    }

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > 64 * 1024) {
      return jsonError("The request body is too large.", 413);
    }
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > 64 * 1024) {
      return jsonError("The request body is too large.", 413);
    }

    let body: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(rawBody);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return jsonError("Send a JSON object containing the message.", 400);
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return jsonError("The request body must contain valid JSON.", 400);
    }

    const input = typeof body.input === "string" ? body.input.trim() : "";
    const sessionId = typeof body.conversationId === "string" ? body.conversationId.trim() : "";
    if (!input) return jsonError("Enter a message for the agent.", 400);
    if (input.length > 12000) return jsonError("Keep each message under 12,000 characters.", 413);
    if (sessionId && !/^[A-Za-z0-9_-]{40,64}$/.test(sessionId)) {
      return jsonError("The conversation ID is invalid. Start a new conversation.", 400);
    }

    const convex = createConvexAdminClient();
    const agent = await convex.query(internal.agent.getPublishedAgentByPublicId, { publicAgentId });
    if (!agent) return jsonError("This agent is not published or the link has been revoked.", 404);

    const allowed = await convex.mutation(internal.agent.consumePublishedRequest, {
      publicAgentId,
      now: Date.now(),
    });
    if (!allowed) {
      const retryAfter = 60 - Math.floor((Date.now() % 60_000) / 1000);
      return jsonError("This agent has reached its request limit. Try again shortly.", 429, {
        "Retry-After": String(retryAfter),
      });
    }

    let openaiConversationId: string;
    let publicConversationId: string;
    if (sessionId) {
      const session = await convex.query(internal.agent.getPublishedConversation, { sessionId });
      if (
        !session ||
        session.publicAgentId !== publicAgentId ||
        session.publishedVersion !== agent.version
      ) {
        return jsonError("This conversation is unavailable. Start a new conversation.", 409);
      }
      if (session.createdAt < Date.now() - 24 * 60 * 60 * 1000) {
        return jsonError("This conversation has expired. Start a new conversation.", 410);
      }
      openaiConversationId = session.openaiConversationId;
      publicConversationId = session.sessionId;
    } else {
      const conversation = await openai.conversations.create({});
      openaiConversationId = conversation.id;
      publicConversationId = randomBytes(32).toString("base64url");
      await convex.mutation(internal.agent.createPublishedConversation, {
        sessionId: publicConversationId,
        publicAgentId,
        publishedVersion: agent.version,
        openaiConversationId,
        createdAt: Date.now(),
      });
    }

    const response = await runAgentChat(agent, input, openaiConversationId);
    const headers = new Headers(response.headers);
    headers.set("X-Agent-Conversation-Id", publicConversationId);
    for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error("Published agent request failed:", error);
    return jsonError("The published agent could not complete this request.", 500);
  }
}
