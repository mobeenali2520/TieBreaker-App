import { GeminiProvider } from './server/ai/providers/GeminiProvider';
import 'dotenv/config';

async function run() {
  const provider = new GeminiProvider("gemini-3.6-flash", 10, false);
  try {
    const result = await provider.generateIntakeQuestions("Should I learn Python or Rust?");
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error("FAILED:", e);
  }
}
run();
