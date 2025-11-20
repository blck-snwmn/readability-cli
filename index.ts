import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

const url = Bun.argv[2];

if (!url) {
  console.error("Usage: bun run index.ts <url>");
  process.exit(1);
}

try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  const html = await response.text();

  const { document } = parseHTML(html);
  const reader = new Readability(document);
  const article = reader.parse();

  if (article) {
    console.log(JSON.stringify(article, null, 2));
  } else {
    console.error("Failed to parse article");
    process.exit(1);
  }
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}