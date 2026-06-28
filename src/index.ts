import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

// Define a set of valid ISO 4217 currency codes for semantic validation
const VALID_CURRENCY_CODES = new Set([
  "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "SEK", "NZD",
  "MXN", "SGD", "HKD", "NOK", "KRW", "TRY", "RUB", "INR", "BRL", "ZAR",
  // Add more valid ISO 4217 currency codes as required by the business
]);

// --- 1. REAL SWAGGER / OPENAPI ENDPOINT ---
// This makes the onboarding URL in your UI 100% authentic.
app.get('/docs/openapi.json', (req, res) => {
  res.json({
    openapi: "3.0.0",
    info: { title: "Apex Financial Core API", version: "2.0.0" },
    paths: {
      "/v2/transactions/settle": {
        post: {
          summary: "Settle a transaction",
          requestBody: {
            content: {
              "application/json": {
                schema: { 
                  type: "object", 
                  properties: { amount: { type: "number" }, currency_code: { type: "string" } },
                  required: ["amount", "currency_code"]
                }
              }
            }
          }
        }
      }
    }
  });
});

// --- 2. BUGGY ENTERPRISE ENDPOINT (Now fixed and robust) ---
// Prevents TypeError and adds semantic validation for currency codes.
app.post('/v2/transactions/settle', (req, res, next) => {
  try {
    const payload = req.body;
    
    // 1. Validate 'amount' type and value
    if (typeof payload.amount !== 'number' || isNaN(payload.amount)) {
      return res.status(400).json({ error: "Validation Error: 'amount' is required and must be a number." });
    }
    if (payload.amount <= 0) {
        return res.status(400).json({ error: "Validation Error: 'amount' must be a positive number." });
    }

    // 2. Validate 'currency_code' type and presence
    if (typeof payload.currency_code !== 'string' || payload.currency_code.trim() === '') {
      // This specifically addresses the TypeError when currency_code is missing or not a string
      return res.status(400).json({ error: "Validation Error: 'currency_code' is required and must be a non-empty string." });
    }

    // Standardize currency code to uppercase for consistent validation and storage
    const formattedCurrencyCode = payload.currency_code.trim().toUpperCase(); 
    
    // 3. Validate 'currency_code' semantic validity (incorporating Senior Critique)
    if (!VALID_CURRENCY_CODES.has(formattedCurrencyCode)) {
      return res.status(400).json({ error: `Validation Error: '${formattedCurrencyCode}' is not a valid ISO 4217 currency code.` });
    }

    // Now all inputs are validated and safe to use
    res.json({ 
      status: "settled", 
      amount: payload.amount,
      currency: formattedCurrencyCode // Use the validated and formatted currency code
    });
  } catch (error) {
    // Pass to global error handler for any unexpected server-side errors
    next(error);
  }
});

// --- 3. PHANTOM-NET TELEMETRY INTERCEPT (The "Datadog" replacement) ---
// This catches ANY error in the Apex API and forwards it to your Agent.
app.use(async (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`\n🚨 [APEX FINANCIAL CRASH]: ${err.message}`);
  console.log(`📡 Forwarding crash telemetry to Phantom-Net Sentinel...`);
  
  try {
    // Dynamically post to your local Agent Engine
    await fetch('http://localhost:4000/api/v1/webhook/intercept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // UPDATE THIS to your real GitHub Repo name for Company X
        repository: "suparnTech/apex-financial-api", 
        endpoint: req.originalUrl,
        httpCode: 500,
        errorMessage: err.stack || err.message
      })
    });
    console.log(`✅ Telemetry successfully transmitted to Phantom-Net.`);
  } catch (agentError) {
    console.error(`❌ Failed to reach Phantom-Net. Is the Agent running?`);
  }

  res.status(500).json({ error: "Internal System Failure. Remediation requested." });
});

const PORT = 5005;
app.listen(PORT, () => {
  console.log(`🏦 Apex Financial API running on port ${PORT}`);
  console.log(`📘 Swagger available at: http://localhost:${PORT}/docs/openapi.json`);
});