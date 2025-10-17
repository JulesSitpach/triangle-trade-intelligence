/**
 * Census Bureau International Trade API Integration
 * REAL DATA: US import/export values by HS code
 *
 * What this gives us:
 * - Monthly import values by HS code
 * - Volume changes (trending up/down)
 * - Country-specific import data
 * - Real supply chain pressure indicators
 */

/**
 * Get recent import data for specific HS codes
 * Returns REAL import values from Census Bureau
 */
export async function getCensusImportData(hsCodes, months = 3) {
  const apiKey = process.env.CENSUS_API_KEY;

  if (!apiKey) {
    throw new Error('CENSUS_API_KEY not configured');
  }

  const results = [];

  // Get data for each HS code
  for (const hsCode of hsCodes) {
    try {
      // Census uses HS10 (10-digit codes), pad if necessary
      const hs10 = hsCode.replace(/\./g, '').padEnd(10, '0');

      // Get last 3 months of data
      const currentDate = new Date();
      const monthsData = [];

      for (let i = 0; i < months; i++) {
        const targetDate = new Date(currentDate);
        targetDate.setMonth(currentDate.getMonth() - i);
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const period = `${year}-${month}`;

        // Census API endpoint for import data
        const url = `https://api.census.gov/data/timeseries/intltrade/imports/hs?get=I_COMMODITY,I_COMMODITY_LDESC,GEN_VAL_MO,CTY_CODE,CTY_NAME&COMM_LVL=HS10&I_COMMODITY=${hs10}&time=${period}&key=${apiKey}`;

        const response = await fetch(url);

        if (!response.ok) {
          console.warn(`Census API failed for ${hsCode} ${period}:`, response.statusText);
          continue;
        }

        const data = await response.json();

        // Parse Census response format: [headers, ...rows]
        if (data && data.length > 1) {
          const headers = data[0];
          const rows = data.slice(1);

          const valueIndex = headers.indexOf('GEN_VAL_MO');
          const countryCodeIndex = headers.indexOf('CTY_CODE');
          const countryNameIndex = headers.indexOf('CTY_NAME');
          const descIndex = headers.indexOf('I_COMMODITY_LDESC');

          // Aggregate by country
          const countryData = {};
          let totalValue = 0;

          for (const row of rows) {
            const value = parseInt(row[valueIndex]) || 0;
            const countryCode = row[countryCodeIndex];
            const countryName = row[countryNameIndex];

            totalValue += value;

            if (!countryData[countryCode]) {
              countryData[countryCode] = {
                code: countryCode,
                name: countryName,
                value: 0
              };
            }
            countryData[countryCode].value += value;
          }

          monthsData.push({
            period,
            totalValue,
            description: rows[0]?.[descIndex],
            byCountry: Object.values(countryData)
          });
        }
      }

      // Calculate trend (comparing most recent to oldest month)
      let trend = 'stable';
      let trendPercent = 0;

      if (monthsData.length >= 2) {
        const recent = monthsData[0].totalValue;
        const old = monthsData[monthsData.length - 1].totalValue;

        if (old > 0) {
          trendPercent = ((recent - old) / old) * 100;

          if (trendPercent > 10) {
            trend = 'surging';
          } else if (trendPercent > 5) {
            trend = 'rising';
          } else if (trendPercent < -10) {
            trend = 'dropping';
          } else if (trendPercent < -5) {
            trend = 'declining';
          }
        }
      }

      results.push({
        hsCode,
        months: monthsData,
        trend,
        trendPercent: Math.round(trendPercent),
        latestValue: monthsData[0]?.totalValue || 0,
        latestPeriod: monthsData[0]?.period || 'unknown',
        description: monthsData[0]?.description || 'Unknown commodity'
      });

    } catch (error) {
      console.error(`Error fetching Census data for ${hsCode}:`, error);
    }
  }

  return results;
}

/**
 * Analyze Census data to generate alerts
 * Returns actionable intelligence for users
 */
export function analyzeCensusData(censusData, userComponents) {
  const alerts = [];

  for (const data of censusData) {
    const { hsCode, trend, trendPercent, latestValue, latestPeriod, months } = data;

    // Find which user component uses this HS code
    const component = userComponents.find(c => c.hs_code === hsCode);
    if (!component) continue;

    // Alert 1: Significant import volume changes
    if (Math.abs(trendPercent) > 15) {
      const direction = trendPercent > 0 ? 'surge' : 'drop';
      const impact = trendPercent > 0 ?
        'Increased demand may lead to supply constraints and price increases' :
        'Declining imports may signal supplier issues or market shifts';

      alerts.push({
        type: 'volume_change',
        urgency: Math.abs(trendPercent) > 25 ? 'high' : 'medium',
        title: `${component.description} Import ${direction === 'surge' ? 'Surge' : 'Drop'} Detected`,
        details: `US imports of HS ${hsCode} ${direction === 'surge' ? 'up' : 'down'} ${Math.abs(trendPercent)}% in ${latestPeriod}`,
        impact,
        affectedComponent: component.description,
        hsCode,
        data: {
          currentValue: `$${(latestValue / 1000000).toFixed(1)}M`,
          trendPercent,
          period: latestPeriod
        },
        source: 'US Census Bureau',
        detectedAt: new Date().toISOString()
      });
    }

    // Alert 2: High import concentration from specific country
    if (months.length > 0) {
      const recentMonth = months[0];
      const sortedCountries = recentMonth.byCountry.sort((a, b) => b.value - a.value);
      const topCountry = sortedCountries[0];

      if (topCountry && topCountry.value > recentMonth.totalValue * 0.6) {
        const concentration = ((topCountry.value / recentMonth.totalValue) * 100).toFixed(0);

        alerts.push({
          type: 'supply_concentration',
          urgency: concentration > 80 ? 'high' : 'medium',
          title: `High Import Dependency: ${component.description}`,
          details: `${concentration}% of US imports from ${topCountry.name}`,
          impact: 'Supply chain vulnerability - single country dependency creates risk',
          affectedComponent: component.description,
          hsCode,
          data: {
            primarySource: topCountry.name,
            concentrationPercent: concentration,
            monthlyValue: `$${(topCountry.value / 1000000).toFixed(1)}M`
          },
          source: 'US Census Bureau',
          detectedAt: new Date().toISOString()
        });
      }
    }
  }

  return alerts;
}

/**
 * Format Census data for dashboard display
 */
export function formatCensusDataForDashboard(censusData) {
  return censusData.map(data => ({
    hsCode: data.hsCode,
    description: data.description,
    trend: data.trend,
    trendPercent: data.trendPercent,
    latestValue: `$${(data.latestValue / 1000000).toFixed(1)}M`,
    latestPeriod: data.latestPeriod,
    monthlyData: data.months.map(m => ({
      period: m.period,
      value: `$${(m.totalValue / 1000000).toFixed(1)}M`,
      topCountries: m.byCountry
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
        .map(c => ({
          name: c.name,
          value: `$${(c.value / 1000000).toFixed(1)}M`,
          percent: ((c.value / m.totalValue) * 100).toFixed(0) + '%'
        }))
    }))
  }));
}
