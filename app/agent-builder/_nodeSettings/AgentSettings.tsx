import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import { FileJson } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const supportedModels = ['gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini']

function AgentSettings({ selectedNode, updateFormData }: any) {
    const [formData, setFormData] = useState({
        name: '',
        instruction: '',
        includeHistory: true,
        model: 'gpt-4.1-mini',
        output: 'Text',
        schema: ''
    })
    useEffect(() => {
        if (selectedNode) {
            const savedModel = selectedNode?.data?.settings?.model
            setFormData({
                name: selectedNode?.data?.settings?.name ?? '',
                instruction: selectedNode?.data?.settings?.instruction ?? '',
                includeHistory: selectedNode?.data?.settings?.includeHistory ?? true,
                model: supportedModels.includes(savedModel)
                    ? savedModel
                    : 'gpt-4.1-mini',
                output: selectedNode?.data?.settings?.output ?? 'Text',
                schema: selectedNode?.data?.settings?.schema ?? ''
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
            <h2 className='font-bold'>Agent</h2>
            <p className='text-gray-500 mt-1'>Call the AI model with your instruction</p>
            <div className='mt-3 space-y-1'>
                <Label>Name</Label>
                <Input
                    placeholder='Agent Name'
                    value={formData.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                />
            </div>
            <div className='mt-3 space-y-1'>
                <Label>Instruction</Label>
                <Textarea
                    placeholder='Instruction'
                    value={formData.instruction}
                    onChange={(event) => handleChange('instruction', event.target.value)}
                />
                <h2 className='text-sm p-1 flex gap-2 items-center'>
                    Add Context
                    <FileJson className='h-3 w-3' />
                </h2>
            </div>
            <div className='mt-3 flex justify-between items-center'>
                <Label>Include Chat History</Label>
                <Switch
                    checked={formData.includeHistory}
                    onCheckedChange={(checked) => handleChange('includeHistory', checked)}
                />
            </div>
            <div className='mt-3 flex justify-between items-center'>
                <Label>Model</Label>
                <Select
                    value={formData.model}
                    onValueChange={(value) => handleChange('model', value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder='Choose an OpenAI model' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='gpt-4.1-mini'>GPT-4.1 mini</SelectItem>
                        <SelectItem value='gpt-4.1'>GPT-4.1</SelectItem>
                        <SelectItem value='gpt-4o-mini'>GPT-4o mini</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className='mt-3 space-y-2'>
                <Label>Output Format</Label>
                <Tabs
                    defaultValue='Text'
                    className='w-[400px]'
                    value={formData.output}
                    onValueChange={(value) => handleChange('output', value)}
                >
                    <TabsList>
                        <TabsTrigger value='Text'>Text</TabsTrigger>
                        <TabsTrigger value='Json'>Json</TabsTrigger>
                    </TabsList>
                    <TabsContent value='Text'>
                        <h2 className='text-sm text-gray-500'>Output will be Text</h2>
                    </TabsContent>
                    <TabsContent value='Json'>
                        <Label className='text-sm text-gray-500'>Enter Json Schema</Label>
                        <Textarea
                            placeholder='{title:string}'
                            value={formData.schema}
                            onChange={(event) => handleChange('schema', event.target.value)}
                            className='max-w-[300px] mt-1'
                        />
                    </TabsContent>
                </Tabs>
            </div>
            <Button className='w-full mt-5' onClick={onSave}>
                Save
            </Button>
        </div>
    )
}

export default AgentSettings
