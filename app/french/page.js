'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Languages, Plus, Calendar, TrendingUp, X } from 'lucide-react'

export default function FrenchPage() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    activity_type: 'vocabulary',
    duration_minutes: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchActivities()
  }, [])

  async function fetchActivities() {
    try {
      const { data, error } = await supabase
        .from('french_learning')
        .select('*')
        .order('date', { ascending: false })
        .limit(30)
      
      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('french_learning')
        .insert([{
          ...formData,
          duration_minutes: parseInt(formData.duration_minutes)
        }])
      if (error) throw error
      
      resetForm()
      fetchActivities()
    } catch (error) {
      console.error('Error saving activity:', error)
      alert('Error saving activity. Please make sure the french_learning table exists in Supabase.')
    }
  }

  function resetForm() {
    setFormData({
      activity_type: 'vocabulary',
      duration_minutes: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    })
    setShowForm(false)
  }

  function calculateStats() {
    const totalMinutes = activities.reduce((sum, a) => sum + a.duration_minutes, 0)
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10
    const thisWeek = activities.filter(a => {
      const activityDate = new Date(a.date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return activityDate >= weekAgo
    }).length
    return { totalHours, totalSessions: activities.length, thisWeek }
  }

  const stats = calculateStats()

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">French Learning</h1>
          <p className="text-gray-600 mt-2">Track your daily learning activities</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center space-x-2"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          <span>{showForm ? 'Cancel' : 'Log Activity'}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="text-sm text-gray-600">Total Hours</div>
          <div className="text-3xl font-bold text-purple-600">{stats.totalHours}h</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-600">Total Sessions</div>
          <div className="text-3xl font-bold text-primary-600">{stats.totalSessions}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-600">This Week</div>
          <div className="text-3xl font-bold text-green-600">{stats.thisWeek}</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Log Learning Activity</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Activity Type *</label>
                <select
                  className="input-field"
                  value={formData.activity_type}
                  onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
                  required
                >
                  <option value="vocabulary">Vocabulary</option>
                  <option value="grammar">Grammar</option>
                  <option value="reading">Reading</option>
                  <option value="listening">Listening</option>
                  <option value="speaking">Speaking</option>
                  <option value="writing">Writing</option>
                  <option value="exercise">Exercise</option>
                </select>
              </div>
              <div>
                <label className="label">Duration (minutes) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="input-field"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Date *</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input-field"
                rows="3"
                placeholder="What did you learn or practice today?"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">Log Activity</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Activities List */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          <Calendar className="w-5 h-5" />
          <span>Recent Activities</span>
        </h2>
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <Languages className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No activities yet</h3>
            <p className="text-gray-600 mb-4">Start logging your French learning activities</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Log Your First Activity
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="border-l-4 border-purple-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-gray-900 capitalize">
                        {activity.activity_type}
                      </span>
                      <span className="text-sm text-gray-500">
                        {activity.duration_minutes} min
                      </span>
                      <span className="text-sm text-gray-400">
                        {new Date(activity.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    {activity.notes && (
                      <p className="text-gray-600 mt-1 text-sm">{activity.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress Chart Placeholder */}
      {activities.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Learning Streak</span>
          </h2>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = new Date()
              date.setDate(date.getDate() - (6 - i))
              const dateStr = date.toISOString().split('T')[0]
              const hasActivity = activities.some(a => a.date === dateStr)
              return (
                <div key={i} className="text-center">
                  <div className={`h-16 rounded-lg ${
                    hasActivity ? 'bg-purple-500' : 'bg-gray-200'
                  }`} />
                  <div className="text-xs text-gray-600 mt-1">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
