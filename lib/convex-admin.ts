import { ConvexHttpClient } from "convex/browser";

export function createConvexAdminClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const deploymentKey = process.env.CONVEX_DEPLOY_KEY;

  if (!convexUrl) {
    throw new Error(
      "Publishing is not configured: NEXT_PUBLIC_CONVEX_URL is missing from the server environment."
    );
  }
  if (!deploymentKey) {
    throw new Error(
      "Publishing is not configured: add CONVEX_DEPLOY_KEY to .env.local, then restart the Next.js server. Keep this key server-only; never prefix it with NEXT_PUBLIC_."
    );
  }

  const client = new ConvexHttpClient(convexUrl, { logger: false });
  (client as ConvexHttpClient & { setAdminAuth(token: string): void })
    .setAdminAuth(deploymentKey);
  // ConvexHttpClient's public TypeScript signatures omit internal references,
  // though its server-side admin token is specifically allowed to call them.
  return client as any;
}
