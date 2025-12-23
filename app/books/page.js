'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { BookOpen, Plus, Edit2, Trash2, Save, X, Star, Calendar, Globe, Tag, FileText } from 'lucide-react'

export default function BooksPage() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    progress: 0,
    status: 'reading',
    genre: '',
    rating: 0,
    language_analysis: '',
    notes: '',
    date_started: '',
    date_finished: ''
  })

  useEffect(() => {
    fetchBooks()
  }, [])

  async function fetchBooks() {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setBooks(data || [])
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const dataToSave = {
        title: formData.title,
        author: formData.author,
        progress: parseFloat(formData.progress) || 0,
        status: formData.status,
        genre: formData.genre || null,
        rating: parseInt(formData.rating) || null,
        language_analysis: formData.language_analysis || null,
        notes: formData.notes || null,
        date_started: formData.date_started || null,
        date_finished: formData.date_finished || null
      }

      if (editingId) {
        const { error } = await supabase
          .from('books')
          .update(dataToSave)
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('books')
          .insert([dataToSave])
        if (error) throw error
      }
      
      resetForm()
      fetchBooks()
    } catch (error) {
      console.error('Error saving book:', error)
      alert('Error saving book: ' + error.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this book?')) return
    
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id)
      if (error) throw error
      fetchBooks()
    } catch (error) {
      console.error('Error deleting book:', error)
    }
  }

  function handleEdit(book) {
    setFormData({
      title: book.title || '',
      author: book.author || '',
      progress: book.progress || 0,
      status: book.status || 'reading',
      genre: book.genre || '',
      rating: book.rating || 0,
      language_analysis: book.language_analysis || '',
      notes: book.notes || '',
      date_started: book.date_started || '',
      date_finished: book.date_finished || ''
    })
    setEditingId(book.id)
    setShowForm(true)
  }

  function resetForm() {
    setFormData({
      title: '',
      author: '',
      progress: 0,
      status: 'reading',
      genre: '',
      rating: 0,
      language_analysis: '',
      notes: '',
      date_started: '',
      date_finished: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  function getStatusBadgeColor(status) {
    switch (status) {
      case 'reading':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
      case 'planned':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  function formatDate(dateString) {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  function renderStars(rating) {
    if (!rating) return <span className="text-gray-400 dark:text-gray-500 text-sm">未评分</span>
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-900 dark:text-gray-100">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Books Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Track your reading progress</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center space-x-2"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          <span>{showForm ? 'Cancel' : 'Add Book'}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-6 dark:border dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Books</div>
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{books.length}</div>
        </div>
        <div className="card p-6 dark:border dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Currently Reading</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {books.filter(b => b.status === 'reading').length}
          </div>
        </div>
        <div className="card p-6 dark:border dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {books.filter(b => b.status === 'completed').length}
          </div>
        </div>
        <div className="card p-6 dark:border dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Planned</div>
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {books.filter(b => b.status === 'planned').length}
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 dark:border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {editingId ? 'Edit Book' : 'Add New Book'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Title *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Author *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Progress (%) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  className="input-field"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Status *</label>
                <select
                  className="input-field"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="planned">Planned</option>
                  <option value="reading">Reading</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="label">Genre (题材/分类)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Fiction, Science, Biography"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Rating (评分 1-5星)</label>
                <select
                  className="input-field"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                >
                  <option value="0">No rating</option>
                  <option value="1">⭐ 1 Star</option>
                  <option value="2">⭐⭐ 2 Stars</option>
                  <option value="3">⭐⭐⭐ 3 Stars</option>
                  <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                  <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                </select>
              </div>
              <div>
                <label className="label">Date Started (开始阅读时间)</label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.date_started}
                  onChange={(e) => setFormData({ ...formData, date_started: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Date Finished (完成时间)</label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.date_finished}
                  onChange={(e) => setFormData({ ...formData, date_finished: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Language Analysis (语言分析)</label>
                <textarea
                  className="input-field"
                  rows="2"
                  placeholder="Language learning notes, vocabulary, expressions..."
                  value={formData.language_analysis}
                  onChange={(e) => setFormData({ ...formData, language_analysis: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Notes (笔记)</label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="Your thoughts, reflections, key takeaways..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="btn-primary flex items-center space-x-2">
                <Save className="w-5 h-5" />
                <span>{editingId ? 'Update' : 'Add'} Book</span>
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Books List */}
      <div className="grid gap-4">
        {books.length === 0 ? (
          <div className="card p-12 text-center dark:border dark:border-gray-700">
            <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No books yet</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Start tracking your reading journey by adding your first book</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Add Your First Book
            </button>
          </div>
        ) : (
          books.map((book) => {
            const progress = parseFloat(book.progress) || 0
            return (
              <div key={book.id} className="card p-6 dark:border dark:border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{book.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300">by {book.author}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(book)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(book.id)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Main Info Row */}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className={`capitalize px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(book.status)}`}>
                        {book.status}
                      </span>
                      {book.genre && (
                        <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Tag className="w-4 h-4 mr-1" />
                          {book.genre}
                        </span>
                      )}
                      {book.rating > 0 && (
                        <span className="flex items-center">
                          {renderStars(book.rating)}
                        </span>
                      )}
                    </div>

                    {/* Dates Section */}
                    {(book.date_started || book.date_finished || book.date_updated) && (
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        {book.date_started && (
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            开始: {formatDate(book.date_started)}
                          </span>
                        )}
                        {book.date_finished && (
                          <span className="flex items-center text-green-600 dark:text-green-400">
                            <Calendar className="w-4 h-4 mr-1" />
                            完成: {formatDate(book.date_finished)}
                          </span>
                        )}
                        {book.date_updated && !book.date_finished && (
                          <span className="flex items-center text-gray-400 dark:text-gray-500">
                            最后更新: {formatDate(book.date_updated)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Language Analysis */}
                    {book.language_analysis && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                        <div className="flex items-start">
                          <Globe className="w-4 h-4 mr-2 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">语言分析</div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{book.language_analysis}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {book.notes && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-start">
                          <FileText className="w-4 h-4 mr-2 mt-0.5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">笔记</div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{book.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-medium text-primary-600 dark:text-primary-400">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-primary-600 dark:bg-primary-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
