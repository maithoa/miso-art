import "dotenv/config";
import { ROLES } from "./roles.js";
import { runAgent, parseAgentJSON } from "./worker.js";
import {
  loadProjectContext,
  loadExistingCode,
  writeAgentFiles,
  commitIssue,
  logSprint,
  getReadyIssues,
  printIssueBoard,
} from "./context.js";

// ─────────────────────────────────────────────
// MAIN ENTRY POINT
//
// Run next ready issues automatically:
//   node agents/orchestrator.js
//
// Force a specific issue:
//   node agents/orchestrator.js 02
// ─────────────────────────────────────────────

const forceIssue = process.argv[2]; // optional: "02"

const { prd, issues } = loadProjectContext();
printIssueBoard(issues);

// Decide which issues to run this sprint
let toRun = [];

if (forceIssue) {
  const found = issues.find(i => i.number === forceIssue.padStart(2, "0"));
  if (!found) { console.error(`❌ Issue ${forceIssue} not found`); process.exit(1); }
  if (found.done) { console.log(`✅ Issue ${forceIssue} is already done.`); process.exit(0); }
  if (found.mode === "HITL") {
    console.log(`🙋 Issue ${forceIssue} is HITL — needs your manual input before agents can proceed.`);
    console.log(`   Read: .scratch/miso-art-mvp/issues/${found.file}`);
    process.exit(0);
  }
  toRun = [found];
} else {
  toRun = getReadyIssues(issues);
  if (toRun.length === 0) {
    console.log("🎉 Nothing ready to run. Either all done, all blocked, or HITL issues need your input.");
    process.exit(0);
  }
  // Cap at 2 parallel issues (1 per dev)
  toRun = toRun.slice(0, 2);
}

console.log(`\n🚀 Running issues: ${toRun.map(i => i.number).join(", ")}`);

await runSprint(toRun, prd);

// ─────────────────────────────────────────────
// SPRINT RUNNER
// Plan → Execute in parallel → Write outputs → Log
// ─────────────────────────────────────────────

async function runSprint(issues, prd) {
  const sprintNumber = Date.now();
  const existingCode = loadExistingCode();

  // Format issues into a readable instruction for the Tech Lead
  const instruction = issues.map(i =>
    `Issue ${i.number}:\n${i.content}`
  ).join("\n\n---\n\n");

  const existingCodeSummary = Object.keys(existingCode).length > 0
    ? `Existing files:\n${Object.keys(existingCode).join("\n")}`
    : "No code written yet.";

  // ── Step 1: Tech Lead plans ──────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧠 TECH LEAD — Planning sprint...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const planRaw = await runAgent({
    label: "Tech Lead",
    systemPrompt: ROLES.techLead,
    userMessage: `
      PRD:
      ${prd}

      ISSUES TO PLAN THIS SPRINT:
      ${instruction}

      EXISTING CODE:
      ${existingCodeSummary}

      RESOLVED DECISIONS (do not flag these as blockers):
      - orders table has stripe_payment_id TEXT NOT NULL — confirmed in database/001_tables.sql
      - VITE_SUPABASE_URL is set in .env to the live Supabase project URL
      - Stripe keys are not needed locally; Edge Functions read STRIPE_SECRET_KEY from Supabase dashboard at runtime
      - CartContext already built at src/context/CartContext.jsx — items shape: [{ id, name, price (cents), image_url, quantity }]
      - stripe_payment_id ordering: use Option B — validate products first, then create Stripe PaymentIntent, then insert order row with stripe_payment_id = pi.id, then insert order_items. A dangling PI (if DB insert fails) is harmless as it expires in 24h and never charges the customer.
    `,
  });

  const { data: plan, error: planError } = parseAgentJSON(planRaw);

  if (planError) {
    console.error("❌ Tech Lead returned invalid JSON:", planError);
    process.exit(1);
  }

  console.log("\n📋 Sprint goal:", plan.sprint_goal);

  if (plan.human_decision_needed) {
    console.log("\n⚠️  HUMAN DECISION NEEDED:", plan.human_decision_needed);
    console.log("Resolve this then re-run. Exiting.");
    process.exit(0);
  }

  // ── Step 2: Both devs work in parallel ───────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("👩‍💻 DEV 1 + 👨‍💻 DEV 2 — Working in parallel...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Interview insight: Promise.all = true parallelism.
  // Both agents run simultaneously — this is why multi-agent is faster.
  const [dev1Raw, dev2Raw] = await Promise.all([
    runAgent({
      label: "Dev 1 (Frontend)",
      systemPrompt: ROLES.devFrontend,
      userMessage: buildDevPrompt(plan.dev1, plan.shared_types, existingCode),
    }),
    runAgent({
      label: "Dev 2 (Backend)",
      systemPrompt: ROLES.devBackend,
      userMessage: buildDevPrompt(plan.dev2, plan.shared_types, existingCode),
    }),
  ]);

  // ── Step 3: Parse + write files ──────────────
  const { data: dev1Files, error: dev1Error } = parseAgentJSON(dev1Raw);
  const { data: dev2Files, error: dev2Error } = parseAgentJSON(dev2Raw);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💾 Writing files...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (dev1Error) {
    console.error("⚠️  Dev 1 output could not be parsed:", dev1Error);
  } else {
    writeAgentFiles(dev1Files);
    await commitIssue(issues[0].number, issues[0].file, dev1Files);
  }

  if (dev2Error) {
    console.error("⚠️  Dev 2 output could not be parsed:", dev2Error);
  } else {
    writeAgentFiles(dev2Files);
    // When only one issue runs, both devs work on it — commit to the same issue
    const dev2Issue = issues[1] ?? issues[0];
    await commitIssue(dev2Issue.number, dev2Issue.file, dev2Files);
  }

  // ── Step 4: Log everything ────────────────────
  logSprint(sprintNumber, {
    instruction,
    plan,
    dev1: { raw: dev1Raw, files: dev1Files },
    dev2: { raw: dev2Raw, files: dev2Files },
  });

  console.log("\n🎉 Sprint complete!");
}

// ─────────────────────────────────────────────
// HELPER — Build the message a dev receives
// Interview insight: you control exactly what context each agent gets.
// Less context = faster + more focused. More context = better decisions.
// ─────────────────────────────────────────────

function buildDevPrompt(devPlan, sharedTypes, existingCode) {
  // Only pass existing files that are relevant to this dev's task
  const relevantFiles = Object.entries(existingCode)
    .filter(([filePath]) => devPlan.context_needed?.includes(filePath))
    .map(([filePath, content]) => `// ${filePath}\n${content}`)
    .join("\n\n---\n\n");

  return `
    TASK:
    ${devPlan.task}

    FILES TO CREATE:
    ${devPlan.files_to_create.join(", ")}

    CONTEXT YOU NEED:
    ${devPlan.context_needed}

    SHARED TYPES (align with the other developer):
    ${sharedTypes}

    ${relevantFiles ? `EXISTING RELEVANT CODE:\n${relevantFiles}` : ""}
  `;
}