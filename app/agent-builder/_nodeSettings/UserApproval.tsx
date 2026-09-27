import React, { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

function UserApproval({ selectedNode, updateFormData }: any) {
    const [formData, setFormData] = useState({ name: '', message: '' })
    useEffect(() => {
        console.log(selectedNode)
        if (selectedNode) {
            setFormData({
                name: selectedNode?.data?.settings?.name ?? '',
                message: selectedNode?.data?.settings?.message ?? ''
            })
        }
    }, [selectedNode])
    const handleChange = (key: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value
        }))
    }
    const onSave = () => {
        console.log(formData)
        updateFormData(formData)
        toast.success('Settings Updated!')
    }
    return (
        <div>
            <h2 className='font-bold'>User Approval</h2>
            <p className='text-gray-500 mt-1'>
                Pause for a Human to approve or rejecrt a step
            </p>
            <div className='mt-3 space-y-1'>
                <Label>Name</Label>
                <Input
                    placeholder='Name'
                    value={formData.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                />
            </div>
            <div className='mt-3 space-y-1'>
                <Label>Message</Label>
                <Textarea
                    placeholder='Describe the message to show to the user'
                    value={formData.message}
                    onChange={(event) => handleChange('message', event.target.value)}
                />
            </div>
            <Button className='w-full mt-5' onClick={onSave}>
                Save
            </Button>
        </div>
    )
}

export default UserApproval