// Static dropdown options to replace complex database queries
// Provides reliable hardcoded business types, countries, and import volumes

export default function handler(req, res) {
  try {
    const options = {
      businessTypes: [
        { value: 'Electronics', label: 'Electronics & Technology', description: 'Consumer electronics, computers, telecommunications equipment' },
        { value: 'Manufacturing', label: 'Manufacturing & Industrial', description: 'Industrial equipment, machinery, tools' },
        { value: 'Medical', label: 'Medical & Healthcare', description: 'Medical devices, pharmaceuticals, healthcare products' },
        { value: 'Automotive', label: 'Automotive & Transportation', description: 'Auto parts, vehicles, transportation equipment' },
        { value: 'Textiles', label: 'Textiles & Apparel', description: 'Clothing, fabrics, footwear, accessories' },
        { value: 'Food', label: 'Food & Beverages', description: 'Food products, beverages, agricultural goods' },
        { value: 'Construction', label: 'Construction & Materials', description: 'Building materials, construction equipment' },
        { value: 'Energy', label: 'Energy & Resources', description: 'Energy equipment, oil & gas, renewable energy' },
        { value: 'Chemicals', label: 'Chemicals & Materials', description: 'Chemical products, plastics, raw materials' },
        { value: 'Retail', label: 'Retail & Consumer Goods', description: 'Consumer products, retail merchandise' }
      ],
      
      countries: [
        'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia',
        'Austria', 'Bangladesh', 'Belgium', 'Brazil', 'Canada',
        'Chile', 'China', 'Colombia', 'Denmark', 'Egypt',
        'France', 'Germany', 'Ghana', 'Greece', 'Hong Kong',
        'India', 'Indonesia', 'Ireland', 'Israel', 'Italy',
        'Japan', 'Jordan', 'Kenya', 'Malaysia', 'Mexico',
        'Morocco', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway',
        'Pakistan', 'Peru', 'Philippines', 'Poland', 'Portugal',
        'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea',
        'Spain', 'Sweden', 'Switzerland', 'Taiwan', 'Thailand',
        'Turkey', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
        'United States', 'Vietnam'
      ],
      
      importVolumes: [
        { value: 'Under $500K', label: 'Under $500K annually', description: 'Small business imports' },
        { value: '$500K - $1M', label: '$500K - $1M annually', description: 'Growing business imports' },
        { value: '$1M - $5M', label: '$1M - $5M annually', description: 'Mid-size business imports' },
        { value: '$5M - $25M', label: '$5M - $25M annually', description: 'Large business imports' },
        { value: 'Over $25M', label: 'Over $25M annually', description: 'Enterprise-level imports' }
      ],
      
      optimizationPriorities: [
        { value: 'cost_savings', label: 'Cost Savings', description: 'Focus on reducing tariff costs' },
        { value: 'time_efficiency', label: 'Time Efficiency', description: 'Faster delivery and processing' },
        { value: 'risk_reduction', label: 'Risk Reduction', description: 'Diversify supply chain risk' },
        { value: 'compliance', label: 'Compliance', description: 'Ensure regulatory compliance' },
        { value: 'sustainability', label: 'Sustainability', description: 'Environmentally friendly routing' }
      ]
    }

    // Add response headers for reliability
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.setHeader('Content-Type', 'application/json')
    
    res.status(200).json(options)
    
  } catch (error) {
    console.error('Simple dropdown options error:', error)
    
    // Fallback minimal options
    res.status(200).json({
      businessTypes: [
        { value: 'Electronics', label: 'Electronics', description: 'Electronics' },
        { value: 'Manufacturing', label: 'Manufacturing', description: 'Manufacturing' },
        { value: 'Other', label: 'Other', description: 'Other business type' }
      ],
      countries: [
        'Australia', 'Brazil', 'Canada', 'China', 'Germany',
        'India', 'Italy', 'Japan', 'South Korea', 'Mexico',
        'Malaysia', 'Netherlands', 'Singapore', 'Thailand',
        'Turkey', 'United Kingdom', 'United States', 'Vietnam'
      ],
      importVolumes: [
        { value: 'Under $500K', label: 'Under $500K', description: 'Small volume' },
        { value: '$1M - $5M', label: '$1M - $5M', description: 'Medium volume' },
        { value: 'Over $25M', label: 'Over $25M', description: 'Large volume' }
      ],
      optimizationPriorities: [
        { value: 'cost_savings', label: 'Cost Savings', description: 'Focus on costs' }
      ]
    })
  }
}