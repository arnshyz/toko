import { readFile } from "fs/promises";

export async function renderTemplate(
  filePath: string,
  vars: Record<string, string>
) {
  const tpl = await readFile(filePath, "utf8");
  return tpl.replace(/{{(\w+)}}/g, (_, k) => vars[k] ?? "");
}
