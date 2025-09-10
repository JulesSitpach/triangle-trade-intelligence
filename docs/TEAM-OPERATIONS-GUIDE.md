# Triangle Intelligence Team Operations Guide

## Quick Start for Your Role

### Customer Success Manager
- Monitor crisis alerts affecting your accounts in Crisis Management dashboard
- Review customer analytics weekly for qualification opportunities
- Process supplier introduction requests within 24 hours
- Track customer savings and communicate value achievements

### Business Development
- Use Business Opportunities dashboard to identify upsell moments
- Monitor RSS feeds for crisis-driven acquisition opportunities
- Review Mexico supplier network for customer matching
- Track revenue pipeline and conversion metrics

### Operations Team
- Verify USMCA qualification calculations for accuracy
- Maintain RSS feed health (>50% success rate required)
- Process crisis alerts within 4-hour SLA
- Update supplier database with new opportunities

## Dashboard Operations

### 1. Crisis Management Dashboard (`/admin/crisis-management`)

**PURPOSE**: Convert trade disruptions into business opportunities

**Key Metrics to Monitor**:
- **Policy Events Count**: New tariff announcements requiring customer notification
- **Business Opportunities**: Revenue pipeline from crisis response
- **Customer Impacts**: Accounts affected by current events
- **RSS Feed Health**: Must maintain >50% success rate

**Daily Actions**:
1. Check "Critical" severity alerts first (immediate customer impact)
2. Review "High" alerts for 24-hour response opportunities
3. Match alerts to customer portfolios for targeted communication
4. Generate opportunity reports for sales team

**Alert Response Workflow**:
```
Critical Alert → Identify Affected Customers → Prepare Solution → Contact Within 4 Hours
High Alert → Analyze Impact → Create Opportunity → Contact Within 24 Hours
Medium Alert → Monitor Situation → Update CRM → Weekly Review
Low Alert → Document for Planning → Monthly Summary
```

### 2. Customer Analytics Dashboard

**PURPOSE**: Drive customer success through data-driven insights

**Key Performance Indicators**:
- **Qualification Rate**: Target >75% successful USMCA qualification
- **Average Savings**: $50K-$500K annual target per customer
- **Supplier Matches**: 3-5 Mexico alternatives per customer
- **Response Time**: <30 minutes for qualification analysis

**Weekly Review Process**:
1. Sort customers by savings potential (highest first)
2. Identify customers with <60% USMCA content (opportunity)
3. Review customers with China suppliers (Mexico routing opportunity)
4. Generate success stories for marketing

**Customer Health Scoring**:
- **Green**: Active, achieving savings, engaged with platform
- **Yellow**: Low engagement, unrealized savings potential
- **Red**: No recent activity, high China exposure risk

### 3. Supplier Management Interface

**PURPOSE**: Connect customers with Mexico manufacturing network

**Supplier Introduction Process**:
1. Customer requests supplier for specific product category
2. Filter Mexico suppliers by capability match
3. Verify supplier certifications and USMCA compliance
4. Send introduction with Triangle Intelligence facilitation
5. Track introduction success rate (target >40%)

**Supplier Quality Metrics**:
- **Response Rate**: Supplier responds within 48 hours
- **Quote Quality**: Competitive with China + tariff costs
- **USMCA Content**: Minimum 75% North American content
- **Delivery Reliability**: On-time delivery >95%

### 4. Revenue Tracking Dashboard

**PURPOSE**: Monitor business performance and growth

**Revenue Streams to Track**:
- **Service Fees**: 10% of facilitated tariff savings
- **Crisis Response**: Premium subscriptions during disruptions
- **Supplier Introductions**: Success fee on completed transitions
- **Compliance Services**: Qualification analysis and certification

**Monthly Targets**:
- New Customer Acquisition: 10-15 qualified leads
- Trial Conversion: >25% from crisis alerts
- Customer Lifetime Value: >$150K
- Churn Rate: <10% annually

## Critical Business Processes

### USMCA Qualification Process

**What Determines Qualification**:
1. **Regional Content**: Must exceed product-specific threshold (usually 60-75%)
2. **Tariff Jump**: Product transformation must be substantial
3. **De Minimis**: Non-originating content below 10% threshold
4. **Documentation**: Proper certificates and supplier attestations

**Common Qualification Scenarios**:
- **Automotive Parts**: 75% content requirement, steel/aluminum rules
- **Electronics**: 60% content, specific component requirements
- **Textiles**: Yarn-forward rule, must use North American materials
- **Chemicals**: Reaction rule, chemical transformation required

### Mexico Triangle Routing Strategy

**The Strategic Advantage**:
```
Traditional: China → USA = 25% tariff
Triangle Route: China → Mexico (assembly) → USA = 0-2.5% tariff
Savings: 22.5% on landed cost
```

**When Triangle Routing Works**:
1. Product requires assembly or transformation
2. Mexico facility adds >35% value
3. USMCA qualification achieved through transformation
4. Customer has flexible supply chain

**Implementation Timeline**:
- Week 1: Identify routing opportunity
- Week 2-3: Mexico supplier qualification
- Week 4-6: Pilot shipment and testing
- Week 8: Full implementation
- Ongoing: Monitor savings and compliance

### Crisis Response Playbook

**Phase 1: Detection (0-4 hours)**
- RSS feeds detect policy announcement
- System generates severity classification
- Customer portfolio matching activated
- Initial impact assessment completed

**Phase 2: Analysis (4-12 hours)**
- Calculate customer-specific impacts
- Identify Mexico routing alternatives
- Prepare solution recommendations
- Generate executive briefing materials

**Phase 3: Outreach (12-48 hours)**
- Priority customer notifications sent
- Solution webinars scheduled
- Supplier introductions initiated
- Media coverage amplified

**Phase 4: Conversion (48 hours - 2 weeks)**
- Trial accounts activated
- Qualification analysis provided
- Implementation support delivered
- Success metrics tracked

## Communication Templates

### Crisis Alert Customer Email

**Subject**: Urgent: New 25% Tariff Affects Your [Product Category] Imports

**Body**:
Dear [Customer Name],

The administration announced [specific tariff] affecting your imports from [country], effective [date].

**Your Impact**: $[amount] additional annual cost
**Our Solution**: Mexico routing can reduce this by [percentage]
**Action Required**: Schedule emergency consultation

[Schedule Now Button]

Your Triangle Intelligence Team

### Supplier Introduction Email

**Subject**: Introduction: [Customer] <> [Supplier] for [Product]

**Body**:
Dear [Supplier Contact],

I'm connecting you with [Customer Contact] from [Company], who is seeking Mexico-based manufacturing for [product category].

**Opportunity Details**:
- Annual Volume: [units]
- Target Price: [China price + 10%]
- USMCA Requirement: [percentage]
- Timeline: [start date]

Please respond within 48 hours to maintain opportunity priority.

Best regards,
[Your Name]
Triangle Intelligence Supplier Network

### Success Story Template

**[Customer] Saves $[Amount] Through Triangle Intelligence**

Challenge: [Specific tariff threat]
Solution: [Mexico routing/USMCA qualification]
Result: [Savings percentage] cost reduction
Timeline: [Implementation period]

"Quote from customer executive"

## Troubleshooting Guide

### Common Issues and Solutions

**RSS Feeds Showing <50% Success Rate**:
1. Check individual feed status in admin panel
2. Test feed URLs directly for accessibility
3. Review error logs for timeout patterns
4. Contact technical team if persistent

**USMCA Qualification Showing 100% for All Products**:
- Known bug: System defaults to qualified
- Workaround: Manually verify with calculation
- Formula: (North American Value / Total Value) × 100
- Must exceed product-specific threshold

**Customer Not Receiving Crisis Alerts**:
1. Verify email in notification settings
2. Check spam filters for @triangleintelligence.com
3. Confirm customer portfolio categories match alert tags
4. Test with manual notification send

**Supplier Introduction Not Converting**:
- Review supplier response time (must be <48 hours)
- Verify price competitiveness (China + 10% max)
- Check USMCA content capability
- Consider alternative suppliers in network

## Performance Benchmarks

### Customer Success Metrics
- Qualification Analysis: <30 minutes
- Crisis Response: <4 hours for critical
- Supplier Introduction: 40% success rate
- Customer Satisfaction: >4.5/5.0

### Operational Efficiency
- Dashboard Load Time: <2 seconds
- API Response: <400ms
- Database Query: <200ms
- Report Generation: <10 seconds

### Business Targets
- Monthly Recurring Revenue Growth: 15%
- Customer Acquisition Cost: <$5,000
- Customer Lifetime Value: >$150,000
- Trial to Paid Conversion: >25%

## Escalation Procedures

### Level 1: Team Lead (Immediate)
- RSS feed failures
- Customer complaint
- Qualification disputes
- System performance issues

### Level 2: Department Head (Within 2 hours)
- Major customer at risk
- Crisis alert failure
- Revenue impact >$10K
- Security concerns

### Level 3: Executive (Within 4 hours)
- Customer churn risk >$100K
- System-wide outage
- Compliance violation
- Media inquiry

## Daily Checklist

### Morning (9:00 AM)
- [ ] Review overnight crisis alerts
- [ ] Check RSS feed health status
- [ ] Review critical customer tickets
- [ ] Verify system performance metrics

### Midday (12:00 PM)
- [ ] Process supplier introductions
- [ ] Update customer success metrics
- [ ] Review qualification requests
- [ ] Send crisis alert notifications

### Afternoon (3:00 PM)
- [ ] Generate opportunity reports
- [ ] Update CRM with activities
- [ ] Review trial account progress
- [ ] Prepare next-day priorities

### End of Day (5:00 PM)
- [ ] Document crisis responses
- [ ] Update revenue tracking
- [ ] Set overnight monitoring alerts
- [ ] Team status communication

## Training Resources

### Week 1: Platform Fundamentals
- USMCA qualification basics
- Dashboard navigation
- Customer portfolio management
- Basic crisis response

### Week 2: Advanced Operations
- Mexico Triangle routing strategy
- Supplier network management
- Revenue optimization techniques
- Crisis-to-opportunity conversion

### Week 3: Customer Excellence
- Consultative selling approach
- Success story development
- Retention strategies
- Upsell identification

### Ongoing Education
- Weekly crisis simulation drills
- Monthly USMCA regulation updates
- Quarterly supplier network training
- Annual strategic planning session

## Quick Reference

### Key Contacts
- Technical Support: tech@triangleintelligence.com
- Customer Success: success@triangleintelligence.com
- Supplier Network: suppliers@triangleintelligence.com
- Executive Escalation: leadership@triangleintelligence.com

### System URLs
- Production: https://triangleintelligence.com
- Admin Portal: /admin
- Crisis Dashboard: /admin/crisis-management
- Analytics: /admin/analytics

### Critical Thresholds
- RSS Success Rate: >50%
- API Response Time: <400ms
- USMCA Content: 60-75% (product-specific)
- Crisis Response SLA: 4 hours (critical)

### Success Formulas
- Tariff Savings = (China Rate - USMCA Rate) × Import Value
- Service Fee = Tariff Savings × 10%
- ROI = (Savings - Platform Cost) / Platform Cost × 100
- Qualification % = North American Value / Total Value × 100

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Next Review**: February 2025

For questions about this guide, contact your team lead or email operations@triangleintelligence.com