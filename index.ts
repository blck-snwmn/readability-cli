import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { readdirSync } from "fs";
import { join, parse } from "path";
import { parseArgs } from "util";

function convertHtmlToMarkdown(html: string, url?: string): string | null {
  const { document } = parseHTML(html);
  const reader = new Readability(document);
  const article = reader.parse();

  if (article) {
    const markdown = NodeHtmlMarkdown.translate(article.content || "");
    return `# ${article.title}\n\n${markdown}`;
  }
  return null;
}

async function processUrl(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const html = await response.text();
    const markdown = convertHtmlToMarkdown(html, url);
    if (markdown) {
      console.log(markdown);
    } else {
      console.error("Failed to parse article");
      process.exit(1);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

async function processFile(filePath: string) {
  try {
    const file = Bun.file(filePath);
    const html = await file.text();
    const markdown = convertHtmlToMarkdown(html);
    if (markdown) {
      const parsedPath = parse(filePath);
      const outputPath = join(parsedPath.dir, `${parsedPath.name}.md`);
      await Bun.write(outputPath, markdown);
      console.log(`Converted ${filePath} to ${outputPath}`);
    } else {
      console.error(`Failed to parse article from ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

async function processDirectory(dirPath: string) {
  try {
    const files = readdirSync(dirPath);
    for (const file of files) {
      if (file.endsWith(".html")) {
        await processFile(join(dirPath, file));
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error);
    process.exit(1);
  }
}

async function main() {
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      url: {
        type: "string",
      },
      file: {
        type: "string",
      },
      dir: {
        type: "string",
      },
    },
    strict: true,
    allowPositionals: true,
  });

  if (values.url) {
    await processUrl(values.url);
  } else if (values.file) {
    await processFile(values.file);
  } else if (values.dir) {
    await processDirectory(values.dir);
  } else {
    console.error("Usage: bun run index.ts --url <url> | --file <file> | --dir <directory>");
    process.exit(1);
  }
}

main();