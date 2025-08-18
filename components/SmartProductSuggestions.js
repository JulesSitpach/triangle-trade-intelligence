import { useState, useEffect } from 'react'

export default function SmartProductSuggestions({ businessType, experienceLevel, onAddProduct }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        setLoading(true)
        // console.log('🔍 Loading product suggestions for:', businessType)
        
        const response = await fetch('/api/product-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessType })
        })
        
        if (response.ok) {
          const { products } = await response.json()
          // console.log('✅ Loaded product suggestions:', products?.length)
          setSuggestions(products?.slice(0, 6) || [])
        } else {
          console.warn('⚠️ Failed to load product suggestions')
          setSuggestions([])
        }
      } catch (error) {
        console.error('❌ Product suggestions error:', error)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }

    if (businessType) {
      loadSuggestions()
    }
  }, [businessType])

  return (
    <div className="card product-suggestions">
      <h3>💡 Common {businessType} Products</h3>
      <p className="subtitle">
        Based on {experienceLevel} importers in your industry:
      </p>
      
      <div className="product-buttons">
        {loading ? (
          <div className="loading-state">
            Loading product suggestions...
          </div>
        ) : suggestions.length > 0 ? (
          suggestions.map((product, index) => (
            <button 
              key={index}
              onClick={() => onAddProduct(product.description)}
              className="product-suggestion-btn"
            >
              {product.description}
            </button>
          ))
        ) : (
          <div className="no-suggestions">
            No product suggestions available for {businessType}
          </div>
        )}
      </div>
      
      <div className="triangle-context">
        🔺 <strong>Triangle Route:</strong> Asia → Mexico → Canada (USMCA Triangle) • 
        <strong> Compliance:</strong> High level required
      </div>
    </div>
  )
}