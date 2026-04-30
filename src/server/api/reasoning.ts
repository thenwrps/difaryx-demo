/**
 * Server-Side API Route for LLM Reasoning
 * 
 * This module provides a server-side API endpoint for LLM reasoning.
 * In a production deployment, this would be deployed as a Cloud Run service
 * or serverless function.
 * 
 * For local development with Vite, you would need to set up a proxy or
 * use a separate Express/Fastify server.
 */

import type {
  ReasoningRequest,
  ReasoningResponse,
} from '../../agent/mcp/types';
import { routeReasoning } from '../llm/router';

/**
 * Handle reasoning request.
 * 
 * This function would be called by your API endpoint handler.
 * 
 * Example Express route:
 * ```typescript
 * app.post('/api/reasoning', async (req, res) => {
 *   try {
 *     const request: ReasoningRequest = req.body;
 *     const response = await handleReasoningRequest(request);
 *     res.json(response);
 *   } catch (error) {
 *     res.status(500).json({
 *       success: false,
 *       error: error.message,
 *     });
 *   }
 * });
 * ```
 */
export async function handleReasoningRequest(
  request: ReasoningRequest,
): Promise<ReasoningResponse> {
  try {
    // Validate request
    if (!request.packet) {
      return {
        success: false,
        error: 'Missing evidence packet',
      };
    }

    if (!request.provider) {
      return {
        success: false,
        error: 'Missing provider',
      };
    }

    // Route to appropriate provider
    const response = await routeReasoning(
      request.packet,
      request.provider,
      request.model,
    );

    return response;
  } catch (error) {
    console.error('Reasoning request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Client-side helper to call the reasoning API.
 * 
 * In production, this would make a fetch call to your deployed API.
 * For demo purposes, we'll call the server-side function directly.
 */
export async function callReasoningAPI(
  request: ReasoningRequest,
): Promise<ReasoningResponse> {
  // PRODUCTION: Replace with actual API call
  // const response = await fetch('/api/reasoning', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(request),
  // });
  // return response.json();

  // DEMO: Call server function directly
  // Note: In a real deployment, this would be a separate server process
  return handleReasoningRequest(request);
}
