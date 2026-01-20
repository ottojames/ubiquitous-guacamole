import { getNoticeBuilder } from './src/next/publish/schema/registry';
import { NOTICE_DEFINITIONS } from './src/next/publish/config/noticeTypes';

console.log('🔍 Registry Debug Test\n');
console.log('═'.repeat(80));

const testIds = [
  'licensing-premises-new',
  'licensing-club-new',
  'gambling-betting-new',
  'gvol-new',
  'planning-major',
  'probate-trustee-s27',
];

console.log('\n📋 Testing builder registration for sample IDs:\n');

for (const id of testIds) {
  const builder = getNoticeBuilder(id);
  const definition = NOTICE_DEFINITIONS.find(d => d.id === id);

  console.log(`${id}:`);
  console.log(`  Definition exists: ${definition ? '✅' : '❌'}`);
  console.log(`  Builder registered: ${builder ? '✅' : '❌'}`);
  if (builder) {
    console.log(`  Builder category: ${builder.category}`);
  }
  console.log('');
}

console.log('═'.repeat(80));
console.log('\n📊 Summary:\n');

const allIds = NOTICE_DEFINITIONS.map(d => d.id);
const registeredCount = allIds.filter(id => getNoticeBuilder(id) !== null).length;

console.log(`Total definitions: ${allIds.length}`);
console.log(`Builders registered: ${registeredCount}`);
console.log(`Missing builders: ${allIds.length - registeredCount}`);

if (registeredCount < allIds.length) {
  console.log('\n❌ Missing builders for:');
  const missing = allIds.filter(id => getNoticeBuilder(id) === null);
  missing.forEach(id => console.log(`  - ${id}`));
}
