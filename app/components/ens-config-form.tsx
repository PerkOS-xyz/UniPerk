'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'

interface ENSConfigFormProps {
  onSubmit?: (data: ENSFormData) => void
}

interface ENSFormData {
  allowed: boolean
  maxTrade: string
  tokens: string
  slippage: string
  expires: string
}

export function ENSConfigForm({ onSubmit }: ENSConfigFormProps) {
  const [formData, setFormData] = useState<ENSFormData>({
    allowed: true,
    maxTrade: '1000',
    tokens: 'ETH,USDC,WETH',
    slippage: '50',
    expires: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // In production, this would write to ENS text records
    console.log('Submitting ENS config:', formData)
    onSubmit?.(formData)
    
    setTimeout(() => setIsSubmitting(false), 1000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure Agent Permissions</CardTitle>
        <CardDescription>
          Set permissions for AI agents to trade on your behalf
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Allowed Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Enable Agent Trading</label>
              <p className="text-sm text-gray-500">Allow agents to execute trades</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, allowed: !formData.allowed })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                formData.allowed ? 'bg-uniperk-pink' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  formData.allowed ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Max Trade */}
          <div className="space-y-2">
            <label className="font-medium">Maximum Trade Size (USDC)</label>
            <Input
              type="number"
              value={formData.maxTrade}
              onChange={(e) => setFormData({ ...formData, maxTrade: e.target.value })}
              placeholder="1000"
            />
            <p className="text-sm text-gray-500">Maximum amount per trade</p>
          </div>

          {/* Tokens */}
          <div className="space-y-2">
            <label className="font-medium">Allowed Tokens</label>
            <Input
              type="text"
              value={formData.tokens}
              onChange={(e) => setFormData({ ...formData, tokens: e.target.value })}
              placeholder="ETH,USDC,WETH"
            />
            <p className="text-sm text-gray-500">Comma-separated list of tokens</p>
          </div>

          {/* Slippage */}
          <div className="space-y-2">
            <label className="font-medium">Max Slippage (basis points)</label>
            <Input
              type="number"
              value={formData.slippage}
              onChange={(e) => setFormData({ ...formData, slippage: e.target.value })}
              placeholder="50"
            />
            <p className="text-sm text-gray-500">50 = 0.5%, 100 = 1%</p>
          </div>

          {/* Expires */}
          <div className="space-y-2">
            <label className="font-medium">Permission Expiry</label>
            <Input
              type="date"
              value={formData.expires}
              onChange={(e) => setFormData({ ...formData, expires: e.target.value })}
            />
            <p className="text-sm text-gray-500">Leave empty for no expiration</p>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Permissions'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
