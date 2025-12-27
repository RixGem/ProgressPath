/**
 * Visual indicator for sync status
 * Shows loading, syncing, error states
 */

import { useAuth } from '@/contexts/AuthContext'
import { CheckCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'

export default function SyncStatusIndicator({ className = '' }) {
  const { loading, syncing, error, clearError, refreshSession } = useAuth()

  // Don't show anything if not loading or syncing
  if (!loading && !syncing && !error) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {loading && (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </div>
      )}

      {syncing && !loading && (
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Syncing...</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
          <button
            onClick={clearError}
            className="ml-2 text-xs underline hover:no-underline"
          >
            Dismiss
          </button>
          <button
            onClick={refreshSession}
            className="ml-2 text-xs underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
