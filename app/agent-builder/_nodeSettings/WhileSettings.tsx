import React, { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

function WhileSettings({ selectedNode, updateFormData }: any) {
    const [formData, setFormData] = useState({ whileCondition: '' })
    useEffect(() => {
        console.log(selectedNode)
        selectedNode && setFormData(selectedNode?.data?.settings ?? { whileCondition: '' })
    }, [selectedNode])
    return (
        <div>
            <h2 className='font-bold'>While</h2>
            <p className='text-gray-500 mt-1'>
                Loop your logic
            </p>
            <div className='mt-3'>
                <Label>While</Label>
                <Input
                    placeholder='Enter condition e.g output==`any condition`'
                    className='mt-2'
                    value={formData?.whileCondition ?? ''}
                    onChange={(e) => setFormData({ whileCondition: e.target.value })}
                />
            </div>
            <Button
                className='w-full mt-5'
                onClick={() => { updateFormData(formData); toast.success('Updated!') }}
            >
                Save
            </Button>
        </div>
    )
}

export default WhileSettings