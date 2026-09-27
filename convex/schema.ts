import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    UserTable: defineTable({
        name: v.string(),
        email: v.string(),
        subscribtion: v.optional(v.string()),
        token: v.number(),
    }),

    AgentTable: defineTable({
        agentId: v.string(),
        name: v.string(),
        config: v.optional(v.any()),
        nodes: v.optional(v.any()),
        edges: v.optional(v.any()),
        published: v.boolean(),
        publicAgentId: v.optional(v.string()),
        userId: v.id('UserTable'),
        agentToolConfig: v.optional(v.any()),
        templateSourceId: v.optional(v.id("AgentTable")),
        templateDescription: v.optional(v.string()),
    }).index("by_agentId", ["agentId"]),

    TemplateTable: defineTable({
        templateId: v.string(),
        name: v.string(),
        description: v.string(),
        icon: v.string(),
        nodes: v.any(),
        edges: v.any(),
        config: v.optional(v.any()),
        agentToolConfig: v.optional(v.any()),
    }).index("by_templateId", ["templateId"]),
    
    PublishedAgentTable: defineTable({
        publicAgentId: v.string(),
        sourceAgentId: v.id("AgentTable"),
        userId: v.id("UserTable"),
        name: v.string(),
        nodes: v.any(),
        edges: v.any(),
        config: v.optional(v.any()),
        agentToolConfig: v.any(),
        version: v.number(),
        publishedAt: v.number(),
    })
        .index("by_publicAgentId", ["publicAgentId"])
        .index("by_sourceAgentId", ["sourceAgentId"]),

    PublishedConversationTable: defineTable({
        sessionId: v.string(),
        publicAgentId: v.string(),
        publishedVersion: v.number(),
        openaiConversationId: v.string(),
        createdAt: v.number(),
    })
        .index("by_sessionId", ["sessionId"])
        .index("by_publicAgentId", ["publicAgentId"])
        .index("by_createdAt", ["createdAt"]),

    PublishedUsageTable: defineTable({
        publicAgentId: v.string(),
        windowStart: v.number(),
        requestCount: v.number(),
    }).index("by_publicAgentId", ["publicAgentId"]),

    ConversationTable: defineTable({
        conversationId: v.string(),
        agentId: v.id('AgentTable'),
        userId: v.id('UserTable'),
    })
});
