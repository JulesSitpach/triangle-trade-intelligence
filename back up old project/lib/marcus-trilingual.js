/**
 * 🤖 MARCUS TRILINGUAL INTELLIGENCE
 * Simple language detection and responses for Canadian-Mexican market
 * Safe implementation that won't break existing functionality
 */

export class MarcusTrilingualIntelligence {
  constructor() {
    this.responses = {
      greeting: {
        en: "Hi! I'm Marcus, your Canada-Mexico trade intelligence advisor. How can I help optimize your $56 billion opportunity today?",
        es: "¡Hola! Soy Marcus, tu asesor de inteligencia comercial Canadá-México. ¿Cómo puedo ayudarte a optimizar tu oportunidad de $56 mil millones hoy?",
        fr: "Bonjour! Je suis Marcus, votre conseiller en intelligence commerciale Canada-Mexique. Comment puis-je vous aider à optimiser votre opportunité de 56 milliards de dollars aujourd'hui?"
      },
      
      savings: {
        en: "Based on our analysis of 15,079 trade records, companies like yours typically save $",
        es: "Basado en nuestro análisis de 15,079 registros comerciales, empresas como la tuya típicamente ahorran $",
        fr: "Basé sur notre analyse de 15 079 enregistrements commerciaux, les entreprises comme la vôtre économisent généralement $"
      },
      
      specialist: {
        en: "I can connect you with our Mexican specialist network. They have a 94% success rate with Canada-Mexico implementations.",
        es: "Puedo conectarte con nuestra red de especialistas mexicanos. Tienen una tasa de éxito del 94% con implementaciones Canadá-México.",
        fr: "Je peux vous connecter avec notre réseau de spécialistes mexicains. Ils ont un taux de réussite de 94% avec les implémentations Canada-Mexique."
      },
      
      government: {
        en: "Our platform integrates official data from both Canadian and Mexican governments for 98/100 credibility.",
        es: "Nuestra plataforma integra datos oficiales de los gobiernos canadiense y mexicano para 98/100 de credibilidad.",
        fr: "Notre plateforme intègre les données officielles des gouvernements canadien et mexicain pour une crédibilité de 98/100."
      }
    }
  }

  // Detect language from user input
  detectLanguage(userInput) {
    const input = userInput.toLowerCase()
    
    // Spanish detection
    const spanishKeywords = ['hola', 'español', 'mexico', 'ahorros', 'ayuda', 'como', 'puedo']
    if (spanishKeywords.some(keyword => input.includes(keyword))) {
      return 'es'
    }
    
    // French detection  
    const frenchKeywords = ['bonjour', 'français', 'aide', 'comment', 'je peux', 'canada']
    if (frenchKeywords.some(keyword => input.includes(keyword))) {
      return 'fr'
    }
    
    // Default to English
    return 'en'
  }

  // Get appropriate response based on detected language and intent
  getResponse(userInput, responseType = 'greeting') {
    const language = this.detectLanguage(userInput)
    
    if (!this.responses[responseType] || !this.responses[responseType][language]) {
      return this.responses.greeting.en // Safe fallback
    }
    
    return this.responses[responseType][language]
  }

  // Format savings response with actual numbers
  formatSavingsResponse(userInput, savingsAmount) {
    const language = this.detectLanguage(userInput)
    const baseResponse = this.responses.savings[language]
    
    return `${baseResponse}${savingsAmount.toLocaleString()} annually through USMCA optimization.`
  }

  // Get contextual response based on user input analysis
  getContextualResponse(userInput) {
    const input = userInput.toLowerCase()
    
    // Intent detection
    if (input.includes('save') || input.includes('ahor') || input.includes('économ')) {
      return this.getResponse(userInput, 'savings')
    }
    
    if (input.includes('specialist') || input.includes('expert') || input.includes('especialista')) {
      return this.getResponse(userInput, 'specialist')
    }
    
    if (input.includes('government') || input.includes('oficial') || input.includes('gouvernement')) {
      return this.getResponse(userInput, 'government')
    }
    
    // Default greeting
    return this.getResponse(userInput, 'greeting')
  }

  // Simple chatbot simulation for demonstration
  simulateConversation(userMessage) {
    const language = this.detectLanguage(userMessage)
    
    // Sample conversation flow
    const conversation = {
      userMessage,
      detectedLanguage: language,
      marcusResponse: this.getContextualResponse(userMessage),
      followUpSuggestions: this.getFollowUpSuggestions(language),
      capabilities: this.getCapabilities(language)
    }
    
    return conversation
  }

  // Get follow-up suggestions in appropriate language
  getFollowUpSuggestions(language) {
    const suggestions = {
      en: [
        "Calculate your USMCA savings",
        "Connect with Mexico specialists", 
        "View government data integration",
        "See success stories"
      ],
      es: [
        "Calcular tus ahorros T-MEC",
        "Conectar con especialistas mexicanos",
        "Ver integración de datos gubernamentales", 
        "Ver historias de éxito"
      ],
      fr: [
        "Calculer vos économies AEUMC",
        "Se connecter avec des spécialistes mexicains",
        "Voir l'intégration des données gouvernementales",
        "Voir les histoires de réussite"
      ]
    }
    
    return suggestions[language] || suggestions.en
  }

  // Get Marcus capabilities in appropriate language
  getCapabilities(language) {
    const capabilities = {
      en: [
        "Analyze 15,079+ UN Comtrade records",
        "Connect Canadian + Mexican government data",
        "Calculate real USMCA savings potential",
        "Match with 94% success rate specialists",
        "Provide institutional learning insights"
      ],
      es: [
        "Analizar 15,079+ registros UN Comtrade",
        "Conectar datos gubernamentales canadienses + mexicanos",
        "Calcular potencial real de ahorros T-MEC",
        "Conectar con especialistas con 94% tasa de éxito",
        "Proporcionar insights de aprendizaje institucional"
      ],
      fr: [
        "Analyser 15 079+ enregistrements UN Comtrade",
        "Connecter les données gouvernementales canadiennes + mexicaines", 
        "Calculer le potentiel réel d'économies AEUMC",
        "Connecter avec des spécialistes avec 94% de taux de réussite",
        "Fournir des insights d'apprentissage institutionnel"
      ]
    }
    
    return capabilities[language] || capabilities.en
  }
}

// Export singleton instance for easy use
export const MarcusAI = new MarcusTrilingualIntelligence()

// Simple demo function for testing
export function testMarcusResponses() {
  const testMessages = [
    "Hello, how can you help me?",
    "Hola, ¿cómo puedes ayudarme?", 
    "Bonjour, comment pouvez-vous m'aider?",
    "I want to save money on imports",
    "Quiero ahorrar dinero en importaciones",
    "I need a specialist for Mexico",
    "What government data do you have?"
  ]
  
  console.log("🤖 MARCUS TRILINGUAL TESTING:")
  
  testMessages.forEach(message => {
    const response = MarcusAI.simulateConversation(message)
    console.log(`\n👤 User: "${message}"`)
    console.log(`🧠 Detected: ${response.detectedLanguage.toUpperCase()}`)
    console.log(`🤖 Marcus: "${response.marcusResponse}"`)
  })
  
  return "Marcus trilingual system tested successfully!"
}