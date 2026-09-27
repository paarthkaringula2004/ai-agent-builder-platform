"use client"

import { Button } from '@/components/ui/button'
import { ChevronLeft, Code2, Play, X } from 'lucide-react'
import React from 'react'
import { Agent } from '@/types/AgentType'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Props = {
    agentDetail: Agent | undefined,
    previewHeader?: boolean,
    onPublish: () => void,
    onCode: () => void,
}

function Header({ agentDetail, previewHeader = false, onPublish, onCode }: Props) {
    const router = useRouter()

    const handleBack = () => {
        if (previewHeader) {
            router.push(`/agent-builder/${agentDetail?.agentId}`)
        } else {
            router.push('/dashboard')
        }
    }

    return (
        <div className='w-full p-3 flex items-center justify-between'>
            <div className='flex gap-2 items-center'>
                <ChevronLeft
                    className='h-8 w-8 cursor-pointer'
                    onClick={handleBack}
                />

                <h2 className='text-xl'>
                    {agentDetail?.name}
                </h2>
            </div>

            <div className='flex items-center gap-3'>
                <Button variant={'ghost'} onClick={onCode}>
                    <Code2 /> Code
                </Button>

                {!previewHeader ? (
                    <Link href={`/agent-builder/${agentDetail?.agentId}/preview`}>
                        <Button>
                            <Play /> Preview
                        </Button>
                    </Link>
                ) : (
                    <Link href={`/agent-builder/${agentDetail?.agentId}`}>
                        <Button variant={'outline'}>
                            <X /> Close Preview
                        </Button>
                    </Link>
                )}

                <Button onClick={onPublish}>
                    Publish
                </Button>
            </div>
        </div>
    )
}

export default Header
