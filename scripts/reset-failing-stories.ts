/**
 * Reset stories to passes: false based on user's manual testing feedback
 * From PRD_SUCCESS_CRITERIA.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface UserStory {
  id: string;
  title: string;
  passes: boolean;
  evidence?: string;
  notes: string;
}

interface PRD {
  project: string;
  branchName: string;
  description: string;
  userStories: UserStory[];
}

// Stories that FAILED in manual testing per PRD_SUCCESS_CRITERIA.md
const failingStories = {
  'US-0108': 'FAILED: Dropdown doesn\'t appear when typing postcode',
  'US-0109': 'FAILED: Filters visible but search doesn\'t work',
  'US-0117': 'FAILED: API connection failed (port 5174 error)',
  'US-0125': 'FAILED: Can\'t test - no council in database',
  'US-0126': 'FAILED: Can\'t access portal - no test data',
  'US-0127': 'FAILED: Can\'t access portal - no test data',
  'US-0128': 'FAILED: Can\'t access portal - no test data',
  'US-0129': 'FAILED: Can\'t access portal - no test data',
  'US-0145': 'FAILED: Redirects to homepage instead of showing wizard',
  'US-0146': 'FAILED: Can\'t reach wizard',
  'US-0148': 'FAILED: Can\'t test without firm account',
  'US-0149': 'FAILED: Can\'t test without firm account',
  'US-0150': 'FAILED: Can\'t test without notice',
  'US-0151': 'FAILED: Can\'t test without notice',
};

const projectRoot = path.resolve(__dirname, '..');
const prdPath = path.join(projectRoot, 'prd.json');

// Read PRD
const prd: PRD = JSON.parse(fs.readFileSync(prdPath, 'utf-8'));

console.log('Resetting stories based on manual testing feedback...\n');

let resetCount = 0;

// Update stories
prd.userStories = prd.userStories.map((story) => {
  if (failingStories[story.id as keyof typeof failingStories]) {
    resetCount++;
    console.log(`✗ ${story.id}: ${story.title}`);
    console.log(`  Reason: ${failingStories[story.id as keyof typeof failingStories]}`);

    return {
      ...story,
      passes: false,
      evidence: failingStories[story.id as keyof typeof failingStories],
      notes: `${story.notes}\n\nManual testing showed this feature is broken. Needs fixing and proper browser testing.`,
    };
  }
  return story;
});

// Write updated PRD
fs.writeFileSync(prdPath, JSON.stringify(prd, null, 2));

console.log(`\n✓ Reset ${resetCount} stories to passes: false`);
console.log(`\nPriority 0 status:`);
console.log(`  Total: ${prd.userStories.filter((s) => s.priority === 0).length}`);
console.log(`  Passing: ${prd.userStories.filter((s) => s.priority === 0 && s.passes).length}`);
console.log(`  Failing: ${prd.userStories.filter((s) => s.priority === 0 && !s.passes).length}`);
