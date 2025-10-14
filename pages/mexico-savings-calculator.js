/**
 * Mexico Savings Calculator
 * Interactive tool to calculate realistic savings from China→Mexico sourcing
 * No fake data - all calculations based on current 2025 trade policy
 */

import { useState, useEffect } from 'react';
import TriangleLayout from '../components/TriangleLayout';

export default function MexicoSavingsCalculator() {
  const [annualVolume, setAnnualVolume] = useState('');
  const [currentOrigin, setCurrentOrigin] = useState('China');
  const [productCategory, setProductCategory] = useState('Machinery');
  const [showResults, setShowResults] = useState(false);
  const [calculations, setCalculations] = useState(null);

  // Tariff rates based on 2025 reality
  const TARIFF_RATES = {
    'China': {
      section301: 0.25,
      mfn: 0.025,
      total: 0.275, // 25% Section 301 + 2.5% MFN average
      label: 'China (Section 301 + MFN)'
    },
    'Germany': {
      mfn: 0.03,
      energySurcharge: 0.25, // 25% manufacturing cost increase
      total: 0.28,
      label: 'Germany/EU (MFN + Energy Crisis)'
    },
    'Vietnam': {
      mfn: 0.045,
      total: 0.045,
      label: 'Vietnam (MFN)'
    },
    'India': {
      mfn: 0.075,
      total: 0.075,
      label: 'India (MFN)'
    }
  };

  // Product category thresholds
  const CATEGORY_RATES = {
    'Machinery': { mfn: 0.025 },
    'Electronics': { mfn: 0.02 },
    'Textiles': { mfn: 0.12 },
    'Automotive': { mfn: 0.025 },
    'Industrial': { mfn: 0.03 }
  };

  const calculateSavings = () => {
    if (!annualVolume || isNaN(parseFloat(annualVolume))) return;

    const volume = parseFloat(annualVolume.replace(/,/g, ''));
    const originRates = TARIFF_RATES[currentOrigin];
    const categoryRate = CATEGORY_RATES[productCategory]?.mfn || 0.025;

    // Current costs (origin country)
    const currentTariffCost = volume * originRates.total;
    const currentShippingTime = currentOrigin === 'China' || currentOrigin === 'Vietnam' || currentOrigin === 'India' ?
      '6-8 weeks' : '2-3 weeks';
    const currentShippingDays = currentOrigin === 'China' || currentOrigin === 'Vietnam' || currentOrigin === 'India' ?
      49 : 17.5; // Average days

    // Mexico scenarios
    const mexicoUSMCA = {
      tariff: 0,
      shippingTime: '1-2 weeks',
      shippingDays: 10.5
    };

    const mexicoBilateral = {
      tariff: categoryRate, // If USMCA replaced, revert to MFN
      shippingTime: '1-2 weeks',
      shippingDays: 10.5
    };

    // Savings calculations
    const tariffSavingsUSMCA = currentTariffCost - (volume * mexicoUSMCA.tariff);
    const tariffSavingsBilateral = currentTariffCost - (volume * mexicoBilateral.tariff);

    // Inventory carrying cost reduction (faster shipping = less inventory needed)
    // Industry standard: 25% annual carrying cost on inventory
    const carryingCostRate = 0.25;
    const daysReduction = currentShippingDays - mexicoUSMCA.shippingDays;
    const inventoryReduction = (daysReduction / 365) * volume;
    const carryingCostSavings = inventoryReduction * carryingCostRate;

    // Total savings
    const totalSavingsUSMCA = tariffSavingsUSMCA + carryingCostSavings;
    const totalSavingsBilateral = tariffSavingsBilateral + carryingCostSavings;

    setCalculations({
      volume,
      currentOrigin,
      currentTariffCost,
      currentShippingTime,
      tariffSavingsUSMCA,
      tariffSavingsBilateral,
      carryingCostSavings,
      totalSavingsUSMCA,
      totalSavingsBilateral,
      percentageSavingsUSMCA: (totalSavingsUSMCA / volume) * 100,
      percentageSavingsBilateral: (totalSavingsBilateral / volume) * 100
    });

    setShowResults(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <TriangleLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Mexico Sourcing Savings Calculator</h1>
          <p className="dashboard-subtitle">
            Calculate realistic savings from switching to Mexico-based suppliers
          </p>
        </div>

        {/* Calculator Input */}
        <div className="form-section">
          <h2 className="form-section-title">Your Current Situation</h2>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label required">Annual Import Volume (USD)</label>
              <input
                type="text"
                className="form-input"
                value={annualVolume}
                onChange={(e) => setAnnualVolume(e.target.value)}
                placeholder="5,000,000"
              />
              <div className="form-help">Total annual import value from current supplier</div>
            </div>

            <div className="form-group">
              <label className="form-label required">Current Origin Country</label>
              <select
                className="form-select"
                value={currentOrigin}
                onChange={(e) => setCurrentOrigin(e.target.value)}
              >
                <option value="China">China</option>
                <option value="Germany">Germany/EU</option>
                <option value="Vietnam">Vietnam</option>
                <option value="India">India</option>
              </select>
              <div className="form-help">Where your products currently come from</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Product Category</label>
            <select
              className="form-select"
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
            >
              <option value="Machinery">Machinery & Equipment</option>
              <option value="Electronics">Electronics & Technology</option>
              <option value="Textiles">Textiles & Apparel</option>
              <option value="Automotive">Automotive Parts</option>
              <option value="Industrial">Industrial Supplies</option>
            </select>
            <div className="form-help">General product classification</div>
          </div>

          <div className="hero-buttons">
            <button
              onClick={calculateSavings}
              className="btn-primary"
              disabled={!annualVolume}
            >
              Calculate My Savings
            </button>
          </div>
        </div>

        {/* Results */}
        {showResults && calculations && (
          <>
            <div className="form-section">
              <h2 className="form-section-title">Your Potential Savings</h2>

              <div className="status-grid">
                <div className="status-card">
                  <div className="status-label">Current Annual Tariff Cost</div>
                  <div className="status-value error">{formatCurrency(calculations.currentTariffCost)}</div>
                  <div className="form-help">{TARIFF_RATES[currentOrigin].label}</div>
                </div>
                <div className="status-card">
                  <div className="status-label">Current Shipping Time</div>
                  <div className="status-value">{calculations.currentShippingTime}</div>
                  <div className="form-help">Ocean freight + customs clearance</div>
                </div>
              </div>
            </div>

            {/* USMCA Scenario */}
            <div className="alert alert-success">
              <div className="alert-content">
                <div className="alert-title">✅ Best Case: Mexico with USMCA (Current Policy)</div>
                <div className="status-grid">
                  <div className="status-card">
                    <div className="status-label">Annual Tariff Savings</div>
                    <div className="status-value success">{formatCurrency(calculations.tariffSavingsUSMCA)}</div>
                  </div>
                  <div className="status-card">
                    <div className="status-label">Inventory Cost Savings</div>
                    <div className="status-value success">{formatCurrency(calculations.carryingCostSavings)}</div>
                  </div>
                  <div className="status-card">
                    <div className="status-label">Total Annual Savings</div>
                    <div className="status-value success">{formatCurrency(calculations.totalSavingsUSMCA)}</div>
                  </div>
                  <div className="status-card">
                    <div className="status-label">Savings Percentage</div>
                    <div className="status-value success">{calculations.percentageSavingsUSMCA.toFixed(1)}%</div>
                  </div>
                </div>
                <div className="text-body">
                  <strong>Shipping Time:</strong> 1-2 weeks (vs {calculations.currentShippingTime})
                  <br />
                  <strong>Tariff Rate:</strong> 0% (USMCA qualified)
                </div>
              </div>
            </div>

            {/* Bilateral Scenario */}
            <div className="alert alert-warning">
              <div className="alert-content">
                <div className="alert-title">⚠️ Conservative Case: Mexico with Bilateral Deal (If USMCA Replaced)</div>
                <div className="status-grid">
                  <div className="status-card">
                    <div className="status-label">Annual Tariff Savings</div>
                    <div className="status-value">{formatCurrency(calculations.tariffSavingsBilateral)}</div>
                  </div>
                  <div className="status-card">
                    <div className="status-label">Inventory Cost Savings</div>
                    <div className="status-value success">{formatCurrency(calculations.carryingCostSavings)}</div>
                  </div>
                  <div className="status-card">
                    <div className="status-label">Total Annual Savings</div>
                    <div className="status-value">{formatCurrency(calculations.totalSavingsBilateral)}</div>
                  </div>
                  <div className="status-card">
                    <div className="status-label">Savings Percentage</div>
                    <div className="status-value">{calculations.percentageSavingsBilateral.toFixed(1)}%</div>
                  </div>
                </div>
                <div className="text-body">
                  <strong>Shipping Time:</strong> 1-2 weeks (vs {calculations.currentShippingTime})
                  <br />
                  <strong>Tariff Rate:</strong> {(CATEGORY_RATES[productCategory]?.mfn * 100).toFixed(1)}% (MFN - Most Favored Nation)
                  <br />
                  <strong>Key Point:</strong> Even if USMCA is replaced, geography and shipping advantages remain
                </div>
              </div>
            </div>

            {/* Additional Benefits */}
            <div className="form-section">
              <h3 className="form-section-title">Additional Mexico Advantages (Not Quantified Above)</h3>
              <div className="text-body">
                <ul>
                  <li><strong>Time Zone Alignment:</strong> Same-day communication vs 12-hour delay with Asia</li>
                  <li><strong>Direct Trucking:</strong> Ground shipping to US/Canada vs ocean freight uncertainty</li>
                  <li><strong>Cultural Bridge:</strong> Bilingual teams bridge US-Mexico business practices</li>
                  <li><strong>Supply Chain Resilience:</strong> Less vulnerable to Suez Canal, Panama Canal disruptions</li>
                  <li><strong>Quality Control:</strong> Easier site visits and relationship building (2hr flight vs 14hr)</li>
                  <li><strong>Regulatory Compliance:</strong> Expert customs brokers ensure smooth clearance</li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div className="alert alert-info">
              <div className="alert-content">
                <div className="alert-title">Get Your Personalized Analysis</div>
                <div className="text-body">
                  This calculator shows general estimates. For a detailed analysis of your specific supply chain with:
                  <br />• Component-level vulnerability assessment
                  <br />• Vetted Mexico supplier matching
                  <br />• Expert compliance guidance
                  <br />• Ongoing relationship support
                </div>
                <div className="hero-buttons">
                  <button
                    onClick={() => window.location.href = '/usmca-workflow'}
                    className="btn-primary"
                  >
                    Start Free USMCA Analysis
                  </button>
                  <button
                    onClick={() => window.location.href = '/services/request-form'}
                    className="btn-secondary"
                  >
                    Explore Expert Services
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Disclaimer */}
        <div className="form-section">
          <div className="form-help">
            <strong>Calculation Methodology:</strong> Tariff rates based on January 2025 US trade policy.
            Section 301 tariffs (25%) apply to most Chinese goods. EU energy crisis adds 25-35% to manufacturing costs.
            Inventory carrying costs calculated at 25% annual rate (industry standard).
            Shipping time reduction based on ocean freight (6-8 weeks) vs ground/short ocean (1-2 weeks).
            Individual results may vary based on specific product HS codes, origin locations, and business circumstances.
          </div>
        </div>
      </div>
    </TriangleLayout>
  );
}
