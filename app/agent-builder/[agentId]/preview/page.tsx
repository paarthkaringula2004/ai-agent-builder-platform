"use client"

import "@xyflow/react/dist/style.css"
import React, { useEffect, useState } from 'react'
import Header from '../../_components/Header'
import { useConvex, useMutation } from 'convex/react'
import { useParams } from 'next/navigation'
import { Agent } from '@/types/AgentType'
import { api } from '@/convex/_generated/api'
import { ReactFlow } from '@xyflow/react'
import { nodeTypes } from '../page'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { RefreshCcwIcon } from 'lucide-react'
import ChatUi from './_components/ChatUi'
import PublishCodeDialog from "./_components/PublishCodeDialog"

function PreviewAgent() {
    const convex = useConvex()
    const params = useParams<{ agentId: string }>()
    const agentId = params?.agentId

    const [agentDetail, setAgentDetail] = useState<Agent>()
    const [loading, setLoading] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [conversationError, setConversationError] = useState<string | null>(null)
    const [setupError, setSetupError] = useState<string | null>(null)
    const [openDialog, setOpenDialog] = useState(false);
    const [publishDialogMode, setPublishDialogMode] = useState<"publish" | "code">("publish")

    const updateAgentToolConfig = useMutation(
        api.agent.UpdateAgentToolConfig
    )

    const GetAgentDetail = async () => {
        if (!agentId) return

        const result = await convex.query(
            api.agent.GetAgentById,
            {
                agentId: agentId
            }
        )

        setAgentDetail(result)
    }

    useEffect(() => {
        GetAgentDetail()
    }, [agentId, convex])

    useEffect(() => {
        let active = true
        const GetConversationId = async () => {
            setConversationId(null)
            setConversationError(null)

            try {
                const conversationIdResult = await axios.get(
                    '/api/agent-chat'
                )

                if (active) {
                    setConversationId(
                        conversationIdResult.data?.conversationId ?? null
                    )
                }
            } catch (error) {
                console.error(
                    'Conversation ID Error:',
                    error
                )
                if (active) {
                    setConversationError(
                        'The chat session could not be started.'
                    )
                }
            }
        }

        GetConversationId()
        return () => {
            active = false
        }
    }, [agentId])

    const GenerateAgentToolConfig = async () => {
        if (!agentDetail?._id) return

        setLoading(true)
        setSetupError(null)

        try {
            const result = await axios.post(
                '/api/generate-agent-tool-config',
                {
                    agentId: agentDetail.agentId,
                    userId: agentDetail.userId
                }
            )

            await updateAgentToolConfig({
                id: agentDetail._id,
                agentToolConfig: result.data
            })

            await GetAgentDetail()
        } catch (error) {
            console.error(
                'Generate Agent Tool Config Error:',
                error
            )
            setSetupError(
                (error as any)?.response?.data?.error ??
                'Could not prepare the saved workflow. Check the API settings and try again.'
            )
        } finally {
            setLoading(false)
        }
    }

    const onPublish = () => {
        setPublishDialogMode("publish")
        setOpenDialog(true)
    }
    const onCode = () => {
        setPublishDialogMode("code")
        setOpenDialog(true)
    }
    const isAgentReady = agentDetail?.agentToolConfig?.runtimeVersion === 2

    return (
        <div className='h-screen w-screen overflow-hidden flex flex-col'>

            {/* Header */}
            <div className='shrink-0'>
                <Header
                    previewHeader={true}
                    agentDetail={agentDetail}
                    onPublish={onPublish}
                    onCode={onCode}
                />
            </div>

            {/* Main Content */}
            <div className='flex-1 min-h-0 grid grid-cols-4 gap-0 overflow-hidden'>

                {/* Preview Section */}
                <div className='col-span-3 min-h-0 p-5 pt-2 overflow-hidden'>

                    <div className='h-full w-full border rounded-2xl bg-white p-4 flex flex-col overflow-hidden'>

                        {/* Preview Title */}
                        <div className='shrink-0 mb-3'>
                            <h2 className='font-semibold text-sm'>
                                Preview
                            </h2>
                        </div>

                        {/* React Flow Preview */}
                        <div className='flex-1 min-h-0 w-full rounded-2xl overflow-hidden bg-[#f7f7f7]'>

                            <ReactFlow
                                nodes={
                                    Array.isArray(
                                        agentDetail?.nodes
                                    )
                                        ? agentDetail.nodes
                                        : []
                                }
                                edges={
                                    Array.isArray(
                                        agentDetail?.edges
                                    )
                                        ? agentDetail.edges
                                        : []
                                }
                                fitView
                                fitViewOptions={{
                                    padding: 0.2
                                }}
                                nodeTypes={nodeTypes}
                                nodesDraggable={false}
                                nodesConnectable={false}
                                elementsSelectable={false}
                                zoomOnDoubleClick={false}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    background:
                                        '#f7f7f7'
                                }}
                            />

                        </div>
                    </div>

                </div>

                {/* Chat Section */}
                <div className='col-span-1 min-h-0 p-5 pt-2 pl-0 overflow-hidden'>

                    <div className='h-full w-full min-h-0 border rounded-2xl overflow-hidden bg-white'>

                        {!isAgentReady ? (

                            <div className='relative h-full flex flex-col items-center justify-center gap-3 px-6'>

                                <Button
                                    onClick={
                                        GenerateAgentToolConfig
                                    }
                                    disabled={loading}
                                >
                                    <RefreshCcwIcon
                                        className={
                                            loading
                                                ? 'animate-spin'
                                                : ''
                                        }
                                    />

                                    Reboot Agent
                                </Button>
                                {agentDetail?.agentToolConfig && (
                                    <p className='max-w-xs text-center text-sm text-gray-500'>
                                        Refresh this agent to connect the latest saved workflow to Preview.
                                    </p>
                                )}
                                {setupError && (
                                    <p className='absolute bottom-5 max-w-sm px-4 text-center text-sm text-red-600'>
                                        {setupError}
                                    </p>
                                )}

                            </div>

                        ) : (

                            <ChatUi
                                GenerateAgentToolConfig={
                                    GenerateAgentToolConfig
                                }
                                loading={loading}
                                agentDetail={
                                    agentDetail
                                }
                                conversationId={
                                    conversationId
                                }
                                conversationError={conversationError}
                            />

                        )}

                    </div>

                </div>

            </div>
            <PublishCodeDialog
                openDialog={openDialog}
                setOpenDialog={setOpenDialog}
                agentId={agentDetail?.agentId}
                mode={publishDialogMode}
                onPublished={GetAgentDetail}
            />
        </div>
    )
}

export default PreviewAgent
