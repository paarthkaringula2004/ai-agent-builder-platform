import { fetchQuery } from "convex/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { openai } from "@/config/OpenAi";
import { runAgentChat } from "@/lib/agent-chat-runtime";

export const runtime = "nodejs";

export async function GET() {
  try {
    const conversation = await openai.conversations.create({});
    return NextResponse.json({ conversationId: conversation.id });
  } catch (error) {
    console.error("Could not create Preview conversation:", error);
    return NextResponse.json(
      { error: "The chat session could not be started. Please try again." },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const agentId = typeof body.agentId === "string" ? body.agentId.trim() : "";
    const userId = typeof body.userId === "string" ? body.userId : "";
    const input = typeof body.input === "string" ? body.input.trim() : "";
    const conversationId =
      typeof body.conversationId === "string" ? body.conversationId.trim() : "";

    if (!agentId || !userId || !input || !conversationId) {
      return NextResponse.json(
        {
          error:
            "The agent chat is not ready. Refresh Preview and wait for the chat to connect.",
        },
        { status: 400 }
      );
    }
    if (input.length > 12000) {
      return NextResponse.json(
        { error: "Please keep each message under 12,000 characters." },
        { status: 413 }
      );
    }

    const agentDetail = await fetchQuery(api.agent.GetAgentById, { agentId });
    if (!agentDetail || String(agentDetail.userId) !== userId) {
      return NextResponse.json({ error: "Agent not found." }, { status: 404 });
    }

    return await runAgentChat(agentDetail, input, conversationId);
  } catch (error) {
    console.error("Agent chat request failed:", error);
    return NextResponse.json(
      { error: "The agent could not complete that request. Please try again." },
      { status: 500 }
    );
  }
}
