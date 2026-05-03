import fs from "fs";
import path from "path";

// Interview insight: context management is one of the hardest parts of
// multi-agent systems. Agents have no memory between calls — you are the memory.

const ISSUES_DIR = "./.scratch/miso-art-mvp/issues";
const PRD_PATH = "./.scratch/miso-art-mvp/PRD.md";

// Manually track done issues here as you complete them
const DONE_ISSUES = ["01", "02", "03", "04", "05", "06", "07", "08"];

export function loadProjectContext() {
  const prd = fs.readFileSync(PRD_PATH, "utf8");
  const issues = loadIssues();
  return { prd, issues };
}

export function loadIssues() {
  const files = fs.readdirSync(ISSUES_DIR).sort();
  const issues = [];

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const number = file.split("-")[0];           // "01", "02", etc.
    const content = fs.readFileSync(path.join(ISSUES_DIR, file), "utf8");

    // Parse status and blockers from the filename tree you have
    const meta = ISSUE_META[number] ?? { mode: "AFK", blockers: [] };
    const done = DONE_ISSUES.includes(number);
    const blocked = meta.blockers.some(b => !DONE_ISSUES.includes(b));

    issues.push({
      number,
      file,
      content,
      mode: meta.mode,        // "AFK" | "HITL"
      blockers: meta.blockers,
      done,
      blocked,
      // ready = agent can pick it up right now
      ready: !done && !blocked && meta.mode === "AFK",
    });
  }

  return issues;
}

// Dependency + mode map derived from your issues tree
const ISSUE_META = {
  "01": { mode: "HITL", blockers: [] },
  "02": { mode: "AFK",  blockers: [] },
  "03": { mode: "AFK",  blockers: ["01", "02"] },
  "04": { mode: "AFK",  blockers: ["03"] },
  "05": { mode: "AFK",  blockers: ["03"] },
  "06": { mode: "AFK",  blockers: ["01", "05"] },
  "07": { mode: "AFK",  blockers: ["06"] },
  "08": { mode: "AFK",  blockers: ["01", "02"] },
  "09": { mode: "AFK",  blockers: ["07", "08"] },
  "10": { mode: "AFK",  blockers: ["01", "08"] },
  "11": { mode: "AFK",  blockers: ["01", "08"] },
  "12": { mode: "AFK",  blockers: ["07", "11"] },
  "13": { mode: "HITL", blockers: ["01","02","03","04","05","06","07","08","09","10","11","12"] },
};

export function getReadyIssues(issues) {
  return issues.filter(i => i.ready);
}

export function printIssueBoard(issues) {
  console.log("\n📋 ISSUE BOARD");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  for (const i of issues) {
    const status = i.done ? "✅ done"
      : i.mode === "HITL"  ? "🙋 HITL"
      : i.blocked          ? "🔒 blocked"
      :                      "🟢 ready";
    console.log(`  ${i.number} — ${i.file.replace(".md","")}  [${status}]`);
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// Collect all files already written by agents so they don't duplicate work
export function loadExistingCode(directories = ["src", "supabase"]) {
  const codeMap = {};

  for (const dir of directories) {
    if (!fs.existsSync(dir)) continue;
    collectFiles(dir, codeMap);
  }

  return codeMap;
}

function collectFiles(dir, codeMap) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, codeMap);
    } else if (entry.isFile() && isCodeFile(entry.name)) {
      codeMap[fullPath] = fs.readFileSync(fullPath, "utf8");
    }
  }
}

function isCodeFile(name) {
  return /\.(js|jsx|ts|tsx|sql|json)$/.test(name);
}

// Write files that agents produce
export function writeAgentFiles(files) {
  for (const { path: filePath, content } of files) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`  ✅ Written: ${filePath}`);
  }
}

// Auto-commit after each issue completes
export async function commitIssue(issueNumber, issueFile, filesWritten) {
  const { execSync } = await import("child_process");
  const fileList = filesWritten.map(f => f.path).join(", ");
  const message = `agent: complete issue ${issueNumber} — ${issueFile.replace(".md","")}\n\nFiles: ${fileList}`;

  try {
    execSync("git add -A");
    execSync(`git commit -m "${message}"`);
    console.log(`  🔖 Committed: issue ${issueNumber}`);
  } catch (e) {
    console.warn("  ⚠️  Git commit failed (is this a git repo?):", e.message);
  }
}

// Sprint log — lets you review what each agent did
export function logSprint(sprintNumber, data) {
  const logDir = "./output/logs";
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = `${logDir}/sprint-${sprintNumber}.json`;
  fs.writeFileSync(logPath, JSON.stringify(data, null, 2));
  console.log(`  📋 Sprint log saved: ${logPath}`);
}