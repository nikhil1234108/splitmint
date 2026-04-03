const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

const aiKeys = ["GOOGLE_API_KEY", "GEMINI_API_KEY"];

const missing = required.filter((key) => !process.env[key]);
const hasAiKey = aiKeys.some((key) => Boolean(process.env[key]));

if (!hasAiKey) {
  missing.push("GOOGLE_API_KEY or GEMINI_API_KEY");
}

if (missing.length > 0) {
  console.error("Missing deployment environment variables:");
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

console.log("Deployment env check passed.");
