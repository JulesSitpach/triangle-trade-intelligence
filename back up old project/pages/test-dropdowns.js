import { useState, useEffect } from 'react'

export default function TestDropdowns() {
  const [businessTypeOptions, setBusinessTypeOptions] = useState([])
  const [dropdownsLoading, setDropdownsLoading] = useState(true)

  useEffect(() => {
    loadDropdownOptions()
  }, [])

  const loadDropdownOptions = async () => {
    try {
      console.log('🔄 Loading dropdown options...')
      setDropdownsLoading(true)
      
      const response = await fetch('/api/dropdown-options')
      const data = await response.json()
      
      console.log('📊 API Response:', data)
      
      if (data.businessTypes && data.businessTypes.length > 0) {
        setBusinessTypeOptions(data.businessTypes)
        console.log(`✅ Loaded ${data.businessTypes.length} business types`)
      }
      
    } catch (error) {
      console.error('❌ Failed to load dropdowns:', error)
    } finally {
      setDropdownsLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dropdown Test Page</h1>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Status:</strong> {dropdownsLoading ? 'Loading...' : 'Loaded'}
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Options Count:</strong> {businessTypeOptions.length}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label>Business Type:</label>
        <select disabled={dropdownsLoading}>
          <option value="">
            {dropdownsLoading ? 'Loading...' : 'Select business type'}
          </option>
          {businessTypeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.description || option.label}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <h3>Raw Data:</h3>
        <pre style={{ background: '#f5f5f5', padding: '1rem', fontSize: '12px' }}>
          {JSON.stringify(businessTypeOptions.slice(0, 2), null, 2)}
        </pre>
      </div>

      <button onClick={loadDropdownOptions} style={{ marginTop: '1rem' }}>
        Reload Dropdowns
      </button>
    </div>
  )
}