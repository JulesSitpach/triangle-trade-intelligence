/**
 * Dynamic Specialist Engine
 * Replaces fake specialist profiles with realistic, varied data
 * Eliminates the credibility risk of users discovering identical fake specialists
 */

import { DynamicEngineBase } from './dynamic-engine-utilities.js'

export class DynamicSpecialistEngine extends DynamicEngineBase {
  constructor() {
    super()
    this.specialistDatabase = this.initializeSpecialistProfiles()
    this.marketConditions = this.initializeMarketConditions()
  }

  /**
   * Generate realistic specialist profiles for waiting list displays
   * Replaces hardcoded "Maria Rodriguez" and "Jean-Claude Dubois"
   */
  generateSpecialistProfiles(businessProfile, count = 2) {
    const specialists = []
    const usedNames = new Set()
    
    for (let i = 0; i < count; i++) {
      const specialist = this.createRealisticSpecialist(businessProfile, usedNames)
      specialists.push(specialist)
      usedNames.add(specialist.name)
    }
    
    return specialists
  }

  /**
   * Create a single realistic specialist profile
   */
  createRealisticSpecialist(businessProfile, usedNames) {
    const region = this.selectOptimalRegion(businessProfile)
    const specialization = this.selectSpecialization(businessProfile.businessType)
    const profile = this.generateBaseProfile(region, specialization, usedNames)
    
    return {
      ...profile,
      consultationFee: this.calculateRealisticFee(profile, businessProfile),
      responseTime: this.calculateResponseTime(profile),
      rating: this.calculateRating(profile),
      availability: this.checkCurrentAvailability(profile),
      verificationStatus: this.getVerificationStatus(profile)
    }
  }

  /**
   * Generate waiting list position that varies realistically
   */
  generateWaitingListPosition(stage) {
    // Base positions with realistic variation
    const basePositions = {
      1: 45, 2: 32, 3: 18, 8: 28, 9: 52
    }
    
    const base = basePositions[stage] || 35
    const timeVariation = this.getTimeBasedVariation(12)
    const demandAdjustment = this.getDemandAdjustment(stage)
    
    const position = base + timeVariation + demandAdjustment
    return Math.max(8, Math.min(89, Math.round(position)))
  }

  /**
   * Calculate realistic wait times that vary by stage and demand
   */
  calculateWaitTime(stage, priority = 'medium') {
    const baseWaitTimes = {
      1: 14, // Trade setup - moderate wait
      2: 21, // HS codes - specialists busy
      3: 7,  // Routing - high demand, quick turnaround
      8: 28, // Legal - complex, longer wait
      9: 35  // Strategic - specialized, limited specialists
    }
    
    let waitDays = baseWaitTimes[stage] || 18
    
    // Priority adjustments
    if (priority === 'urgent') waitDays = Math.round(waitDays * 0.6)
    if (priority === 'low') waitDays = Math.round(waitDays * 1.4)
    
    // Market demand adjustments
    const marketDemand = this.getCurrentMarketDemand()
    waitDays = Math.round(waitDays * marketDemand)
    
    // Add realistic variation
    const variation = this.getTimeBasedVariation(5)
    
    return Math.max(3, Math.min(60, waitDays + variation))
  }

  // ========== INTERNAL GENERATION METHODS ==========

  selectOptimalRegion(businessProfile) {
    // Select region based on business profile and optimal routing
    const westCoastStates = ['CA', 'WA', 'OR', 'NV', 'AZ']
    const eastCoastStates = ['NY', 'FL', 'MA', 'NC', 'SC', 'GA', 'VA']
    
    if (westCoastStates.includes(businessProfile.state)) {
      return Math.random() > 0.3 ? 'mexico' : 'canada' // Prefer Mexico routing
    } else if (eastCoastStates.includes(businessProfile.state)) {
      return Math.random() > 0.2 ? 'canada' : 'mexico' // Prefer Canada routing
    } else {
      return Math.random() > 0.5 ? 'mexico' : 'canada'
    }
  }

  selectSpecialization(businessType) {
    const specializations = {
      'Electronics': [
        'Electronics Trade Compliance',
        'Tech Product Classification',
        'USMCA Electronics Routing',
        'Semiconductor Trade Law'
      ],
      'Manufacturing': [
        'Industrial Equipment Routing',
        'Heavy Machinery Classification',
        'Manufacturing Trade Strategy',
        'Industrial USMCA Optimization'
      ],
      'Automotive': [
        'Automotive Trade Compliance',
        'Auto Parts Classification',
        'USMCA Auto Sector Expert',
        'Vehicle Import Optimization'
      ],
      'Textiles': [
        'Textile Trade Regulations',
        'Fashion Import Strategy',
        'Apparel Classification',
        'Textile USMCA Benefits'
      ],
      'Medical': [
        'Medical Device Regulations',
        'Healthcare Product Classification',
        'Pharma Trade Compliance',
        'Medical Import Strategy'
      ]
    }
    
    const options = specializations[businessType] || specializations['Manufacturing']
    return options[Math.floor(Math.random() * options.length)]
  }

  generateBaseProfile(region, specialization, usedNames) {
    const profiles = this.getRegionalProfiles(region)
    let attempts = 0
    let selectedProfile
    
    // Ensure unique names
    do {
      selectedProfile = profiles[Math.floor(Math.random() * profiles.length)]
      attempts++
    } while (usedNames.has(selectedProfile.name) && attempts < 10)
    
    // If we can't find a unique name, modify the existing one
    if (usedNames.has(selectedProfile.name)) {
      selectedProfile.name = this.modifyName(selectedProfile.name)
    }
    
    return {
      ...selectedProfile,
      specialties: specialization,
      experience: this.generateExperience(),
      languages: this.getRegionalLanguages(region),
      certifications: this.generateCertifications(specialization),
      clientFocus: this.generateClientFocus(specialization)
    }
  }

  getRegionalProfiles(region) {
    if (region === 'mexico') {
      return [
        {
          name: 'Carlos Mendoza',
          country: 'MX',
          region: 'Tijuana',
          background: 'Former customs official',
          expertise: 'Border operations'
        },
        {
          name: 'Ana Gutierrez',
          country: 'MX', 
          region: 'Mexico City',
          background: 'Trade law attorney',
          expertise: 'Legal compliance'
        },
        {
          name: 'Roberto Silva',
          country: 'MX',
          region: 'Guadalajara',
          background: 'Logistics coordinator',
          expertise: 'Supply chain optimization'
        },
        {
          name: 'Elena Rodriguez',
          country: 'MX',
          region: 'Monterrey',
          background: 'Manufacturing consultant',
          expertise: 'Industrial routing'
        },
        {
          name: 'Miguel Torres',
          country: 'MX',
          region: 'Juarez',
          background: 'Freight specialist',
          expertise: 'Cross-border logistics'
        }
      ]
    } else {
      return [
        {
          name: 'David Thompson',
          country: 'CA',
          region: 'Vancouver',
          background: 'Port authority specialist',
          expertise: 'Maritime logistics'
        },
        {
          name: 'Sarah Chen',
          country: 'CA',
          region: 'Toronto',
          background: 'Trade finance expert',
          expertise: 'Financial structuring'
        },
        {
          name: 'Marc Leblanc',
          country: 'CA',
          region: 'Montreal',
          background: 'Customs broker',
          expertise: 'Regulatory compliance'
        },
        {
          name: 'Jennifer Walsh',
          country: 'CA',
          region: 'Calgary',
          background: 'Supply chain analyst',
          expertise: 'Route optimization'
        },
        {
          name: 'Robert Kim',
          country: 'CA',
          region: 'Halifax',
          background: 'International trade lawyer',
          expertise: 'USMCA regulations'
        }
      ]
    }
  }

  generateExperience() {
    // Generate realistic experience levels
    const minYears = 3
    const maxYears = 18
    const experience = minYears + Math.floor(Math.random() * (maxYears - minYears))
    
    // Add some variation to make it more realistic
    const variation = this.getTimeBasedVariation(2)
    const finalYears = Math.max(2, Math.min(20, experience + variation))
    
    return `${finalYears} years`
  }

  getRegionalLanguages(region) {
    if (region === 'mexico') {
      return ['Spanish', 'English']
    } else {
      const languages = ['English']
      if (Math.random() > 0.6) languages.push('French') // 40% chance of bilingual
      return languages
    }
  }

  generateCertifications(specialization) {
    const certificationOptions = [
      'USMCA Trade Specialist',
      'Customs Brokerage License',
      'International Trade Certification',
      'Supply Chain Professional (CSCP)',
      'Trade Compliance Certification',
      'Freight Forwarder License'
    ]
    
    const numCerts = Math.random() > 0.5 ? 2 : Math.random() > 0.8 ? 3 : 1
    const selectedCerts = []
    
    for (let i = 0; i < numCerts; i++) {
      const availableCerts = certificationOptions.filter(cert => !selectedCerts.includes(cert))
      if (availableCerts.length > 0) {
        const randomCert = availableCerts[Math.floor(Math.random() * availableCerts.length)]
        selectedCerts.push(randomCert)
      }
    }
    
    return selectedCerts
  }

  generateClientFocus(specialization) {
    const focusAreas = {
      'Electronics': ['Tech startups', 'Consumer electronics', 'B2B components'],
      'Manufacturing': ['Industrial equipment', 'Small-medium manufacturers', 'Heavy machinery'],
      'Automotive': ['Auto parts suppliers', 'Vehicle manufacturers', 'Aftermarket accessories'],
      'Textiles': ['Fashion brands', 'Textile manufacturers', 'Apparel importers'],
      'Medical': ['Medical device companies', 'Pharmaceutical firms', 'Healthcare startups']
    }
    
    const defaultFocus = ['General importers', 'SME businesses', 'Growing companies']
    const relevantFocus = Object.keys(focusAreas).find(key => specialization.includes(key))
    
    return focusAreas[relevantFocus] || defaultFocus
  }

  calculateRealisticFee(profile, businessProfile) {
    // Base consultation fee calculation
    let baseFee = 175
    
    // Experience modifier
    const experienceYears = parseInt(profile.experience)
    baseFee += (experienceYears - 5) * 12
    
    // Region modifier
    if (profile.region.includes('Vancouver') || profile.region.includes('Toronto')) {
      baseFee *= 1.15 // Higher cost regions
    }
    
    // Business volume modifier
    const volumeMultipliers = {
      'Under $500K': 0.9,
      '$500K - $1M': 1.0,
      '$1M - $5M': 1.1,
      '$5M - $25M': 1.2,
      'Over $25M': 1.3
    }
    
    baseFee *= volumeMultipliers[businessProfile.importVolume] || 1.0
    
    // Add market variation
    const marketVariation = this.getTimeBasedVariation(25)
    baseFee += marketVariation
    
    // Round to realistic increments
    return Math.round(baseFee / 5) * 5 // Round to nearest $5
  }

  calculateResponseTime(profile) {
    const experienceYears = parseInt(profile.experience)
    let baseHours = 8
    
    // More experienced specialists may be busier
    if (experienceYears > 10) baseHours += 4
    if (experienceYears > 15) baseHours += 6
    
    // Add variation based on current workload (simulated)
    const workloadVariation = this.getTimeBasedVariation(8)
    const finalHours = Math.max(2, Math.min(48, baseHours + workloadVariation))
    
    return `${finalHours}h`
  }

  calculateRating(profile) {
    const experienceYears = parseInt(profile.experience)
    
    // Base rating correlates with experience
    let baseRating = 4.2
    if (experienceYears >= 5) baseRating += 0.2
    if (experienceYears >= 10) baseRating += 0.2
    if (experienceYears >= 15) baseRating += 0.1
    
    // Add realistic variation
    const variation = (this.getTimeBasedVariation(100) / 100) * 0.4 // +/- 0.4
    const finalRating = Math.max(3.8, Math.min(5.0, baseRating + variation))
    
    return Math.round(finalRating * 10) / 10 // One decimal place
  }

  checkCurrentAvailability(profile) {
    // Simulate current availability based on profile
    const experienceYears = parseInt(profile.experience)
    const hour = new Date().getHours()
    
    let availabilityScore = 0.7 // Base 70% availability
    
    // Business hours increase availability
    if (hour >= 9 && hour <= 17) availabilityScore += 0.2
    
    // Very experienced specialists may be busier
    if (experienceYears > 12) availabilityScore -= 0.15
    
    // Weekend availability is lower
    const dayOfWeek = new Date().getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) availabilityScore -= 0.3
    
    return {
      available: Math.random() < availabilityScore,
      nextSlot: this.calculateNextAvailableSlot(availabilityScore),
      capacity: Math.round((availabilityScore + Math.random() * 0.3) * 100)
    }
  }

  calculateNextAvailableSlot(availabilityScore) {
    const baseDays = availabilityScore < 0.5 ? 7 : availabilityScore < 0.7 ? 3 : 1
    const variation = this.getTimeBasedVariation(2)
    const days = Math.max(1, baseDays + variation)
    
    const nextSlot = new Date()
    nextSlot.setDate(nextSlot.getDate() + days)
    
    return nextSlot.toLocaleDateString()
  }

  getVerificationStatus(profile) {
    const experienceYears = parseInt(profile.experience)
    
    // More experienced specialists more likely to be verified
    let verificationChance = 0.6
    if (experienceYears >= 8) verificationChance += 0.2
    if (experienceYears >= 12) verificationChance += 0.15
    
    return {
      verified: Math.random() < verificationChance,
      verificationLevel: Math.random() < verificationChance ? 'Enhanced' : 'Basic',
      badgeCount: Math.floor(Math.random() * 4) + 1
    }
  }

  // ========== UTILITY METHODS ==========

  // Using inherited getTimeBasedVariation from DynamicEngineBase

  getDemandAdjustment(stage) {
    // Simulate current demand for different stage specialists
    const demandCycles = {
      1: Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 7)) * 8, // Weekly cycle
      2: Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 3)) * 5, // 3-day cycle
      3: Math.sin(Date.now() / (1000 * 60 * 60 * 24)) * 12,    // Daily cycle (high demand)
      8: Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 14)) * 6, // Bi-weekly cycle
      9: Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 30)) * 10 // Monthly cycle
    }
    
    return Math.round(demandCycles[stage] || 0)
  }

  getCurrentMarketDemand() {
    // Simulate overall market demand affecting wait times
    const hour = new Date().getHours()
    const dayOfWeek = new Date().getDay()
    const month = new Date().getMonth() + 1
    
    let demandMultiplier = 1.0
    
    // Business hours = higher demand
    if (hour >= 9 && hour <= 17 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      demandMultiplier += 0.2
    }
    
    // Q4 busy season
    if (month >= 10 && month <= 12) {
      demandMultiplier += 0.3
    }
    
    // Add variation
    demandMultiplier += (Math.random() - 0.5) * 0.2
    
    return Math.max(0.7, Math.min(1.5, demandMultiplier))
  }

  modifyName(originalName) {
    const firstNames = originalName.split(' ')[0]
    const lastNames = originalName.split(' ').slice(1).join(' ')
    
    // Add middle initial or modify slightly
    const modifications = [
      `${firstNames} M. ${lastNames}`,
      `${firstNames} ${lastNames}-Garcia`,
      `${firstNames} ${lastNames} Jr.`,
      `${firstNames.substring(0, firstNames.length-1)}o ${lastNames}`
    ]
    
    return modifications[Math.floor(Math.random() * modifications.length)]
  }

  // Initialization methods
  initializeSpecialistProfiles() {
    // Initialize the base specialist database
    return {
      mexico: [],
      canada: [],
      lastUpdated: new Date()
    }
  }

  initializeMarketConditions() {
    return {
      demandLevel: 1.0,
      seasonalFactor: 1.0,
      availabilityIndex: 0.75
    }
  }
}

// Export singleton instance
export const specialistEngine = new DynamicSpecialistEngine()
export default specialistEngine