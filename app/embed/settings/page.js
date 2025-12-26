'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Copy, Check, ExternalLink, Key, Clock, Info, AlertCircle, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function EmbedSettings() {
  const { user } = useAuth()
  const [selectedDuration, setSelectedDuration] = useState('7d')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [embedData, setEmbedData] = useState(null)
  const [copiedField, setCopiedField] = useState(null)

  // Duration options with labels and descriptions
  const durationOptions = [
    { value: '1d', label: '1 Day', description: 'Short-term, expires in 24 hours' },
    { value: '7d', label: '7 Days', description: 'Standard duration, best for most uses' },
    { value: '30d', label: '30 Days', description: 'Long-term, monthly refresh needed' },
    { value: '90d', label: '90 Days', description: 'Extended duration, quarterly refresh' },
  ]

  // Generate embed token
  const generateToken = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated. Please log in again.')
      }

      // Generate embed token via API
      const response = await fetch('/api/auth/generate-embed-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: selectedDuration
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate embed token')
      }

      if (data.success) {
        setEmbedData(data)
      } else {
        throw new Error(data.error || 'Unknown error occurred')
      }
    } catch (err) {
      console.error('Error generating token:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Copy to clipboard with feedback
  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Format date for display
  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  // Calculate days until expiration
  const getDaysUntilExpiration = (expiresAt) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffTime = expiry - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Embed Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Generate secure embed tokens for integrating your ProgressPath dashboard into Notion and other platforms
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                About Embed Tokens
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Embed tokens provide <strong>read-only</strong> access to your dashboard. They're perfect for displaying your progress in Notion, personal wikis, or other applications. Tokens automatically expire based on the duration you select.
              </p>
            </div>
          </div>
        </div>

        {/* Token Generation Card */}
        <div className="card p-6 dark:bg-gray-800 dark:border dark:border-gray-700">
          <div className="space-y-6">
            {/* User Info */}
            {user && (
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <span className="text-primary-600 dark:text-primary-400 font-semibold">
                    {user.email?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Generating token for</p>
                  <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                </div>
              </div>
            )}

            {/* Duration Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <Clock className="w-4 h-4" />
                Token Expiration Duration
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                {durationOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedDuration(option.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedDuration === option.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateToken}
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Token...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Generate Embed Token
                </>
              )}
            </button>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                      Error Generating Token
                    </h4>
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generated Token Display */}
        {embedData && (
          <div className="card p-6 dark:bg-gray-800 dark:border dark:border-gray-700 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Your Embed Token
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Generated Successfully
                </span>
              </div>
            </div>

            {/* Expiration Info */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                    Expires in {getDaysUntilExpiration(embedData.expiresAt)} days
                  </div>
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    {formatDate(embedData.expiresAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Embed URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Embed URL (Recommended)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={embedData.embedUrl}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(embedData.embedUrl, 'embedUrl')}
                  className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                >
                  {copiedField === 'embedUrl' ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Use this complete URL to embed in Notion or other platforms
              </p>
            </div>

            {/* JWT Token */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                JWT Token (Advanced)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={embedData.token}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm overflow-hidden text-ellipsis"
                />
                <button
                  onClick={() => copyToClipboard(embedData.token, 'token')}
                  className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                >
                  {copiedField === 'token' ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Raw JWT token for custom integrations
              </p>
            </div>

            {/* Token Details */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Token Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">User:</span>
                  <div className="font-medium text-gray-900 dark:text-white mt-1">
                    {embedData.user.fullName || embedData.user.email}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Email:</span>
                  <div className="font-medium text-gray-900 dark:text-white mt-1">
                    {embedData.user.email}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Permissions:</span>
                  <div className="font-medium text-gray-900 dark:text-white mt-1">
                    {embedData.permissions.join(', ')}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Token Type:</span>
                  <div className="font-medium text-gray-900 dark:text-white mt-1 capitalize">
                    {embedData.type}
                  </div>
                </div>
              </div>
            </div>

            {/* Test Link */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <a
                href={embedData.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Test Embed in New Tab
              </a>
            </div>
          </div>
        )}

        {/* How to Use Section */}
        <div className="card p-6 dark:bg-gray-800 dark:border dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            How to Use in Notion
          </h2>
          <ol className="space-y-3 text-gray-600 dark:text-gray-300">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-semibold text-sm flex items-center justify-center">
                1
              </span>
              <span>Generate an embed token above by clicking "Generate Embed Token"</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-semibold text-sm flex items-center justify-center">
                2
              </span>
              <span>Copy the Embed URL using the copy button</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-semibold text-sm flex items-center justify-center">
                3
              </span>
              <span>In your Notion page, type <code className="px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded text-sm">/embed</code> and select "Embed"</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-semibold text-sm flex items-center justify-center">
                4
              </span>
              <span>Paste your embed URL and click "Embed link"</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-semibold text-sm flex items-center justify-center">
                5
              </span>
              <span>Resize the embed by dragging the corners to fit your page layout</span>
            </li>
          </ol>
        </div>

        {/* Security Notice */}
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-gray-600 dark:text-gray-300">
              <strong className="text-gray-900 dark:text-white">Security Note:</strong> Keep your embed tokens secure. Anyone with the token can view your dashboard data. Regenerate tokens if you suspect they've been compromised or when they expire.
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
