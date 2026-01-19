import { Router } from 'express';
import { getServiceSupabaseClient } from '../lib/supabase';
import { z } from 'zod';

const router = Router();

// Schema for council registration
const councilRegistrationSchema = z.object({
  // Council Information
  name: z.string().min(1),
  type: z.enum(['borough', 'city', 'district', 'county']),
  region: z.string().min(1),
  // Departments
  departments: z.array(z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    type: z.string().min(1),
    email: z.string().email(),
    description: z.string().optional()
  })).min(1),
  // Authority Details (MANDATORY)
  authorityAddress: z.string().min(1),
  authorityEmail: z.string().email(),
  authorityPhone: z.string().min(1),
  onlineRegisterUrl: z.string().url(),
  // Admin Account
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  adminName: z.string().min(1),
  adminRole: z.string().min(1)
});

// Schema for firm registration
const firmRegistrationSchema = z.object({
  // Firm Information
  firmName: z.string().min(1),
  practiceAreas: z.array(z.string()).min(1),
  // Office Details
  officeAddress: z.string().min(1),
  officeEmail: z.string().email(),
  officePhone: z.string().min(1),
  // Admin Account
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  adminName: z.string().min(1),
  adminRole: z.string().min(1),
  // Subscription
  subscriptionPlan: z.enum(['starter', 'professional', 'enterprise'])
});

// Register council
router.post('/council', async (req, res) => {
  try {
    console.log('📝 [registration/council] Request received:', {
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Validate request
    const validationResult = councilRegistrationSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.error('❌ [registration/council] Validation failed:', validationResult.error);
      const firstError = validationResult.error.errors?.[0];
      let errorMessage = 'Invalid data provided';

      // Provide more helpful error messages
      if (firstError?.path?.[0] === 'onlineRegisterUrl') {
        errorMessage = 'Please enter a valid URL starting with http:// or https://';
      } else if (firstError?.message) {
        errorMessage = firstError.message;
      }

      return res.status(400).json({
        error: 'validation',
        message: errorMessage,
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    // Get service client (bypasses RLS)
    const supabase = getServiceSupabaseClient();

    // Generate slug
    const councilSlug = data.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/^the-/, '');

    // 1. Create organization
    console.log('🏢 [registration/council] Creating organization:', { name: data.name, slug: councilSlug });
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: data.name,
        slug: councilSlug,
        type: 'council',
        email: data.authorityEmail,
        settings: {
          region: data.region,
          councilType: data.type
        }
      })
      .select()
      .single();

    if (orgError) {
      console.error('❌ [registration/council] Organization creation failed:', orgError);
      if (orgError.code === '23505') {
        return res.status(409).json({
          error: 'duplicate',
          message: 'A council with this name already exists'
        });
      }
      throw orgError;
    }

    console.log('✅ [registration/council] Organization created:', org.id);

    // 2. Create departments
    for (const dept of data.departments) {
      console.log('🏬 [registration/council] Creating department:', dept.name);
      // FIX APPLIED: Using 'email' column as per original migrations (20251021000000_multi_tenant_foundation.sql)
      // Migration 20260119_fix_departments_email_column.sql should be run to rename contact_email -> email
      const { error: deptError } = await supabase
        .from('departments')
        .insert({
          organization_id: org.id,
          name: dept.name,
          slug: dept.slug,
          type: dept.type,
          email: dept.email, // Correct column name per migrations
          status: 'active' // Required field with default value
        });

      if (deptError) {
        console.error('❌ [registration/council] Department creation failed:', deptError);
        // Rollback organization
        await supabase.from('organizations').delete().eq('id', org.id);
        throw deptError;
      }
    }

    // 3. Create council settings
    console.log('⚙️ [registration/council] Creating council settings');
    const { error: settingsError } = await supabase
      .from('council_settings')
      .insert({
        organization_id: org.id,
        authority_address: data.authorityAddress,
        authority_email: data.authorityEmail,
        authority_phone: data.authorityPhone,
        online_register_url: data.onlineRegisterUrl
      });

    if (settingsError) {
      console.error('❌ [registration/council] Settings creation failed:', settingsError);
      // Rollback
      await supabase.from('departments').delete().eq('organization_id', org.id);
      await supabase.from('organizations').delete().eq('id', org.id);
      throw settingsError;
    }

    // 4. Create admin user
    console.log('👤 [registration/council] Creating admin user:', data.adminEmail);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.adminEmail,
      password: data.adminPassword,
      email_confirm: true,
      user_metadata: {
        name: data.adminName,
        organization_id: org.id,
        role: data.adminRole,
        type: 'council'
      }
    });

    if (authError) {
      console.error('❌ [registration/council] User creation failed:', authError);
      // Rollback everything
      await supabase.from('council_settings').delete().eq('organization_id', org.id);
      await supabase.from('departments').delete().eq('organization_id', org.id);
      await supabase.from('organizations').delete().eq('id', org.id);

      if (authError.message?.includes('already registered')) {
        return res.status(409).json({
          error: 'duplicate',
          message: 'This email address is already registered'
        });
      }
      throw authError;
    }

    console.log('✅ [registration/council] Registration complete');

    // Build redirect path - safely access departments array
    const firstDeptSlug = data.departments && data.departments.length > 0
      ? data.departments[0].slug
      : 'dashboard';

    // Return success with redirect path
    res.status(201).json({
      success: true,
      organizationId: org.id,
      redirectPath: `/c/${councilSlug}/${firstDeptSlug}/dashboard`,
      message: 'Council registration successful'
    });

  } catch (error: any) {
    console.error('💥 [registration/council] Error:', error);
    res.status(500).json({
      error: 'server',
      message: error?.message || 'Registration failed. Please try again.'
    });
  }
});

// Register firm
router.post('/firm', async (req, res) => {
  try {
    console.log('📝 [registration/firm] Request received:', {
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Validate request
    const validationResult = firmRegistrationSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.error('❌ [registration/firm] Validation failed:', validationResult.error);
      const firstError = validationResult.error.errors?.[0];
      let errorMessage = firstError?.message || 'Invalid data provided';

      return res.status(400).json({
        error: 'validation',
        message: errorMessage,
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    // Get service client (bypasses RLS)
    const supabase = getServiceSupabaseClient();

    // Generate slug
    const firmSlug = data.firmName.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // 1. Create organization
    console.log('🏢 [registration/firm] Creating organization:', { name: data.firmName, slug: firmSlug });
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: data.firmName,
        slug: firmSlug,
        type: 'firm',
        email: data.officeEmail,
        settings: {
          practice_areas: data.practiceAreas,
          subscription_plan: data.subscriptionPlan,
          address: data.officeAddress,
          phone: data.officePhone
        }
      })
      .select()
      .single();

    if (orgError) {
      console.error('❌ [registration/firm] Organization creation failed:', orgError);
      if (orgError.code === '23505') {
        return res.status(409).json({
          error: 'duplicate',
          message: 'A firm with this name already exists'
        });
      }
      throw orgError;
    }

    console.log('✅ [registration/firm] Organization created:', org.id);

    // 2. Create admin user
    console.log('👤 [registration/firm] Creating admin user:', data.adminEmail);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.adminEmail,
      password: data.adminPassword,
      email_confirm: true,
      user_metadata: {
        name: data.adminName,
        organization_id: org.id,
        role: data.adminRole,
        type: 'firm'
      }
    });

    if (authError) {
      console.error('❌ [registration/firm] User creation failed:', authError);
      // Rollback
      await supabase.from('organizations').delete().eq('id', org.id);

      if (authError.message?.includes('already registered')) {
        return res.status(409).json({
          error: 'duplicate',
          message: 'This email address is already registered'
        });
      }
      throw authError;
    }

    console.log('✅ [registration/firm] Registration complete');

    // Return success with redirect path
    res.status(201).json({
      success: true,
      organizationId: org.id,
      redirectPath: `/f/${firmSlug}/dashboard`,
      message: 'Firm registration successful'
    });

  } catch (error: any) {
    console.error('💥 [registration/firm] Error:', error);
    res.status(500).json({
      error: 'server',
      message: error?.message || 'Registration failed. Please try again.'
    });
  }
});

export default router;