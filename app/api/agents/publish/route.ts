import { randomBytes } from "node:crypto";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { internal } from "@/convex/_generated/api";
import { createConvexAdminClient } from "@/lib/convex-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const requestOrigin = request.headers.get("origin");
    if (requestOrigin && requestOrigin !== new URL(request.url).origin) {
      return NextResponse.json({ error: "Cross-origin publishing requests are not allowed." }, { status: 403 });
    }

    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Sign in before publishing an agent." }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const primaryEmail = clerkUser?.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId && email.verification?.status === "verified"
    )?.emailAddress;
    if (!primaryEmail) {
      return NextResponse.json({ error: "A verified primary email is required to publish." }, { status: 403 });
    }

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > 16 * 1024) {
      return NextResponse.json({ error: "The request body is too large." }, { status: 413 });
    }
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > 16 * 1024) {
      return NextResponse.json({ error: "The request body is too large." }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(rawBody);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return NextResponse.json({ error: "Send a JSON object." }, { status: 400 });
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "The request body must contain valid JSON." }, { status: 400 });
    }

    const agentId = typeof body.agentId === "string" ? body.agentId.trim() : "";
    const action = typeof body.action === "string" ? body.action : "";
    if (!["status", "publish", "unpublish"].includes(action)) {
      return NextResponse.json({ error: "Choose status, publish, or unpublish." }, { status: 400 });
    }
    if (!agentId || agentId.length > 128) {
      return NextResponse.json({ error: "A valid agent ID is required." }, { status: 400 });
    }

    const convex = createConvexAdminClient();
    const owner = await convex.query(internal.agent.getAgentForPublishing, { agentId });
    if (!owner || owner.ownerEmail.trim().toLowerCase() !== primaryEmail.trim().toLowerCase()) {
      return NextResponse.json({ error: "Agent not found." }, { status: 404 });
    }

    if (action === "status") {
      return NextResponse.json({
        published: Boolean(owner.publicAgentId),
        publicAgentId: owner.publicAgentId ?? null,
        version: owner.publishedVersion ?? null,
      });
    }

    if (action === "unpublish") {
      await convex.mutation(internal.agent.unpublishAgentSnapshot, { agentId });
      return NextResponse.json({ published: false });
    }

    const publicAgentId = owner.publicAgentId ?? randomBytes(32).toString("base64url");
    const result = await convex.mutation(internal.agent.publishAgentSnapshot, {
      agentId,
      publicAgentId,
      publishedAt: Date.now(),
    });

    return NextResponse.json({ published: true, ...result });
  } catch (error) {
    console.error("Agent publishing failed:", error);
    const message = error instanceof Error ? error.message : "Could not publish this agent.";
    const status = message.toLowerCase().includes("not configured") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
