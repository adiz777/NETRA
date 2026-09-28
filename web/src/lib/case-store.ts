import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { NetraCase } from "netra";

const filePath = path.join(process.cwd(), "data", "cases.json");

async function readCases(): Promise<NetraCase[]> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as NetraCase[];
  } catch {
    return [];
  }
}

async function writeCases(cases: NetraCase[]) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(cases, null, 2), "utf8");
}

export async function listCases() {
  return readCases();
}

export async function getCase(caseId: string) {
  const cases = await readCases();
  return cases.find((item) => item.caseId === caseId) ?? null;
}

export async function saveCase(netraCase: NetraCase) {
  const cases = await readCases();
  const index = cases.findIndex((item) => item.caseId === netraCase.caseId);
  if (index === -1) cases.push(netraCase);
  else cases[index] = netraCase;
  await writeCases(cases);
  return netraCase;
}
