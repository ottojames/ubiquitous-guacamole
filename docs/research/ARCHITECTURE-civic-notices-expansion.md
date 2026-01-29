# Technical Architecture: Civic Notices Platform Expansion

**Target**: Support £4.5M ARR across multiple notice types | **Timeline**: 18-month implementation

## Executive Summary

This architecture document outlines the technical foundation required to scale Civic Notices from a statutory advertising service to the UK's leading civic and legal notice platform. The architecture supports:

- **High-volume transaction processing**: 100,000+ notices annually
- **Professional SaaS platform**: 1,000+ paying subscribers
- **Multi-tenant operations**: Councils, solicitors, developers, consultants
- **Regulatory compliance**: Automated legal requirement validation
- **Revenue scale**: £4.5M ARR with room for 10x growth

## 1. Current State Assessment

### Existing Platform Strengths
- **Proven statutory advertising workflow**: Licensing notices operational
- **Newspaper network**: Established relationships with 200+ publications
- **Payment processing**: Stripe integration for transactions
- **Basic user management**: Customer accounts and billing
- **Compliance foundation**: Legal requirement tracking

### Technical Debt & Limitations
- **Single notice type**: Limited to licensing notices
- **Manual processes**: High operator intervention required
- **No workflow management**: Basic transaction-only model
- **Limited analytics**: Basic reporting capabilities
- **Monolithic architecture**: Difficult to scale independently

## 2. Target Architecture

### 2.1 Microservices Architecture

#### Core Services
- **Notice Management Service**: Notice type definitions, templates, content generation
- **Workflow Engine**: Process definition, state management, task automation
- **Publication Engine**: Newspaper selection, booking, proof collection
- **Compliance Engine**: Legal requirement validation, deadline calculations
- **Customer Management**: User accounts, authentication, subscriptions
- **Financial Management**: Pricing, invoicing, payment tracking

### 2.2 Data Architecture

#### Core Entities
- **notice_types**: Type definitions, legal frameworks, publication requirements
- **applications**: Customer applications, status tracking, workflow data
- **publications**: Newspaper placements, publication dates, proofs
- **compliance_checks**: Requirement validation, audit trails
- **councils**: Authority data, boundaries, specific requirements
- **newspapers**: Publication data, circulation, rates
- **customers**: Account details, plans, billing
- **invoices**: Financial records, line items, payments

#### Database Strategy
**Primary Database**: PostgreSQL
- ACID compliance for financial transactions
- JSONB support for flexible notice data
- Geographic queries for council boundary matching
- Full-text search for notice content

**Caching Layer**: Redis
- Session management for user authentication
- Rate limiting for API protection
- Temporary data for workflow state
- Real-time updates for dashboard notifications

**Document Storage**: AWS S3 / CloudFlare R2
- Notice documents (PDFs, proofs)
- Customer uploads (plans, applications)
- Template libraries (statutory formats)
- Audit trails (compliance documentation)

### 2.3 Integration Architecture

#### External APIs
**Critical Integrations**:
1. **London Gazette API**: Automated probate notice submission
2. **Newspaper APIs**: Direct booking where available
3. **Payment Processing**: Stripe for cards, GoCardless for direct debit
4. **Communication Services**: SendGrid, Twilio for notifications
5. **Planning Portal**: Application data feeds (where available)

**Integration Patterns**:
- REST APIs: Primary interface for external services
- Webhooks: Real-time updates from payment providers
- Batch processing: Daily reconciliation and reporting
- Queue-based: Asynchronous processing for heavy operations

## 3. Notice Type Implementation

### 3.1 Probate Notices Architecture

#### Specific Requirements
- **London Gazette integration**: Direct API submission
- **Estate value validation**: Threshold checking (£5,000)
- **Two-publication requirement**: Gazette + local newspaper
- **Two-month period calculation**: Automatic deadline setting

### 3.2 Planning Notices Architecture

#### Specific Requirements
- **Council boundary matching**: Geographic postcode lookup
- **Development type validation**: Major vs minor thresholds
- **21-day consultation period**: Automated deadline calculation
- **Multiple publication types**: Newspaper + site notices

### 3.3 Professional Portal Architecture

#### SaaS-Specific Requirements
- **Multi-tenancy**: Customer isolation and data security
- **Role-based access**: Teams, clients, read-only users
- **White-labeling**: Customer branding and customization
- **API access**: Third-party integrations

## 4. Performance & Scale Requirements

### 4.1 Traffic Projections

#### Year 1 Targets
- **Notice volume**: 15,000 notices annually
- **Professional users**: 200 active consultants
- **Page views**: 50,000 monthly
- **API calls**: 100,000 monthly

#### Year 3 Targets  
- **Notice volume**: 50,000 notices annually
- **Professional users**: 1,000 active consultants
- **Page views**: 200,000 monthly
- **API calls**: 500,000 monthly

### 4.2 Infrastructure Scaling

#### Compute Resources
**Production Environment**:
- api_servers: 3 instances, AWS c5.xlarge (4 vCPU, 8GB RAM)
- auto_scaling: min 2, max 10 instances
- worker_processes: 2 instances for queue processing
- database: AWS RDS PostgreSQL db.r5.xlarge (4 vCPU, 32GB RAM)
- cache: AWS ElastiCache Redis cache.r5.large

#### Content Delivery
- **CDN**: CloudFlare for static assets
- **File storage**: AWS S3 with lifecycle policies
- **Image optimization**: Automated compression and resizing
- **Geographic distribution**: UK-focused with EU backup

### 4.3 Monitoring & Observability

#### Application Monitoring
- **Error tracking**: Sentry for exception monitoring
- **Performance monitoring**: New Relic for application performance
- **Uptime monitoring**: Pingdom for service availability
- **Log aggregation**: ELK stack for centralized logging

## 5. Security & Compliance

### 5.1 Data Protection

#### GDPR Compliance
- **Data encryption**: AES-256 at rest, TLS 1.3 in transit
- **Access controls**: Role-based permissions with audit logs
- **Data retention**: Automated deletion per legal requirements
- **Privacy controls**: User consent management and data portability

#### Professional Standards
- **Solicitor confidentiality**: Chinese wall functionality
- **Client privilege**: Secure document sharing
- **Audit trails**: Complete action logging for compliance
- **Backup and recovery**: 3-2-1 backup strategy with testing

### 5.2 Application Security

#### Authentication & Authorization
- **Authentication**: OAuth2 with PKCE, MFA for admin
- **Session management**: JWT with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Data protection**: AES-256 encryption, AWS KMS key management

#### API Security
- **Rate limiting**: Per-user and per-endpoint limits
- **Input validation**: Strict schema validation for all endpoints
- **SQL injection prevention**: Parameterized queries only
- **CSRF protection**: Double-submit cookie pattern

## 6. Development & Deployment

### 6.1 Technology Stack

#### Backend Services
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with Helmet security middleware
- **Database**: PostgreSQL 14+ with pgcrypto extension
- **Queue**: Bull (Redis-based) for background jobs
- **Testing**: Jest for unit/integration testing

#### Frontend Applications
- **Customer Portal**: React 18 with Next.js
- **Professional Dashboard**: React with TypeScript
- **Admin Interface**: React Admin framework
- **Mobile**: React Native for consultant mobile app

#### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: AWS ECS with Fargate
- **CI/CD**: GitHub Actions with automated testing
- **Infrastructure as Code**: Terraform for AWS resources

### 6.2 Development Workflow

#### Git Strategy
- main branch (production)
- develop (integration)
- feature/* branches
- hotfix/* for urgent fixes

#### Deployment Pipeline
1. Feature development: Branch-based development
2. Automated testing: Unit, integration, and E2E tests
3. Security scanning: SAST/DAST with Snyk
4. Staging deployment: Automated deployment to staging
5. Production deployment: Blue-green deployment strategy

## 7. Cost & Resource Planning

### 7.1 Infrastructure Costs

#### Annual Operating Costs (Year 1)
- **Compute**: £2,000/month (AWS EC2, containers)
- **Database**: £800/month (RDS PostgreSQL)
- **Storage**: £300/month (S3, backup)
- **CDN**: £200/month (CloudFlare Pro)
- **Monitoring**: £400/month (New Relic, Sentry)
- **Total**: £42,000 annually

#### Scaling Costs (Year 3)
- **Compute**: £6,000/month (scaled infrastructure)
- **Database**: £2,000/month (larger instance)
- **Storage**: £800/month (increased data)
- **CDN**: £500/month (higher traffic)
- **Monitoring**: £800/month (additional services)
- **Total**: £120,000 annually

### 7.2 Development Resources

#### Team Requirements
- **Backend developers**: 2-3 senior engineers
- **Frontend developers**: 2 engineers (React/TypeScript)
- **DevOps engineer**: 1 senior engineer
- **Product manager**: 1 experienced PM
- **QA engineer**: 1 automation specialist

## 8. Risk Management

### 8.1 Technical Risks

#### High Priority
1. **Third-party API failures**: London Gazette, payment processors
   - Mitigation: Fallback processes, manual override capabilities

2. **Database performance**: Large-scale query optimization
   - Mitigation: Index optimization, query caching, read replicas

3. **Security vulnerabilities**: Data breach or system compromise
   - Mitigation: Regular audits, automated security scanning

#### Medium Priority
1. **Integration complexity**: Multiple external systems
   - Mitigation: Circuit breaker patterns, comprehensive testing

2. **Scaling challenges**: Rapid growth overwhelming infrastructure
   - Mitigation: Auto-scaling, performance monitoring

### 8.2 Business Risks

#### Regulatory Changes
- **Digital-first legislation**: Government push away from newspapers
- Mitigation: Position as bridge solution, develop digital alternatives

#### Market Competition
- **Large technology companies entering market**
- Mitigation: First-mover advantage, deep domain expertise

## 9. Success Metrics

### 9.1 Technical KPIs
- **Uptime**: 99.9% availability
- **Performance**: <200ms average API response time
- **Scalability**: Handle 10x traffic with <50% cost increase
- **Security**: Zero data breaches, 100% GDPR compliance

### 9.2 Business KPIs
- **Revenue**: £4.5M ARR by Year 3
- **Customer satisfaction**: 90%+ NPS score
- **Market share**: 15%+ in core notice types
- **Platform efficiency**: 70%+ reduction in manual processes

---

**Implementation Priority**: This architecture supports aggressive growth from £1M to £4.5M ARR while maintaining operational excellence and regulatory compliance.
