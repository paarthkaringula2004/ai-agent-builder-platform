import { NextRequest } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { openai } from "@/config/OpenAi";
import { Agent, run, tool } from "@openai/agents";
import z from "zod";

export async function POST(req: NextRequest) {
    const { userId, agentId, userInput } = await req.json();

    const agentDetail = await fetchQuery(api.agent.GetAgentById, {
        agentId: agentId
    });

    //check if Conversation Id exists
    let conversationId_ = null;
    const conversationDetail = await fetchQuery(api.conversation.GetConversationById, {
        agentId: agentDetail._id,
        userId: userId
    })

    conversationId_ = conversationDetail?.conversationId;
    if (!conversationDetail.conversationId) {
        const { id: conversationId } = await openai.conversations.create({});
        conversationId_ = conversationId;
    }

    // Map All Tools
    const generatedTools = agentDetail?.agentToolConfig?.tools?.map((t: any) => {
        // Dynamically build zod object for parameters
        const paramSchema = z.object(
            Object.fromEntries(
                Object.entries(t.parameters).map(([key, type]) => {
                    if (type === "string") return [key, z.string()];
                    if (type === "number") return [key, z.number()];
                    return [key, z.any()];
                })
            )
        );

        return tool({
            name: t.name,
            description: t.description,
            parameters: paramSchema,
            async execute(params: Record<string, any>) {
                // Replace placeholders in URL
                let url = t.url;

                for (const key in params) {
                    url = url.replace(
                        `{{${key}}}`,
                        encodeURIComponent(params[key])
                    );
                }

                if (t.includeApiKey && t.apiKey) {
                    url += url.includes("?")
                        ? `&key=${t.apiKey}`
                        : `?key=${t.apiKey}`;
                }

                // Make API request
                const response = await fetch(url);
                const data = await response.json();

                return data;
            }
        });
    });

    const createdAgents = agentDetail?.agentToolConfig?.agents.map((config: any) => {
        return new Agent({
            name: config?.name,
            instructions: config?.instructions,
            tools: generatedTools
        });
    });

    const finalAgent = Agent.create({
        name: agentDetail?.name,
        instructions: 'You determine which agent to use based on the user query.',
        handoffs: createdAgents
    });

    const result = await run(finalAgent, userInput, {
        conversationId: conversationId_,
        stream: true
    });

    const stream = result.toTextStream({
        compatibleWithNodeStreams: true
    });

    // @ts-ignore
    return new Response(stream);
}