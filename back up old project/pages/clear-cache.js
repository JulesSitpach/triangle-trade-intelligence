import { useEffect } from 'react'
import Link from 'next/link'

export default function ClearCachePage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clear all Triangle Intelligence cache
      const keysToRemove = [
        // Legacy stage keys (for backward compatibility)
        'triangle-stage1',
        'triangle-stage2', 
        'triangle-stage3',
        'triangle-stage4',
        'triangle-stage8',
        'triangle-stage9',
        'triangle-stage2-products',
        // New semantic page keys
        'triangle-foundation',
        'triangle-product',
        'triangle-routing',
        'triangle-partnership',
        'triangle-hindsight',
        'triangle-alerts',
        'triangle-product-classifications',
        // System keys
        'triangle-derived',
        'triangle-hs-learning',
        'triangle-data-version'
      ]
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log(`🗑️ Cleared: ${key}`)
      })
      
      // Clear browser caches if available
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name)
            console.log(`🧹 Cleared cache: ${name}`)
          })
        })
      }
      
      console.log('✅ All Triangle Intelligence cache cleared!')
    }
  }, [])

  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <h1>🧹 Cache Cleared Successfully!</h1>
      <p style={{ margin: '2rem 0', color: '#666' }}>
        All Triangle Intelligence localStorage and browser cache has been cleared.
        You can now start fresh with a clean data flow.
      </p>
      
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link href="/foundation" style={{
          padding: '1rem 2rem',
          background: '#059669',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '0.5rem'
        }}>
          Start Fresh → Foundation
        </Link>
        
        <Link href="/" style={{
          padding: '1rem 2rem', 
          background: '#6b7280',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '0.5rem'
        }}>
          ← Home
        </Link>
      </div>
      
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: '#f0fdf4', 
        border: '1px solid #059669',
        borderRadius: '0.5rem',
        fontSize: '0.875rem'
      }}>
        <strong>What was cleared:</strong>
        <ul style={{ textAlign: 'left', margin: '0.5rem 0' }}>
          <li>All stage data (Stage 1-9)</li>
          <li>Product suggestions cache</li>
          <li>HS code learning data</li>
          <li>Browser API cache</li>
          <li>Data version markers</li>
        </ul>
      </div>
    </div>
  )
}