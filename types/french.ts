export interface FrenchActivity {
  id: string
  activity_type: string
  duration_minutes: number
  total_time: number
  notes: string | null
  date: string
  new_vocabulary: string[] | string | null
  practice_sentences: string[] | string | null
  mood: 'good' | 'neutral' | 'difficult'
  user_id: string
  created_at: string
}

export interface FrenchFormData {
  activity_type: string
  duration_minutes: string
  notes: string
  date: string
  new_vocabulary: string
  practice_sentences: string
  mood: 'good' | 'neutral' | 'difficult'
}

export interface FrenchStats {
  totalHours: string
  totalSessions: number
  thisWeek: number
  totalVocabulary: number
  currentStreak: number
}
