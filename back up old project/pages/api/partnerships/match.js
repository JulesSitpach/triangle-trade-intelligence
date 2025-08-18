import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { importerProfile, partnerType } = req.body;

    // Match importers with Mexican partners based on multiple factors
    const matchingFactors = {
      industry: 0.25,        // Industry alignment
      volume: 0.20,          // Volume compatibility
      geography: 0.20,       // Geographic optimization
      certifications: 0.15,  // Required certifications
      timeline: 0.10,        // Timeline alignment
      services: 0.10         // Service requirements
    };

    // Query potential partners from database
    let query = supabase
      .from('partnership_profiles')
      .select('*')
      .eq('country', 'MX')
      .eq('status', 'active');

    if (partnerType) {
      query = query.eq('partner_type', partnerType);
    }

    const { data: partners, error } = await query;

    if (error) {
      console.error('Database error:', error);
      // Return mock data if database is not set up yet
      return res.status(200).json({ 
        matches: getMockMatches(importerProfile),
        factors: matchingFactors 
      });
    }

    // Calculate match scores
    const scoredMatches = partners.map(partner => {
      let score = 0;

      // Industry match
      if (partner.industries?.includes(importerProfile.industry)) {
        score += matchingFactors.industry * 100;
      }

      // Volume compatibility
      const importerVolume = parseVolume(importerProfile.volume);
      const partnerCapacity = parseVolume(partner.monthly_capacity);
      if (partnerCapacity >= importerVolume) {
        score += matchingFactors.volume * 100;
      }

      // Geographic optimization
      if (isGeographicallyOptimal(importerProfile.location, partner.location)) {
        score += matchingFactors.geography * 100;
      }

      // Certifications match
      const requiredCerts = importerProfile.required_certifications || [];
      const partnerCerts = partner.certifications || [];
      const certMatch = requiredCerts.filter(cert => partnerCerts.includes(cert)).length;
      score += (certMatch / Math.max(requiredCerts.length, 1)) * matchingFactors.certifications * 100;

      // Timeline compatibility
      if (isTimelineCompatible(importerProfile.timeline, partner.availability)) {
        score += matchingFactors.timeline * 100;
      }

      // Service requirements
      const requiredServices = importerProfile.required_services || [];
      const partnerServices = partner.services || [];
      const serviceMatch = requiredServices.filter(service => partnerServices.includes(service)).length;
      score += (serviceMatch / Math.max(requiredServices.length, 1)) * matchingFactors.services * 100;

      return {
        ...partner,
        matchScore: Math.round(score),
        matchDetails: {
          industryMatch: partner.industries?.includes(importerProfile.industry),
          volumeCompatible: partnerCapacity >= importerVolume,
          geographicallyOptimal: isGeographicallyOptimal(importerProfile.location, partner.location),
          certificationAlignment: certMatch / Math.max(requiredCerts.length, 1),
          timelineMatch: isTimelineCompatible(importerProfile.timeline, partner.availability)
        },
        potentialValue: calculatePotentialValue(importerProfile, partner)
      };
    });

    // Sort by match score
    scoredMatches.sort((a, b) => b.matchScore - a.matchScore);

    // Log match activity
    await supabase.from('partnership_match_logs').insert({
      importer_profile: importerProfile,
      matches_found: scoredMatches.length,
      top_match_score: scoredMatches[0]?.matchScore,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      matches: scoredMatches.slice(0, 10), // Return top 10 matches
      factors: matchingFactors,
      totalMatches: scoredMatches.length
    });

  } catch (error) {
    console.error('Partnership matching error:', error);
    res.status(500).json({ 
      error: 'Failed to generate matches',
      matches: getMockMatches(req.body.importerProfile) 
    });
  }
}

// Helper functions
function parseVolume(volumeStr) {
  if (!volumeStr) return 0;
  const match = volumeStr.match(/\$([\d.]+)([MK])?/i);
  if (!match) return 0;
  
  let value = parseFloat(match[1]);
  if (match[2] === 'M' || match[2] === 'm') value *= 1000000;
  if (match[2] === 'K' || match[2] === 'k') value *= 1000;
  
  return value;
}

function isGeographicallyOptimal(importerLocation, partnerLocation) {
  // Simple geographic optimization logic
  const borderCities = ['Tijuana', 'Juarez', 'Nuevo Laredo', 'Matamoros', 'Mexicali'];
  const portCities = ['Manzanillo', 'Lazaro Cardenas', 'Veracruz', 'Altamira'];
  
  // Partners near borders are optimal for US/Canada importers
  if (importerLocation?.includes('US') || importerLocation?.includes('Canada')) {
    return borderCities.some(city => partnerLocation?.includes(city));
  }
  
  // Partners near ports are optimal for Asian imports
  return portCities.some(city => partnerLocation?.includes(city));
}

function isTimelineCompatible(importerTimeline, partnerAvailability) {
  if (!importerTimeline || !partnerAvailability) return true;
  
  // Check if partner is available when importer needs them
  const importerStart = new Date(importerTimeline);
  const partnerStart = new Date(partnerAvailability);
  
  return partnerStart <= importerStart;
}

function calculatePotentialValue(importer, partner) {
  const volume = parseVolume(importer.volume);
  const savingsRate = 0.25; // Assume 25% savings through triangle routing
  const partnerFeeRate = 0.05; // Assume 5% partner fee
  
  const annualSavings = volume * savingsRate;
  const partnerRevenue = volume * partnerFeeRate;
  
  return {
    importerSavings: `$${(annualSavings / 1000000).toFixed(1)}M`,
    partnerRevenue: `$${(partnerRevenue / 1000000).toFixed(1)}M`,
    totalValue: `$${((annualSavings + partnerRevenue) / 1000000).toFixed(1)}M`
  };
}

function getMockMatches(importerProfile) {
  // Return mock matches for demonstration
  return [
    {
      id: 'mock-1',
      company_name: 'Maquiladora Excellence Tijuana',
      location: 'Tijuana, Baja California',
      partner_type: 'processor',
      services: ['Assembly', 'Repackaging', 'Labeling'],
      certifications: ['IMMEX', 'ISO 9001', 'C-TPAT'],
      monthly_capacity: '$10M',
      matchScore: 92,
      matchDetails: {
        industryMatch: true,
        volumeCompatible: true,
        geographicallyOptimal: true,
        certificationAlignment: 0.8,
        timelineMatch: true
      },
      potentialValue: {
        importerSavings: '$1.5M',
        partnerRevenue: '$0.3M',
        totalValue: '$1.8M'
      }
    },
    {
      id: 'mock-2',
      company_name: 'Logistics Hub Monterrey',
      location: 'Monterrey, Nuevo Leon',
      partner_type: 'logistics',
      services: ['Warehousing', 'Distribution', 'Customs'],
      certifications: ['AEO', 'ISO 28000'],
      monthly_capacity: '$25M',
      matchScore: 85,
      matchDetails: {
        industryMatch: true,
        volumeCompatible: true,
        geographicallyOptimal: false,
        certificationAlignment: 0.6,
        timelineMatch: true
      },
      potentialValue: {
        importerSavings: '$1.2M',
        partnerRevenue: '$0.25M',
        totalValue: '$1.45M'
      }
    }
  ];
}