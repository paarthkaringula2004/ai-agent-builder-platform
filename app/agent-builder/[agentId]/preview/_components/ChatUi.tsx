"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2Icon, RefreshCcwIcon, Send } from 'lucide-react'
import { Agent } from '@/types/AgentType'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Message = {
    role: 'user' | 'assistant'
    content: string
}

type Props = {
    GenerateAgentToolConfig: () => void
    loading: boolean
    agentDetail: Agent
    conversationId: string | null
    conversationError?: string | null
}

function ChatUi({
    GenerateAgentToolConfig,
    loading,
    agentDetail,
    conversationId,
    conversationError
}: Props) {
    const [loadingMsg, setLoadingMsg] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [userInput, setUserInput] = useState('')

    const messagesContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = messagesContainerRef.current

        if (container) {
            container.scrollTop = container.scrollHeight
        }
    }, [messages])

    const OnSendMsg = async () => {
        if (!userInput.trim() || loadingMsg || loading || !conversationId) return

        const input = userInput.trim()

        setLoadingMsg(true)
        setUserInput('')

        setMessages((prev) => [
            ...prev,
            {
                role: 'user',
                content: input
            },
            {
                role: 'assistant',
                content: ''
            }
        ])

        try {
            const res = await fetch('/api/agent-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    agentId: agentDetail.agentId,
                    userId: agentDetail.userId,
                    input,
                    conversationId
                })
            })

            if (!res.ok) {
                const errorBody = await res.json().catch(() => null)
                throw new Error(
                    errorBody?.error || "Request failed with status " + res.status
                )
            }

            if (!res.body) {
                throw new Error('No response body received')
            }

            const reader = res.body.getReader()
            const decoder = new TextDecoder()

            let done = false

            while (!done) {
                const { value, done: doneReading } = await reader.read()

                done = doneReading

                if (value) {
                    const chunk = decoder.decode(value, {
                        stream: !done
                    })

                    setMessages((prev) => {
                        const updated = [...prev]
                        const lastMessage = updated[updated.length - 1]

                        if (lastMessage?.role === 'assistant') {
                            updated[updated.length - 1] = {
                                ...lastMessage,
                                content: lastMessage.content + chunk
                            }
                        }

                        return updated
                    })
                }
            }

            const remainingText = decoder.decode()

            if (remainingText) {
                setMessages((prev) => {
                    const updated = [...prev]
                    const lastMessage = updated[updated.length - 1]

                    if (lastMessage?.role === 'assistant') {
                        updated[updated.length - 1] = {
                            ...lastMessage,
                            content: lastMessage.content + remainingText
                        }
                    }

                    return updated
                })
            }
        } catch (error) {
            console.error('Agent Chat Error:', error)

            setMessages((prev) => {
                const updated = [...prev]
                const lastMessage = updated[updated.length - 1]

                if (lastMessage?.role === 'assistant') {
                    updated[updated.length - 1] = {
                        ...lastMessage,
                        content: error instanceof Error
                            ? error.message
                            : 'Sorry, something went wrong while processing your request.'
                    }
                }

                return updated
            })
        } finally {
            setLoadingMsg(false)
        }
    }

    return (
        <div className='w-full h-full min-h-0 flex flex-col overflow-hidden'>

            {/* Header */}
            <div className='flex justify-between items-center border-b p-4 shrink-0'>
                <h2 className='font-semibold truncate'>
                    {agentDetail?.name}
                </h2>

                <Button
                    onClick={GenerateAgentToolConfig}
                    disabled={loading || loadingMsg}
                >
                    <RefreshCcwIcon
                        className={loading ? 'animate-spin' : ''}
                    />
                    Reboot Agent
                </Button>
            </div>

            {/* Chat Area */}
            <div className='flex-1 min-h-0 flex flex-col p-4 overflow-hidden'>

                {/* Messages */}
                <div
                    ref={messagesContainerRef}
                    className='flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-4 px-2'
                >
                    {messages.length === 0 && (
                        <div className='h-full flex items-center justify-center text-sm text-gray-500'>
                            {conversationError
                                ? conversationError + ' Refresh Preview to reconnect.'
                                : conversationId
                                    ? 'Start a conversation with your agent'
                                    : 'Connecting to your agent...'}
                        </div>
                    )}

                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.role === 'user'
                                    ? 'justify-end'
                                    : 'justify-start'
                                }`}
                        >
                            <div
                                className={`rounded-xl max-w-[85%] break-words ${msg.role === 'user'
                                        ? 'bg-blue-500 text-white px-4 py-2.5'
                                        : 'bg-gray-300 text-black px-4 py-3'
                                    }`}
                            >
                                {msg.role === 'assistant' ? (
                                    <div className='text-sm leading-6'>
                                        <Markdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h1: ({ children }) => (
                                                    <h1 className='text-lg font-bold mb-3'>
                                                        {children}
                                                    </h1>
                                                ),

                                                h2: ({ children }) => (
                                                    <h2 className='text-base font-bold mb-2 mt-3'>
                                                        {children}
                                                    </h2>
                                                ),

                                                h3: ({ children }) => (
                                                    <h3 className='text-sm font-bold mb-2 mt-3'>
                                                        {children}
                                                    </h3>
                                                ),

                                                p: ({ children }) => (
                                                    <p className='mb-3 last:mb-0'>
                                                        {children}
                                                    </p>
                                                ),

                                                ul: ({ children }) => (
                                                    <ul className='list-disc pl-5 mb-3 space-y-1'>
                                                        {children}
                                                    </ul>
                                                ),

                                                ol: ({ children }) => (
                                                    <ol className='list-decimal pl-5 mb-3 space-y-1'>
                                                        {children}
                                                    </ol>
                                                ),

                                                li: ({ children }) => (
                                                    <li className='pl-1'>
                                                        {children}
                                                    </li>
                                                ),

                                                strong: ({ children }) => (
                                                    <strong className='font-bold'>
                                                        {children}
                                                    </strong>
                                                ),

                                                em: ({ children }) => (
                                                    <em className='italic'>
                                                        {children}
                                                    </em>
                                                ),

                                                a: ({ children, href }) => (
                                                    <a
                                                        href={href}
                                                        target='_blank'
                                                        rel='noopener noreferrer'
                                                        className='text-blue-600 underline hover:text-blue-800'
                                                    >
                                                        {children}
                                                    </a>
                                                ),

                                                blockquote: ({ children }) => (
                                                    <blockquote className='border-l-4 border-gray-400 pl-3 my-3 italic text-gray-700'>
                                                        {children}
                                                    </blockquote>
                                                ),

                                                hr: () => (
                                                    <hr className='my-4 border-gray-400' />
                                                ),

                                                code: ({ children }) => (
                                                    <code className='bg-gray-200 rounded px-1.5 py-0.5 text-xs font-mono'>
                                                        {children}
                                                    </code>
                                                ),

                                                pre: ({ children }) => (
                                                    <pre className='bg-gray-900 text-gray-100 rounded-lg p-3 my-3 overflow-x-auto text-xs'>
                                                        {children}
                                                    </pre>
                                                ),

                                                table: ({ children }) => (
                                                    <div className='overflow-x-auto my-3'>
                                                        <table className='w-full border-collapse text-xs'>
                                                            {children}
                                                        </table>
                                                    </div>
                                                ),

                                                th: ({ children }) => (
                                                    <th className='border border-gray-400 px-2 py-1 text-left font-bold bg-gray-200'>
                                                        {children}
                                                    </th>
                                                ),

                                                td: ({ children }) => (
                                                    <td className='border border-gray-400 px-2 py-1'>
                                                        {children}
                                                    </td>
                                                )
                                            }}
                                        >
                                            {msg.content}
                                        </Markdown>
                                    </div>
                                ) : (
                                    <div className='text-sm whitespace-pre-wrap'>
                                        {msg.content}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Thinking */}
                    {loadingMsg &&
                        messages[messages.length - 1]?.content === '' && (
                            <div className='flex justify-center items-center gap-2 p-4'>
                                <Loader2Icon className='h-5 w-5 animate-spin' />
                                <span className='text-sm text-gray-600'>
                                    Thinking... Working on your request
                                </span>
                            </div>
                        )}
                </div>

                {/* Input */}
                <div className='border-t pt-3 mt-3 shrink-0'>
                    <div className='flex items-end gap-2'>
                        <Textarea
                            value={userInput}
                            onChange={(e) =>
                                setUserInput(e.target.value)
                            }
                            placeholder={
                                conversationId
                                    ? 'Type your message here...'
                                    : 'Connecting to your agent...'
                            }
                            disabled={loading || loadingMsg || !conversationId}
                            className='flex-1 min-h-[50px] max-h-[150px] resize-none border rounded-lg px-3 py-2'
                            onKeyDown={(e) => {
                                if (
                                    e.key === 'Enter' &&
                                    !e.shiftKey
                                ) {
                                    e.preventDefault()
                                    OnSendMsg()
                                }
                            }}
                        />

                        <Button
                            size='icon'
                            onClick={OnSendMsg}
                            disabled={
                                loadingMsg ||
                                loading ||
                                !conversationId ||
                                !userInput.trim()
                            }
                            className='h-[50px] w-[50px] shrink-0'
                        >
                            {loadingMsg ? (
                                <Loader2Icon className='animate-spin' />
                            ) : (
                                <Send />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChatUi
