/**
 * Transparent Classification Demo
 * Shows the fallback system in action
 */

import { useState } from 'react'

export default function TransparentClassificationDemo() {
  const [productInput, setProductInput] = useState('')
  const [classification, setClassification] = useState(null)
  const [loading, setLoading] = useState(false)
  const [userHSCode, setUserHSCode] = useState('')
  const [showImprovement, setShowImprovement] = useState(false)

  const testProducts = [
    'Solar microinverters',
    'Bluetooth headphones', 
    'Medical syringes',
    'Car brake pads',
    'Cotton t-shirts',
    'Steel pipes',
    'Unknown product XYZ123'
  ]

  const classifyProduct = async (product, hsCode = null) => {
    setLoading(true)
    try {
      const response = await fetch('/api/intelligent-classification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDescription: product,
          userHSCode: hsCode,
          businessType: 'Manufacturing'
        })
      })
      
      const result = await response.json()
      setClassification(result)
      setShowImprovement(result.userOptions?.canImprove && !hsCode)
    } catch (error) {
      console.error('Classification failed:', error)
    }
    setLoading(false)
  }

  const handleUserImprovement = async () => {
    if (!userHSCode.trim()) return
    await classifyProduct(productInput, userHSCode.trim())
    setShowImprovement(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🎯 Transparent HS Classification Demo
      </h2>
      
      {/* Product Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Description
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={productInput}
            onChange={(e) => setProductInput(e.target.value)}
            placeholder="Enter product description..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => classifyProduct(productInput)}
            disabled={loading || !productInput.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Classifying...' : 'Classify'}
          </button>
        </div>
        
        {/* Quick Test Buttons */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Quick tests:</span>
          {testProducts.map(product => (
            <button
              key={product}
              onClick={() => {
                setProductInput(product)
                classifyProduct(product)
              }}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              {product}
            </button>
          ))}
        </div>
      </div>

      {/* Classification Results */}
      {classification && (
        <div className="space-y-4">
          
          {/* Main Classification */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-blue-800">
                Classification Result
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                classification.classification.confidence === 'high' 
                  ? 'bg-green-100 text-green-800'
                  : classification.classification.confidence === 'medium'
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {classification.classification.confidence} confidence
              </span>
            </div>
            
            <p className="text-blue-700 mb-2">
              <strong>{classification.classification.message}</strong>
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Industry:</strong> {classification.classification.industry}
              </div>
              <div>
                <strong>HS Code Range:</strong> {classification.classification.hsCodeRange}
              </div>
              <div>
                <strong>Fallback HS:</strong> {classification.classification.hsCode}
              </div>
              <div>
                <strong>Description:</strong> {classification.classification.description}
              </div>
            </div>
            
            {classification.classification.matchedKeywords?.length > 0 && (
              <div className="mt-2">
                <strong>Matched keywords:</strong> {classification.classification.matchedKeywords.join(', ')}
              </div>
            )}
          </div>

          {/* Trade Intelligence */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Trade Intelligence
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Trade Value:</strong> ${(classification.tradeIntelligence?.tradeValue / 1000000)?.toFixed(1)}M
              </div>
              <div>
                <strong>Savings Potential:</strong> ${(classification.tradeIntelligence?.savingsPotential / 1000000)?.toFixed(1)}M
              </div>
            </div>
            
            {classification.tradeIntelligence?.routes && (
              <div className="mt-2">
                <strong>Triangle Routes:</strong>
                <ul className="list-disc list-inside ml-2">
                  {classification.tradeIntelligence.routes.map((route, i) => (
                    <li key={i} className="text-green-700">{route}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Transparency Notes */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              🔍 Transparency & Accuracy
            </h3>
            
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Data Source:</strong> {classification.transparency.dataSource}</p>
              <p><strong>Accuracy:</strong> {classification.transparency.accuracyNote}</p>
              <p><strong>Trade Data:</strong> {classification.transparency.tradeDataNote}</p>
              <p><strong>Learning:</strong> {classification.transparency.improvementNote}</p>
            </div>
          </div>

          {/* User Improvement Section */}
          {showImprovement && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                💡 Help Us Improve
              </h3>
              
              <p className="text-yellow-700 mb-3">
                {classification.userOptions.improvementMessage}
              </p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userHSCode}
                  onChange={(e) => setUserHSCode(e.target.value)}
                  placeholder={classification.userOptions.placeholder}
                  className="flex-1 px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <button
                  onClick={handleUserImprovement}
                  disabled={!userHSCode.trim()}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                >
                  Use This HS Code
                </button>
              </div>
              
              <button
                onClick={() => setShowImprovement(false)}
                className="mt-2 text-sm text-yellow-600 hover:text-yellow-800"
              >
                Continue with fallback data →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}