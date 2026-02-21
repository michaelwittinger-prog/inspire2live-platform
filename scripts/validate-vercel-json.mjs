import fs from "node:fs";
import path from "node:path";

function validateJsonFile(file) {
  if (!fs.existsSync(file)) {
    console.log(`No vercel.json present at ${file}; nothing to validate.`);
    return;
  }

  const raw = fs.readFileSync(file, "utf8");
  if (raw.length === 0) {
    console.error(`ERR vercel.json (${file}): file is empty (0 bytes)`);
    process.exit(1);
  }
  if (raw.trim().length === 0) {
    console.error(`ERR vercel.json (${file}): file contains only whitespace`);
    process.exit(1);
  }

  try {
    JSON.parse(raw);
    console.log(`OK vercel.json (${file})`);
  } catch (err) {
    console.error(
      `ERR vercel.json (${file}): ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }
}

// Guard: Vercel fails hard if vercel.json exists but isn't strict JSON.
//
// This mono-repo-ish workspace can have a Vercel config at:
// - repo root:              ./vercel.json
// - project root (Next app): ./inspire2live-platform/vercel.json
//
// Validate both if present.
validateJsonFile(path.resolve(process.cwd(), "vercel.json"));
validateJsonFile(path.resolve(process.cwd(), "inspire2live-platform", "vercel.json"));
