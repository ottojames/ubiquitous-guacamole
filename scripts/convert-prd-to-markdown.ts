/**
 * Convert prd.json to PRD.md format for Ralph
 * PRD.md uses [ ] and [x] checkboxes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const prdJsonPath = path.join(projectRoot, 'prd.json');
const prdMdPath = path.join(projectRoot, 'PRD.md');

const prd = JSON.parse(fs.readFileSync(prdJsonPath, 'utf-8'));

let markdown = `# ${prd.project} - Product Requirements Document

**Branch:** ${prd.branchName}

**Description:** ${prd.description}

---

## User Stories (Priority 0)

`;

// Only Priority 0 stories
const priority0Stories = prd.userStories.filter((s: any) => s.priority === 0);

priority0Stories.forEach((story: any) => {
  const checkbox = story.passes ? '[x]' : '[ ]';

  markdown += `### ${checkbox} ${story.id}: ${story.title}\n\n`;
  markdown += `**Description:** ${story.description}\n\n`;
  markdown += `**Acceptance Criteria:**\n`;

  story.acceptanceCriteria.forEach((criteria: string) => {
    markdown += `- ${criteria}\n`;
  });

  if (story.evidence) {
    markdown += `\n**Evidence:** ${story.evidence}\n`;
  }

  markdown += `\n---\n\n`;
});

fs.writeFileSync(prdMdPath, markdown);

console.log(`✅ Created PRD.md with ${priority0Stories.length} Priority 0 stories`);
console.log(`   Passing: ${priority0Stories.filter((s: any) => s.passes).length}`);
console.log(`   Failing: ${priority0Stories.filter((s: any) => !s.passes).length}`);
