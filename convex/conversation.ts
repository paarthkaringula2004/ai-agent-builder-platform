import { v } from "convex/values";
import { query } from "./_generated/server";

export const GetConversationById = query({
    args: {
        agentId: v.id("AgentTable"),
        userId: v.id("UserTable")
    },
    handler: async (ctx, args) => {
        const result = await ctx.db.query('ConversationTable')
            .filter(q => q.and(q.eq(q.field('agentId'), args.agentId),
                q.eq(q.field('userId'), args.userId)))
            .order('desc')
            .collect();

        return result[0];
    }
})