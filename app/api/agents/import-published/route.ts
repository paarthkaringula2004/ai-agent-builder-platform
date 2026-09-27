import { randomUUID } from "node:crypto";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { internal } from "@/convex/_generated/api";
import { createConvexAdminClient } from "@/lib/convex-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json({ error: "Cross-origin imports are not allowed." }, { status: 403 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in before importing a workflow." }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const ownerEmail = clerkUser?.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId && email.verification?.status === "verified"
    )?.emailAddress;
    if (!ownerEmail) {
      return NextResponse.json({ error: "A verified primary email is required to import a workflow." }, { status: 403 });
    }

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > 64 * 1024) {
      return NextResponse.json({ error: "The pasted code is too large." }, { status: 413 });
    }
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > 64 * 1024) {
      return NextResponse.json({ error: "The pasted code is too large." }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(rawBody);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return NextResponse.json({ error: "Send the pasted code as a JSON object." }, { status: 400 });
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "The request body must contain valid JSON." }, { status: 400 });
    }

    const code = typeof body.code === "string" ? body.code : "";
    if (!code || code.length > 48 * 1024) {
      return NextResponse.json({ error: "Paste the published agent code, then try again." }, { status: 400 });
    }
    const publicId = code.match(
      /\/api\/published-agents\/([A-Za-z0-9_-]{40,64})\/chat(?:[/?#"'`\\\s]|$)/
    )?.[1];
    if (!publicId) {
      return NextResponse.json({
        error: "That code does not contain a published-agent endpoint. Copy the code from its Publish dialog and paste it here.",
      }, { status: 400 });
    }

    const convex = createConvexAdminClient();
    const imported = await convex.mutation(internal.agent.importPublishedAgent, {
      publicAgentId: publicId,
      ownerEmail,
      agentId: randomUUID(),
    });

    return NextResponse.json(imported, { status: 201 });
  } catch (error) {
    console.error("Published workflow import failed:", error);
    const message = error instanceof Error ? error.message : "Could not import this workflow.";
    const status = message.toLowerCase().includes("not configured") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
