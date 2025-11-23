import { expect, test, afterEach, beforeEach } from "bun:test";
import { join } from "path";
import { existsSync, rmSync, mkdtempSync, realpathSync } from "fs";
import { tmpdir } from "os";

const HTML_CONTENT = `
<!DOCTYPE html>
<html>
<head><title>Test Article</title></head>
<body>
  <h1>Test Article</h1>
  <p>This is a test paragraph.</p>
</body>
</html>
`;

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(realpathSync(tmpdir()), "readability-cli-test-"));
});

afterEach(() => {
  if (tempDir && existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("process file", async () => {
  const testFilePath = join(tempDir, "test.html");
  await Bun.write(testFilePath, HTML_CONTENT);

  const proc = Bun.spawn(["bun", "run", "index.ts", "--file", testFilePath]);
  await proc.exited;

  const expectedMdPath = testFilePath.replace(".html", ".md");
  expect(existsSync(expectedMdPath)).toBe(true);

  const mdContent = await Bun.file(expectedMdPath).text();
  expect(mdContent).toContain("# Test Article");
  expect(mdContent).toContain("This is a test paragraph.");
});

test("process directory", async () => {
  const file1 = join(tempDir, "file1.html");
  const file2 = join(tempDir, "file2.html");

  await Bun.write(file1, HTML_CONTENT);
  await Bun.write(file2, HTML_CONTENT);

  const proc = Bun.spawn(["bun", "run", "index.ts", "--dir", tempDir]);
  await proc.exited;

  const md1 = file1.replace(".html", ".md");
  const md2 = file2.replace(".html", ".md");

  expect(existsSync(md1)).toBe(true);
  expect(existsSync(md2)).toBe(true);
});
