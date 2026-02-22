# Requirements Document: AssetBridge Production Transformation

## Introduction

AssetBridge is a Global Asset Liquidity & Credit Passport platform that enables users to unlock liquidity from their home-country assets without selling them. The platform tokenizes real-world assets (RWA) on blockchain, provides instant credit globally, generates AI-powered trust scores, and enables cross-border collateralization.

This requirements document outlines the transformation from a frontend-only prototype to a production-ready application with full backend integration, blockchain connectivity, payment processing, and real-world data integration.

## Glossary

- **System**: The AssetBridge platform (frontend, backend, blockchain, and third-party integrations)
- **User**: Any authenticated person using the platform (Borrower, Lender, or Admin)
- **Borrower**: A user who locks assets and requests loans
- **Lender**: A user who provides loans to borrowers
- **Admin**: A platform administrator with elevated privileges
- **RWA**: Real World Asset - physical or financial assets tokenized on blockchain
- **KYC**: Know Your Customer - identity verification process
- **LTV**: Loan-to-Value ratio - percentage of asset value available as credit
- **Trust_Score**: AI-generated credit score (0-1000) based on financial data
- **Collateral**: Locked assets backing a loan or credit line
- **Custodian**: Third-party entity holding physical custody of locked assets
- **Smart_Contract**: Self-executing blockchain contract managing tokenization and loans
- **Virtual_Card**: Digital credit card backed by locked assets
- **FX_Rate**: Foreign exchange rate between currencies
- **Hedge**: Financial instrument to protect against currency fluctuations
- **NRI**: Non-Resident Indian
- **API**: Application Programming Interface
- **JWT**: JSON Web Token for authentication
- **OCR**: Optical Character Recognition for document text extraction

## Requirements

### Requirement 1: User Registration and Authentication

**User Story:** As a new user, I want to register and authenticate my identity, so that I can securely access the platform and its features.

#### Acceptance Criteria

1. WHEN a user submits valid registration details (email, phone, password), THE System SHALL create a new user account and send verification codes
2. WHEN a user enters a valid verification code, THE System SHALL activate the account and mark email/phone as verified
3. WHEN a user submits valid login credentials, THE System SHALL authenticate the user and issue a JWT token
4. WHEN a user requests password reset, THE System SHALL send a secure reset link to the verified email
5. WHEN a JWT token expires, THE System SHALL require re-authentication
6. WHEN an unauthenticated user attempts to access protected routes, THE System SHALL redirect to the login page
7. WHEN a user logs out, THE System SHALL invalidate the JWT token and clear session data
8. THE System SHALL hash all passwords using bcrypt before storage
9. WHEN a user enters incorrect credentials three times, THE System SHALL temporarily lock the account for 15 minutes
10. THE System SHALL enforce password complexity requirements (minimum 8 characters, uppercase, lowercase, number, special character)

### Requirement 2: Multi-Step KYC Process

**User Story:** As a registered user, I want to complete KYC verification, so that I can unlock full platform features and establish trust.

#### Acceptance Criteria

1. WHEN a user starts KYC, THE System SHALL present a multi-step form (Personal Details → Document Upload → Selfie Verification → Bank Linking)
2. WHEN a user submits personal details, THE System SHALL validate all required fields (Name, DOB, Address, Nationality, PAN/SSN)
3. WHEN a user uploads identity documents, THE System SHALL accept PDF/JPG/PNG formats up to 5MB per file
4. WHEN documents are uploaded, THE System SHALL use OCR to extract text and validate document authenticity
5. WHEN a user submits a selfie, THE System SHALL perform liveness detection and face matching against identity documents
6. WHEN all KYC steps are completed, THE System SHALL submit data to third-party KYC provider (Sumsub/Onfido) for verification
7. WHEN KYC verification is approved, THE System SHALL update user status to "verified" and unlock asset locking features
8. WHEN KYC verification is rejected, THE System SHALL notify the user with specific reasons and allow resubmission
9. THE System SHALL store all KYC documents securely in encrypted cloud storage (AWS S3)
10. WHEN a user's KYC status changes, THE System SHALL send email and SMS notifications

### Requirement 3: User Profile Management

**User Story:** As a verified user, I want to manage my profile and view my account status, so that I can keep my information current and track my platform activity.

#### Acceptance Criteria

1. WHEN a user accesses their profile, THE System SHALL display all profile information (personal details, KYC status, linked accounts, trust score)
2. WHEN a user updates profile information, THE System SHALL validate changes and update the database
3. WHEN a user changes email or phone, THE System SHALL require re-verification before updating
4. THE System SHALL display user role (Borrower, Lender, Admin) and associated permissions
5. WHEN a user views their dashboard, THE System SHALL display personalized data (locked assets, active loans, credit available, trust score)
6. THE System SHALL track and display user activity history (logins, transactions, document uploads)
7. WHEN a user requests account deletion, THE System SHALL verify no active loans exist before proceeding

### Requirement 4: Asset Linking and Verification

**User Story:** As a verified user, I want to link my real-world assets to the platform, so that I can use them as collateral for credit.

#### Acceptance Criteria

1. WHEN a user links a bank account, THE System SHALL use Plaid/Finicity API to authenticate and fetch account details
2. WHEN bank linking is successful, THE System SHALL retrieve and display real-time balances for FDs and savings accounts
3. WHEN a user links a stock portfolio, THE System SHALL use Alpha Vantage API to fetch holdings and current valuations
4. WHEN a user adds mutual fund holdings, THE System SHALL fetch NAV data from MFCentral/AMFI API
5. WHEN a user adds gold holdings, THE System SHALL fetch live gold prices and calculate current value
6. WHEN a user adds real estate, THE System SHALL require manual entry of property details and upload of ownership documents
7. THE System SHALL validate asset ownership through document verification before allowing locking
8. WHEN asset data is fetched, THE System SHALL store it in the database with timestamps for refresh tracking
9. THE System SHALL refresh asset valuations every 24 hours for stocks, mutual funds, and gold
10. WHEN an asset's value changes significantly (>10%), THE System SHALL notify the user and recalculate credit limits

### Requirement 5: Asset Locking and Tokenization

**User Story:** As a user with verified assets, I want to lock my assets and tokenize them on blockchain, so that I can access credit without selling my assets.

#### Acceptance Criteria

1. WHEN a user selects an asset to lock, THE System SHALL display asset details, current value, and estimated credit limit (LTV ratio)
2. WHEN a user confirms asset locking, THE System SHALL create a lien/pledge record with the custodian
3. WHEN the custodian confirms asset custody, THE System SHALL initiate blockchain tokenization
4. WHEN tokenization is initiated, THE Smart_Contract SHALL mint a unique ERC-721 token representing the asset
5. THE System SHALL store the token ID, contract address, and transaction hash in the database
6. WHEN tokenization is complete, THE System SHALL update asset status to "locked" and credit limit to "available"
7. THE System SHALL calculate LTV ratio based on asset type (FD: 90%, Stocks: 70%, Gold: 75%, Property: 60%)
8. WHEN a locked asset's value decreases, THE System SHALL recalculate credit limit and trigger margin calls if necessary
9. WHEN a user unlocks an asset, THE Smart_Contract SHALL burn the token and THE System SHALL release the custodian lien
10. THE System SHALL charge a tokenization fee (0.5% of asset value) payable via payment gateway

### Requirement 6: Blockchain Integration and Wallet Connection

**User Story:** As a user, I want to connect my Web3 wallet and interact with blockchain, so that I can own and control my tokenized assets.

#### Acceptance Criteria

1. WHEN a user clicks "Connect Wallet", THE System SHALL prompt for MetaMask or WalletConnect connection
2. WHEN wallet connection is successful, THE System SHALL display the connected wallet address
3. WHEN a user initiates tokenization, THE System SHALL estimate gas fees and display them before transaction
4. WHEN a user confirms a blockchain transaction, THE System SHALL submit it to Polygon network and track status
5. THE System SHALL display real-time transaction status (pending, confirmed, failed)
6. WHEN a transaction is confirmed, THE System SHALL update the database with transaction hash and block number
7. THE System SHALL support Polygon Mumbai testnet for development and Polygon mainnet for production
8. WHEN a user transfers a token, THE Smart_Contract SHALL verify ownership before allowing transfer
9. THE System SHALL integrate Chainlink oracles for live FX rates and asset price feeds
10. WHEN blockchain network is congested, THE System SHALL display estimated wait times and allow gas price adjustment

### Requirement 7: AI-Powered Credit Passport Generation

**User Story:** As a verified user, I want an AI-generated trust score based on my financial data, so that I can access better credit terms and global lending opportunities.

#### Acceptance Criteria

1. WHEN a user uploads bank statements, THE System SHALL use OCR to extract transaction data
2. WHEN a user uploads tax returns (ITR), THE System SHALL parse income, deductions, and tax paid
3. WHEN a user uploads credit reports (CIBIL/Experian), THE System SHALL extract credit score and payment history
4. WHEN all documents are processed, THE System SHALL send data to AI model (OpenAI API or custom ML model) for analysis
5. THE System SHALL calculate Trust_Score (0-1000) based on weighted factors: Income stability (25%), Credit history (20%), Asset coverage (25%), Debt-to-income ratio (15%), Cross-border activity (10%), Fraud risk (5%)
6. WHEN Trust_Score is generated, THE System SHALL display it on the dashboard with visual breakdown of contributing factors
7. THE System SHALL provide explainable AI insights showing positive factors, negative factors, and improvement suggestions
8. THE System SHALL recalculate Trust_Score monthly or when new documents are uploaded
9. WHEN Trust_Score changes significantly (>50 points), THE System SHALL notify the user
10. THE Smart_Contract SHALL store Trust_Score hash on-chain for verification by lenders

### Requirement 8: Loan Request and P2P Marketplace

**User Story:** As a borrower, I want to request loans using my locked assets as collateral, so that I can access liquidity without selling my assets.

#### Acceptance Criteria

1. WHEN a borrower creates a loan request, THE System SHALL require loan amount, tenure, purpose, and collateral selection
2. THE System SHALL validate that requested loan amount does not exceed available credit limit (LTV ratio)
3. WHEN a loan request is submitted, THE System SHALL publish it to the P2P marketplace visible to lenders
4. WHEN a lender views loan requests, THE System SHALL display borrower's Trust_Score, collateral details, and requested terms
5. WHEN a lender makes a loan offer, THE System SHALL notify the borrower and display offer details (interest rate, tenure, conditions)
6. WHEN a borrower accepts a loan offer, THE Smart_Contract SHALL create an escrow holding the collateral
7. WHEN loan agreement is finalized, THE System SHALL disburse funds to borrower's linked bank account
8. THE System SHALL generate a repayment schedule with EMI amounts and due dates
9. WHEN an EMI is due, THE System SHALL auto-debit from borrower's linked account
10. WHEN a borrower misses a payment, THE System SHALL send alerts and start a 7-day grace period before liquidation

### Requirement 9: Loan Lifecycle Management

**User Story:** As a lender, I want to track my active loans and receive repayments, so that I can manage my lending portfolio and earn returns.

#### Acceptance Criteria

1. WHEN a lender views their portfolio, THE System SHALL display all active loans with borrower details, amounts, interest rates, and repayment status
2. WHEN a borrower makes a repayment, THE System SHALL distribute principal and interest to the lender's account
3. THE System SHALL calculate and display lender's total returns (interest earned, pending interest, defaults)
4. WHEN a loan is fully repaid, THE Smart_Contract SHALL release the collateral back to the borrower
5. WHEN a borrower defaults (grace period expires), THE System SHALL initiate collateral liquidation
6. WHEN collateral is liquidated, THE System SHALL compensate the lender from liquidation proceeds
7. THE System SHALL charge a platform fee (0.5% of loan amount) deducted from disbursement
8. WHEN a loan is 30 days overdue, THE System SHALL report to credit bureaus
9. THE System SHALL allow early loan repayment with reduced interest calculation
10. WHEN a dispute arises, THE System SHALL provide an arbitration mechanism with admin review

### Requirement 10: Virtual Credit Card Issuance

**User Story:** As a borrower with locked assets, I want a virtual credit card backed by my collateral, so that I can spend globally without traditional credit checks.

#### Acceptance Criteria

1. WHEN a user applies for a Virtual_Card, THE System SHALL verify sufficient locked assets and available credit limit
2. WHEN eligibility is confirmed, THE System SHALL use card issuance API (Marqeta/Stripe Issuing) to create a virtual card
3. THE System SHALL issue the Virtual_Card instantly and display card details (number, CVV, expiry) in masked format
4. WHEN a user clicks "Reveal Card Details", THE System SHALL require authentication and display full card information
5. THE System SHALL set card spending limit equal to available credit limit from locked assets
6. WHEN a user makes a card transaction, THE System SHALL receive real-time webhook notification
7. WHEN a transaction is processed, THE System SHALL deduct amount from available credit and update balance
8. THE System SHALL display real-time card balance and transaction history
9. WHEN a user freezes the card, THE System SHALL immediately block all transactions
10. WHEN a user requests a physical card, THE System SHALL initiate shipping and provide tracking information
11. THE System SHALL enable international usage by default with multi-currency support
12. WHEN card balance is low (<10% of limit), THE System SHALL send alerts to add more collateral

### Requirement 11: Payment Gateway Integration

**User Story:** As a user, I want to make payments for fees and loan repayments, so that I can use platform services and fulfill my obligations.

#### Acceptance Criteria

1. WHEN a user initiates a payment, THE System SHALL redirect to payment gateway (Stripe/Razorpay) with transaction details
2. THE System SHALL support multiple payment methods (credit card, debit card, UPI, net banking, wallet)
3. WHEN payment is successful, THE System SHALL receive webhook notification and update transaction status to "completed"
4. WHEN payment fails, THE System SHALL notify the user with failure reason and allow retry
5. THE System SHALL generate and email invoice for all successful payments
6. THE System SHALL support multi-currency payments (INR, USD, GBP, EUR, AED) with automatic FX conversion
7. WHEN a refund is requested, THE System SHALL process it through the payment gateway within 5-7 business days
8. THE System SHALL implement webhook signature verification for security
9. THE System SHALL store all payment records with transaction IDs, amounts, timestamps, and status
10. THE System SHALL apply platform fees: Tokenization (0.5%), Loan processing (0.5%), Card issuance (₹500/year)

### Requirement 12: FX Hedging and Risk Management

**User Story:** As a user with cross-border exposure, I want automated FX hedging, so that I can protect my collateral value from currency fluctuations.

#### Acceptance Criteria

1. WHEN a user has multi-currency exposure, THE System SHALL display currency breakdown and exposure amounts
2. THE System SHALL fetch live FX rates from Forex API every 5 minutes
3. WHEN a user enables auto-hedging, THE System SHALL allow setting threshold rates (e.g., hedge if INR/USD > 85)
4. WHEN FX rate crosses threshold, THE System SHALL automatically execute hedge through partner broker
5. THE System SHALL calculate and display hedge costs before execution
6. WHEN collateral value drops, THE System SHALL calculate current LTV ratio
7. WHEN LTV exceeds 80%, THE System SHALL send margin call alert to the user
8. WHEN LTV exceeds 90%, THE System SHALL force rebalance by liquidating partial collateral or requiring additional collateral
9. THE System SHALL display risk dashboard with currency exposure, hedge positions, and profit/loss tracking
10. WHEN a hedge position is closed, THE System SHALL settle gains/losses to user's account

### Requirement 13: Reverse Remittance for NRI Users

**User Story:** As an NRI, I want to provide credit access to my family in India using my foreign assets, so that they can spend locally without currency conversion hassles.

#### Acceptance Criteria

1. WHEN an NRI user links a foreign bank account, THE System SHALL verify account ownership through Plaid/Finicity
2. WHEN an NRI locks foreign assets (USD/GBP/EUR), THE System SHALL calculate INR credit line using live FX rates
3. WHEN an NRI creates a family credit line, THE System SHALL allow adding family members with their details
4. WHEN a family member is added, THE System SHALL issue a Virtual_Card linked to NRI's collateral
5. THE System SHALL set spending limits for each family member card
6. WHEN a family member makes a transaction in INR, THE System SHALL deduct equivalent amount from NRI's credit line
7. THE System SHALL display real-time balance sync between NRI's dashboard and family member cards
8. THE System SHALL charge zero currency conversion fees (cost absorbed by platform or subsidized)
9. WHEN NRI wants to modify limits, THE System SHALL allow real-time adjustment of family member spending limits
10. THE System SHALL provide consolidated transaction report showing all family member spending

### Requirement 14: Real-Time Notifications and Alerts

**User Story:** As a user, I want to receive timely notifications about important events, so that I can stay informed and take necessary actions.

#### Acceptance Criteria

1. WHEN a user's account status changes (KYC approved, loan disbursed), THE System SHALL send email and SMS notifications via Twilio
2. WHEN a card transaction occurs, THE System SHALL send real-time push notification with transaction details
3. WHEN a loan payment is due in 3 days, THE System SHALL send reminder notifications
4. WHEN a margin call is triggered, THE System SHALL send urgent alerts via email, SMS, and in-app notification
5. WHEN Trust_Score changes significantly, THE System SHALL notify the user with updated score
6. WHEN a lender receives a loan offer acceptance, THE System SHALL send immediate notification
7. THE System SHALL allow users to configure notification preferences (email, SMS, push, in-app)
8. WHEN blockchain transaction is confirmed, THE System SHALL send confirmation notification with transaction hash
9. THE System SHALL implement notification rate limiting to prevent spam (max 10 SMS per day)
10. WHEN system maintenance is scheduled, THE System SHALL send advance notice 24 hours before

### Requirement 15: Admin Dashboard and Management

**User Story:** As an admin, I want a comprehensive dashboard to manage users, monitor transactions, and handle disputes, so that I can ensure platform integrity and compliance.

#### Acceptance Criteria

1. WHEN an admin logs in, THE System SHALL display admin dashboard with key metrics (total users, active loans, TVL, revenue)
2. THE System SHALL allow admins to view and search all user accounts with filters (KYC status, role, registration date)
3. WHEN an admin views a user profile, THE System SHALL display complete user information, assets, loans, and transaction history
4. THE System SHALL allow admins to manually approve or reject KYC applications with reason notes
5. WHEN a dispute is raised, THE System SHALL create a ticket visible in admin dashboard
6. THE System SHALL allow admins to freeze user accounts or cards in case of suspicious activity
7. THE System SHALL generate reports (daily transactions, monthly revenue, loan performance, default rates)
8. THE System SHALL log all admin actions with timestamps and admin IDs for audit trail
9. WHEN an admin modifies critical data, THE System SHALL require two-factor authentication
10. THE System SHALL provide analytics dashboard with charts for user growth, loan volume, and platform health

### Requirement 16: Security and Compliance

**User Story:** As a platform operator, I want robust security measures and compliance controls, so that user data and funds are protected and regulatory requirements are met.

#### Acceptance Criteria

1. THE System SHALL encrypt all sensitive data at rest using AES-256 encryption
2. THE System SHALL use TLS 1.3 for all data in transit
3. THE System SHALL implement rate limiting on all API endpoints (100 requests per minute per user)
4. THE System SHALL log all authentication attempts and flag suspicious patterns (multiple failed logins, unusual locations)
5. WHEN a security breach is detected, THE System SHALL automatically lock affected accounts and notify admins
6. THE System SHALL implement CSRF protection on all state-changing operations
7. THE System SHALL validate and sanitize all user inputs to prevent SQL injection and XSS attacks
8. THE System SHALL store KYC documents in encrypted S3 buckets with access logging
9. THE System SHALL implement role-based access control (RBAC) for all API endpoints
10. THE System SHALL comply with data protection regulations (GDPR, CCPA) and provide data export/deletion on request
11. THE System SHALL maintain audit logs for all financial transactions for 7 years
12. THE System SHALL implement automated backup of database every 6 hours with 30-day retention

### Requirement 17: API Architecture and Documentation

**User Story:** As a developer, I want well-documented RESTful APIs, so that I can integrate with the platform and build additional features.

#### Acceptance Criteria

1. THE System SHALL expose RESTful API endpoints following REST conventions (GET, POST, PUT, DELETE)
2. THE System SHALL return consistent JSON response format with status, data, and error fields
3. THE System SHALL implement API versioning (e.g., /api/v1/) to support backward compatibility
4. THE System SHALL provide comprehensive API documentation using OpenAPI/Swagger specification
5. THE System SHALL require JWT token in Authorization header for all protected endpoints
6. THE System SHALL return appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 500)
7. THE System SHALL implement request validation using schema validators (Joi/Zod)
8. THE System SHALL provide detailed error messages with error codes for debugging
9. THE System SHALL implement pagination for list endpoints (limit, offset, total count)
10. THE System SHALL support filtering, sorting, and searching on list endpoints

### Requirement 18: Database Design and Data Integrity

**User Story:** As a system architect, I want a well-designed database schema with data integrity constraints, so that data remains consistent and reliable.

#### Acceptance Criteria

1. THE System SHALL use PostgreSQL as primary database with proper indexing on frequently queried fields
2. THE System SHALL implement foreign key constraints to maintain referential integrity
3. THE System SHALL use database transactions for multi-step operations (loan disbursement, tokenization)
4. WHEN a transaction fails, THE System SHALL rollback all changes to maintain consistency
5. THE System SHALL implement soft deletes for critical records (users, transactions) to maintain audit trail
6. THE System SHALL use UUID for primary keys to prevent enumeration attacks
7. THE System SHALL implement database migrations using migration tools (Knex/Alembic)
8. THE System SHALL maintain created_at and updated_at timestamps on all tables
9. THE System SHALL implement database connection pooling for optimal performance
10. THE System SHALL use Redis for caching frequently accessed data (user sessions, asset prices) with TTL

### Requirement 19: Smart Contract Security and Testing

**User Story:** As a blockchain developer, I want secure and tested smart contracts, so that user assets and funds are protected from exploits.

#### Acceptance Criteria

1. THE Smart_Contract SHALL implement access control using OpenZeppelin's Ownable or AccessControl
2. THE Smart_Contract SHALL use SafeMath or Solidity 0.8+ for arithmetic operations to prevent overflow/underflow
3. THE Smart_Contract SHALL implement reentrancy guards on all external calls
4. THE Smart_Contract SHALL emit events for all state changes (token minted, loan created, collateral released)
5. THE Smart_Contract SHALL implement pause functionality for emergency situations
6. WHEN Smart_Contract is deployed, THE System SHALL verify contract code on blockchain explorer (Polygonscan)
7. THE Smart_Contract SHALL undergo security audit by third-party auditor before mainnet deployment
8. THE System SHALL implement comprehensive unit tests achieving >90% code coverage
9. THE System SHALL test Smart_Contract on testnet for minimum 2 weeks before mainnet deployment
10. THE Smart_Contract SHALL implement upgrade mechanism using proxy pattern for bug fixes

### Requirement 20: Performance and Scalability

**User Story:** As a platform operator, I want the system to handle high load and scale efficiently, so that user experience remains smooth as the platform grows.

#### Acceptance Criteria

1. THE System SHALL respond to API requests within 200ms for 95th percentile
2. THE System SHALL handle minimum 1000 concurrent users without performance degradation
3. THE System SHALL implement database query optimization with proper indexes and query planning
4. THE System SHALL use Redis caching to reduce database load for frequently accessed data
5. THE System SHALL implement CDN for static assets (images, CSS, JS) to reduce latency
6. THE System SHALL use connection pooling for database and external API connections
7. THE System SHALL implement horizontal scaling capability using load balancers
8. THE System SHALL monitor system performance using APM tools (New Relic, DataDog)
9. WHEN system load exceeds 80%, THE System SHALL trigger auto-scaling to add more instances
10. THE System SHALL implement rate limiting and request throttling to prevent abuse and ensure fair usage
