/**
 * Custom hook for managing user profile data with automatic sync
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  syncUserData, 
  initializeUserProfile, 
  updateUserProfile,
  subscribeToUserProfile 
} from '../lib/userSync'

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncing, setSyncing] = useState(false)

  // Load user profile
  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Try to sync existing profile
      let profileData = await syncUserData(user.id)
      
      // If no profile exists, initialize it
      if (!profileData) {
        profileData = await initializeUserProfile(user.id, {
          email: user.email,
          ...user.user_metadata
        })
      }
      
      setProfile(profileData)
    } catch (err) {
      console.error('Error loading profile:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Update profile
  const updateProfile = useCallback(async (updates) => {
    if (!user?.id) return null

    try {
      setSyncing(true)
      setError(null)
      
      const updatedProfile = await updateUserProfile(user.id, updates)
      
      if (updatedProfile) {
        setProfile(updatedProfile)
      }
      
      return updatedProfile
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err.message)
      return null
    } finally {
      setSyncing(false)
    }
  }, [user?.id])

  // Refresh profile
  const refreshProfile = useCallback(() => {
    loadProfile()
  }, [loadProfile])

  // Load profile when user changes
  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Subscribe to profile changes
  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = subscribeToUserProfile(user.id, (newProfile) => {
      setProfile(newProfile)
    })

    return unsubscribe
  }, [user?.id])

  return {
    profile,
    loading: authLoading || loading,
    syncing,
    error,
    updateProfile,
    refreshProfile
  }
}
