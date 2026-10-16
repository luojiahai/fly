import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const svg = readFileSync("static/icon.svg", "utf8");
const square = svg.replace(/(<rect width="32" height="32") rx="7"/, "$1");
if (square === svg) throw new Error('static/icon.svg has no <rect width="32" height="32" rx="7"> background to square off.');

const dir = mkdtempSync(join(tmpdir(), "fly-icons-"));
try {
  const squareSvg = join(dir, "square.svg");
  writeFileSync(squareSvg, square);
  execFileSync("rsvg-convert", ["-w", "180", "-h", "180", "-o", "static/apple-icon.png", squareSvg]);

  const frames = [48, 32, 16].map((size) => {
    const png = join(dir, `${size}.png`);
    execFileSync("rsvg-convert", ["-w", String(size), "-h", String(size), "-o", png, "static/icon.svg"]);
    return png;
  });
  execFileSync("magick", [...frames, "static/favicon.ico"]);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
