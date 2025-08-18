/**
 * TRANSLATION MANAGEMENT INTERFACE
 * Professional translation administration for non-developers
 * Real-time database updates without deployment
 */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import { getSupabaseClient } from '../lib/supabase-client'
import DatabaseLanguageSwitcher from '../components/DatabaseLanguageSwitcher'

export default function TranslationAdmin() {
  const [translations, setTranslations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [editingId, setEditingId] = useState(null)
  const [newTranslation, setNewTranslation] = useState({ key: '', value: '', context: '' })

  const supabase = getSupabaseClient()

  useEffect(() => {
    loadTranslations()
  }, [selectedLanguage])

  const loadTranslations = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('translations')
        .select('*')
        .eq('language', selectedLanguage)
        .order('key')
        .limit(50)

      if (error) throw error

      setTranslations(data || [])
    } catch (error) {
      console.error('Failed to load translations:', error)
      alert('Failed to load translations: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateTranslation = async (id, newValue) => {
    try {
      setSaving(true)

      const { error } = await supabase
        .from('translations')
        .update({ 
          value: newValue,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)

      if (error) throw error

      // Update local state
      setTranslations(prev => 
        prev.map(t => t.id === id ? { ...t, value: newValue } : t)
      )

      setEditingId(null)
      console.log('Translation updated successfully')

    } catch (error) {
      console.error('Failed to update translation:', error)
      alert('Failed to update translation: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const addNewTranslation = async () => {
    try {
      if (!newTranslation.key || !newTranslation.value) {
        alert('Please provide both key and value')
        return
      }

      setSaving(true)

      const { error } = await supabase
        .from('translations')
        .insert({
          key: newTranslation.key,
          language: selectedLanguage,
          value: newTranslation.value,
          context: newTranslation.context || 'Added via admin',
          created_at: new Date().toISOString()
        })

      if (error) throw error

      setNewTranslation({ key: '', value: '', context: '' })
      await loadTranslations()
      
      console.log('Translation added successfully')

    } catch (error) {
      console.error('Failed to add translation:', error)
      alert('Failed to add translation: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredTranslations = translations.filter(t => 
    t.key.toLowerCase().includes(filter.toLowerCase()) ||
    t.value.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <>
      <Head>
        <title>Translation Management - Triangle Intelligence</title>
        <meta name="description" content="Professional translation management interface" />
      </Head>

      <div className="admin-container">
        <div className="admin-header">
          <h1>🌍 Translation Management</h1>
          <p>Professional translation administration for Triangle Intelligence Platform</p>
          
          <div className="admin-controls">
            <DatabaseLanguageSwitcher />
            <select 
              value={selectedLanguage} 
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="language-select"
            >
              <option value="en">🇺🇸 English</option>
              <option value="es">🇲🇽 Español</option>
              <option value="fr">🇨🇦 Français</option>
            </select>
          </div>
        </div>

        <div className="admin-stats">
          <div className="stat-item">
            <div className="stat-value">{translations.length}</div>
            <div className="stat-label">Translations Loaded</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{selectedLanguage.toUpperCase()}</div>
            <div className="stat-label">Current Language</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{filteredTranslations.length}</div>
            <div className="stat-label">Filtered Results</div>
          </div>
        </div>

        <div className="filter-section">
          <input
            type="text"
            placeholder="🔍 Search translations by key or value..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="add-section">
          <h3>➕ Add New Translation</h3>
          <div className="add-form">
            <input
              type="text"
              placeholder="Translation key (e.g., common.save)"
              value={newTranslation.key}
              onChange={(e) => setNewTranslation(prev => ({...prev, key: e.target.value}))}
              className="add-input"
            />
            <input
              type="text"
              placeholder="Translation value"
              value={newTranslation.value}
              onChange={(e) => setNewTranslation(prev => ({...prev, value: e.target.value}))}
              className="add-input"
            />
            <input
              type="text"
              placeholder="Context (optional)"
              value={newTranslation.context}
              onChange={(e) => setNewTranslation(prev => ({...prev, context: e.target.value}))}
              className="add-input"
            />
            <button 
              onClick={addNewTranslation}
              disabled={saving}
              className="add-btn"
            >
              {saving ? 'Adding...' : 'Add Translation'}
            </button>
          </div>
        </div>

        <div className="translations-section">
          <h3>📝 Current Translations ({selectedLanguage.toUpperCase()})</h3>
          
          {loading ? (
            <div className="loading">Loading translations...</div>
          ) : (
            <div className="translations-grid">
              {filteredTranslations.map(translation => (
                <div key={translation.id} className="translation-card">
                  <div className="translation-key">
                    <code>{translation.key}</code>
                  </div>
                  
                  {editingId === translation.id ? (
                    <div className="edit-form">
                      <input
                        type="text"
                        defaultValue={translation.value}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateTranslation(translation.id, e.target.value)
                          }
                          if (e.key === 'Escape') {
                            setEditingId(null)
                          }
                        }}
                        className="edit-input"
                        autoFocus
                      />
                      <div className="edit-buttons">
                        <button 
                          onClick={(e) => {
                            const input = e.target.parentElement.previousElementSibling
                            updateTranslation(translation.id, input.value)
                          }}
                          disabled={saving}
                          className="save-btn"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="cancel-btn"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="translation-value">
                      <div className="value-text">{translation.value}</div>
                      <button 
                        onClick={() => setEditingId(translation.id)}
                        className="edit-btn"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  )}
                  
                  {translation.context && (
                    <div className="translation-context">
                      Context: {translation.context}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-actions">
          <button onClick={loadTranslations} disabled={loading} className="refresh-btn">
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
          <a href="/translation-test" className="test-btn">
            🧪 Test Translations
          </a>
          <a href="/stage1" className="continue-btn">
            ✅ Continue to Platform
          </a>
        </div>
      </div>

      <style jsx>{`
        .admin-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          font-family: var(--font-sans);
        }

        .admin-header {
          text-align: center;
          margin-bottom: 2rem;
          padding: 2rem;
          background: linear-gradient(135deg, #1e293b, #334155);
          color: white;
          border-radius: 1rem;
        }

        .admin-header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
        }

        .admin-header p {
          margin: 0 0 1.5rem 0;
          opacity: 0.9;
        }

        .admin-controls {
          display: flex;
          justify-content: center;
          gap: 1rem;
          align-items: center;
        }

        .language-select {
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          border: 1px solid #cbd5e1;
          font-weight: 600;
        }

        .admin-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-item {
          padding: 1.5rem;
          background: white;
          border-radius: 0.75rem;
          border: 2px solid #e2e8f0;
          text-align: center;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          color: #64748b;
          font-weight: 500;
        }

        .filter-section {
          margin-bottom: 2rem;
        }

        .filter-input {
          width: 100%;
          padding: 1rem;
          font-size: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.5rem;
          transition: border-color 0.2s;
        }

        .filter-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .add-section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
        }

        .add-section h3 {
          margin: 0 0 1rem 0;
          color: #1e293b;
        }

        .add-form {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 1rem;
          align-items: end;
        }

        .add-input {
          padding: 0.75rem;
          border: 1px solid #cbd5e1;
          border-radius: 0.5rem;
          font-size: 0.9rem;
        }

        .add-btn {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: white;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 600;
          white-space: nowrap;
        }

        .add-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .add-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .translations-section h3 {
          margin-bottom: 1rem;
          color: #1e293b;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: #64748b;
          font-style: italic;
        }

        .translations-grid {
          display: grid;
          gap: 1rem;
        }

        .translation-card {
          padding: 1.5rem;
          background: white;
          border-radius: 0.75rem;
          border: 2px solid #e2e8f0;
          transition: all 0.2s;
        }

        .translation-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .translation-key {
          margin-bottom: 1rem;
        }

        .translation-key code {
          background: #f1f5f9;
          padding: 0.4rem 0.8rem;
          border-radius: 0.375rem;
          font-family: var(--font-mono);
          color: #1e293b;
          font-weight: 600;
        }

        .translation-value {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .value-text {
          flex: 1;
          font-size: 1.1rem;
          color: #1e293b;
          line-height: 1.5;
        }

        .edit-btn {
          padding: 0.5rem 1rem;
          background: #f59e0b;
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        .edit-form {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .edit-input {
          padding: 0.75rem;
          border: 2px solid #3b82f6;
          border-radius: 0.375rem;
          font-size: 1rem;
        }

        .edit-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .save-btn, .cancel-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          font-weight: 600;
        }

        .save-btn {
          background: #16a34a;
          color: white;
        }

        .cancel-btn {
          background: #6b7280;
          color: white;
        }

        .translation-context {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
          font-size: 0.875rem;
          color: #64748b;
          font-style: italic;
        }

        .admin-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 2px solid #e2e8f0;
        }

        .refresh-btn, .test-btn, .continue-btn {
          padding: 1rem 2rem;
          border-radius: 0.75rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
          font-size: 1rem;
        }

        .refresh-btn {
          background: linear-gradient(135deg, #6b7280, #4b5563);
          color: white;
        }

        .test-btn {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
        }

        .continue-btn {
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: white;
        }

        .refresh-btn:hover, .test-btn:hover, .continue-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 768px) {
          .admin-container {
            padding: 1rem;
          }
          
          .admin-controls {
            flex-direction: column;
          }
          
          .add-form {
            grid-template-columns: 1fr;
          }
          
          .admin-actions {
            flex-direction: column;
          }
          
          .translation-value {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </>
  )
}