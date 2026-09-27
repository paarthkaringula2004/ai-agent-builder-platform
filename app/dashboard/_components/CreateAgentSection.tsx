"use client"
import { Loader2Icon, Plus } from 'lucide-react'
import React, { useContext, useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { v4 as uuidv4 } from 'uuid'
import { useRouter } from 'next/navigation'
import { UserDetailContext } from '@/context/UserDetailContext'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'

function CreateAgentSection() {
  const [openDialog, setOpenDialog] = useState(false)
  const CreateAgentMutation = useMutation(api.agent.CreateAgent)

  const [agentName, setAgentName] = useState<string>()
  const router = useRouter()
  const [loader, setLoader] = useState(false)
  const { userDetail } = useContext(UserDetailContext);
  const { has } = useAuth();
  const isPaidUser = has({ plan: 'unlimited_plan' })
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

  const CreateAgent = async () => {
    if (!userDetail?._id) {
      toast.error("Your account is still loading. Please try again in a moment.")
      return
    }

    if (
      !isPaidUser &&
      (userAgents === undefined || remainingCredits <= 0)
    ) {
      toast.error("You have reached the limit of free agents. Please upgrade your plan to create more agents.")
      return
    }

    if (!agentName?.trim()) {
      toast.error("Enter a name for your agent.")
      return
    }

    setLoader(true)

    try {
      const agentId = uuidv4()

      await CreateAgentMutation({
        agentId,
        name: agentName.trim(),
        userId: userDetail._id
      })

      setOpenDialog(false)
      router.push('./agent-builder/' + agentId)
    } catch (error) {
      console.error("Agent creation failed:", error)
      toast.error("Could not create the agent. Please try again.")
    } finally {
      setLoader(false)
    }
  }

  return (
    <div className='space-y-2 flex flex-col justify-center items-center mt-24'>
      <h2 className='font-bold text-2xl'>Create AI Agent</h2>

      <p className='text-lg'>
        Build a AI Agent Workflow with custum logic and tools
      </p>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>

        <DialogTrigger
          render={
            <Button
              size={'lg'}
              disabled={!canCreateAgent}
              onClick={() => setOpenDialog(true)}
            />
          }
        >
          <Plus /> Create
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Agent Name</DialogTitle>

            <DialogDescription>
              <Input
                placeholder='Agent Name'
                onChange={(event) => setAgentName(event.target.value)}
              />
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>

            <DialogClose render={<Button variant="ghost" />}>
              Cancel
            </DialogClose>

            <Button
              onClick={() => CreateAgent()}
              disabled={loader || !canCreateAgent || !agentName?.trim()}
            >
              {loader && <Loader2Icon className='animate-spin' />}
              Create
            </Button>

          </DialogFooter>
        </DialogContent>

      </Dialog>
    </div>
  )
}

export default CreateAgentSection
