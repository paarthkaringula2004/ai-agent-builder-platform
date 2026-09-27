"use client"
import React, { useContext, useEffect, useState } from 'react'
import { UserDetailContext } from '@/context/UserDetailContext'
import { useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Agent } from 'http';
import { GitBranchPlus } from 'lucide-react';
import moment from 'moment'
import Link from 'next/link';

function MyAgents() {
  const { userDetail } = useContext(UserDetailContext);
  const [agentList, setAgentList] = useState<any[]>([])
  const convex = useConvex();

  useEffect(() => {
    userDetail?._id && GetUserAgents();
  }, [userDetail?._id])
  const GetUserAgents = async () => {
    if (!userDetail?._id) return
    const result = await convex.query(api.agent.GetUserAgents, {
      userId: userDetail._id
    });
    console.log(result);
    setAgentList(result)
  }

  return (

    <div className='w-full'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'>
        {agentList.map((agent, index) => (
          <Link href={'/agent-builder/' + agent.agentId} key={index} className='p-3 border rounded-2xl shadow mt-5'>
            <GitBranchPlus className='bg-yellow-100 p-2 h-8 w-8 rounded-sm' />
            <h2 className='mt-3'>{agent.name}</h2>
            <h2 className='text-sm text-gray-400 mt-2'>{moment(agent._creationTime).fromNow()}</h2>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default MyAgents
