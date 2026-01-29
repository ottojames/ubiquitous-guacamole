import { Router } from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';

const router = Router();

// Temporary endpoint to apply practice_areas migration
// This just updates existing firms - the column must be added via SQL Editor first
router.post('/apply-practice-areas-migration', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();

    console.log('Checking practice_areas column...');

    // Try to read practice_areas to see if column exists
    const { data: testFirms, error: testError } = await supabase
      .from('organizations')
      .select('id, slug, name, practice_areas')
      .eq('type', 'firm')
      .limit(1);

    if (testError) {
      return res.status(400).json({
        success: false,
        error: 'practice_areas column does not exist. Please run the SQL migration first:\n\nALTER TABLE organizations ADD COLUMN IF NOT EXISTS practice_areas text[] DEFAULT NULL;',
        sqlError: testError.message
      });
    }

    console.log('Column exists. Updating firms with default practice areas...');

    // Update existing firms with default practice areas
    const { data: updated, error: updateError } = await supabase
      .from('organizations')
      .update({ practice_areas: ['licensing', 'planning'] })
      .eq('type', 'firm')
      .is('practice_areas', null)
      .select();

    if (updateError) {
      throw updateError;
    }

    // Verify all firms
    const { data: allFirms, error: verifyError } = await supabase
      .from('organizations')
      .select('id, slug, name, practice_areas')
      .eq('type', 'firm');

    if (verifyError) {
      throw verifyError;
    }

    res.json({
      success: true,
      message: 'Practice areas updated successfully',
      updated: updated?.length || 0,
      firms: allFirms
    });

  } catch (error: any) {
    console.error('Migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
