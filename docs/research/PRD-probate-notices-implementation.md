# PRD: Probate Notices Implementation (Phase 1)

**Target Launch**: Q1 2024 | **Revenue Target**: £1.1M annually | **Market Share Target**: 5%

## Executive Summary

Probate notices represent the highest-value, lowest-risk entry point for Civic Notices expansion. With £21.5M total addressable market and clear regulatory requirements under Trustee Act 1925, this implementation targets 5% market share (£1.1M ARR) within 12 months.

**Key Success Factors:**
- £199 all-inclusive pricing beats competition by 40%+
- Digital-first workflow vs traditional phone/fax
- London Gazette API integration for compliance
- Target: 1,000+ probate solicitors onboarded

## 1. Market Opportunity

### Market Size & Pricing Analysis
- **Total estates annually**: ~180,000
- **Notices required**: ~108,000 (60% of estates >£5,000)
- **Current pricing**: £150-£400 per notice
- **Our target price**: £199 (all-inclusive)
- **Addressable market**: £21.5M annually

### Competitive Landscape
**Whitehead & Co** (Market Leader):
- £350+ per notice
- Slow 3-5 day processing
- Phone/fax ordering
- Limited digital presence

**Direct to newspapers**:
- £150-£400 inconsistent pricing  
- No London Gazette coordination
- Manual compliance checking
- Solicitor has to manage multiple relationships

**Our Competitive Advantage:**
- **Speed**: 24-hour processing vs 3-5 days
- **Price transparency**: Fixed £199 vs variable pricing
- **Compliance**: Automated legal requirement checking
- **Integration**: London Gazette + newspaper in one order

## 2. Legal Requirements & Compliance

### Trustee Act 1925 Section 27
**Purpose**: Protects executors from claims by unknown creditors
**Requirements**:
- 2-month notice period minimum
- London Gazette publication (mandatory)
- Local newspaper in area where deceased lived/owned property
- Specific statutory wording required

### Publication Requirements

**London Gazette**:
- £78 base publication fee
- 2-3 business day processing
- API available for automated submission
- PDF proof of publication provided

**Local Newspaper**:
- Varies by circulation: £50-£200
- Must circulate in relevant area
- Same notice text as London Gazette
- Proof of publication required

## 3. Technical Implementation

### Core Platform Features

#### 3.1 Probate Notice Builder
**Inputs Required**:
- Deceased full name and address
- Date of death
- Estate value (determines if notice required)
- Solicitor/executor details
- Local area for newspaper selection

**Automated Features**:
- Estate value threshold checking (£5,000+)
- Statutory wording template population
- 2-month period calculation
- Local newspaper recommendation engine

#### 3.2 London Gazette Integration
**API Requirements**:
- Automated submission to London Gazette system
- Payment processing integration
- Status tracking and confirmation
- PDF proof retrieval and storage

#### 3.3 Newspaper Selection Engine
**Geographic Targeting**:
- Postcode-based newspaper matching
- Circulation data integration
- Price comparison functionality
- Bulk rate optimization

## 4. Customer Acquisition Strategy

### Primary Target Market
**Probate Solicitors**:
- 3,000+ firms handling probate work
- Average 3-5 probate notices per month per firm
- Pain points: Time, complexity, cost uncertainty

### Marketing Channels

#### 4.1 Direct Outreach
- Legal 500 probate teams
- Chambers Directory estate planning
- Law Society member database
- Regional law society events

#### 4.2 Content Marketing
- "Probate Notice Requirements Guide"
- "Trustee Act Section 27 Compliance"
- "Estate Administration Checklist"
- "Cost Comparison: DIY vs Professional Service"

### 4.3 Pricing Strategy

**Launch Pricing**: £199 all-inclusive
- London Gazette: £78 (cost)
- Newspaper: £50-150 (varies)
- Platform/service fee: £69-£71
- Gross margin: 35-40%

**Volume Discounts**:
- 10+ notices/year: £189 each
- 25+ notices/year: £179 each  
- 50+ notices/year: £169 each

## 5. Revenue Projections

### Year 1 Targets
**Customer Acquisition**:
- Month 1-3: 50 solicitors onboarded
- Month 4-6: 150 total solicitors
- Month 7-9: 300 total solicitors  
- Month 10-12: 500+ total solicitors

**Notice Volume**:
- Month 1-3: 100 notices
- Month 4-6: 450 notices  
- Month 7-9: 900 notices
- Month 10-12: 1,500+ notices

**Revenue Build**:
- Q1: £20k
- Q2: £90k
- Q3: £180k
- Q4: £300k
- **Annual total**: £590k (growing to £1.1M run rate)

## 6. Implementation Timeline

### Phase 1: Platform Development (Months 1-2)
- Week 1-2: London Gazette API integration
- Week 3-4: Probate notice builder interface
- Week 5-6: Newspaper selection engine enhancement
- Week 7-8: Workflow automation and testing

### Phase 2: Pilot Launch (Months 3-4)
- Week 9-10: Beta testing with 5 friendly solicitors
- Week 11-12: Feedback incorporation and refinement
- Week 13-14: Full platform launch
- Week 15-16: Initial marketing campaign launch

### Phase 3: Scale & Optimize (Months 5-12)
- Month 5-6: Customer acquisition acceleration
- Month 7-8: Process optimization based on volume
- Month 9-10: Enhanced features and integrations
- Month 11-12: Market expansion and partnership development

## 7. Success Metrics

### Key Performance Indicators
**Customer Metrics**:
- Customer acquisition rate (new solicitors/month)
- Customer retention (repeat usage)
- Average notices per customer per month
- Customer satisfaction score (NPS)

**Operational Metrics**:
- Processing time (target: <24 hours)
- Error rate (target: <1%)
- London Gazette success rate (target: 99%+)
- Proof delivery time (target: <48 hours)

**Financial Metrics**:
- Monthly recurring revenue
- Customer lifetime value
- Customer acquisition cost
- Gross margin per notice

### Success Milestones
**3 Months**: 100 notices processed, £20k revenue
**6 Months**: 500 notices processed, £100k revenue  
**9 Months**: 1,000 notices processed, £200k revenue
**12 Months**: 1,500+ notices processed, £300k+ revenue

## 8. Risk Mitigation

### Regulatory Risk
**London Gazette Changes**: Maintain direct relationships and alternative compliance methods
**Legal Requirement Changes**: Monitor Law Commission and government consultations

### Competitive Risk  
**Incumbent Response**: Focus on superior digital experience and transparent pricing
**New Market Entrants**: Leverage first-mover advantage and customer relationships

### Operational Risk
**Volume Scaling**: Automated workflow can handle 10x current capacity
**Quality Control**: Built-in compliance checking and proof validation

## 9. Next Steps

### Immediate Actions (Next 30 Days)
1. **Technical**: Begin London Gazette API integration
2. **Legal**: Finalize statutory wording templates
3. **Market**: Begin outreach to 50 target solicitors
4. **Product**: Complete probate notice builder wireframes

### Success Criteria for Go/No-Go (90 Days)
- 10+ beta customers successfully processed
- <24 hour average processing time achieved
- 99%+ London Gazette publication success rate
- £199 pricing validated as competitive

---

**Expected Outcome**: £1.1M annual run rate within 18 months, establishing Civic Notices as the leading digital probate notice platform and creating foundation for additional notice type expansion.
