"use client"

import React, { useContext, useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { UserDetailContext } from "@/context/UserDetailContext"
import { v4 as uuidv4 } from "uuid"
import { useRouter } from "next/navigation"
import { Loader2, GitBranchPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useAuth } from "@clerk/nextjs"

function Templates() {
  const { userDetail } = useContext(UserDetailContext)
  const templates = useQuery(
    api.agent.GetTemplates,
    userDetail?._id ? { userId: userDetail._id } : "skip"
  )
  const { has } = useAuth()
  const isPaidUser = has({ plan: "unlimited_plan" })
  const userAgents = useQuery(
    api.agent.GetUserAgents,
    !isPaidUser && userDetail?._id
      ? { userId: userDetail._id }
      : "skip"
  )
  const remainingCredits = Math.max(0, 2 - (userAgents?.length ?? 0))
  const canCreateAgent =
    Boolean(userDetail?._id) &&
    (isPaidUser || (userAgents !== undefined && remainingCredits > 0))
  const createAgentFromTemplate = useMutation(api.agent.CreateAgentFromTemplate)
  const updateTemplateDescription = useMutation(api.agent.UpdateTemplateDescription)
  const router = useRouter()
  const [loadingTemplate, setLoadingTemplate] = useState<string>()
  const [analysisFailures, setAnalysisFailures] = useState<Set<string>>(new Set())
  const requestedTemplateIds = useRef(new Set<string>())

  useEffect(() => {
    if (!userDetail?._id || !templates) return

    const missingDescriptions = templates.filter(
      (template) => !template.templateDescription && !requestedTemplateIds.current.has(template._id)
    )
    missingDescriptions.forEach((template) => requestedTemplateIds.current.add(template._id))

    void (async () => {
      for (const template of missingDescriptions) {
        try {
          const response = await fetch("/api/analyze-workflow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: template.name,
              nodes: template.nodes ?? [],
              edges: template.edges ?? [],
            }),
          })
          if (!response.ok) throw new Error("Workflow analysis request failed")

          const result = await response.json()
          if (typeof result.description !== "string" || !result.description.trim()) {
            throw new Error("Workflow analysis returned no description")
          }

          await updateTemplateDescription({
            id: template._id,
            userId: userDetail._id,
            description: result.description,
          })
          setAnalysisFailures((current) => {
            const next = new Set(current)
            next.delete(template._id)
            return next
          })
        } catch (error) {
          console.error("Template description generation failed:", error)
          setAnalysisFailures((current) => new Set(current).add(template._id))
        }
      }
    })()
  }, [templates, userDetail?._id, updateTemplateDescription])

  const useTemplate = async (sourceAgentId: Id<"AgentTable">) => {
    if (!userDetail?._id) {
      toast.error("Please wait for your account to load, then try again.")
      return
    }

    if (!isPaidUser && (userAgents === undefined || remainingCredits <= 0)) {
      toast.error("You have reached the limit of free agents. Please upgrade your plan to create more agents.")
      return
    }

    setLoadingTemplate(sourceAgentId)
    try {
      const agentId = uuidv4()
      await createAgentFromTemplate({
        sourceAgentId,
        agentId,
        userId: userDetail._id,
      })
      router.push(`/agent-builder/${agentId}`)
    } catch (error) {
      console.error(error)
      toast.error("Could not create an agent from this template.")
    } finally {
      setLoadingTemplate(undefined)
    }
  }

  if (!userDetail?._id || templates === undefined) {
    return <div className="py-10 text-sm text-gray-500">Loading templates...</div>
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {templates.map((template) => (
          <div key={template._id} className="p-4 border rounded-2xl shadow mt-5 flex flex-col">
            <div className="flex items-center gap-3">
              <GitBranchPlus className="bg-yellow-100 p-2 h-8 w-8 rounded-sm" />
            </div>
            <h2 className="mt-3 font-medium">{template.name}</h2>
            <p className="text-sm text-gray-500 mt-2 flex-1">
              {template.templateDescription || (
                analysisFailures.has(template._id)
                  ? "Could not analyze this workflow. Check your OpenAI API configuration."
                  : "Analyzing what this workflow does..."
              )}
            </p>
            <Button
              className="mt-4"
              onClick={() => useTemplate(template._id)}
              disabled={loadingTemplate !== undefined || !canCreateAgent}
            >
              {loadingTemplate === template._id && <Loader2 className="animate-spin" />}
              Use Template
            </Button>
          </div>
        ))}
      </div>
      {templates.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">
          Save an agent workflow to make it available here as a template.
        </p>
      )}
    </div>
  )
}

export default Templates
