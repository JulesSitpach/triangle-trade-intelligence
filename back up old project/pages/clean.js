/**
 * CLEAN TRIANGLE INTELLIGENCE UI
 * Showcases $73B database with zero agent complexity
 */

import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function CleanTriangleIntelligence() {
  const [stats, setStats] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [routing, setRouting] = useState(null)
  const [loading, setLoading] = useState(false)

  // Load database stats on mount
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/clean-stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const searchProducts = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/clean-products?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (data.success) {
        setSearchResults(data.results)
      }
    } catch (error) {
      console.error('Search failed:', error)
    }
    setLoading(false)
  }

  const findRoutes = async (product, origin = 'China') => {
    setLoading(true)
    try {
      const response = await fetch('/api/clean-routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, origin })
      })
      const data = await response.json()
      if (data.success) {
        setRouting(data.results)
      }
    } catch (error) {
      console.error('Routing failed:', error)
    }
    setLoading(false)
  }

  const formatValue = (value) => {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value}`
  }

  return (
    <>
      <Head>
        <title>Clean Triangle Intelligence - Real $73B Trade Database</title>
        <meta name="description" content="Direct access to $73B+ trade intelligence database" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Triangle Intelligence
            </h1>
            <p className="mt-2 text-gray-600">
              Direct access to {stats ? formatValue(stats.database.totalTradeValue) : '$73B+'} trade database • {stats?.database.totalRecords || 738} real trade flows
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          
          {/* Database Stats */}
          {stats && (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">Trade Records</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.database.totalRecords.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">Total Trade Value</h3>
                <p className="text-3xl font-bold text-green-600">{formatValue(stats.database.totalTradeValue)}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">Triangle Routes</h3>
                <p className="text-3xl font-bold text-purple-600">{stats.triangleRouting.stage1 + stats.triangleRouting.stage2}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">Direct Routes</h3>
                <p className="text-3xl font-bold text-orange-600">{stats.triangleRouting.direct}</p>
              </div>
            </div>
          )}

          {/* Product Search */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">🔍 Search Trade Database</h2>
            
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products (e.g., electronic, automotive, steel)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && searchProducts(searchQuery)}
              />
              <button
                onClick={() => searchProducts(searchQuery)}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Found {searchResults.length} products:</h3>
                {searchResults.slice(0, 8).map((product, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded border hover:bg-gray-100">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {product.product_description}
                      </p>
                      <p className="text-sm text-gray-600">
                        HS {product.hs_code} • {product.reporter_country} → {product.partner_country}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatValue(product.trade_value)}</p>
                      <button
                        onClick={() => findRoutes(product.product_description, product.reporter_country)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Find Routes →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Triangle Routing Results */}
          {routing && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">🔺 Triangle Routing Analysis</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded">
                  <p className="text-sm text-blue-600">Total Routes</p>
                  <p className="text-2xl font-bold text-blue-800">{routing.total}</p>
                </div>
                <div className="p-4 bg-green-50 rounded">
                  <p className="text-sm text-green-600">Stage 1 (Asia→USMCA)</p>
                  <p className="text-2xl font-bold text-green-800">{routing.triangleRoutes}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded">
                  <p className="text-sm text-purple-600">Stage 2 (USMCA→USA)</p>
                  <p className="text-2xl font-bold text-purple-800">{routing.finalRoutes}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded">
                  <p className="text-sm text-orange-600">Direct Routes</p>
                  <p className="text-2xl font-bold text-orange-800">{routing.directRoutes}</p>
                </div>
              </div>

              {routing.totalSavings > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-lg font-bold text-yellow-800">
                    💰 Total USMCA Savings Potential: {formatValue(routing.totalSavings)}
                  </p>
                </div>
              )}

              {routing.routes.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Route Details:</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {routing.routes.map((route, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded text-sm">
                        <div>
                          <p className="font-medium">
                            {route.reporter_country} → {route.partner_country}
                          </p>
                          <p className="text-gray-600">
                            Stage: {route.triangle_stage} • {route.route_recommendation}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatValue(route.trade_value)}</p>
                          {route.estimated_usmca_savings > 0 && (
                            <p className="text-green-600">Save: {formatValue(route.estimated_usmca_savings)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Examples */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold mb-3">💡 Try these searches:</h3>
            <div className="flex flex-wrap gap-2">
              {['electronic', 'automotive', 'steel', 'textile', 'machinery'].map(term => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchQuery(term)
                    searchProducts(term)
                  }}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}