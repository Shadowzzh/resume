import fs from "node:fs/promises";

export async function renderJson({ resume, outputPath }) {
  const content = JSON.stringify(resume, null, 2);
  await fs.writeFile(outputPath, `${content}\n`, "utf8");
}
