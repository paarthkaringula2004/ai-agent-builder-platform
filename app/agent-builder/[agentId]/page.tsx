"use client"

import React, { useCallback, useContext, useEffect, useState } from "react"
import Header from "../_components/Header"
import {
    ReactFlow,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    Background,
    MiniMap,
    Controls,
    Panel,
    useOnSelectionChange,
    OnSelectionChangeParams,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import StartNode from "../_costumNodes/StartNode"
import AgentNode from "../_costumNodes/AgentNode"
import EndNode from "../_costumNodes/EndNode"
import IfElseNode from "../_costumNodes/IfElseNode"
import AgentToolsPanel from "@/app/agent-builder/_components/AgentToolsPanel"
import { WorkflowContext } from "@/context/WorkflowContext"
import { Agent } from "@/types/AgentType"
import { useConvex, useMutation } from "convex/react"
import { useParams } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import { toast } from "sonner"
import WhileNode from "../_costumNodes/WhileNode"
import UserApprovalNode from "../_costumNodes/UserApprovalNode"
import ApiNode from "../_costumNodes/ApiNode"
import SettingPanel from "../_components/SettingPanel"
import PublishCodeDialog from "./preview/_components/PublishCodeDialog"

export const nodeTypes = {
    StartNode,
    AgentNode,
    EndNode,
    IfElseNode,
    WhileNode,
    UserApprovalNode,
    ApiNode,
}

function AgentBuilder() {
    const params = useParams<{ agentId: string }>()
    const agentId = params?.agentId

    const {
        addedNodes,
        setAddedNodes,
        nodeEdges,
        setNodeEdges,
        setSelectedNode,
    } = useContext(WorkflowContext)

    const convex = useConvex()
    const UpdateAgentDetail = useMutation(api.agent.UpdateAgentDetail)
    const [agentDetail, setAgentDetail] = useState<Agent>()
    const [openPublishDialog, setOpenPublishDialog] = useState(false)
    const [publishDialogMode, setPublishDialogMode] = useState<"publish" | "code">("publish")

    const onPublish = () => {
        setPublishDialogMode("publish")
        setOpenPublishDialog(true)
    }
    const onCode = () => {
        setPublishDialogMode("code")
        setOpenPublishDialog(true)
    }

    // Get current Agent
    useEffect(() => {
        if (!agentId) return
        const GetAgentDetail = async () => {
            const result = await convex.query(
                api.agent.GetAgentById,
                {
                    agentId: agentId,
                }
            )
            setAgentDetail(result)
        }
        GetAgentDetail()
    }, [agentId, convex])

    // Load saved workflow into Context
    useEffect(() => {
        if (!agentDetail) return
        const loadedNodes = Array.isArray(agentDetail.nodes)
            ? agentDetail.nodes
            : [
                {
                    id: "start",
                    position: { x: 0, y: 0 },
                    data: { label: "Start" },
                    type: "StartNode",
                },
            ]
        const loadedEdges = Array.isArray(agentDetail.edges)
            ? agentDetail.edges.map((edge: any) =>
                edge.type === "smoothstep"
                    ? { ...edge, type: "default" }
                    : edge
            )
            : []
        setAddedNodes(loadedNodes)
        setNodeEdges(loadedEdges)
    }, [agentDetail, setAddedNodes, setNodeEdges])

    // Node changes
    const onNodesChange = useCallback(
        (changes: any) => {
            setAddedNodes((currentNodes: any[]) =>
                applyNodeChanges(
                    changes,
                    Array.isArray(currentNodes)
                        ? currentNodes
                        : []
                )
            )
        },
        [setAddedNodes]
    )

    // Edge changes
    const onEdgesChange = useCallback(
        (changes: any) => {
            setNodeEdges((currentEdges: any[]) =>
                applyEdgeChanges(
                    changes,
                    Array.isArray(currentEdges)
                        ? currentEdges
                        : []
                )
            )
        },
        [setNodeEdges]
    )

    // Connect nodes
    const onConnect = useCallback(
        (params: any) => {
            setNodeEdges((currentEdges: any[]) =>
                addEdge(
                    params,
                    Array.isArray(currentEdges)
                        ? currentEdges
                        : []
                )
            )
        },
        [setNodeEdges]
    )

    // Save workflow
    const SaveNodeAndEdges = async () => {
        if (!agentDetail?._id) {
            toast.error("Agent not found")
            return
        }

        const nodesToSave = Array.isArray(addedNodes) ? addedNodes : []
        const edgesToSave = Array.isArray(nodeEdges) ? nodeEdges : []

        try {
            let templateDescription: string | undefined

            try {
                const analysisResponse = await fetch("/api/analyze-workflow", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: agentDetail.name,
                        nodes: nodesToSave,
                        edges: edgesToSave,
                    }),
                })

                if (!analysisResponse.ok) {
                    throw new Error("Workflow analysis request failed")
                }

                const analysis = await analysisResponse.json()
                templateDescription = analysis.description
            } catch (analysisError) {
                // Keep saving the workflow even if the AI description service is unavailable.
                console.error("Workflow description generation failed:", analysisError)
            }

            await UpdateAgentDetail({
                id: agentDetail._id,
                nodes: nodesToSave,
                edges: edgesToSave,
                templateDescription: templateDescription ?? "",
            })
            toast.success(
                templateDescription
                    ? "Workflow saved and its purpose was analyzed."
                    : "Workflow saved. Description analysis failed; check your OpenAI API configuration and save again."
            )
        } catch (error) {
            console.error(error)
            toast.error("Failed to save")
        }
    }

    const onNodeSelect = useCallback(({ nodes, edges }: OnSelectionChangeParams) => {
        setSelectedNode(nodes[0])
        console.log(nodes[0])
    }, [])

    useOnSelectionChange({
        onChange: onNodeSelect
    })

    return (
        <div>
            <Header agentDetail={agentDetail} onPublish={onPublish} onCode={onCode} />
            <div
                style={{
                    width: "100vw",
                    height: "90vh",
                }}
            >
                <ReactFlow
                    nodes={Array.isArray(addedNodes) ? addedNodes : []}
                    edges={Array.isArray(nodeEdges) ? nodeEdges : []}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                    nodeTypes={nodeTypes}
                >
                    <MiniMap />
                    <Controls />
                    <Background gap={12} size={1} />
                    <Panel position="top-left">
                        <AgentToolsPanel />
                    </Panel>
                    <Panel position="top-right">
                        <SettingPanel />
                    </Panel>
                    <Panel position="bottom-center">
                        <Button onClick={SaveNodeAndEdges}>
                            <Save />
                            Save
                        </Button>
                    </Panel>
                </ReactFlow>
            </div>
            <PublishCodeDialog
                openDialog={openPublishDialog}
                setOpenDialog={setOpenPublishDialog}
                agentId={agentDetail?.agentId}
                mode={publishDialogMode}
                onPublished={async () => {
                    if (!agentId) return
                    const updatedAgent = await convex.query(api.agent.GetAgentById, { agentId })
                    setAgentDetail(updatedAgent)
                }}
            />
        </div>
    )
}

export default AgentBuilder
