# Implementation Plan: AssetBridge Production Transformation

## Overview

This implementation plan transforms AssetBridge from a frontend prototype into a production-ready platform with backend services, blockchain integration, payment processing, and AI-powered credit scoring. The plan follows an incremental approach, building core infrastructure first, then layering features progressively with testing at each stage.

## Tasks

- [ ] 1. Project Setup and Infrastructure
  - Initialize backend project with Node.js, Express, TypeScript
  - Set up PostgreSQL database with connection pooling
  - Configure Redis for caching and sessions
  - Set up environment configuration (.env files)
  - Configure ESLint, Prettier, and TypeScript compiler
  - Set up testing framework (Jest) with fast-check for property-based testing
  - Create Docker Compose for local development (PostgreSQL, Redis)
  - Set up logging with Winston
  - _Requirements: 17.1, 17.3, 18.1, 18.9_

- [ ] 2. Database Schema and Migrations
  - [ ] 2.1 Create database migration system using Knex or Prisma
    - Set up migration tool
    - Create initial migration structure
    - _Requirements: 18.7_
  
  - [ ] 2.2 Implement core tables (users, kyc_documents, assets, locked_assets)
    - Create users table with indexes
    - Create kyc_documents table with foreign keys
    - Create assets table with metadata JSONB field
    - Create locked_assets table linking to assets
    - _Requirements: 1.1, 2.1, 4.1, 5.1_
  
  - [ ] 2.3 Implement loan-related tables (loan_requests, loan_offers, loans, repayments)
    - Create loan_requests table
    - Create loan_offers table
    - Create loans table with EMI tracking
    - Create repayments table with payment history
    - Create loan_collateral junction table
    - _Requirements: 8.1, 9.1_
  
  - [ ] 2.4 Implement payment and card tables (virtual_cards, card_transactions, payments)
    - Create virtual_cards table with encrypted fields
    - Create card_transactions table
    - Create payments table with status tracking
    - _Requirements: 10.1, 11.1_
  
  - [ ] 2.5 Implement trust score and notification tables
    - Create trust_scores table with factor breakdown
    - Create notifications table
    - Create audit_logs table
    - _Requirements: 7.1, 14.1, 15.1_
  
  - [ ] 2.6 Write property test for database schema integrity
    - **Property 48: Database Transaction Rollback on Failure**
    - **Validates: Requirements 18.4**

- [ ] 3. Authentication Service Implementation
  - [ ] 3.1 Implement user registration with password hashing
    - Create registration endpoint (POST /auth/register)
    - Hash passwords with bcrypt (cost factor 12)
    - Generate email and phone verification tokens
    - Store user in database
    - _Requirements: 1.1, 1.8_
  
  - [ ] 3.2 Implement email and phone verification
    - Create verification endpoint (POST /auth/verify-email)
    - Validate verification tokens
    - Update user verification status
    - Send verification emails via Twilio
    - _Requirements: 1.2_
  
  - [ ] 3.3 Implement login with JWT token generation
    - Create login endpoint (POST /auth/login)
    - Validate credentials
    - Generate JWT access token (15-min expiry)
    - Generate refresh token (7-day expiry)
    - Store session in Redis
    - _Requirements: 1.3_
  
  - [ ] 3.4 Implement JWT middleware for protected routes
    - Create authentication middleware
    - Verify JWT signature and expiry
    - Extract user info from token
    - Attach user to request object
    - _Requirements: 1.5, 1.6, 17.5_
  
  - [ ] 3.5 Implement token refresh and logout
    - Create refresh token endpoint (POST /auth/refresh-token)
    - Create logout endpoint (POST /auth/logout)
    - Invalidate tokens in Redis
    - _Requirements: 1.7_
  
  - [ ] 3.6 Implement password reset flow
    - Create password reset request endpoint
    - Generate secure reset tokens
    - Send reset emails
    - Create password reset confirmation endpoint
    - _Requirements: 1.4_
  
  - [ ] 3.7 Implement account lockout after failed attempts
    - Track failed login attempts in Redis
    - Lock account for 15 minutes after 3 failures
    - Clear counter on successful login
    - _Requirements: 1.9_
  
  - [ ] 3.8 Write property test for password hashing
    - **Property 1: Password Security Invariant**
    - **Validates: Requirements 1.8**
  
  - [ ] 3.9 Write property test for authentication token lifecycle
    - **Property 2: Authentication Token Lifecycle**
    - **Validates: Requirements 1.5**
  
  - [ ] 3.10 Write property test for protected route access control
    - **Property 3: Protected Route Access Control**
    - **Validates: Requirements 1.6, 17.5**
  
  - [ ] 3.11 Write property test for registration and verification round trip
    - **Property 4: Registration and Verification Round Trip**
    - **Validates: Requirements 1.1, 1.2**
  
  - [ ] 3.12 Write property test for account lockout
    - **Property 5: Account Lockout After Failed Attempts**
    - **Validates: Requirements 1.9**

- [ ] 4. Checkpoint - Authentication System
  - Ensure all authentication tests pass
  - Verify JWT tokens work correctly
  - Test password reset flow manually
  - Ask the user if questions arise

- [ ] 5. KYC Service Implementation
  - [ ] 5.1 Implement KYC submission endpoint
    - Create KYC submission endpoint (POST /kyc/submit)
    - Validate personal details (name, DOB, address, PAN)
    - Store KYC data in database
    - Update user KYC status to 'SUBMITTED'
    - _Requirements: 2.2_
  
  - [ ] 5.2 Implement document upload with S3 integration
    - Set up AWS S3 client
    - Create document upload endpoint (POST /kyc/upload-document)
    - Validate file types (PDF, JPG, PNG) and size (max 5MB)
    - Encrypt and upload to S3
    - Store file URL and hash in database
    - _Requirements: 2.3, 2.9_
  
  - [ ] 5.3 Integrate OCR for document text extraction
    - Integrate Tesseract or AWS Textract
    - Extract text from uploaded documents
    - Parse document numbers, dates, names
    - Store OCR data in kyc_documents.ocr_data JSONB field
    - _Requirements: 2.4_
  
  - [ ] 5.4 Integrate third-party KYC provider (Sumsub/Onfido)
    - Set up Sumsub/Onfido API client
    - Submit KYC data to provider
    - Handle verification webhooks
    - Update KYC status based on provider response
    - _Requirements: 2.6, 2.7, 2.8_
  
  - [ ] 5.5 Implement KYC status endpoint
    - Create KYC status endpoint (GET /kyc/status)
    - Return current KYC status and document list
    - Include verification details
    - _Requirements: 2.1_
  
  - [ ] 5.6 Write property test for KYC document encryption
    - **Property 6: KYC Document Storage Security**
    - **Validates: Requirements 2.9**
  
  - [ ] 5.7 Write property test for KYC status notifications
    - **Property 7: KYC Status Change Notifications**
    - **Validates: Requirements 2.10**

- [ ] 6. User Profile Service Implementation
  - [ ] 6.1 Implement profile retrieval endpoint
    - Create profile endpoint (GET /users/profile)
    - Return complete user profile with KYC status
    - Include linked accounts and trust score
    - _Requirements: 3.1_
  
  - [ ] 6.2 Implement profile update endpoint
    - Create profile update endpoint (PUT /users/profile)
    - Validate update data
    - Update database
    - Return updated profile
    - _Requirements: 3.2_
  
  - [ ] 6.3 Implement email/phone change with re-verification
    - Create contact change endpoint
    - Generate new verification tokens
    - Send verification to new contact
    - Update only after verification
    - _Requirements: 3.3_
  
  - [ ] 6.4 Implement dashboard data aggregation
    - Create dashboard endpoint (GET /users/dashboard)
    - Aggregate locked assets, active loans, credit available
    - Calculate total portfolio value
    - Include trust score
    - _Requirements: 3.5_
  
  - [ ] 6.5 Write property test for profile update round trip
    - **Property 8: Profile Update Round Trip**
    - **Validates: Requirements 3.2**
  
  - [ ] 6.6 Write property test for email/phone verification requirement
    - **Property 9: Email/Phone Change Requires Verification**
    - **Validates: Requirements 3.3**
  
  - [ ] 6.7 Write property test for account deletion with active loans
    - **Property 10: Account Deletion Blocked by Active Loans**
    - **Validates: Requirements 3.7**

- [ ] 7. Checkpoint - User Management
  - Ensure all user profile tests pass
  - Verify KYC flow works end-to-end
  - Test document upload to S3
  - Ask the user if questions arise

- [ ] 8. Asset Management Service - External Integrations
  - [ ] 8.1 Integrate Plaid for bank account linking
    - Set up Plaid API client
    - Create bank linking endpoint (POST /assets/link-bank)
    - Exchange Plaid public token for access token
    - Fetch account balances and details
    - Store bank account as asset
    - _Requirements: 4.1, 4.2_
  
  - [ ] 8.2 Integrate Alpha Vantage for stock portfolio
    - Set up Alpha Vantage API client
    - Create stock portfolio linking endpoint
    - Fetch stock holdings and current prices
    - Calculate portfolio value
    - Store stocks as assets
    - _Requirements: 4.3_
  
  - [ ] 8.3 Integrate mutual fund and gold price APIs
    - Set up MFCentral/AMFI API client for mutual funds
    - Set up gold price API client
    - Create endpoints for adding mutual funds and gold
    - Fetch NAV and gold prices
    - Store as assets
    - _Requirements: 4.4, 4.5_
  
  - [ ] 8.4 Implement real estate asset entry
    - Create real estate asset endpoint
    - Require manual value entry
    - Require ownership document upload
    - Store as asset with 'PROPERTY' type
    - _Requirements: 4.6_
  
  - [ ] 8.5 Implement asset valuation refresh job
    - Create scheduled job (cron) for daily valuation updates
    - Fetch latest prices for stocks, mutual funds, gold
    - Update asset current_value and last_valuation_at
    - Cache prices in Redis (5-minute TTL)
    - _Requirements: 4.9_
  
  - [ ] 8.6 Write property test for asset valuation freshness
    - **Property 11: Asset Valuation Freshness**
    - **Validates: Requirements 4.9**
  
  - [ ] 8.7 Write property test for significant value change notifications
    - **Property 12: Significant Asset Value Change Notifications**
    - **Validates: Requirements 4.10**

- [ ] 9. Asset Management Service - Locking and Tokenization
  - [ ] 9.1 Implement asset listing endpoint
    - Create assets endpoint (GET /assets)
    - Return all user assets with current values
    - Include locked status
    - Calculate total portfolio value
    - _Requirements: 4.8_
  
  - [ ] 9.2 Implement credit limit calculation
    - Create credit limit calculation function
    - Apply LTV ratios by asset type (FD: 90%, STOCK: 70%, GOLD: 75%, PROPERTY: 60%)
    - Create credit limit endpoint (GET /assets/credit-limit)
    - Return total and available credit
    - _Requirements: 5.1, 5.7_
  
  - [ ] 9.3 Implement asset locking endpoint
    - Create asset lock endpoint (POST /assets/lock)
    - Validate asset ownership
    - Create custodian lien record (mock for now)
    - Update asset status to 'LOCKED'
    - Trigger tokenization (next task)
    - _Requirements: 5.2, 5.6_
  
  - [ ] 9.4 Implement asset unlocking endpoint
    - Create asset unlock endpoint (POST /assets/unlock)
    - Verify no active loans using the asset
    - Trigger token burning (blockchain task)
    - Release custodian lien
    - Update asset status to 'ACTIVE'
    - _Requirements: 5.9_
  
  - [ ] 9.5 Write property test for LTV ratio consistency
    - **Property 13: LTV Ratio Consistency by Asset Type**
    - **Validates: Requirements 5.7**
  
  - [ ] 9.6 Write property test for asset lock-unlock round trip
    - **Property 15: Asset Lock-Unlock Round Trip**
    - **Validates: Requirements 5.9**

- [ ] 10. Checkpoint - Asset Management
  - Ensure all asset management tests pass
  - Verify Plaid integration works
  - Test asset valuation refresh job
  - Ask the user if questions arise

- [ ] 11. Smart Contract Development - AssetToken
  - [ ] 11.1 Set up Hardhat project for smart contracts
    - Initialize Hardhat project
    - Install OpenZeppelin contracts
    - Configure Polygon Mumbai testnet
    - Set up deployment scripts
    - _Requirements: 6.7_
  
  - [ ] 11.2 Implement AssetToken ERC-721 contract
    - Create AssetToken.sol contract
    - Inherit from ERC721, AccessControl, Pausable
    - Implement mintAssetToken function with metadata
    - Implement burnAssetToken function
    - Implement pause/unpause functions
    - Add events for minting and burning
    - _Requirements: 5.4, 5.9_
  
  - [ ] 11.3 Write unit tests for AssetToken contract
    - Test minting with valid data
    - Test burning tokens
    - Test access control (only MINTER_ROLE can mint)
    - Test pause functionality
    - Test metadata storage
    - _Requirements: 19.1, 19.4, 19.5_
  
  - [ ] 11.4 Write property test for unique token IDs
    - **Property 14: Asset Tokenization Creates Unique Tokens**
    - **Validates: Requirements 5.4**
  
  - [ ] 11.5 Write property test for token transfer ownership verification
    - **Property 18: Token Transfer Ownership Verification**
    - **Validates: Requirements 6.8**
  
  - [ ] 11.6 Write property test for smart contract access control
    - **Property 49: Smart Contract Access Control Enforcement**
    - **Validates: Requirements 19.1**
  
  - [ ] 11.7 Write property test for smart contract reentrancy protection
    - **Property 50: Smart Contract Reentrancy Protection**
    - **Validates: Requirements 19.3**
  
  - [ ] 11.8 Write property test for smart contract events
    - **Property 51: Smart Contract State Change Events**
    - **Validates: Requirements 19.4**
  
  - [ ] 11.9 Write property test for smart contract pause functionality
    - **Property 52: Smart Contract Pause Functionality**
    - **Validates: Requirements 19.5**

- [ ] 12. Smart Contract Development - LoanManager
  - [ ] 12.1 Implement LoanManager contract
    - Create LoanManager.sol contract
    - Implement createLoan function with escrow
    - Implement repayLoan function with collateral release
    - Implement liquidateCollateral function
    - Add reentrancy guards
    - Add events for loan lifecycle
    - _Requirements: 8.6, 9.4, 9.5_
  
  - [ ] 12.2 Write unit tests for LoanManager contract
    - Test loan creation with collateral transfer
    - Test loan repayment and collateral release
    - Test liquidation after default
    - Test access control
    - Test reentrancy protection
    - _Requirements: 19.1, 19.3_

- [ ] 13. Smart Contract Development - TrustScore
  - [ ] 13.1 Implement TrustScore contract
    - Create TrustScore.sol contract
    - Implement updateTrustScore function
    - Implement getTrustScore function
    - Implement verifyScoreHash function
    - Add access control for score updates
    - _Requirements: 7.10_
  
  - [ ] 13.2 Write unit tests for TrustScore contract
    - Test score updates
    - Test score retrieval
    - Test hash verification
    - Test access control
    - _Requirements: 19.1_
  
  - [ ] 13.3 Write property test for trust score on-chain verification
    - **Property 21: Trust Score On-Chain Verification**
    - **Validates: Requirements 7.10**

- [ ] 14. Blockchain Integration Service
  - [ ] 14.1 Set up Ethers.js integration
    - Install ethers.js
    - Configure provider for Polygon Mumbai
    - Set up wallet for contract interactions
    - Load contract ABIs
    - _Requirements: 6.1, 6.2_
  
  - [ ] 14.2 Implement token minting service
    - Create mintAssetToken function
    - Estimate gas fees before minting
    - Submit transaction to blockchain
    - Track transaction status
    - Store token ID and transaction hash in database
    - _Requirements: 5.4, 5.5, 6.3, 6.4_
  
  - [ ] 14.3 Implement token burning service
    - Create burnAssetToken function
    - Verify token ownership
    - Submit burn transaction
    - Track transaction status
    - Update database on confirmation
    - _Requirements: 5.9_
  
  - [ ] 14.4 Implement loan escrow service
    - Create createLoanEscrow function
    - Transfer collateral tokens to LoanManager contract
    - Store escrow contract address
    - _Requirements: 8.6_
  
  - [ ] 14.5 Implement collateral release and liquidation
    - Create releaseLoanEscrow function for repayment
    - Create liquidateCollateral function for defaults
    - Track transaction status
    - _Requirements: 9.4, 9.5_
  
  - [ ] 14.6 Integrate Chainlink oracles for price feeds
    - Set up Chainlink price feed contracts
    - Create getFXRate function
    - Create getAssetPrice function
    - Cache prices in Redis
    - _Requirements: 6.9_
  
  - [ ] 14.7 Write property test for blockchain transaction tracking
    - **Property 17: Blockchain Transaction Tracking**
    - **Validates: Requirements 6.6**

- [ ] 15. Checkpoint - Blockchain Integration
  - Deploy contracts to Polygon Mumbai testnet
  - Verify contract code on Polygonscan
  - Test token minting and burning
  - Test loan escrow creation
  - Ask the user if questions arise

- [ ] 16. AI Credit Scoring Service
  - [ ] 16.1 Implement document OCR processing
    - Create document processing function
    - Extract text from bank statements
    - Extract text from tax returns (ITR)
    - Extract text from credit reports
    - Parse structured data (income, expenses, credit score)
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 16.2 Integrate OpenAI API for credit analysis
    - Set up OpenAI API client
    - Create prompt for financial analysis
    - Send parsed document data to OpenAI
    - Extract insights (income stability, spending patterns, risk factors)
    - _Requirements: 7.4_
  
  - [ ] 16.3 Implement trust score calculation
    - Create calculateTrustScore function
    - Apply weighted factors: Income (25%), Credit (20%), Asset (25%), DTI (15%), Cross-border (10%), Fraud (5%)
    - Calculate final score (0-1000)
    - Generate factor breakdown
    - Store in trust_scores table
    - _Requirements: 7.5, 7.6_
  
  - [ ] 16.4 Implement explainable AI insights
    - Generate positive factors list
    - Generate negative factors list
    - Generate improvement suggestions
    - Return with trust score
    - _Requirements: 7.7_
  
  - [ ] 16.5 Implement trust score endpoints
    - Create calculate endpoint (POST /trust-score/calculate)
    - Create get endpoint (GET /trust-score)
    - Include explanation in response
    - _Requirements: 7.6, 7.7_
  
  - [ ] 16.6 Implement trust score recalculation job
    - Create monthly recalculation job
    - Trigger recalculation on new document upload
    - Send notifications for significant changes (>50 points)
    - Update on-chain hash
    - _Requirements: 7.8, 7.9_
  
  - [ ] 16.7 Write property test for trust score calculation weights
    - **Property 19: Trust Score Calculation Weights**
    - **Validates: Requirements 7.5**
  
  - [ ] 16.8 Write property test for trust score range constraint
    - **Property 20: Trust Score Range Constraint**
    - **Validates: Requirements 7.5**
  
  - [ ] 16.9 Write property test for significant score change notifications
    - **Property 22: Significant Trust Score Change Notifications**
    - **Validates: Requirements 7.9**

- [ ] 17. Loan Service - Request and Marketplace
  - [ ] 17.1 Implement loan request creation
    - Create loan request endpoint (POST /loans/requests)
    - Validate loan amount against credit limit
    - Validate collateral asset IDs
    - Store loan request in database
    - Link collateral assets
    - _Requirements: 8.1, 8.2_
  
  - [ ] 17.2 Implement loan marketplace listing
    - Create loan requests endpoint (GET /loans/requests)
    - Support filtering (status, amount range, tenure)
    - Include borrower trust score
    - Include collateral details
    - Implement pagination
    - _Requirements: 8.3, 8.4_
  
  - [ ] 17.3 Implement loan offer creation
    - Create loan offer endpoint (POST /loans/offers)
    - Validate lender has sufficient funds
    - Store loan offer in database
    - Send notification to borrower
    - _Requirements: 8.5_
  
  - [ ] 17.4 Implement loan offer acceptance
    - Create offer acceptance endpoint (POST /loans/offers/:offerId/accept)
    - Create loan record
    - Calculate EMI amount
    - Generate repayment schedule
    - Create blockchain escrow
    - Update loan request status to 'MATCHED'
    - _Requirements: 8.6, 8.7, 8.8_
  
  - [ ] 17.5 Write property test for loan amount within credit limit
    - **Property 23: Loan Amount Within Credit Limit**
    - **Validates: Requirements 8.2**
  
  - [ ] 17.6 Write property test for loan acceptance creates escrow
    - **Property 24: Loan Acceptance Creates Escrow**
    - **Validates: Requirements 8.6**
  
  - [ ] 17.7 Write property test for repayment schedule generation
    - **Property 25: Loan Repayment Schedule Generation**
    - **Validates: Requirements 8.8**

- [ ] 18. Loan Service - Repayment and Lifecycle
  - [ ] 18.1 Implement loan disbursement
    - Create disbursement function
    - Transfer funds to borrower's bank account (via payment gateway)
    - Deduct platform fee (0.5%)
    - Update loan status to 'ACTIVE'
    - Set first payment due date
    - _Requirements: 8.7, 9.7_
  
  - [ ] 18.2 Implement loan repayment endpoint
    - Create repayment endpoint (POST /loans/:loanId/repay)
    - Calculate principal and interest split
    - Process payment via payment gateway
    - Update total_repaid in loans table
    - Create repayment record
    - Distribute interest to lender
    - _Requirements: 8.9, 9.2_
  
  - [ ] 18.3 Implement auto-debit for EMI payments
    - Create scheduled job for due date checks
    - Auto-debit from borrower's linked account
    - Send payment reminders 3 days before due date
    - Handle payment failures
    - _Requirements: 8.9_
  
  - [ ] 18.4 Implement loan completion and collateral release
    - Check if loan is fully repaid
    - Release collateral via blockchain
    - Update loan status to 'REPAID'
    - Send completion notifications
    - _Requirements: 9.4_
  
  - [ ] 18.5 Implement default handling and liquidation
    - Create job to check overdue payments
    - Send alerts on missed payments
    - Start 7-day grace period
    - Trigger liquidation after grace period
    - Transfer collateral to lender
    - Update loan status to 'DEFAULTED'
    - Report to credit bureaus after 30 days
    - _Requirements: 8.10, 9.5, 9.6, 9.8_
  
  - [ ] 18.6 Implement early repayment
    - Allow early full repayment
    - Recalculate interest based on actual days
    - Process repayment
    - Release collateral
    - _Requirements: 9.9_
  
  - [ ] 18.7 Implement lender portfolio endpoint
    - Create lender portfolio endpoint (GET /loans/my-loans?role=LENDER)
    - Show all active loans
    - Calculate total returns (interest earned)
    - Show pending interest
    - _Requirements: 9.1, 9.3_
  
  - [ ] 18.8 Write property test for missed payment grace period
    - **Property 26: Missed Payment Grace Period**
    - **Validates: Requirements 8.10**
  
  - [ ] 18.9 Write property test for repayment principal-interest split
    - **Property 27: Loan Repayment Principal-Interest Split**
    - **Validates: Requirements 9.2**
  
  - [ ] 18.10 Write property test for full repayment releases collateral
    - **Property 28: Full Repayment Releases Collateral**
    - **Validates: Requirements 9.4**
  
  - [ ] 18.11 Write property test for default triggers liquidation
    - **Property 29: Default Triggers Liquidation**
    - **Validates: Requirements 9.5, 9.6**
  
  - [ ] 18.12 Write property test for platform fee application
    - **Property 30: Platform Fee Application on Loans**
    - **Validates: Requirements 9.7**
  
  - [ ] 18.13 Write property test for early repayment interest recalculation
    - **Property 31: Early Repayment Interest Recalculation**
    - **Validates: Requirements 9.9**

- [ ] 19. Checkpoint - Loan System
  - Ensure all loan tests pass
  - Test loan creation and acceptance flow
  - Test repayment and liquidation
  - Verify escrow contracts work correctly
  - Ask the user if questions arise

- [ ] 20. Payment Gateway Integration
  - [ ] 20.1 Integrate Stripe/Razorpay SDK
    - Set up Stripe/Razorpay API client
    - Configure API keys
    - Set up webhook endpoint
    - _Requirements: 11.1_
  
  - [ ] 20.2 Implement payment intent creation
    - Create payment intent endpoint (POST /payments/create-intent)
    - Generate payment intent with amount and purpose
    - Return client secret for frontend
    - _Requirements: 11.1_
  
  - [ ] 20.3 Implement payment webhook handler
    - Create webhook endpoint (POST /payments/webhook)
    - Verify webhook signature
    - Handle payment success events
    - Handle payment failure events
    - Update payment status in database
    - Send notifications
    - _Requirements: 11.3, 11.4, 11.8_
  
  - [ ] 20.4 Implement invoice generation
    - Create invoice generation function
    - Generate PDF invoices
    - Email invoices to users
    - _Requirements: 11.5_
  
  - [ ] 20.5 Implement refund processing
    - Create refund endpoint
    - Process refund via payment gateway
    - Update payment status
    - Send refund confirmation
    - _Requirements: 11.7_
  
  - [ ] 20.6 Implement multi-currency payment support
    - Support INR, USD, GBP, EUR, AED
    - Fetch live FX rates
    - Convert amounts for display
    - Process payments in user's currency
    - _Requirements: 11.6_
  
  - [ ] 20.7 Write property test for payment success updates status
    - **Property 36: Payment Success Updates Transaction Status**
    - **Validates: Requirements 11.3, 11.5**
  
  - [ ] 20.8 Write property test for webhook signature verification
    - **Property 37: Payment Webhook Signature Verification**
    - **Validates: Requirements 11.8**
  
  - [ ] 20.9 Write property test for multi-currency payment support
    - **Property 38: Multi-Currency Payment Support**
    - **Validates: Requirements 11.6**

- [ ] 21. Virtual Card Issuance Service
  - [ ] 21.1 Integrate card issuance provider (Marqeta/Stripe Issuing)
    - Set up Marqeta/Stripe Issuing API client
    - Configure card program
    - Set up card transaction webhooks
    - _Requirements: 10.2_
  
  - [ ] 21.2 Implement virtual card issuance
    - Create card issuance endpoint (POST /cards/issue)
    - Verify user has sufficient credit limit
    - Create card via issuer API
    - Encrypt card number and CVV
    - Store card details in database
    - Return masked card details
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ] 21.3 Implement card details reveal
    - Create card details endpoint (GET /cards/:cardId/details)
    - Require re-authentication (2FA or password)
    - Decrypt card number and CVV
    - Return full card details
    - _Requirements: 10.4_
  
  - [ ] 21.4 Implement card transaction webhook handler
    - Create card transaction webhook endpoint
    - Verify webhook signature
    - Store transaction in database
    - Deduct from available credit
    - Send real-time notification
    - _Requirements: 10.6, 10.7_
  
  - [ ] 21.5 Implement card management endpoints
    - Create card transactions endpoint (GET /cards/:cardId/transactions)
    - Create freeze card endpoint (POST /cards/:cardId/freeze)
    - Create unfreeze card endpoint (POST /cards/:cardId/unfreeze)
    - Update card status in database and with issuer
    - _Requirements: 10.8, 10.9_
  
  - [ ] 21.6 Implement low balance alerts
    - Create job to check card balances
    - Send alert when balance < 10% of limit
    - _Requirements: 10.12_
  
  - [ ] 21.7 Write property test for card credit limit matches available credit
    - **Property 32: Virtual Card Credit Limit Matches Available Credit**
    - **Validates: Requirements 10.5**
  
  - [ ] 21.8 Write property test for card transaction reduces credit
    - **Property 33: Card Transaction Reduces Available Credit**
    - **Validates: Requirements 10.7**
  
  - [ ] 21.9 Write property test for frozen card blocks transactions
    - **Property 34: Frozen Card Blocks Transactions**
    - **Validates: Requirements 10.9**
  
  - [ ] 21.10 Write property test for low balance alert threshold
    - **Property 35: Low Balance Alert Threshold**
    - **Validates: Requirements 10.12**

- [ ] 22. Checkpoint - Payments and Cards
  - Ensure all payment and card tests pass
  - Test payment gateway integration
  - Test card issuance and transactions
  - Verify webhooks work correctly
  - Ask the user if questions arise

- [ ] 23. FX Hedging and Risk Management Service
  - [ ] 23.1 Integrate Forex API for live FX rates
    - Set up Forex API client
    - Create FX rate fetching function
    - Cache rates in Redis (5-minute TTL)
    - Create scheduled job to refresh rates every 5 minutes
    - _Requirements: 12.2_
  
  - [ ] 23.2 Implement currency exposure calculation
    - Create exposure calculation function
    - Aggregate assets by currency
    - Calculate total exposure per currency
    - Create exposure endpoint (GET /risk/exposure)
    - _Requirements: 12.1_
  
  - [ ] 23.3 Implement auto-hedging configuration
    - Create auto-hedge setup endpoint (POST /risk/auto-hedge)
    - Allow setting threshold rates
    - Store hedge configuration
    - _Requirements: 12.3_
  
  - [ ] 23.4 Implement auto-hedge execution
    - Create job to monitor FX rates
    - Check if rates cross thresholds
    - Execute hedge via partner broker API (mock for now)
    - Calculate and display hedge costs
    - Store hedge positions
    - _Requirements: 12.4, 12.5_
  
  - [ ] 23.5 Implement LTV monitoring and margin calls
    - Create job to monitor collateral values
    - Calculate current LTV ratios
    - Send margin call alerts when LTV > 80%
    - Trigger force rebalance when LTV > 90%
    - _Requirements: 12.6, 12.7, 12.8_
  
  - [ ] 23.6 Implement risk dashboard endpoint
    - Create risk dashboard endpoint (GET /risk/dashboard)
    - Show currency exposure breakdown
    - Show hedge positions
    - Calculate and show P&L
    - _Requirements: 12.9_
  
  - [ ] 23.7 Write property test for margin call alert threshold
    - **Property 39: Margin Call Alert at LTV Threshold**
    - **Validates: Requirements 12.7**
  
  - [ ] 23.8 Write property test for force rebalance at critical LTV
    - **Property 40: Force Rebalance at Critical LTV**
    - **Validates: Requirements 12.8**
  
  - [ ] 23.9 Write property test for auto-hedge execution
    - **Property 41: Auto-Hedge Execution on Threshold Breach**
    - **Validates: Requirements 12.4**

- [ ] 24. Reverse Remittance Service for NRI Users
  - [ ] 24.1 Implement foreign bank account linking
    - Extend Plaid integration for foreign accounts
    - Create foreign account linking endpoint
    - Verify account ownership
    - Store foreign account details
    - _Requirements: 13.1_
  
  - [ ] 24.2 Implement NRI credit line calculation
    - Calculate INR credit line from foreign assets
    - Use live FX rates for conversion
    - Apply LTV ratios
    - Create NRI credit line endpoint
    - _Requirements: 13.2_
  
  - [ ] 24.3 Implement family member management
    - Create family member addition endpoint (POST /nri/family-members)
    - Store family member details
    - Set spending limits per member
    - _Requirements: 13.3, 13.5_
  
  - [ ] 24.4 Implement family member card issuance
    - Issue virtual card for each family member
    - Link card to NRI's credit line
    - Set individual spending limits
    - _Requirements: 13.4_
  
  - [ ] 24.5 Implement family transaction tracking
    - Track all family member transactions
    - Deduct from NRI's credit line
    - Sync balances in real-time
    - Create consolidated report endpoint
    - _Requirements: 13.6, 13.7, 13.10_
  
  - [ ] 24.6 Implement zero FX fee policy
    - Waive currency conversion fees for family transactions
    - Absorb FX costs in platform
    - _Requirements: 13.8_
  
  - [ ] 24.7 Implement real-time limit adjustment
    - Create limit adjustment endpoint (PUT /nri/family-members/:id/limit)
    - Update card limits immediately
    - Sync with card issuer
    - _Requirements: 13.9_
  
  - [ ] 24.8 Write property test for family transaction deducts from NRI credit
    - **Property 42: NRI Family Transaction Deducts from NRI Credit**
    - **Validates: Requirements 13.6**
  
  - [ ] 24.9 Write property test for NRI credit line FX conversion
    - **Property 43: NRI Family Credit Line FX Conversion**
    - **Validates: Requirements 13.2**
  
  - [ ] 24.10 Write property test for zero FX fees
    - **Property 44: Zero FX Fees for Family Transactions**
    - **Validates: Requirements 13.8**

- [ ] 25. Checkpoint - Risk Management and NRI Features
  - Ensure all risk management tests pass
  - Test FX hedging and margin calls
  - Test NRI family credit line
  - Verify family member cards work
  - Ask the user if questions arise

- [ ] 26. Notification Service Implementation
  - [ ] 26.1 Integrate Twilio for SMS and email
    - Set up Twilio API client
    - Configure SMS and email templates
    - Create notification sending function
    - _Requirements: 14.1_
  
  - [ ] 26.2 Implement notification endpoints
    - Create notification preferences endpoint
    - Allow users to configure notification channels
    - Store preferences in database
    - _Requirements: 14.7_
  
  - [ ] 26.3 Implement notification triggers
    - KYC status changes
    - Card transactions
    - Loan payment reminders
    - Margin calls
    - Trust score changes
    - Loan offer notifications
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_
  
  - [ ] 26.4 Implement notification rate limiting
    - Limit SMS to 10 per day per user
    - Queue notifications if limit exceeded
    - _Requirements: 14.9_
  
  - [ ] 26.5 Implement system maintenance notifications
    - Create admin endpoint to schedule maintenance
    - Send advance notice 24 hours before
    - _Requirements: 14.10_

- [ ] 27. Admin Dashboard Implementation
  - [ ] 27.1 Implement admin authentication and RBAC
    - Create admin role in database
    - Implement admin-only middleware
    - Require 2FA for admin actions
    - _Requirements: 15.9_
  
  - [ ] 27.2 Implement admin dashboard metrics endpoint
    - Create admin dashboard endpoint (GET /admin/analytics)
    - Calculate total users, active loans, TVL, revenue
    - Calculate default rates
    - _Requirements: 15.1_
  
  - [ ] 27.3 Implement user management endpoints
    - Create user search endpoint (GET /admin/users)
    - Support filters (KYC status, role, date)
    - Implement pagination
    - Create user detail endpoint (GET /admin/users/:userId)
    - _Requirements: 15.2, 15.3_
  
  - [ ] 27.4 Implement KYC approval/rejection
    - Create KYC approval endpoint (PUT /admin/kyc/:userId/approve)
    - Create KYC rejection endpoint (PUT /admin/kyc/:userId/reject)
    - Require admin notes
    - Send notifications to users
    - _Requirements: 15.4_
  
  - [ ] 27.5 Implement account and card freezing
    - Create account freeze endpoint (POST /admin/users/:userId/freeze)
    - Create card freeze endpoint (POST /admin/cards/:cardId/freeze)
    - Log admin actions
    - _Requirements: 15.6_
  
  - [ ] 27.6 Implement report generation
    - Create report endpoints for daily transactions, monthly revenue
    - Generate CSV/PDF reports
    - Include loan performance and default rates
    - _Requirements: 15.7_
  
  - [ ] 27.7 Implement audit logging
    - Log all admin actions with timestamps
    - Store admin ID and action details
    - Create audit log viewing endpoint
    - _Requirements: 15.8_

- [ ] 28. API Documentation and Error Handling
  - [ ] 28.1 Implement consistent API response format
    - Create response wrapper functions
    - Ensure all endpoints return { status, data, error }
    - _Requirements: 17.2_
  
  - [ ] 28.2 Implement comprehensive error handling
    - Create error classes for each error type
    - Implement global error handler middleware
    - Return appropriate HTTP status codes
    - Include error codes and messages
    - _Requirements: 17.6, 17.8_
  
  - [ ] 28.3 Implement request validation middleware
    - Use Joi or Zod for schema validation
    - Validate all request bodies and query params
    - Return detailed validation errors
    - _Requirements: 17.7_
  
  - [ ] 28.4 Implement pagination, filtering, and sorting
    - Add pagination support to all list endpoints
    - Support query params for filtering
    - Support sorting by various fields
    - _Requirements: 17.9, 17.10_
  
  - [ ] 28.5 Generate OpenAPI/Swagger documentation
    - Set up Swagger UI
    - Document all API endpoints
    - Include request/response schemas
    - Include authentication requirements
    - _Requirements: 17.4_
  
  - [ ] 28.6 Write property test for API response format consistency
    - **Property 45: API Response Format Consistency**
    - **Validates: Requirements 17.2**
  
  - [ ] 28.7 Write property test for API error messages
    - **Property 46: API Error Messages Include Error Codes**
    - **Validates: Requirements 17.8**
  
  - [ ] 28.8 Write property test for list endpoint pagination
    - **Property 47: List Endpoint Pagination Support**
    - **Validates: Requirements 17.9**

- [ ] 29. Security Hardening
  - [ ] 29.1 Implement rate limiting
    - Set up rate limiting middleware (100 req/min per user)
    - Apply to all API endpoints
    - Return 429 status when exceeded
    - _Requirements: 16.3_
  
  - [ ] 29.2 Implement CORS configuration
    - Configure CORS for allowed origins
    - Set appropriate headers
    - _Requirements: 16.7_
  
  - [ ] 29.3 Implement CSRF protection
    - Add CSRF tokens to state-changing operations
    - Validate tokens on POST/PUT/DELETE requests
    - _Requirements: 16.6_
  
  - [ ] 29.4 Implement input sanitization
    - Sanitize all user inputs
    - Prevent SQL injection via parameterized queries
    - Prevent XSS via output encoding
    - _Requirements: 16.7_
  
  - [ ] 29.5 Implement data encryption
    - Encrypt sensitive data at rest (AES-256)
    - Use TLS 1.3 for data in transit
    - Encrypt KYC documents in S3
    - _Requirements: 16.1, 16.2, 16.8_
  
  - [ ] 29.6 Implement security monitoring
    - Log all authentication attempts
    - Flag suspicious patterns (multiple failed logins, unusual locations)
    - Auto-lock accounts on breach detection
    - _Requirements: 16.4, 16.5_
  
  - [ ] 29.7 Implement automated database backups
    - Set up automated backups every 6 hours
    - Retain backups for 30 days
    - Test backup restoration
    - _Requirements: 16.12_

- [ ] 30. Checkpoint - Security and Admin Features
  - Ensure all security tests pass
  - Test rate limiting and CORS
  - Test admin dashboard and user management
  - Verify audit logging works
  - Ask the user if questions arise

- [ ] 31. Frontend Integration Updates
  - [ ] 31.1 Update authentication flow in frontend
    - Integrate with backend login/register endpoints
    - Store JWT tokens securely
    - Implement token refresh logic
    - Add protected route guards
    - _Requirements: 1.3, 1.5, 1.6_
  
  - [ ] 31.2 Update KYC flow in frontend
    - Create multi-step KYC form
    - Integrate document upload
    - Show KYC status
    - Handle verification callbacks
    - _Requirements: 2.1, 2.3_
  
  - [ ] 31.3 Integrate Web3 wallet connection
    - Add MetaMask and WalletConnect support
    - Display connected wallet address
    - Show transaction status
    - Handle wallet disconnection
    - _Requirements: 6.1, 6.2, 6.5_
  
  - [ ] 31.4 Update asset management UI
    - Integrate with asset endpoints
    - Show real asset data from Plaid/APIs
    - Implement asset locking UI
    - Show tokenization progress
    - Display credit limits
    - _Requirements: 4.1, 5.1, 5.6_
  
  - [ ] 31.5 Update loan marketplace UI
    - Integrate with loan endpoints
    - Show real loan requests
    - Implement loan offer creation
    - Show loan acceptance flow
    - Display repayment schedules
    - _Requirements: 8.3, 8.4, 8.8_
  
  - [ ] 31.6 Integrate payment gateway in frontend
    - Add Stripe/Razorpay Elements
    - Handle payment intent flow
    - Show payment success/failure
    - Display invoices
    - _Requirements: 11.1, 11.3_
  
  - [ ] 31.7 Update virtual card UI
    - Show card details (masked)
    - Implement card reveal with authentication
    - Display transaction history
    - Add freeze/unfreeze controls
    - _Requirements: 10.3, 10.4, 10.8, 10.9_
  
  - [ ] 31.8 Update dashboard with real data
    - Integrate with dashboard endpoint
    - Show real trust score
    - Display actual locked assets
    - Show active loans
    - Display available credit
    - _Requirements: 3.5, 7.6_
  
  - [ ] 31.9 Implement real-time notifications
    - Add WebSocket or Server-Sent Events
    - Show toast notifications for events
    - Display notification history
    - _Requirements: 14.2_

- [ ] 32. Testing and Quality Assurance
  - [ ] 32.1 Run all unit tests
    - Execute Jest test suite
    - Ensure >80% code coverage
    - Fix any failing tests
  
  - [ ] 32.2 Run all property-based tests
    - Execute fast-check test suite
    - Verify all 52 correctness properties pass
    - Fix any failing properties
  
  - [ ] 32.3 Run integration tests
    - Test all API endpoints
    - Test external API integrations (mocked)
    - Test database operations
    - Ensure >70% integration coverage
  
  - [ ] 32.4 Run smart contract tests
    - Execute Hardhat test suite
    - Run property-based fuzzing tests
    - Ensure >95% contract coverage
    - Verify gas optimization
  
  - [ ] 32.5 Perform security audit
    - Run automated security scans (npm audit, Snyk)
    - Review smart contracts for vulnerabilities
    - Test authentication and authorization
    - Verify encryption implementation
  
  - [ ] 32.6 Run end-to-end tests
    - Test critical user flows with Playwright
    - Test registration → KYC → Asset locking → Loan flow
    - Test card issuance and transactions
    - Test cross-browser compatibility

- [ ] 33. Deployment Preparation
  - [ ] 33.1 Set up production environment
    - Configure production database (PostgreSQL)
    - Set up production Redis
    - Configure environment variables
    - Set up AWS S3 for production
    - _Requirements: 18.1_
  
  - [ ] 33.2 Deploy smart contracts to Polygon mainnet
    - Deploy AssetToken contract
    - Deploy LoanManager contract
    - Deploy TrustScore contract
    - Verify contracts on Polygonscan
    - _Requirements: 6.7_
  
  - [ ] 33.3 Set up CI/CD pipeline
    - Configure GitHub Actions
    - Set up automated testing on PR
    - Set up automated deployment
    - Configure staging environment
  
  - [ ] 33.4 Set up monitoring and logging
    - Configure APM tool (New Relic/DataDog)
    - Set up error tracking (Sentry)
    - Configure log aggregation
    - Set up uptime monitoring
    - _Requirements: 20.8_
  
  - [ ] 33.5 Configure SSL and domain
    - Set up Let's Encrypt SSL certificates
    - Configure Nginx reverse proxy
    - Set up domain DNS
    - Enable HTTPS redirect
  
  - [ ] 33.6 Set up database migrations for production
    - Review all migrations
    - Test migration rollback
    - Prepare production migration plan
    - _Requirements: 18.7_

- [ ] 34. Final Checkpoint - Production Readiness
  - All tests passing (unit, integration, property-based, E2E)
  - Smart contracts deployed and verified
  - Security audit completed
  - Monitoring and logging configured
  - CI/CD pipeline working
  - Documentation complete
  - Ask the user if ready for production deployment

## Notes

- All tasks including property-based tests are required for comprehensive testing from the start
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- The implementation follows an incremental approach: infrastructure → auth → KYC → assets → blockchain → loans → payments → cards → risk management → admin
- External service integrations (Plaid, Stripe, Twilio, etc.) should use sandbox/test environments during development
- Smart contracts should be thoroughly tested on Mumbai testnet before mainnet deployment
- All sensitive data (API keys, private keys, database credentials) must be stored in environment variables, never committed to code

