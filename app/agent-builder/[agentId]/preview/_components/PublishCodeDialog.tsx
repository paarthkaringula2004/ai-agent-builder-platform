"use client"

import React, { useEffect, useMemo, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    CodeBlock,
    CodeBlockCopyButton,
} from '@/components/ai/code-block'
import { Button } from '@/components/ui/button'
import { FileCode2, Loader2, Globe, Unplug } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Props = {
    openDialog: boolean
    setOpenDialog: (open: boolean) => void
    agentId?: string
    mode?: "publish" | "code"
    onPublished?: () => Promise<void> | void
}

function getAgentCode(endpoint: string) {
    return `const agentEndpoint = ${JSON.stringify(endpoint)};
let conversationId: string | undefined;

export async function sendMessageToAgent(input: string): Promise<string> {
  const response = await fetch(agentEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, conversationId }),
  });

  conversationId = response.headers.get('X-Agent-Conversation-Id') ?? conversationId;

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'The agent request failed');
  }

  return response.text();
}

// Example:
const reply = await sendMessageToAgent('Hello');
console.log(reply);`
}

function PublishCodeDialog({
    openDialog,
    setOpenDialog,
    agentId,
    mode = "publish",
    onPublished,
}: Props) {
    const router = useRouter()
    const [isPublished, setIsPublished] = useState(false)
    const [activePublicId, setActivePublicId] = useState<string>()
    const [version, setVersion] = useState<number>()
    const [loading, setLoading] = useState(false)
    const [statusLoaded, setStatusLoaded] = useState(false)
    const [error, setError] = useState<string>()
    const [codeView, setCodeView] = useState<'code' | 'import'>('code')
    const [codeToImport, setCodeToImport] = useState('')
    const [isImporting, setIsImporting] = useState(false)
    const [importError, setImportError] = useState<string>()

    useEffect(() => {
        if (!openDialog) return
        setCodeView('code')
        setCodeToImport('')
        setImportError(undefined)
    }, [openDialog, mode])

    useEffect(() => {
        if (!openDialog || !agentId) return
        let active = true
        setLoading(true)
        setStatusLoaded(false)
        setError(undefined)
        setIsPublished(false)
        setActivePublicId(undefined)
        setVersion(undefined)

        void (async () => {
            try {
                const response = await fetch('/api/agents/publish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ agentId, action: 'status' }),
                })
                const result = await response.json().catch(() => ({}))
                if (!response.ok) throw new Error(result.error || 'Could not load publish status.')
                if (!active) return
                setIsPublished(Boolean(result.published))
                setActivePublicId(result.publicAgentId || undefined)
                setVersion(typeof result.version === 'number' ? result.version : undefined)
                setStatusLoaded(true)
            } catch (statusError) {
                if (!active) return
                setError(statusError instanceof Error ? statusError.message : 'Could not load publish status.')
                setStatusLoaded(true)
            } finally {
                if (active) setLoading(false)
            }
        })()

        return () => { active = false }
    }, [openDialog, agentId])

    const endpoint = useMemo(() => {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
            (typeof window !== 'undefined' ? window.location.origin : '')
        const baseUrl = appUrl.replace(/\/$/, '')
        return activePublicId
            ? `${baseUrl}/api/published-agents/${activePublicId}/chat`
            : ''
    }, [activePublicId])

    const publish = async () => {
        if (!agentId) {
            setError("This agent couldn't be loaded. Refresh the page and try again.")
            return
        }

        setLoading(true)
        setError(undefined)
        try {
            const response = await fetch('/api/agents/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId, action: 'publish' }),
            })
            const result = await response.json().catch(() => ({}))
            if (!response.ok) {
                throw new Error(result.error || 'The agent could not be published.')
            }

            setActivePublicId(result.publicAgentId)
            setVersion(result.version)
            setIsPublished(true)
            await onPublished?.()
            toast.success('Agent published successfully.')
        } catch (publishError) {
            const message = publishError instanceof Error
                ? publishError.message
                : 'The agent could not be published.'
            setError(message)
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    const unpublish = async () => {
        if (!agentId || !window.confirm('Unpublish this agent? Its current code and link will stop working.')) return

        setLoading(true)
        setError(undefined)
        try {
            const response = await fetch('/api/agents/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId, action: 'unpublish' }),
            })
            const result = await response.json().catch(() => ({}))
            if (!response.ok) {
                throw new Error(result.error || 'The agent could not be unpublished.')
            }

            setIsPublished(false)
            setActivePublicId(undefined)
            setVersion(undefined)
            await onPublished?.()
            toast.success('Agent unpublished. Its public link has been revoked.')
        } catch (unpublishError) {
            const message = unpublishError instanceof Error
                ? unpublishError.message
                : 'The agent could not be unpublished.'
            setError(message)
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    const importWorkflow = async () => {
        if (!codeToImport.trim()) {
            setImportError('Paste the published agent code first.')
            return
        }

        setIsImporting(true)
        setImportError(undefined)
        try {
            const response = await fetch('/api/agents/import-published', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: codeToImport }),
            })
            const result = await response.json().catch(() => ({}))
            if (!response.ok) {
                throw new Error(result.error || 'The workflow could not be imported.')
            }

            toast.success('Workflow imported. Add your API key, then reboot the agent.')
            setOpenDialog(false)
            router.push(`/agent-builder/${result.agentId}`)
        } catch (importFailure) {
            const message = importFailure instanceof Error
                ? importFailure.message
                : 'The workflow could not be imported.'
            setImportError(message)
            toast.error(message)
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent className='!w-[850px] !max-w-[90vw] !max-h-[85vh] overflow-hidden flex flex-col'>
                <DialogHeader>
                    <DialogTitle>{mode === "code" ? "Agent Integration Code" : "Publish Agent"}</DialogTitle>
                    <DialogDescription>
                        {mode === "code"
                            ? "Copy this code into your application to send messages to the published agent."
                            : "Publishing saves a server-side version of this workflow and creates a real endpoint for it."}
                    </DialogDescription>
                </DialogHeader>

                {mode === 'publish' && (
                    <div className='flex items-center justify-between gap-4 rounded-lg border p-3'>
                        <div className='flex items-start gap-3'>
                            <Globe className='mt-0.5 h-5 w-5 shrink-0 text-muted-foreground' />
                            <p className='text-sm text-muted-foreground'>
                                {isPublished
                                    ? `Published${version ? ` · version ${version}` : ''}. Updating creates a new saved version at the same endpoint.`
                                    : 'The published agent uses the last saved workflow. Save it and Reboot Agent before publishing.'}
                            </p>
                        </div>
                        <div className='flex shrink-0 gap-2'>
                            <Button onClick={publish} disabled={loading || !agentId || !statusLoaded}>
                                {loading && <Loader2 className='animate-spin' />}
                                {isPublished ? 'Update Published Version' : 'Publish Agent'}
                            </Button>
                            {isPublished && (
                                <Button variant='outline' onClick={unpublish} disabled={loading || !statusLoaded}>
                                    <Unplug /> Unpublish
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {error && (
                    <p className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
                        {error}
                    </p>
                )}

                {mode === 'code' && (
                    <div className='flex gap-2 border-b pb-3'>
                        <Button
                            variant={codeView === 'code' ? 'default' : 'outline'}
                            onClick={() => setCodeView('code')}
                        >
                            View Code
                        </Button>
                        <Button
                            variant={codeView === 'import' ? 'default' : 'outline'}
                            onClick={() => setCodeView('import')}
                        >
                            Paste Code to Import Flow
                        </Button>
                    </div>
                )}

                {mode === 'code' && codeView === 'code' && isPublished && endpoint && (
                    <>
                        <div className='min-h-0 w-full'>
                            <CodeBlock
                                code={getAgentCode(endpoint)}
                                language='typescript'
                                showLineNumbers
                                className='w-full'
                            >
                                <div className='flex w-full items-center justify-between'>
                                    <div className='flex items-center gap-2'>
                                        <FileCode2 className='h-4 w-4 text-muted-foreground' />
                                        <span className='text-sm font-medium'>agent.ts</span>
                                    </div>
                                    <div className='flex items-center gap-3'>
                                        <span className='text-xs text-muted-foreground'>ts</span>
                                        <CodeBlockCopyButton
                                            onCopy={() => toast.success('Integration code copied.')}
                                            onError={() => toast.error('Could not copy the code.')}
                                        />
                                    </div>
                                </div>
                            </CodeBlock>
                        </div>
                        <p className='text-xs text-muted-foreground'>
                            Anyone with this endpoint can use the agent. Unpublish it to revoke access. The endpoint allows up to 30 requests per minute.
                        </p>
                    </>
                )}

                {mode === 'code' && codeView === 'code' && !isPublished && !loading && (
                    <p className='rounded-md bg-muted px-3 py-3 text-sm text-muted-foreground'>
                        This agent has not been published yet, so it does not have an integration endpoint. Use the Publish button to create one.
                    </p>
                )}

                {mode === 'code' && codeView === 'code' && loading && (
                    <p className='flex items-center gap-2 py-4 text-sm text-muted-foreground'>
                        <Loader2 className='h-4 w-4 animate-spin' /> Loading agent code…
                    </p>
                )}

                {mode === 'code' && codeView === 'import' && (
                    <div className='flex min-h-0 flex-col gap-3'>
                        <div>
                            <label htmlFor='published-agent-code' className='text-sm font-medium'>
                                Paste the published agent code or endpoint
                            </label>
                            <p className='mt-1 text-sm text-muted-foreground'>
                                The app imports the saved graph into your account. API keys are removed; add your own key and reboot the agent after import.
                            </p>
                        </div>
                        <textarea
                            id='published-agent-code'
                            value={codeToImport}
                            onChange={(event) => setCodeToImport(event.target.value)}
                            placeholder={'Paste the copied agent.ts snippet or /api/published-agents/.../chat URL here'}
                            className='min-h-40 w-full resize-y rounded-md border bg-background px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
                            maxLength={48 * 1024}
                        />
                        {importError && (
                            <p className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
                                {importError}
                            </p>
                        )}
                        <div className='flex justify-end'>
                            <Button onClick={importWorkflow} disabled={isImporting || !codeToImport.trim()}>
                                {isImporting && <Loader2 className='animate-spin' />}
                                Import Workflow
                            </Button>
                        </div>
                    </div>
                )}

                {mode === 'code' && codeView === 'code' && isPublished && process.env.NEXT_PUBLIC_APP_URL === undefined && (
                    <p className='text-xs text-muted-foreground'>
                        For production, set NEXT_PUBLIC_APP_URL to your deployed app URL before copying this code. Otherwise, this code uses the current site address.
                    </p>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default PublishCodeDialog
