"use client"

import React, { useContext, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar
} from "@/components/ui/sidebar"

import {
    Headphones,
    LayoutDashboard,
    WalletCards,
    User,
    Gem
} from 'lucide-react'

import { UserDetailContext } from '@/context/UserDetailContext'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useRouter } from 'next/navigation'

const MenuOptions = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard
    },
    {
        title: 'AI Agents',
        url: '/dashboard/my-agents',
        icon: Headphones
    },
    {
        title: 'Pricing',
        url: '/dashboard/pricing',
        icon: WalletCards
    },
    {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: User
    },
]

function AppSidebar() {
    const { open } = useSidebar()
    const { userDetail, setUserDetail } = useContext(UserDetailContext)
    const path = usePathname()
    const { has } = useAuth()

    const isPaidUser = has({ plan: 'unlimited_plan' })
    const userAgents = useQuery(
        api.agent.GetUserAgents,
        !isPaidUser && userDetail?._id
            ? { userId: userDetail._id }
            : "skip"
    )
    const totalRemainingCredits = Math.max(
        0,
        2 - Number(userAgents?.length ?? 0)
    )

    useEffect(() => {
        if (isPaidUser || !userDetail?._id || userAgents === undefined) return
        setUserDetail((prev: any) => ({
            ...prev,
            remainingCredits: totalRemainingCredits
        }))
    }, [isPaidUser, userDetail?._id, userAgents, totalRemainingCredits, setUserDetail])

    const router = useRouter();

    return (
        <Sidebar collapsible='icon'>
            <SidebarHeader>
                <div className='flex gap-2 items-center'>
                    <Image
                        src='/logo.svg'
                        alt='logo'
                        width={35}
                        height={35}
                    />

                    {open && (
                        <h2 className='font-bold'>
                            AlphaAgent
                        </h2>
                    )}
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Application
                    </SidebarGroupLabel>

                    <SidebarGroupContent>
                        <SidebarMenu>
                            {MenuOptions.map((menu, index) => (
                                <SidebarMenuItem key={index}>
                                    <SidebarMenuButton
                                        size={open ? 'lg' : 'default'}
                                        isActive={path === menu.url}
                                        render={<Link href={menu.url} />}
                                    >
                                        <menu.icon />
                                        <span>{menu.title}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className='mb-10'>
                {!isPaidUser ? (
                    <div>
                        <div className='flex gap-2 items-center'>
                            <Gem />

                            {open && (
                                <h2>
                                    Remaining Credits:{' '}
                                    <span className='font-bold'>
                                        {totalRemainingCredits} / 2
                                    </span>
                                </h2>
                            )}
                        </div>

                        {open && (
                            <Button className='mt-2'
                                onClick={() => router.push('/dashboard/pricing')}
                            >
                                Upgrade to Unlimited
                            </Button>
                        )}
                    </div>
                ) : (
                    <div>
                        <h2>
                            You Can Create Unlimited Agents
                        </h2>
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
    )
}

export default AppSidebar
