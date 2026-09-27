import { Id } from "@/convex/_generated/dataModel"

export type Agent = {
    _id: Id<"AgentTable">,
    agentId: string,
    config?: any,
    published: boolean,
    publicAgentId?: string,
    name: string,
    userId: Id<"UserTable">,
    nodes?:any,
    edges?:any,
    _creationTime: number,
    agentToolConfig?: any
    templateDescription?: string
}
