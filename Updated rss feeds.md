{
  "updated_rss_feeds": {
    "description": "Working RSS feeds for Triangle Intelligence Platform - Updated Nov 2024",
    "notes": "Many government agencies discontinued RSS feeds post-2020. Using Federal Register API and verified working sources.",
    
    "us_feeds": {
      "critical_priority": [
        {
          "name": "Federal Register - CBP Rules",
          "url": "https://www.federalregister.gov/api/v1/articles.rss?conditions[agencies][]=customs-and-border-protection",
          "description": "Official CBP regulatory announcements",
          "keywords": ["tariff", "classification", "ruling", "customs", "regulation", "USMCA"],
          "status": "WORKING - Primary replacement for CBP feeds"
        },
        {
          "name": "Federal Register - Tariff Changes", 
          "url": "https://www.federalregister.gov/api/v1/articles.rss?conditions[term]=tariff",
          "description": "All federal tariff-related announcements",
          "keywords": ["tariff", "duty", "rate", "classification", "trade"],
          "status": "WORKING - Comprehensive tariff coverage"
        },
        {
          "name": "Federal Register - Section 301",
          "url": "https://www.federalregister.gov/api/v1/articles.rss?conditions[term]=section+301",
          "description": "Section 301 tariff investigations and decisions",
          "keywords": ["section 301", "investigation", "china", "tariff", "trade war"],
          "status": "WORKING - Critical for Section 301 monitoring"
        },
        {
          "name": "Federal Register - USITC",
          "url": "https://www.federalregister.gov/api/v1/articles.rss?conditions[agencies][]=international-trade-commission",
          "description": "US International Trade Commission announcements",
          "keywords": ["antidumping", "countervailing", "investigation", "injury", "determination"],
          "status": "WORKING - Replacement for USITC direct feed"
        }
      ],
      
      "high_priority": [
        {
          "name": "Federal Register - USTR Actions",
          "url": "https://www.federalregister.gov/api/v1/articles.rss?conditions[agencies][]=office-of-the-united-states-trade-representative",
          "description": "Official USTR regulatory actions",
          "keywords": ["trade agreement", "USMCA", "negotiation", "dispute", "consultation"],
          "status": "WORKING - More reliable than USTR direct feed"
        },
        {
          "name": "Federal Register - Commerce ITA",
          "url": "https://www.federalregister.gov/api/v1/articles.rss?conditions[agencies][]=international-trade-administration",
          "description": "Commerce Department trade administration",
          "keywords": ["trade", "export", "import", "license", "restriction"],
          "status": "WORKING - Replacement for Commerce direct feed"
        },
        {
          "name": "Federal Register - USMCA Updates",
          "url": "https://www.federalregister.gov/api/v1/articles.rss?conditions[term]=USMCA",
          "description": "All USMCA-related federal announcements",
          "keywords": ["USMCA", "NAFTA", "Mexico", "Canada", "certificate", "origin"],
          "status": "WORKING - Comprehensive USMCA monitoring"
        }
      ],
      
      "backup_sources": [
        {
          "name": "Reuters Trade News",
          "url": "https://feeds.reuters.com/Reuters/worldNews",
          "description": "International trade news coverage",
          "filter_keywords": ["tariff", "trade", "customs", "USMCA", "section 301"],
          "status": "WORKING - News-based alternative"
        }
      ]
    },

    "canada_feeds": {
      "critical_priority": [
        {
          "name": "Canada Gazette Part I",
          "url": "https://www.gazette.gc.ca/rss/part1-e.xml",
          "description": "Canadian government notices and regulations",
          "keywords": ["tariff", "customs", "trade", "USMCA", "regulation"],
          "status": "VERIFY - May need testing"
        },
        {
          "name": "Canada Gazette Part II", 
          "url": "https://www.gazette.gc.ca/rss/part2-e.xml",
          "description": "Canadian statutory instruments and regulations",
          "keywords": ["regulation", "tariff", "customs", "trade", "duty"],
          "status": "VERIFY - Test before deployment"
        }
      ],
      
      "high_priority": [
        {
          "name": "CBSA News (Alternative)",
          "url": "https://www.cbsa-asfc.gc.ca/news-nouvelles/rss-eng.xml",
          "description": "Canada Border Services Agency",
          "keywords": ["tariff", "duty", "customs", "trade", "USMCA"],
          "status": "TEST - May work with proper headers"
        }
      ]
    },

    "mexico_feeds": {
      "critical_priority": [
        {
          "name": "DOF Official Gazette",
          "url": "https://www.dof.gob.mx/rss.php",
          "description": "Mexican official government announcements",
          "keywords": ["arancel", "tarifa", "comercio", "TLCAN", "TMEC"],
          "status": "TEST - Verify accessibility"
        }
      ],
      
      "high_priority": [
        {
          "name": "Mexican Economy Ministry",
          "url": "https://www.gob.mx/se/articulos/rss",
          "description": "Mexican trade and economic policy",
          "keywords": ["comercio", "arancel", "TMEC", "Estados Unidos", "Canada"],
          "status": "TEST - Alternative URL structure"
        }
      ]
    },

    "international_feeds": {
      "working": [
        {
          "name": "WTO News (Alternative)",
          "url": "https://www.wto.org/english/news_e/rss_e.xml",
          "description": "World Trade Organization announcements",
          "keywords": ["dispute", "panel", "appellate", "agreement", "negotiation"],
          "status": "TEST - Alternative WTO RSS path"
        }
      ]
    },

    "implementation_notes": {
      "headers_required": {
        "User-Agent": "Triangle Intelligence Platform RSS Monitor/1.0 (https://triangle-intelligence.com)",
        "Accept": "application/rss+xml, application/xml, text/xml"
      },
      
      "retry_logic": {
        "timeout": 30000,
        "retries": 3,
        "backoff": "exponential"
      },
      
      "error_handling": {
        "404": "Mark feed as broken, use Federal Register alternative",
        "403": "Try with different User-Agent header",
        "406": "Check Accept header, may need different content type"
      },
      
      "testing_priority": [
        "Federal Register APIs (highest reliability)",
        "Canada Gazette feeds", 
        "Mexican government feeds",
        "WTO alternative URL"
      ]
    }
  }
}