import OpenAI from 'openai';

// Validate API key on startup
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY not set. AI features will use fallback mode.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-fallback',
});

// Local fallback parser (works without OpenAI) - context-aware with better pattern matching
function parseCommandLocally(text: string, userContext?: any): any {
  const lowerText = text.toLowerCase().trim();
  
  console.log('🔍 Local parser analyzing:', lowerText);
  console.log('📊 Context available:', userContext ? 'Yes' : 'No');
  
  // Data query commands - More flexible regex patterns
  if (lowerText.match(/trust.*score|score|credit.*score/i)) {
    const score = userContext?.trustScore || 0;
    console.log('✅ Matched: Trust Score Query');
    return {
      action: 'CHAT',
      params: {},
      message: `Your trust score is ${score} out of 1000`
    };
  }
  
  if (lowerText.match(/loan|borrow/) && lowerText.match(/have|any|active|much|many/i)) {
    console.log('✅ Matched: Loan Query');
    if (userContext?.hasActiveLoans) {
      const amount = userContext.totalLoanAmount;
      const count = userContext.activeLoansCount;
      const formatted = amount >= 100000 ? `₹${(amount / 100000).toFixed(1)} lakh` : `₹${amount.toLocaleString()}`;
      return {
        action: 'CHAT',
        params: {},
        message: count > 1 
          ? `You have ${count} active loans totaling ${formatted}`
          : `Yes, you have one active loan of ${formatted}`
      };
    } else {
      return {
        action: 'CHAT',
        params: {},
        message: 'You have no active loans currently'
      };
    }
  }
  
  if (lowerText.match(/asset/) && lowerText.match(/how.*many|total|value|much/i)) {
    console.log('✅ Matched: Asset Query');
    const count = userContext?.assetsCount || 0;
    const value = userContext?.totalAssets || 0;
    const formatted = value >= 100000 ? `₹${(value / 100000).toFixed(1)} lakh` : `₹${value.toLocaleString()}`;
    return {
      action: 'CHAT',
      params: {},
      message: count > 0 
        ? `You have ${count} assets worth ${formatted}`
        : 'You have no assets added yet'
    };
  }
  
  if (lowerText.match(/credit/) && lowerText.match(/available|limit|have|much/i)) {
    console.log('✅ Matched: Credit Query');
    const credit = userContext?.creditAvailable || 0;
    const formatted = credit >= 100000 ? `₹${(credit / 100000).toFixed(1)} lakh` : `₹${credit.toLocaleString()}`;
    return {
      action: 'CHAT',
      params: {},
      message: credit > 0 
        ? `You have ${formatted} credit available`
        : 'Lock assets to unlock credit'
    };
  }
  
  if (lowerText.match(/name|who.*am.*i/i)) {
    console.log('✅ Matched: Name Query');
    const name = userContext?.name || 'User';
    return {
      action: 'CHAT',
      params: {},
      message: `You are ${name}`
    };
  }
  
  // Navigation commands - More flexible
  if (lowerText.match(/dashboard|home/i)) {
    console.log('✅ Matched: Dashboard Navigation');
    return {
      action: 'NAVIGATE',
      params: { path: '/dashboard' },
      message: 'Taking you to dashboard'
    };
  }
  
  if (lowerText.match(/marketplace|market/i)) {
    console.log('✅ Matched: Marketplace Navigation');
    return {
      action: 'NAVIGATE',
      params: { path: '/marketplace' },
      message: 'Opening marketplace'
    };
  }
  
  if (lowerText.match(/asset.*page|show.*asset|go.*asset/i) && !lowerText.includes('lock')) {
    console.log('✅ Matched: Assets Navigation');
    return {
      action: 'NAVIGATE',
      params: { path: '/assets' },
      message: 'Opening assets page'
    };
  }
  
  if (lowerText.match(/passport|credit.*passport/i)) {
    console.log('✅ Matched: Credit Passport Navigation');
    return {
      action: 'NAVIGATE',
      params: { path: '/credit' },
      message: 'Opening credit passport'
    };
  }
  
  // Asset locking commands
  if (lowerText.match(/lock/i)) {
    console.log('✅ Matched: Lock Asset Command');
    let assetType = 'GOLD';
    let value = 0;
    
    // Detect asset type
    if (lowerText.includes('gold')) assetType = 'GOLD';
    else if (lowerText.match(/fd|fixed.*deposit/i)) assetType = 'FD';
    else if (lowerText.includes('stock')) assetType = 'STOCK';
    else if (lowerText.match(/property|real.*estate/i)) assetType = 'PROPERTY';
    else if (lowerText.match(/mutual.*fund/i)) assetType = 'MUTUAL_FUND';
    
    // Extract value - improved number extraction
    const numberMatch = lowerText.match(/(\d+)/);
    if (numberMatch) {
      value = parseInt(numberMatch[1]);
      
      // Handle lakh/crore
      if (lowerText.match(/lakh|lac/i)) value *= 100000;
      else if (lowerText.match(/crore|cr/i)) value *= 10000000;
      else if (lowerText.match(/thousand|k/i)) value *= 1000;
    }
    
    if (value > 0) {
      return {
        action: 'LOCK_PREFILL',
        params: { type: assetType, value: value },
        message: `Preparing to lock ${assetType} worth ${value} rupees`
      };
    }
  }
  
  // Loan application commands - improved
  if (lowerText.match(/apply|want.*loan|need.*loan|get.*loan/i)) {
    console.log('✅ Matched: Loan Application Command');
    let amount = 0;
    let purpose = 'Personal';
    
    // Extract amount - improved
    const numberMatch = lowerText.match(/(\d+)/);
    if (numberMatch) {
      amount = parseInt(numberMatch[1]);
      
      // Handle lakh/crore
      if (lowerText.match(/lakh|lac/i)) amount *= 100000;
      else if (lowerText.match(/crore|cr/i)) amount *= 10000000;
      else if (lowerText.match(/thousand|k/i)) amount *= 1000;
    }
    
    // Detect purpose
    if (lowerText.includes('business')) purpose = 'Business';
    else if (lowerText.includes('education')) purpose = 'Education';
    else if (lowerText.includes('medical')) purpose = 'Medical';
    else if (lowerText.includes('travel')) purpose = 'Travel';
    
    if (amount > 0) {
      return {
        action: 'LOAN_PREFILL',
        params: { amount: amount, purpose: purpose },
        message: `Preparing loan application for ${amount} rupees`
      };
    }
  }
  
  // General info
  if (lowerText.match(/what.*is|tell.*me.*about|explain/i)) {
    console.log('✅ Matched: General Info Query');
    return {
      action: 'CHAT',
      params: {},
      message: 'AssetBridge lets you unlock credit by locking your assets like gold, stocks, or fixed deposits without selling them'
    };
  }
  
  // Default fallback
  console.log('❌ No pattern matched');
  return {
    action: 'CHAT',
    params: {},
    message: 'I can help you check your data, navigate, lock assets, or apply for loans. Try asking: what is my trust score?'
  };
}

export async function processVoiceCommand(text: string, userContext?: any): Promise<any> {
  try {
    console.log('🎤 Processing voice command:', text);
    console.log('👤 User context:', userContext);

    // Build context summary for OpenAI
    let contextSummary = '';
    if (userContext) {
      const { name, trustScore, totalAssets, assetsCount, creditAvailable, hasActiveLoans, totalLoanAmount, activeLoansCount } = userContext;
      
      const assetValue = totalAssets >= 100000 ? `₹${(totalAssets / 100000).toFixed(1)}L` : `₹${totalAssets.toLocaleString()}`;
      const creditValue = creditAvailable >= 100000 ? `₹${(creditAvailable / 100000).toFixed(1)}L` : `₹${creditAvailable.toLocaleString()}`;
      const loanValue = totalLoanAmount >= 100000 ? `₹${(totalLoanAmount / 100000).toFixed(1)}L` : `₹${totalLoanAmount.toLocaleString()}`;
      
      contextSummary = `
[USER FINANCIAL PROFILE]
Name: ${name}
Trust Score: ${trustScore}/1000
Total Assets: ${assetsCount} assets worth ${assetValue}
Credit Available: ${creditValue}
Active Loans: ${hasActiveLoans ? `${activeLoansCount} loan(s) totaling ${loanValue}` : 'None'}
`;
    }

    // Enhanced system prompt with user context
    const CONTEXT_AWARE_PROMPT = `You are JARVIS, an AI voice CFO for AssetBridge - a fintech platform for asset-backed lending.

You have access to the user's live financial data:
${contextSummary}

Your job is to understand user voice commands and return STRICT JSON responses with actions.

AVAILABLE ACTIONS:
1. CHAT - Answer data queries or provide information
   - Use this when user asks about their data (trust score, loans, assets, credit)
   - Keep responses SHORT (under 20 words), professional, and encouraging
   - Examples: "What is my trust score?", "Do I have any loans?", "How much credit do I have?"

2. NAVIGATE - Navigate to a page
   - Params: { path: "/dashboard" | "/assets" | "/marketplace" | "/credit" | "/chatbot" | "/fx" | "/remittance" | "/card" }
   - Examples: "take me to dashboard", "show marketplace", "go to assets"

3. LOCK_PREFILL - Prefill asset locking form
   - Params: { type: "GOLD" | "FD" | "STOCK" | "PROPERTY" | "MUTUAL_FUND", value: number }
   - Examples: "lock 50000 gold", "lock 5 lakh fixed deposit", "lock 2 lakh stocks"

4. LOAN_PREFILL - Prefill loan application form
   - Params: { amount: number, purpose?: string }
   - Examples: "I want a loan of 5 lakhs", "apply for 200000 loan for business", "get 3 lakh loan"

RESPONSE FORMAT (STRICT JSON):
{
  "action": "CHAT" | "NAVIGATE" | "LOCK_PREFILL" | "LOAN_PREFILL",
  "params": { ... },
  "message": "Brief response message"
}

RULES FOR DATA QUERIES:
- If user asks about trust score, use the profile data to answer
- If user asks about loans, check hasActiveLoans and provide accurate info
- If user asks about assets, use assetsCount and totalAssets
- If user asks about credit, use creditAvailable
- Always be encouraging and positive in tone
- Keep CHAT responses under 20 words

Examples:
User: "What is my trust score?"
Response: {"action":"CHAT","params":{},"message":"Your trust score is ${userContext?.trustScore || 0} out of 1000"}

User: "Do I have any active loans?"
Response: {"action":"CHAT","params":{},"message":"${userContext?.hasActiveLoans ? `Yes, you have ${userContext.activeLoansCount} active loan(s)` : 'No active loans currently'}"}

User: "How much credit do I have?"
Response: {"action":"CHAT","params":{},"message":"You have credit available based on your locked assets"}

User: "take me to dashboard"
Response: {"action":"NAVIGATE","params":{"path":"/dashboard"},"message":"Taking you to dashboard"}

User: "lock 50000 gold"
Response: {"action":"LOCK_PREFILL","params":{"type":"GOLD","value":50000},"message":"Preparing to lock gold worth 50000 rupees"}`;

    // Try OpenAI first
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: CONTEXT_AWARE_PROMPT },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const response = completion.choices[0]?.message?.content;
      console.log('🤖 OpenAI response:', response);

      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const parsed = JSON.parse(response);
      console.log('✅ Parsed response:', parsed);

      return parsed;
    } catch (openaiError: any) {
      console.log('⚠️ OpenAI failed, using local parser:', openaiError.message);
      
      // Fallback to local parser with context
      const localResult = parseCommandLocally(text, userContext);
      console.log('✅ Local parser result:', localResult);
      return localResult;
    }
  } catch (error: any) {
    console.error('❌ AI Service error:', error);
    
    // Final fallback
    return parseCommandLocally(text, userContext);
  }
}
