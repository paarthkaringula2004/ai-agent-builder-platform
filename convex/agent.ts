import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

export const GetTemplates = query({
    args: {
        userId: v.id("UserTable"),
    },
    handler: async (ctx, args) => {
        const agents = await ctx.db
            .query("AgentTable")
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .order("desc")
            .collect();

        // Only agents with a saved workflow can be used as templates.
        return agents.filter(
            (agent) => {
                const isPreviouslyCopiedTemplate =
                    Array.isArray(agent.nodes) &&
                    agent.nodes.length > 0 &&
                    agent.nodes.every(
                        (node: any) =>
                            typeof node.id === "string" &&
                            node.id.endsWith(`-${agent.agentId}`)
                    );

                return (
                Array.isArray(agent.nodes) &&
                agent.nodes.length > 0 &&
                agent.templateSourceId === undefined &&
                !isPreviouslyCopiedTemplate
                );
            }
        );
    },
});

export const CreateAgentFromTemplate = mutation({
    args: {
        sourceAgentId: v.id("AgentTable"),
        agentId: v.string(),
        userId: v.id("UserTable"),
    },
    handler: async (ctx, args) => {
        const sourceAgent = await ctx.db.get(args.sourceAgentId);
        if (!sourceAgent || sourceAgent.userId !== args.userId) {
            throw new ConvexError("Agent not found");
        }
        if (!Array.isArray(sourceAgent.nodes) || sourceAgent.nodes.length === 0) {
            throw new ConvexError("Save this agent's workflow before using it as a template");
        }

        // Give every copied node a fresh ID and update edge references too.
        const templateNodes = sourceAgent.nodes as any[];
        const templateEdges = (sourceAgent.edges ?? []) as any[];
        const nodeIds = new Map(templateNodes.map((node: any) => [node.id, `${node.id}-${args.agentId}`]));
        const nodes = templateNodes.map((node: any) => ({
            ...node,
            id: nodeIds.get(node.id)!,
            position: { ...node.position },
            data: {
                ...node.data,
                ...(node.data.settings ? { settings: { ...node.data.settings } } : {}),
            },
        }));
        const edges = templateEdges.map((edge: any) => ({
            ...edge,
            id: `${edge.id}-${args.agentId}`,
            source: nodeIds.get(edge.source) ?? edge.source,
            target: nodeIds.get(edge.target) ?? edge.target,
        }));

        return await ctx.db.insert("AgentTable", {
            agentId: args.agentId,
            name: sourceAgent.name,
            ...(sourceAgent.config !== undefined ? { config: sourceAgent.config } : {}),
            nodes,
            edges,
            published: false,
            userId: args.userId,
            templateSourceId: args.sourceAgentId,
            ...(sourceAgent.agentToolConfig !== undefined
                ? { agentToolConfig: sourceAgent.agentToolConfig }
                : {}),
            ...(sourceAgent.templateDescription !== undefined
                ? { templateDescription: sourceAgent.templateDescription }
                : {}),
        });
    },
});

export const UpdateTemplateDescription = mutation({
    args: {
        id: v.id("AgentTable"),
        userId: v.id("UserTable"),
        description: v.string(),
    },
    handler: async (ctx, args) => {
        const agent = await ctx.db.get(args.id);
        if (!agent || agent.userId !== args.userId) {
            throw new ConvexError("Agent not found");
        }

        await ctx.db.patch(args.id, {
            templateDescription: args.description,
        });
    },
});

export const CreateAgent = mutation({
    args: {
        name: v.string(),
        agentId: v.string(),
        userId: v.id("UserTable"),
    },

    handler: async (ctx, args) => {
        const result = await ctx.db.insert("AgentTable", {
            name: args.name,
            agentId: args.agentId,
            published: false,
            userId: args.userId,
        });

        return result;
    },
});

export const GetUserAgents = query({
    args: {
        userId: v.id("UserTable"),
    },

    handler: async (ctx, args) => {
        const result = await ctx.db
            .query("AgentTable")
            .filter((q) =>
                q.eq(q.field("userId"), args.userId)
            )
            .order("desc")
            .collect();

        return result;
    },
});

export const GetAgentById = query({
    args: {
        agentId: v.string(),
    },

    handler: async (ctx, args) => {
        const result = await ctx.db
            .query("AgentTable")
            .filter((q) =>
                q.eq(q.field("agentId"), args.agentId)
            )
            .order("desc")
            .collect();

        return result[0];
    },
});

export const getAgentForPublishing = internalQuery({
    args: { agentId: v.string() },
    handler: async (ctx, args) => {
        const agent = await ctx.db
            .query("AgentTable")
            .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
            .first();
        if (!agent) return null;

        const owner = await ctx.db.get(agent.userId);
        const snapshot = await ctx.db
            .query("PublishedAgentTable")
            .withIndex("by_sourceAgentId", (q) => q.eq("sourceAgentId", agent._id))
            .first();
        return {
            agentId: agent.agentId,
            ownerEmail: owner?.email ?? "",
            publicAgentId: agent.publicAgentId,
            publishedVersion: snapshot?.version,
        };
    },
});

export const publishAgentSnapshot = internalMutation({
    args: {
        agentId: v.string(),
        publicAgentId: v.string(),
        publishedAt: v.number(),
    },
    handler: async (ctx, args) => {
        const agent = await ctx.db
            .query("AgentTable")
            .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
            .first();
        if (!agent) throw new ConvexError("Agent not found");
        if (!Array.isArray(agent.nodes) || agent.nodes.length === 0) {
            throw new ConvexError("Save the workflow before publishing it");
        }

        const toolConfig = agent.agentToolConfig as any;
        if (toolConfig?.runtimeVersion !== 2 || typeof toolConfig?.systemPrompt !== "string") {
            throw new ConvexError("Reboot the agent after saving the workflow, then publish it");
        }

        const previous = await ctx.db
            .query("PublishedAgentTable")
            .withIndex("by_sourceAgentId", (q) => q.eq("sourceAgentId", agent._id))
            .first();
        const version = (previous?.version ?? 0) + 1;
        if (previous) await ctx.db.delete(previous._id);

        await ctx.db.insert("PublishedAgentTable", {
            publicAgentId: args.publicAgentId,
            sourceAgentId: agent._id,
            userId: agent.userId,
            name: agent.name,
            nodes: agent.nodes,
            edges: agent.edges ?? [],
            ...(agent.config !== undefined ? { config: agent.config } : {}),
            agentToolConfig: toolConfig,
            version,
            publishedAt: args.publishedAt,
        });

        await ctx.db.patch(agent._id, {
            published: true,
            publicAgentId: args.publicAgentId,
        });

        return { publicAgentId: args.publicAgentId, version, publishedAt: args.publishedAt };
    },
});

export const unpublishAgentSnapshot = internalMutation({
    args: { agentId: v.string() },
    handler: async (ctx, args) => {
        const agent = await ctx.db
            .query("AgentTable")
            .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
            .first();
        if (!agent) throw new ConvexError("Agent not found");

        const published = await ctx.db
            .query("PublishedAgentTable")
            .withIndex("by_sourceAgentId", (q) => q.eq("sourceAgentId", agent._id))
            .first();
        if (published) await ctx.db.delete(published._id);

        await ctx.db.patch(agent._id, {
            published: false,
            publicAgentId: undefined,
        });
    },
});

export const getPublishedAgentByPublicId = internalQuery({
    args: { publicAgentId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("PublishedAgentTable")
            .withIndex("by_publicAgentId", (q) => q.eq("publicAgentId", args.publicAgentId))
            .first();
    },
});

export const importPublishedAgent = internalMutation({
    args: {
        publicAgentId: v.string(),
        ownerEmail: v.string(),
        agentId: v.string(),
    },
    handler: async (ctx, args) => {
        const normalizedEmail = args.ownerEmail.trim().toLowerCase();
        const users = await ctx.db.query("UserTable").collect();
        const user = users.find(
            (candidate) => candidate.email.trim().toLowerCase() === normalizedEmail
        );
        if (!user) {
            throw new ConvexError("Your app account could not be matched. Sign in again and retry.");
        }

        const source = await ctx.db
            .query("PublishedAgentTable")
            .withIndex("by_publicAgentId", (q) => q.eq("publicAgentId", args.publicAgentId))
            .first();
        if (!source) {
            throw new ConvexError("That published agent was not found. Check the pasted code and try again.");
        }

        const sourceNodes = Array.isArray(source.nodes) ? source.nodes as any[] : [];
        if (sourceNodes.length === 0) {
            throw new ConvexError("The published agent does not contain a saved workflow.");
        }

        const nodeIds = new Map(
            sourceNodes.map((node: any) => [node.id, `${node.id}-${args.agentId}`])
        );
        const nodes = sourceNodes.map((node: any) => {
            const data = node.data && typeof node.data === "object" ? node.data : {};
            const settings = data.settings && typeof data.settings === "object"
                ? { ...data.settings }
                : undefined;

            // Never copy a published owner's API credential into another user's agent.
            if (settings && /api/i.test(String(node.type ?? ""))) {
                settings.apiKey = "";
                if (typeof settings.url === "string") {
                    try {
                        const url = new URL(settings.url);
                        for (const key of [...url.searchParams.keys()]) {
                            if (/key|token|secret|auth|password/i.test(key)) {
                                url.searchParams.delete(key);
                            }
                        }
                        settings.url = url.toString();
                    } catch {
                        // Keep malformed URLs visible so the new owner can correct them.
                    }
                }
            }

            return {
                ...node,
                id: nodeIds.get(node.id) ?? `${String(node.id)}-${args.agentId}`,
                position: node.position ? { ...node.position } : node.position,
                data: {
                    ...data,
                    ...(settings ? { settings } : {}),
                },
            };
        });
        const sourceEdges = Array.isArray(source.edges) ? source.edges as any[] : [];
        const edges = sourceEdges.map((edge: any) => ({
            ...edge,
            id: `${edge.id}-${args.agentId}`,
            source: nodeIds.get(edge.source) ?? edge.source,
            target: nodeIds.get(edge.target) ?? edge.target,
        }));

        const importedAgentId = await ctx.db.insert("AgentTable", {
            agentId: args.agentId,
            name: source.name,
            nodes,
            edges,
            published: false,
            userId: user._id,
            templateSourceId: source.sourceAgentId,
            agentToolConfig: null,
        });

        return { agentId: args.agentId, name: source.name, id: importedAgentId };
    },
});

export const createPublishedConversation = internalMutation({
    args: {
        sessionId: v.string(),
        publicAgentId: v.string(),
        publishedVersion: v.number(),
        openaiConversationId: v.string(),
        createdAt: v.number(),
    },
    handler: async (ctx, args) => {
        const publishedAgent = await ctx.db
            .query("PublishedAgentTable")
            .withIndex("by_publicAgentId", (q) => q.eq("publicAgentId", args.publicAgentId))
            .first();
        if (!publishedAgent || publishedAgent.version !== args.publishedVersion) {
            throw new ConvexError("This published agent has changed. Start a new conversation.");
        }
        await ctx.db.insert("PublishedConversationTable", args);
    },
});

export const getPublishedConversation = internalQuery({
    args: { sessionId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("PublishedConversationTable")
            .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
            .first();
    },
});

export const deleteExpiredPublishedConversations = internalMutation({
    args: {},
    handler: async (ctx) => {
        const expired = await ctx.db
            .query("PublishedConversationTable")
            .withIndex("by_createdAt", (q) => q.lt("createdAt", Date.now() - 24 * 60 * 60 * 1000))
            .take(500);

        await Promise.all(expired.map((conversation) => ctx.db.delete(conversation._id)));
        return expired.length;
    },
});

export const consumePublishedRequest = internalMutation({
    args: {
        publicAgentId: v.string(),
        now: v.number(),
    },
    handler: async (ctx, args) => {
        const windowStart = Math.floor(args.now / 60_000) * 60_000;
        const usage = await ctx.db
            .query("PublishedUsageTable")
            .withIndex("by_publicAgentId", (q) => q.eq("publicAgentId", args.publicAgentId))
            .first();

        if (usage?.windowStart === windowStart) {
            if (usage.requestCount >= 30) return false;
            await ctx.db.patch(usage._id, { requestCount: usage.requestCount + 1 });
            return true;
        }

        if (usage) {
            await ctx.db.patch(usage._id, { windowStart, requestCount: 1 });
        } else {
            await ctx.db.insert("PublishedUsageTable", {
                publicAgentId: args.publicAgentId,
                windowStart,
                requestCount: 1,
            });
        }
        return true;
    },
});

export const UpdateAgentDetail = mutation({
    args: {
        id: v.id('AgentTable'),
        nodes: v.any(),
        edges: v.any(),
        templateDescription: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            edges: args.edges,
            nodes: args.nodes,
            agentToolConfig: null,
            ...(args.templateDescription !== undefined
                ? { templateDescription: args.templateDescription }
                : {}),
        })
    }
})

export const UpdateAgentToolConfig = mutation({
    args: {
        id: v.id('AgentTable'),
        agentToolConfig: v.any()
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            agentToolConfig: args.agentToolConfig
        })
    }
})
