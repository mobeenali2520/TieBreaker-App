import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import 'dotenv/config';

async function run() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: "Tell me a joke",
      config: {
        thinkingConfig: { thinkingLevel: "HIGH" }
      }
    });
    console.log(response.text);
  } catch (e) {
    console.error("FAILED:", e);
  }
}
run();
