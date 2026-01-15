/**
 * PRD Audit Script
 *
 * Generates PROGRESS.md by analyzing prd.json
 * Run with: npx tsx scripts/audit-prd.ts
 */

import fs from 'fs';
import path from 'path';

interface PRDItem {
  description: string;
  passes: boolean;
  priority: number;
  requirements?: string;
  test_steps?: string[];
  evidence?: string;
  research_needed?: boolean;
}

interface PRDSection {
  [key: string]: PRDItem;
}

interface PRD {
  [section: string]: PRDSection;
}

function generateProgressReport() {
  const prdPath = path.join(process.cwd(), 'prd.json');
  const prd: PRD = JSON.parse(fs.readFileSync(prdPath, 'utf-8'));

  let report = `# PRD Progress Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `---\n\n`;

  // Count totals by section
  const sections: { [key: string]: { total: number; passing: number; failing: number; priority0: number } } = {};

  for (const [sectionName, items] of Object.entries(prd)) {
    sections[sectionName] = { total: 0, passing: 0, failing: 0, priority0: 0 };

    for (const [itemKey, item] of Object.entries(items)) {
      sections[sectionName].total++;

      if (item.passes) {
        sections[sectionName].passing++;
      } else {
        sections[sectionName].failing++;
      }

      if (item.priority === 0) {
        sections[sectionName].priority0++;
      }
    }
  }

  // Executive Summary
  report += `## Executive Summary\n\n`;

  const totalItems = Object.values(sections).reduce((sum, s) => sum + s.total, 0);
  const totalPassing = Object.values(sections).reduce((sum, s) => sum + s.passing, 0);
  const totalFailing = Object.values(sections).reduce((sum, s) => sum + s.failing, 0);
  const totalPriority0 = Object.values(sections).reduce((sum, s) => sum + s.priority0, 0);

  report += `- **Total Items**: ${totalItems}\n`;
  report += `- **Passing**: ${totalPassing} (${Math.round(totalPassing / totalItems * 100)}%)\n`;
  report += `- **Failing**: ${totalFailing} (${Math.round(totalFailing / totalItems * 100)}%)\n`;
  report += `- **Critical (Priority 0)**: ${totalPriority0}\n\n`;

  // Section breakdown
  report += `## Section Breakdown\n\n`;

  for (const [sectionName, stats] of Object.entries(sections)) {
    const percentage = stats.total > 0 ? Math.round(stats.passing / stats.total * 100) : 0;
    const status = stats.failing === 0 ? '✅' : '⚠️';

    report += `### ${status} ${sectionName.replace(/_/g, ' ').toUpperCase()}\n`;
    report += `- Total: ${stats.total}\n`;
    report += `- Passing: ${stats.passing} (${percentage}%)\n`;
    report += `- Failing: ${stats.failing}\n`;
    if (stats.priority0 > 0) {
      report += `- Priority 0 items: ${stats.priority0}\n`;
    }
    report += `\n`;
  }

  // Critical failures (Priority 0)
  report += `## 🚨 Critical Failures (Priority 0)\n\n`;

  let criticalCount = 0;
  for (const [sectionName, items] of Object.entries(prd)) {
    for (const [itemKey, item] of Object.entries(items)) {
      if (item.priority === 0 && !item.passes) {
        criticalCount++;
        report += `### ${criticalCount}. ${itemKey}\n`;
        report += `**Description**: ${item.description}\n\n`;
        report += `**Requirements**: ${item.requirements || 'Not specified'}\n\n`;

        if (item.test_steps && item.test_steps.length > 0) {
          report += `**Test Steps**:\n`;
          item.test_steps.forEach((step, i) => {
            report += `${i + 1}. ${step}\n`;
          });
          report += `\n`;
        }

        report += `---\n\n`;
      }
    }
  }

  if (criticalCount === 0) {
    report += `No critical failures! 🎉\n\n`;
  }

  // Other failures by priority
  for (let priority = 1; priority <= 5; priority++) {
    const failures: Array<{ section: string; key: string; item: PRDItem }> = [];

    for (const [sectionName, items] of Object.entries(prd)) {
      for (const [itemKey, item] of Object.entries(items)) {
        if (item.priority === priority && !item.passes) {
          failures.push({ section: sectionName, key: itemKey, item });
        }
      }
    }

    if (failures.length > 0) {
      report += `## Priority ${priority} Failures\n\n`;

      failures.forEach((f, i) => {
        report += `${i + 1}. **${f.key}** (${f.section})\n`;
        report += `   ${f.item.description}\n\n`;
      });
    }
  }

  // Completed items
  report += `## ✅ Completed Items\n\n`;

  for (const [sectionName, items] of Object.entries(prd)) {
    const completedItems = Object.entries(items).filter(([_, item]) => item.passes);

    if (completedItems.length > 0) {
      report += `### ${sectionName.replace(/_/g, ' ').toUpperCase()}\n`;
      completedItems.forEach(([key, item]) => {
        report += `- ${key}: ${item.description}\n`;
      });
      report += `\n`;
    }
  }

  // Write report
  const reportPath = path.join(process.cwd(), 'PROGRESS.md');
  fs.writeFileSync(reportPath, report);

  console.log(`✅ Progress report generated at ${reportPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Total: ${totalItems}`);
  console.log(`   Passing: ${totalPassing} (${Math.round(totalPassing / totalItems * 100)}%)`);
  console.log(`   Failing: ${totalFailing} (${Math.round(totalFailing / totalItems * 100)}%)`);

  if (totalFailing > 0) {
    console.log(`\n⚠️  ${totalFailing} items need attention`);
    process.exit(1);
  } else {
    console.log(`\n🎉 All PRD items passing!`);
    process.exit(0);
  }
}

generateProgressReport();
