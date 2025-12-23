'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { BookOpen, Plus, Edit2, Trash2, Save, X } from 'lucide-react'

export default function BooksPage() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    total_pages: '',
    current_page: 0,
    status: 'reading'
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
      if (editingId) {
        const { error } = await supabase
          .from('books')
          .update({
            ...formData,
            total_pages: parseInt(formData.total_pages),
            current_page: parseInt(formData.current_page)
          })
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('books')
          .insert([{
            ...formData,
            total_pages: parseInt(formData.total_pages),
            current_page: parseInt(formData.current_page)
          }])
        if (error) throw error
      }
      
      resetForm()
      fetchBooks()
    } catch (error) {
      console.error('Error saving book:', error)
      alert('Error saving book. Please make sure the books table exists in Supabase.')
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
      title: book.title,
      author: book.author,
      total_pages: book.total_pages.toString(),
      current_page: book.current_page,
      status: book.status
    })
    setEditingId(book.id)
    setShowForm(true)
  }

  function resetForm() {
    setFormData({
      title: '',
      author: '',
      total_pages: '',
      current_page: 0,
      status: 'reading'
    })
    setEditingId(null)
    setShowForm(false)
  }

  function calculateProgress(current, total) {
    return Math.round((current / total) * 100)
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Books Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your reading progress</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="text-sm text-gray-600">Total Books</div>
          <div className="text-3xl font-bold text-primary-600">{books.length}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-600">Currently Reading</div>
          <div className="text-3xl font-bold text-green-600">
            {books.filter(b => b.status === 'reading').length}
          </div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-3xl font-bold text-purple-600">
            {books.filter(b => b.status === 'completed').length}
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">
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
                <label className="label">Total Pages *</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="input-field"
                  value={formData.total_pages}
                  onChange={(e) => setFormData({ ...formData, total_pages: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Current Page</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  value={formData.current_page}
                  onChange={(e) => setFormData({ ...formData, current_page: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="input-field"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="to-read">To Read</option>
                  <option value="reading">Reading</option>
                  <option value="completed">Completed</option>
                </select>
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
          <div className="card p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No books yet</h3>
            <p className="text-gray-600 mb-4">Start tracking your reading journey by adding your first book</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Add Your First Book
            </button>
          </div>
        ) : (
          books.map((book) => {
            const progress = calculateProgress(book.current_page, book.total_pages)
            return (
              <div key={book.id} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{book.title}</h3>
                    <p className="text-gray-600">by {book.author}</p>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{book.current_page} / {book.total_pages} pages</span>
                      <span className="capitalize px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                        {book.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(book)}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(book.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-primary-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
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
