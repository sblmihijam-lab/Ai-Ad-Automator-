import OpenAI from "openai";

// Singleton OpenAI client — reuse across serverless invocations
let client = null;

export function getOpenAIClient() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is not set. Add it to your .env.local file."
      );
    }
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 2,
      timeout: 80_000, // 80 second timeout
    });
  }
  return client;
}

export default getOpenAIClient;
