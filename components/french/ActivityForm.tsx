import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { FrenchFormData } from '../../types/french'

interface ActivityFormProps {
  userId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function ActivityForm({ userId, onSuccess, onCancel }: ActivityFormProps) {
  const [formData, setFormData] = useState<FrenchFormData>({
    activity_type: 'vocabulary',
    duration_minutes: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    new_vocabulary: '',
    practice_sentences: '',
    mood: 'neutral'
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const durationMinutes = parseInt(formData.duration_minutes)

      const vocabularyArray = formData.new_vocabulary
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0)

      const sentencesArray = formData.practice_sentences
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      const insertData = {
        activity_type: formData.activity_type,
        duration_minutes: durationMinutes,
        total_time: durationMinutes,
        notes: formData.notes,
        date: formData.date,
        new_vocabulary: vocabularyArray.length > 0 ? vocabularyArray : null,
        practice_sentences: sentencesArray.length > 0 ? sentencesArray : null,
        mood: formData.mood,
        user_id: userId
      }

      const { error } = await supabase
        .from('french_learning')
        .insert([insertData])

      if (error) throw error

      setFormData({
        activity_type: 'vocabulary',
        duration_minutes: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
        new_vocabulary: '',
        practice_sentences: '',
        mood: 'neutral'
      })

      onSuccess()
    } catch (error: any) {
      console.error('Error saving activity:', error)
      alert('Error saving activity: ' + error.message)
    }
  }

  return (
    <div className="card p-6 dark:border dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Log Learning Activity</h2>
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
              min={1}
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

          <div>
            <label className="label">How did it go? *</label>
            <select
              className="input-field"
              value={formData.mood}
              onChange={(e) => setFormData({ ...formData, mood: e.target.value as 'good' | 'neutral' | 'difficult' })}
              required
            >
              <option value="good">😊 Good - Felt confident</option>
              <option value="neutral">😐 Neutral - Okay progress</option>
              <option value="difficult">😓 Difficult - Challenging</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">New Vocabulary</label>
          <input
            type="text"
            className="input-field"
            placeholder="Enter words separated by commas (e.g., bonjour, merci, au revoir)"
            value={formData.new_vocabulary}
            onChange={(e) => setFormData({ ...formData, new_vocabulary: e.target.value })}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Separate multiple words with commas</p>
        </div>

        <div>
          <label className="label">Practice Sentences</label>
          <textarea
            className="input-field"
            rows={2}
            placeholder="Enter sentences separated by commas"
            value={formData.practice_sentences}
            onChange={(e) => setFormData({ ...formData, practice_sentences: e.target.value })}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Separate multiple sentences with commas</p>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            className="input-field"
            rows={3}
            placeholder="What did you learn or practice today?"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <div className="flex space-x-3">
          <button type="submit" className="btn-primary">Log Activity</button>
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  )
}
