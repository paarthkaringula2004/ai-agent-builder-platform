# Publishing an agent

Publishing creates an immutable server-side snapshot of the agent's last saved and rebooted workflow. The generated integration code calls that snapshot through `/api/published-agents/{publicAgentId}/chat`; it does not include the workflow or its API keys.

## Server configuration

Set these variables in the local server environment and in the production host:

- `NEXT_PUBLIC_CONVEX_URL`: the Convex deployment URL already used by the app.
- `CONVEX_DEPLOY_KEY`: the Convex deployment key used only by server routes to read and write internal publishing data. Never prefix this variable with `NEXT_PUBLIC_`, commit its value, or include it in copied integration code.
- `OPENAI_API_KEY`: the server-side OpenAI API key already used by the Preview runtime.
- `NEXT_PUBLIC_APP_URL`: the deployed app's public origin, such as `https://agents.example.com`. This is used to build the integration URL. If omitted, the Publish dialog uses the current browser origin.

The deployment key is available from the Convex deployment settings. Keep separate development and production keys in their corresponding environments.

For local development, add the key to `.env.local` without committing it, then restart the Next.js server:

```dotenv
CONVEX_DEPLOY_KEY=your_convex_deployment_key
```

The app reports a clear setup error in the Publish dialog when this server-only variable is missing. The Code button opens the same publish dialog; integration code is shown after the agent has been published.

## Sync the Convex schema and functions

The publishing feature adds internal tables and functions. From the project directory, run `npx convex dev` for the development deployment. Before release, sync the same changes to the production deployment with `npx convex deploy`.

## Publish and use

1. Save the workflow in the builder.
2. Open Preview and select **Reboot Agent** so the saved workflow has a current runtime configuration.
3. Select **Publish**, then **Publish Agent**. The server checks the signed-in Clerk user against the agent owner's verified primary email before it creates or updates a snapshot.
4. Copy the code shown in the dialog and run it from a client that can reach the deployed app. The public endpoint supports browser CORS and Node.js requests.
5. Use **Unpublish** to revoke the endpoint. Published endpoints are limited to 30 requests per minute per agent, and individual messages are limited to 12,000 characters.

## Import a published workflow

In the same app deployment that published the agent, open **Code → Paste Code to Import Flow** and paste the complete generated snippet or its `/api/published-agents/{publicAgentId}/chat` endpoint. The app reads the public ID and copies the server-stored workflow into the signed-in user's account with fresh node and edge IDs. It never executes pasted JavaScript.

The snippet contains only an endpoint, not the workflow graph, so the source agent must still be published in that deployment. API credentials are removed from the imported copy; add your own API key in the builder, save, and reboot the agent before using it.

The public ID in the endpoint acts as a shareable access link. Anyone who receives the integration code can use that published agent until it is unpublished. The endpoint loads the workflow snapshot through internal Convex functions; API node keys stay server-side. Configured API calls require public HTTPS hosts, pin the resolved address for the connection, and do not follow redirects, which blocks requests to private or local networks. Public chat sessions expire after 24 hours, and a Convex job removes expired session records every five minutes. Request bodies are capped at 64 KB before JSON parsing.
