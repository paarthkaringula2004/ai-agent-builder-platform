import { UserProfile } from '@clerk/nextjs'
import React from 'react'

function Profile() {
    return (
        <div className='w-full min-h-full p-6'>
            <UserProfile
                routing='hash'
                appearance={{
                    elements: {
                        rootBox: 'w-full',
                        cardBox: 'w-full max-w-none shadow-sm rounded-2xl',
                        pageScrollBox: 'w-full',
                    },
                }}
            />
        </div>
    )
}

export default Profile