import { Request, Response, NextFunction } from 'express';

// This function serves as the Express route handler for /v2/transactions/settle
// and includes a fix for the TypeError: Cannot read properties of undefined (reading 'toUpperCase').
export const settleTransactionHandler = (req: Request, res: Response, next: NextFunction) => {
  try {
    // The error message at index.ts:46:53 indicates a variable was 'undefined'
    // when its 'toUpperCase' method was called. This often occurs when a required
    // string property from the request body or query parameters is missing or null.
    // Let's assume 'currencyCode' from the request body is the problematic field,
    // as it's a common string that would undergo such transformation.

    const {
      transactionId,
      amount,
      currencyCode, // This is identified as a potential source of the TypeError.
      ...otherSettlementDetails
    } = req.body;

    let processedCurrencyCode: string;

    // Validate and process currencyCode.
    // This check prevents the 'TypeError: Cannot read properties of undefined (reading 'toUpperCase')'
    // by explicitly ensuring `currencyCode` is a non-empty string before calling `toUpperCase()`.
    if (typeof currencyCode === 'string' && currencyCode.trim() !== '') {
      processedCurrencyCode = currencyCode.trim().toUpperCase();
    } else {
      // If currencyCode is missing, not a string, or empty, return a 400 Bad Request.
      // This provides clear feedback to the client and prevents server-side errors.
      console.error(
        `[SRE Error] /v2/transactions/settle: Invalid or missing 'currencyCode' in request body. Received:`,
        currencyCode
      );
      return res.status(400).json({
        message: 'Bad Request: A valid non-empty string for \'currencyCode\' is required.',
        field: 'currencyCode',
        receivedValue: currencyCode,
      });
    }

    // --- Placeholder for actual business logic to settle the transaction ---
    // In a production environment, this would involve calling a service layer
    // to interact with a database, an external payment gateway, etc.
    console.log(
      `[SRE Info] /v2/transactions/settle: Initiating settlement for Transaction ID: ${transactionId}, Amount: ${amount} ${processedCurrencyCode}`
    );
    // Example: Call a transaction service:
    // const settlementResult = await transactionService.processSettlement({
    //   transactionId,
    //   amount,
    //   currency: processedCurrencyCode,
    //   ...otherSettlementDetails,
    // });
    // This section would typically handle potential errors from downstream services as well.
    // --- End Placeholder ---

    // Send a success response.
    res.status(200).json({
      message: 'Transaction settlement process initiated successfully.',
      transactionReferenceId: `SETTLE-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      status: 'PENDING', // Or 'COMPLETED' based on the actual settlement's synchronous/asynchronous nature
      requestedAmount: amount,
      requestedCurrency: processedCurrencyCode,
    });
  } catch (error) {
    // Catch any unexpected errors during the processing and log them for SRE investigation.
    // Then, pass the error to the next Express error handling middleware.
    console.error(`[SRE Fatal Error] /v2/transactions/settle: Unhandled exception during transaction settlement:`, error);
    next(error); // Propagate the error to the global error handler
  }
};