import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

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

// --- 2. BUGGY ENTERPRISE ENDPOINT ---
// Fails when a client forgets the currency_code, causing a TypeError on .toUpperCase()
app.post('/v2/transactions/settle', (req, res, next) => {
  try {
    const payload = req.body;
    
    // Deliberate Bug: Assuming currency_code always exists without checking
    const formattedCurrency = payload.currency_code.toUpperCase(); 
    
    res.json({ 
      status: "settled", 
      amount: payload.amount,
      currency: formattedCurrency
    });
  } catch (error) {
    // Pass to global error handler instead of crashing the server
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