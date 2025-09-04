/**
 * TRIANGLE INTELLIGENCE SALES PRESENTATION COMPONENT
 * Professional B2B presentation system for USMCA platform
 * 
 * Supports multiple presentation formats:
 * - Executive Summary (8-10 slides)
 * - Technical Deep Dive (15-20 slides)  
 * - ROI-Focused (12-15 slides)
 * - Crisis Response (6-8 slides)
 */

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Mail, 
  TrendingUp, 
  Shield, 
  Zap,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Clock,
  Users
} from 'lucide-react';

// Import configuration (following zero-hardcoding architecture)
import {
  SALES_MESSAGING,
  SALES_STATISTICS,
  PRICING_TIERS,
  CASE_STUDIES,
  SLIDE_TEMPLATES,
  WEB_PRESENTATION_CONFIG
} from '../config/sales-presentation-config.js';

/**
 * Main Sales Presentation Component
 * Dynamic presentation engine with configurable content
 */
export default function SalesPresentation({ 
  presentationType = 'executiveSummary',
  customization = {},
  onSlideChange = () => {},
  onPresentationComplete = () => {}
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [presentationData, setPresentationData] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load presentation data based on type
  useEffect(() => {
    const loadPresentationData = () => {
      let baseData = SLIDE_TEMPLATES[presentationType];
      
      if (!baseData) {
        console.error(`Presentation type ${presentationType} not found`);
        baseData = SLIDE_TEMPLATES.executiveSummary;
      }

      // Apply customizations (merge with default data)
      const customizedData = {
        ...baseData,
        ...customization,
        slides: baseData.slides.map(slide => ({
          ...slide,
          ...customization.slides?.[slide.type] || {}
        }))
      };

      setPresentationData(customizedData);
    };

    loadPresentationData();
  }, [presentationType, customization]);

  // Navigation handlers
  const nextSlide = () => {
    if (presentationData && currentSlide < presentationData.slides.length - 1) {
      const newSlide = currentSlide + 1;
      setCurrentSlide(newSlide);
      onSlideChange(newSlide, presentationData.slides[newSlide]);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      const newSlide = currentSlide - 1;
      setCurrentSlide(newSlide);
      onSlideChange(newSlide, presentationData.slides[newSlide]);
    }
  };

  const goToSlide = (slideIndex) => {
    if (presentationData && slideIndex >= 0 && slideIndex < presentationData.slides.length) {
      setCurrentSlide(slideIndex);
      onSlideChange(slideIndex, presentationData.slides[slideIndex]);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      switch (event.key) {
        case 'ArrowLeft':
          prevSlide();
          break;
        case 'ArrowRight':
        case ' ':
          nextSlide();
          break;
        case 'Home':
          goToSlide(0);
          break;
        case 'End':
          if (presentationData) {
            goToSlide(presentationData.slides.length - 1);
          }
          break;
        case 'Escape':
          setIsFullscreen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlide, presentationData]);

  if (!presentationData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading presentation...</p>
        </div>
      </div>
    );
  }

  const currentSlideData = presentationData.slides[currentSlide];

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'max-w-6xl mx-auto'} 
                    ${WEB_PRESENTATION_CONFIG.styling.fontFamily}`}>
      
      {/* Presentation Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 rounded-t-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{presentationData.title}</h1>
            <p className="text-navy-100 mt-1">{presentationData.subtitle}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Slide counter */}
            <span className="text-navy-100">
              {currentSlide + 1} / {presentationData.slides.length}
            </span>
            
            {/* Action buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="px-3 py-1 bg-navy-600 hover:bg-navy-500 rounded text-sm transition-colors"
              >
                {isFullscreen ? 'Exit' : 'Full'}
              </button>
              
              {WEB_PRESENTATION_CONFIG.features.enableExport && (
                <button className="px-3 py-1 bg-sage-600 hover:bg-sage-500 rounded text-sm transition-colors">
                  <Download className="w-4 h-4 inline mr-1" />
                  PDF
                </button>
              )}
              
              <button className="px-3 py-1 bg-orange-600 hover:bg-orange-500 rounded text-sm transition-colors">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main slide content */}
      <div className="bg-white min-h-[500px] p-8 border-x border-gray-200">
        <SlideRenderer slideData={currentSlideData} presentationType={presentationType} />
      </div>

      {/* Navigation and controls */}
      <div className="bg-gray-50 p-4 rounded-b-lg border border-t-0 border-gray-200">
        <div className="flex justify-between items-center">
          {/* Previous button */}
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg
                     hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>

          {/* Slide navigation dots */}
          <div className="flex space-x-2">
            {presentationData.slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-navy-600' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={nextSlide}
            disabled={currentSlide === presentationData.slides.length - 1}
            className="flex items-center px-4 py-2 bg-navy-600 text-white rounded-lg
                     hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Presentation progress bar */}
        <div className="mt-4 bg-gray-200 rounded-full h-2">
          <div 
            className="progress-bar"
            data-progress={`${((currentSlide + 1) / presentationData.slides.length) * 100}`}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Slide Renderer Component
 * Renders different slide types with appropriate layouts and styling
 */
function SlideRenderer({ slideData, presentationType }) {
  if (!slideData) return null;

  // Get appropriate icon for slide type
  const getSlideIcon = (type) => {
    const iconMap = {
      'crisis_alert': AlertTriangle,
      'problem': AlertTriangle,
      'solution': CheckCircle,
      'demo_results': TrendingUp,
      'competitive': Shield,
      'pricing': DollarSign,
      'roi_timeline': Clock,
      'architecture': Zap,
      'next_steps': Users
    };
    
    return iconMap[type] || TrendingUp;
  };

  const SlideIcon = getSlideIcon(slideData.type);

  return (
    <div className="slide-content">
      {/* Slide title with icon */}
      <div className="flex items-center mb-8">
        <div className={`p-3 rounded-full mr-4 ${getSlideIconColor(slideData.type)}`}>
          <SlideIcon className="w-6 h-6 text-white" />
        </div>
        <h2 className="page-title">{slideData.title}</h2>
      </div>

      {/* Slide subtitle */}
      {slideData.subtitle && (
        <p className="page-subtitle mb-6">{slideData.subtitle}</p>
      )}

      {/* Slide content based on type */}
      {renderSlideContent(slideData, presentationType)}
    </div>
  );
}

/**
 * Render slide content based on slide type
 */
function renderSlideContent(slideData, presentationType) {
  switch (slideData.type) {
    case 'crisis_alert':
      return (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg">
          <div className="text-amber-800">
            <h3 className="text-xl font-semibold mb-4">URGENT ACTION REQUIRED</h3>
            <ul className="space-y-3">
              {slideData.content.map((item, index) => (
                <li key={index} className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );

    case 'demo_results':
      return (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Case study cards */}
          <div className="space-y-6">
            {Object.values(CASE_STUDIES).map((caseStudy, index) => (
              <div key={index} className="bg-sage-50 border border-sage-200 rounded-lg p-6">
                <h4 className="font-semibold text-sage-900 mb-2">{caseStudy.companyName}</h4>
                <p className="text-sage-800 mb-3">{caseStudy.industry}</p>
                <div className="text-2xl font-bold text-sage-700 mb-2">
                  {caseStudy.results.savings} saved
                </div>
                <p className="text-sm text-sage-600">in {caseStudy.results.timeframe}</p>
              </div>
            ))}
          </div>
          
          {/* Key metrics */}
          <div className="space-y-4">
            {slideData.content.map((metric, index) => (
              <div key={index} className="flex items-center p-4 bg-teal-50 rounded-lg border border-teal-200">
                <TrendingUp className="w-8 h-8 text-teal-600 mr-4" />
                <span className="text-teal-900 font-medium">{metric}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'pricing':
      return (
        <div className="grid md:grid-cols-3 gap-6">
          {Object.values(PRICING_TIERS).map((tier, index) => (
            <div key={index} className={`border rounded-lg p-6 ${
              tier.name === 'Enterprise' ? 'border-navy-500 bg-navy-50' : 'border-warm-gray-200 bg-white'
            }`}>
              <h4 className="text-xl font-semibold mb-2">{tier.name}</h4>
              <div className="metric-value text-navy-600">
                {tier.price}
                <span className="text-sm text-gray-600">/{tier.period}</span>
              </div>
              <p className="text-gray-600 mb-4">{tier.description}</p>
              <ul className="space-y-2">
                {tier.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-sage-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );

    case 'competitive':
      return (
        <div className="space-y-6">
          {slideData.content.map((comparison, index) => (
            <div key={index} className="flex items-start p-4 bg-gray-50 rounded-lg border">
              <Shield className="w-6 h-6 text-navy-600 mr-4 mt-1 flex-shrink-0" />
              <div>
                <span className="text-lg text-gray-900">{comparison}</span>
              </div>
            </div>
          ))}
        </div>
      );

    default:
      // Default bullet point layout
      return (
        <ul className="space-y-4">
          {slideData.content.map((item, index) => (
            <li key={index} className="flex items-start">
              <div className="w-2 h-2 bg-navy-600 rounded-full mr-4 mt-3 flex-shrink-0" />
              <span className="text-lg text-gray-700 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      );
  }
}

/**
 * Get appropriate background color for slide icon
 */
function getSlideIconColor(slideType) {
  const colorMap = {
    'crisis_alert': 'bg-amber-600',
    'problem': 'bg-amber-500',
    'solution': 'bg-sage-600',
    'demo_results': 'bg-navy-600',
    'competitive': 'bg-teal-600',
    'pricing': 'bg-sage-600',
    'roi_timeline': 'bg-amber-600',
    'architecture': 'bg-navy-600',
    'next_steps': 'bg-navy-600'
  };
  
  return colorMap[slideType] || 'bg-navy-600';
}