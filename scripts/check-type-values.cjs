const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTypeValues() {
  try {
    // Get distinct type values from existing representations
    const { data: reps, error } = await supabase
      .from('representations')
      .select('type')
      .limit(10);

    if (error) {
      console.error('Error fetching representations:', error);
      return;
    }

    console.log('Sample type values from existing representations:', reps.map(r => r.type));
    
    // Get unique values
    const uniqueTypes = [...new Set(reps.map(r => r.type))];
    console.log('\nUnique type values:', uniqueTypes);

    // Test what values are accepted
    const testValues = ['support', 'object', 'comment', 'objection', 'representation'];
    
    console.log('\nTesting possible values...');
    for (const value of testValues) {
      const { error: testError } = await supabase
        .from('representations')
        .insert({
          notice_id: '550e8400-e29b-41d4-a716-446655440001',
          representor_name: 'Test',
          representation_text: 'Test',
          type: value
        });
      
      if (testError && testError.code === '23514') {
        console.log(`❌ "${value}" is NOT allowed`);
      } else if (testError) {
        console.log(`? "${value}" failed with different error:`, testError.code);
      } else {
        console.log(`✓ "${value}" is allowed`);
        // Clean up test data
        await supabase
          .from('representations')
          .delete()
          .eq('representor_name', 'Test');
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkTypeValues();
