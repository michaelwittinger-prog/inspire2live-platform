import fs from "node:fs";

// Guard: Vercel fails hard if vercel.json exists but isn't strict JSON.
const file = "vercel.json";

if (!fs.existsSync(file)) {
  console.log("No vercel.json present; nothing to validate.");
  process.exit(0);
}

const raw = fs.readFileSync(file, "utf8");
if (raw.length === 0) {
  console.error("ERR vercel.json: file is empty (0 bytes)");
  process.exit(1);
}
if (raw.trim().length === 0) {
  console.error("ERR vercel.json: file contains only whitespace");
  process.exit(1);
}

try {
  JSON.parse(raw);
  console.log("OK vercel.json");
} catch (err) {
  console.error(
    `ERR vercel.json: ${err instanceof Error ? err.message : String(err)}`,
  );
  process.exit(1);
}
