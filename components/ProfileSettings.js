/**
 * Example component showing how to use the new user sync system
 * This demonstrates profile management with the useUserProfile hook
 */

'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/hooks/useUserProfile'
import SyncStatusIndicator from './SyncStatusIndicator'
import { User, Mail, Save, Loader2 } from 'lucide-react'

export default function ProfileSettings() {
  const { user } = useAuth()
  const { profile, loading, syncing, updateProfile, refreshProfile } = useUserProfile()
  
  const [formData, setFormData] = useState({
    display_name: '',
    bio: ''
  })
  const [saveStatus, setSaveStatus] = useState(null)

  // Update form when profile loads
  useState(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || ''
      })
    }
  }, [profile])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaveStatus('saving')

    try {
      const updated = await updateProfile(formData)
      
      if (updated) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus(null), 3000)
      } else {
        setSaveStatus('error')
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      setSaveStatus('error')
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="card dark:bg-gray-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Profile Settings
            </h2>
            <SyncStatusIndicator />
          </div>

          {/* User Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">User ID</p>
                <p className="font-mono text-xs text-gray-700 dark:text-gray-300">
                  {user?.id}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your display name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Tell us about yourself"
              />
            </div>

            {/* Profile Stats */}
            {profile && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Books Read</p>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {profile.total_books_read || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">French Streak</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {profile.french_streak_days || 0} days
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={syncing || saveStatus === 'saving'}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(syncing || saveStatus === 'saving') ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={refreshProfile}
                disabled={loading || syncing}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Refresh
              </button>

              {saveStatus === 'success' && (
                <span className="text-green-600 dark:text-green-400 text-sm">
                  ✓ Saved successfully
                </span>
              )}

              {saveStatus === 'error' && (
                <span className="text-red-600 dark:text-red-400 text-sm">
                  ✗ Failed to save
                </span>
              )}
            </div>
          </form>

          {/* Profile Info */}
          {profile && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {new Date(profile.updated_at).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Account created: {new Date(profile.created_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
