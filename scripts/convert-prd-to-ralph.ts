/**
 * Convert existing prd.json to Ralph user stories format
 *
 * Original format: nested objects by section
 * Ralph format: flat array of user stories with proper structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface OldPRDItem {
  description: string;
  passes: boolean;
  priority: number;
  requirements: string;
  test_steps?: string[];
  evidence?: string;
}

interface OldPRD {
  [section: string]: {
    [itemKey: string]: OldPRDItem;
  };
}

interface RalphUserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  priority: number;
  passes: boolean;
  notes: string;
  evidence?: string;
  section: string; // Track original section for context
}

interface RalphPRD {
  project: string;
  branchName: string;
  description: string;
  userStories: RalphUserStory[];
}

function convertToUserStory(
  itemKey: string,
  item: OldPRDItem,
  section: string,
  index: number
): RalphUserStory {
  // Generate user story ID based on priority and index
  const id = `US-${String(item.priority).padStart(1, '0')}${String(index).padStart(3, '0')}`;

  // Convert item key to title (e.g., "fix_public_notice_detail_page" -> "Fix Public Notice Detail Page")
  const title = itemKey
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Build acceptance criteria from requirements and test steps
  const acceptanceCriteria: string[] = [];

  // Add requirements as first criterion
  if (item.requirements) {
    acceptanceCriteria.push(item.requirements);
  }

  // Add test steps as criteria
  if (item.test_steps && item.test_steps.length > 0) {
    acceptanceCriteria.push('Browser testing steps:');
    item.test_steps.forEach((step) => {
      acceptanceCriteria.push(`  - ${step}`);
    });
  }

  // Always add browser verification requirement
  acceptanceCriteria.push('MUST verify in Chrome browser - evidence must say "BROWSER TESTED: [steps] - [result]"');

  // Always add quality checks requirement
  acceptanceCriteria.push('Quality checks must pass: typecheck, lint, test, dev server starts');

  // Build notes from evidence if exists
  let notes = '';
  if (item.evidence) {
    notes = `Previous evidence: ${item.evidence}`;
  }

  return {
    id,
    title,
    description: item.description,
    acceptanceCriteria,
    priority: item.priority,
    passes: item.passes,
    notes,
    evidence: item.evidence,
    section, // Keep section for context
  };
}

function convertPRD(): void {
  const projectRoot = path.resolve(__dirname, '..');
  const oldPRDPath = path.join(projectRoot, 'prd.json');
  const backupPath = path.join(projectRoot, 'prd.json.backup');
  const newPRDPath = path.join(projectRoot, 'prd.json');

  // Read old PRD
  const oldPRDContent = fs.readFileSync(oldPRDPath, 'utf-8');
  const oldPRD: OldPRD = JSON.parse(oldPRDContent);

  // Create backup
  fs.writeFileSync(backupPath, oldPRDContent);
  console.log(`✓ Backup created: ${backupPath}`);

  // Convert to user stories
  const userStories: RalphUserStory[] = [];
  let globalIndex = 0;

  // Iterate through sections
  for (const [section, items] of Object.entries(oldPRD)) {
    console.log(`\nProcessing section: ${section}`);
    let sectionCount = 0;

    for (const [itemKey, item] of Object.entries(items)) {
      globalIndex++;
      sectionCount++;

      const userStory = convertToUserStory(itemKey, item, section, globalIndex);
      userStories.push(userStory);

      console.log(
        `  ✓ ${userStory.id}: ${userStory.title} [Priority ${userStory.priority}] ${userStory.passes ? '✓' : '✗'}`
      );
    }

    console.log(`  → ${sectionCount} stories in ${section}`);
  }

  // Sort by priority (0 = highest) then by ID
  userStories.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.id.localeCompare(b.id);
  });

  // Create new Ralph format PRD
  const ralphPRD: RalphPRD = {
    project: 'CivicNotices',
    branchName: 'ralph/priority-zero-fixes',
    description: 'Fix all critical Priority 0 issues and implement core features for council and firm portals',
    userStories,
  };

  // Write new PRD
  fs.writeFileSync(newPRDPath, JSON.stringify(ralphPRD, null, 2));
  console.log(`\n✓ Converted PRD written to: ${newPRDPath}`);

  // Print summary
  console.log('\n═══════════════════════════════════════');
  console.log('Conversion Summary');
  console.log('═══════════════════════════════════════');
  console.log(`Total user stories: ${userStories.length}`);

  const byPriority = userStories.reduce(
    (acc, story) => {
      acc[story.priority] = (acc[story.priority] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  console.log('\nBy Priority:');
  Object.entries(byPriority)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([priority, count]) => {
      console.log(`  Priority ${priority}: ${count} stories`);
    });

  const passing = userStories.filter((s) => s.passes).length;
  const failing = userStories.filter((s) => !s.passes).length;

  console.log('\nBy Status:');
  console.log(`  ✓ Passing: ${passing} (${Math.round((passing / userStories.length) * 100)}%)`);
  console.log(`  ✗ Failing: ${failing} (${Math.round((failing / userStories.length) * 100)}%)`);

  console.log('\n✓ Conversion complete!');
  console.log(`  Old format backed up to: ${backupPath}`);
  console.log(`  New Ralph format at: ${newPRDPath}`);
}

// Run conversion
convertPRD();
