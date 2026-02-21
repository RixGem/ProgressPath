'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Globe, Plus, Calendar, TrendingUp, X, BookOpen, MessageSquare, Smile, Flame, GalleryHorizontal, FileText as FileTextIcon } from 'lucide-react'
import ProtectedRoute from '../../components/ProtectedRoute'
import FlashcardNotes from '../../components/FlashcardNotes'
import { useAuth } from '../../contexts/AuthContext'

export default function GermanPage() {
    const { user } = useAuth()
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [totalTime, setTotalTime] = useState(0)
    const [currentStreak, setCurrentStreak] = useState(0)
    const [showFlashcards, setShowFlashcards] = useState(false)
    const [formData, setFormData] = useState({
        activity_type: 'vocabulary',
        duration_minutes: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
        new_vocabulary: '',
        practice_sentences: '',
        mood: 'neutral'
    })

    useEffect(() => {
        if (user) {
            console.log('[German Module] User authenticated:', user.id)
            fetchActivities()
            fetchTotalTime()
        } else {
            console.log('[German Module] No user authenticated')
        }
    }, [user])

    /**
     * Helper function to normalize vocabulary data
     */
    function normalizeVocabulary(vocabulary) {
        if (!vocabulary) return []
        if (Array.isArray(vocabulary)) return vocabulary
        if (typeof vocabulary === 'string') {
            if (vocabulary.includes('个新词汇') || vocabulary.includes('个复习词汇')) return []
            return vocabulary.split(',').map(v => v.trim()).filter(v => v.length > 0)
        }
        return []
    }

    /**
     * Helper function to normalize practice sentences
     */
    function normalizeSentences(sentences) {
        if (!sentences) return []
        if (Array.isArray(sentences)) return sentences
        if (typeof sentences === 'string') {
            return sentences.split(',').map(s => s.trim()).filter(s => s.length > 0)
        }
        return []
    }

    /**
     * Fetch user's German learning activities
     * Table name: german_learning (with underscore)
     */
    async function fetchActivities() {
        if (!user?.id) {
            console.error('[German Module] Cannot fetch activities: user.id is undefined')
            setLoading(false)
            return
        }

        try {
            console.log('[German Module] Fetching activities for user:', user.id)
            console.log('[German Module] Using table: german_learning')
            
            const { data, error } = await supabase
                .from('german_learning')  // ✅ Correct table name with underscore
                .select('*')
                .eq('user_id', user.id)  // ✅ User-specific filtering
                .order('date', { ascending: false })
                .limit(30)

            if (error) {
                console.error('[German Module] Error fetching activities:', error)
                console.error('[German Module] Error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                })
                throw error
            }
            
            console.log('[German Module] Successfully fetched activities:', data?.length || 0, 'records')
            setActivities(data || [])

            if (data && data.length > 0) {
                calculateStreak(data)
            } else {
                console.log('[German Module] No activities found for this user')
            }
        } catch (error) {
            console.error('[German Module] Error in fetchActivities:', error)
        } finally {
            setLoading(false)
        }
    }

    function calculateStreak(activitiesData) {
        if (!activitiesData || activitiesData.length === 0) {
            setCurrentStreak(0)
            return
        }

        const sortedActivities = [...activitiesData].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        )

        let streak = 0
        let currentDate = new Date()
        currentDate.setHours(0, 0, 0, 0)

        // Check if the most recent activity was today or yesterday to keep streak alive
        const mostRecentActivity = new Date(sortedActivities[0].date)
        mostRecentActivity.setHours(0, 0, 0, 0)

        const daysDifference = Math.floor((currentDate - mostRecentActivity) / (1000 * 60 * 60 * 24))

        if (daysDifference > 1) {
            setCurrentStreak(0)
            return
        }

        let checkDate = new Date(currentDate)
        // If no activity today, check from yesterday
        if (daysDifference === 1) {
            checkDate.setDate(checkDate.getDate() - 1)
        }

        const activityDates = new Set(sortedActivities.map(a => a.date))

        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0]
            if (activityDates.has(dateStr)) {
                streak++
                checkDate.setDate(checkDate.getDate() - 1)
            } else {
                break
            }
        }

        setCurrentStreak(streak)
    }

    /**
     * Fetch total time spent on German learning
     * Table name: german_learning (with underscore)
     */
    async function fetchTotalTime() {
        if (!user?.id) {
            console.error('[German Module] Cannot fetch total time: user.id is undefined')
            return
        }

        try {
            console.log('[German Module] Fetching total time for user:', user.id)
            
            const { data, error } = await supabase
                .from('german_learning')  // ✅ Correct table name with underscore
                .select('total_time, duration_minutes')
                .eq('user_id', user.id)  // ✅ User-specific filtering

            if (error) {
                console.error('[German Module] Error fetching total time:', error)
                throw error
            }

            const total = data.reduce((sum, record) => {
                const time = record.total_time !== undefined && record.total_time !== null
                    ? record.total_time
                    : record.duration_minutes
                return sum + (time || 0)
            }, 0)

            console.log('[German Module] Total time calculated:', total, 'minutes')
            setTotalTime(total)
        } catch (error) {
            console.error('[German Module] Error in fetchTotalTime:', error)
        }
    }

    /**
     * Submit new German learning activity
     * Table name: german_learning (with underscore)
     */
    async function handleSubmit(e) {
        e.preventDefault()
        
        if (!user?.id) {
            console.error('[German Module] Cannot submit: user.id is undefined')
            alert('Error: User not authenticated. Please refresh and try again.')
            return
        }

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
                user_id: user.id  // ✅ Explicitly set user_id
            }

            console.log('[German Module] Inserting activity:', insertData)
            console.log('[German Module] Using table: german_learning')

            const { error } = await supabase
                .from('german_learning')  // ✅ Correct table name with underscore
                .insert([insertData])

            if (error) {
                console.error('[German Module] Error saving activity:', error)
                console.error('[German Module] Error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                })
                throw error
            }

            console.log('[German Module] Activity saved successfully')
            resetForm()
            fetchActivities()
            fetchTotalTime()
        } catch (error) {
            console.error('[German Module] Error in handleSubmit:', error)
            alert('Error saving activity: ' + error.message)
        }
    }

    function resetForm() {
        setFormData({
            activity_type: 'vocabulary',
            duration_minutes: '',
            notes: '',
            date: new Date().toISOString().split('T')[0],
            new_vocabulary: '',
            practice_sentences: '',
            mood: 'neutral'
        })
        setShowForm(false)
    }

    function calculateStats() {
        const totalHours = (totalTime / 60).toFixed(1)

        const thisWeek = activities.filter(a => {
            const activityDate = new Date(a.date)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return activityDate >= weekAgo
        }).length

        const totalVocabulary = activities.reduce((sum, a) => {
            const vocab = normalizeVocabulary(a.new_vocabulary)
            return sum + vocab.length
        }, 0)

        return { totalHours, totalSessions: activities.length, thisWeek, totalVocabulary, currentStreak }
    }

    function getMoodEmoji(mood) {
        switch (mood) {
            case 'good': return '😊'
            case 'neutral': return '😐'
            case 'difficult': return '😓'
            default: return '😐'
        }
    }

    function getMoodColor(mood) {
        switch (mood) {
            case 'good': return 'text-green-600 dark:text-green-400'
            case 'neutral': return 'text-yellow-600 dark:text-yellow-400'
            case 'difficult': return 'text-red-600 dark:text-red-400'
            default: return 'text-gray-600 dark:text-gray-400'
        }
    }

    const stats = calculateStats()

    if (loading) {
        return (
            <div className="text-center py-12 text-gray-900 dark:text-gray-100">
                <div className="mb-4">Loading German learning data...</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Fetching from table: german_learning
                </div>
            </div>
        )
    }

    return (
        <ProtectedRoute>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">German Learning</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">Track your daily German progress</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="btn-primary flex items-center space-x-2"
                    >
                        {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        <span>{showForm ? 'Cancel' : 'Log Activity'}</span>
                    </button>
                </div>

                {/* Stats Grid - Using Amber/Red/Black theme for German */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="card p-6 dark:border dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Total Hours</div>
                                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.totalHours}h</div>
                            </div>
                            <TrendingUp className="w-8 h-8 text-amber-400 dark:text-amber-300" />
                        </div>
                    </div>

                    <div className="card p-6 dark:border dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Current Streak</div>
                                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.currentStreak} days</div>
                            </div>
                            <Flame className="w-8 h-8 text-red-500 dark:text-red-400" />
                        </div>
                    </div>

                    <div className="card p-6 dark:border dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</div>
                                <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">{stats.totalSessions}</div>
                            </div>
                            <Calendar className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                        </div>
                    </div>

                    <div className="card p-6 dark:border dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Vocabulary Words</div>
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalVocabulary}</div>
                            </div>
                            <BookOpen className="w-8 h-8 text-green-400 dark:text-green-300" />
                        </div>
                    </div>
                </div>

                {/* Form */}
                {showForm && (
                    <div className="card p-6 dark:border dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Log German Activity</h2>
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

                                <div>
                                    <label className="label">How did it go? *</label>
                                    <select
                                        className="input-field"
                                        value={formData.mood}
                                        onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
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
                                    placeholder="Enter words separated by commas (e.g., hallo, danke, auf wiedersehen)"
                                    value={formData.new_vocabulary}
                                    onChange={(e) => setFormData({ ...formData, new_vocabulary: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Separate multiple words with commas</p>
                            </div>

                            <div>
                                <label className="label">Practice Sentences</label>
                                <textarea
                                    className="input-field"
                                    rows="2"
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
                <div className="card p-6 dark:border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold flex items-center space-x-2 text-gray-900 dark:text-white">
                            <Calendar className="w-5 h-5" />
                            <span>Recent Activities</span>
                        </h2>
                        {activities.length > 0 && (
                            <button
                                onClick={() => setShowFlashcards(true)}
                                className="btn-secondary flex items-center space-x-2"
                            >
                                <GalleryHorizontal className="w-4 h-4" />
                                <span>Flashcard View</span>
                            </button>
                        )}
                    </div>
                    {activities.length === 0 ? (
                        <div className="text-center py-12">
                            <Globe className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No activities yet</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">Start logging your German learning activities</p>
                            <button onClick={() => setShowForm(true)} className="btn-primary">
                                Log Your First Activity
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activities.map((activity) => {
                                const displayDuration = activity.total_time !== undefined && activity.total_time !== null
                                    ? activity.total_time
                                    : activity.duration_minutes

                                const normalizedVocabulary = normalizeVocabulary(activity.new_vocabulary)
                                const normalizedSentences = normalizeSentences(activity.practice_sentences)

                                return (
                                    <div key={activity.id} className="border-l-4 border-amber-500 dark:border-amber-400 pl-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-r-lg">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <span className="font-semibold text-gray-900 dark:text-white capitalize">
                                                        {activity.activity_type}
                                                    </span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {displayDuration} min
                                                    </span>
                                                    <span className="text-sm text-gray-400 dark:text-gray-500">
                                                        {new Date(activity.date).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                    {activity.mood && (
                                                        <span className={`text-lg ${getMoodColor(activity.mood)}`} title={activity.mood}>
                                                            {getMoodEmoji(activity.mood)}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Display vocabulary if available */}
                                                {normalizedVocabulary.length > 0 && (
                                                    <div className="mb-2">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <BookOpen className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Vocabulary ({normalizedVocabulary.length}):</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 ml-6">
                                                            {normalizedVocabulary.map((word, idx) => (
                                                                <span key={idx} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                                                                    {word}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Display practice sentences if available */}
                                                {normalizedSentences.length > 0 && (
                                                    <div className="mb-2">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Practice Sentences:</span>
                                                        </div>
                                                        <ul className="ml-6 space-y-1">
                                                            {normalizedSentences.map((sentence, idx) => (
                                                                <li key={idx} className="text-sm text-gray-600 dark:text-gray-300 italic">• {sentence}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {activity.notes && (
                                                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">{activity.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Learning Streak Visualization */}
                {activities.length > 0 && (
                    <div className="card p-6 dark:border dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2 text-gray-900 dark:text-white">
                            <Flame className="w-5 h-5 text-red-500" />
                            <span>7-Day Activity</span>
                        </h2>
                        <div className="grid grid-cols-7 gap-2">
                            {Array.from({ length: 7 }).map((_, i) => {
                                const date = new Date()
                                date.setDate(date.getDate() - (6 - i))
                                const dateStr = date.toISOString().split('T')[0]
                                const dayActivities = activities.filter(a => a.date === dateStr)
                                const hasActivity = dayActivities.length > 0
                                const totalMinutes = dayActivities.reduce((sum, a) => {
                                    const time = a.total_time !== undefined && a.total_time !== null ? a.total_time : a.duration_minutes
                                    return sum + (time || 0)
                                }, 0)

                                return (
                                    <div key={i} className="text-center">
                                        <div
                                            className={`h-20 rounded-lg flex items-center justify-center ${hasActivity ? 'bg-amber-500 dark:bg-amber-600 text-white font-semibold' : 'bg-gray-200 dark:bg-gray-700'
                                                }`}
                                            title={hasActivity ? `${totalMinutes} minutes` : 'No activity'}
                                        >
                                            {hasActivity && <span className="text-sm">{totalMinutes}m</span>}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500">
                                            {date.getDate()}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {showFlashcards && (
                <FlashcardNotes
                    items={activities}
                    onClose={() => setShowFlashcards(false)}
                    title="German Learning History"
                    renderFront={(activity) => {
                        const normalizedVocabulary = normalizeVocabulary(activity.new_vocabulary)

                        return (
                            <div className="flex flex-col h-full items-center justify-center text-center space-y-6">
                                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                                    <span className="text-4xl text-amber-600 dark:text-amber-400 capitalize">
                                        {activity.activity_type ? activity.activity_type.charAt(0) : '?'}
                                    </span>
                                </div>

                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                                    {activity.activity_type}
                                </h3>

                                <div className="space-y-2">
                                    <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                                        {activity.total_time || activity.duration_minutes} min
                                    </div>
                                    <div className="text-gray-500 dark:text-gray-400">Duration</div>
                                </div>

                                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium">
                                        {new Date(activity.date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>

                                <div className="flex gap-4">
                                    {normalizedVocabulary.length > 0 && (
                                        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                                            <BookOpen className="w-5 h-5" />
                                            <span className="font-bold">{normalizedVocabulary.length} Words</span>
                                        </div>
                                    )}

                                    {activity.mood && (
                                        <div className={`flex items-center space-x-1 ${getMoodColor(activity.mood)}`}>
                                            <span className="text-xl">{getMoodEmoji(activity.mood)}</span>
                                            <span className="font-bold capitalize">{activity.mood}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }}
                    renderBack={(activity) => {
                        const normalizedVocabulary = normalizeVocabulary(activity.new_vocabulary)
                        const normalizedSentences = normalizeSentences(activity.practice_sentences)

                        return (
                            <div className="space-y-6 h-full text-left">
                                {/* Vocabulary Section */}
                                {normalizedVocabulary.length > 0 && (
                                    <div>
                                        <h4 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                            <BookOpen className="w-5 h-5 text-green-500" />
                                            <span>Vocabulary</span>
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {normalizedVocabulary.map((word, idx) => (
                                                <span key={idx} className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg text-sm border border-green-200 dark:border-green-800">
                                                    {word}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Sentences Section */}
                                {normalizedSentences.length > 0 && (
                                    <div>
                                        <h4 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                            <MessageSquare className="w-5 h-5 text-blue-500" />
                                            <span>Practice Sentences</span>
                                        </h4>
                                        <ul className="space-y-2">
                                            {normalizedSentences.map((sentence, idx) => (
                                                <li key={idx} className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                                    <span className="text-blue-500 mt-1">•</span>
                                                    <span className="text-gray-700 dark:text-gray-300 italic">{sentence}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Notes Section */}
                                {activity.notes && (
                                    <div>
                                        <h4 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                            <FileTextIcon className="w-5 h-5 text-gray-500" />
                                            <span>Notes</span>
                                        </h4>
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                {activity.notes}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Empty State */}
                                {!normalizedVocabulary.length && !normalizedSentences.length && !activity.notes && (
                                    <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 italic">
                                        No details recorded for this session.
                                    </div>
                                )}
                            </div>
                        )
                    }}
                />
            )}
        </ProtectedRoute>
    )
}
