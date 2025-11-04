import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }
  return supabase;
}

/**
 * ONS Postcode → Local Authority lookup cache
 * Downloads and caches ONS Postcode Directory data
 * Free, open data under OGL v3.0
 */
const postcodeCache = new Map<string, string>();

interface CouncilMatchResult {
  organization_id: string | null;
  council_id: string | null; // References councils table (for reps_email)
  department_id: string | null;
  confidence: 'high' | 'medium' | 'low';
  method: 'explicit' | 'postcode' | 'geocode' | 'name_match' | 'fallback';
  council_name?: string;
}

/**
 * Strategy 1: Explicit Council ID (from scraper source)
 * Used when scraping from council websites directly
 */
export async function matchByExplicitId(
  councilSlug: string
): Promise<CouncilMatchResult | null> {
  const db = getSupabase();

  const { data: org, error } = await db
    .from('organizations')
    .select('id, name')
    .eq('slug', councilSlug)
    .eq('type', 'council')
    .single();

  if (error || !org) {
    return null;
  }

  // Also look up the council_id from councils table
  // Try exact slug first, then try variations (e.g., westminster vs westminster-city-council)
  let { data: council } = await db
    .from('councils')
    .select('id')
    .eq('slug', councilSlug)
    .single();

  // If not found, try using the organization name to find the council
  if (!council) {
    const { data: councilByName } = await db
      .from('councils')
      .select('id')
      .ilike('name', org.name)
      .limit(1)
      .single();
    council = councilByName;
  }

  return {
    organization_id: org.id,
    council_id: council?.id || null,
    department_id: null, // Will be determined by notice type
    confidence: 'high',
    method: 'explicit',
    council_name: org.name,
  };
}

/**
 * Strategy 2: Postcode → Council Lookup
 * Uses ONS Postcode Directory (free, OGL licensed)
 * MapIt API as fallback (£20/month for unlimited)
 */
export async function matchByPostcode(
  postcode: string
): Promise<CouncilMatchResult | null> {
  // Normalize postcode (remove spaces, uppercase)
  const normalizedPostcode = postcode.replace(/\s+/g, '').toUpperCase();

  console.log('[CouncilMatcher] Looking up postcode:', normalizedPostcode);

  // Check cache first
  const cached = postcodeCache.get(normalizedPostcode);
  if (cached) {
    console.log('[CouncilMatcher] Cache hit:', cached);
    return await matchByCouncilName(cached);
  }

  // Try MapIt API (free for low volume, £20/month for unlimited)
  try {
    const mapitUrl = `https://mapit.mysociety.org/postcode/${encodeURIComponent(normalizedPostcode)}`;
    const response = await fetch(mapitUrl);

    if (!response.ok) {
      console.warn('[CouncilMatcher] MapIt API error:', response.status);
      return null;
    }

    const data = await response.json();

    // Extract local authority from MapIt response
    // MapIt returns multiple areas, we want the "local authority district"
    const localAuthority = Object.values(data.areas || {}).find(
      (area: any) => area.type === 'LBO' || area.type === 'UTA' || area.type === 'DIS'
    ) as any;

    if (localAuthority) {
      const councilName = localAuthority.name;
      console.log('[CouncilMatcher] MapIt found:', councilName);

      // Cache result
      postcodeCache.set(normalizedPostcode, councilName);

      return await matchByCouncilName(councilName);
    }
  } catch (error) {
    console.error('[CouncilMatcher] MapIt API failed:', error);
  }

  return null;
}

/**
 * Strategy 3: Geographic Coordinates → Council
 * Uses PostGIS spatial query on council boundaries
 */
export async function matchByGeolocation(
  latitude: number,
  longitude: number
): Promise<CouncilMatchResult | null> {
  const db = getSupabase();

  // PostGIS query: find council whose boundary contains this point
  // Note: Requires council boundary geometries in database
  // TODO: Import council boundary data from ONS Open Geography Portal

  console.log('[CouncilMatcher] Geo lookup not yet implemented:', {
    latitude,
    longitude,
  });

  // For now, return null (will implement after boundary import)
  return null;
}

/**
 * Strategy 4: Council Name Matching
 * Fuzzy match council names from scraped data
 */
export async function matchByCouncilName(
  councilName: string
): Promise<CouncilMatchResult | null> {
  const db = getSupabase();

  // Normalize name (remove "Council", "City", "Borough", etc.)
  const normalized = councilName
    .toLowerCase()
    .replace(/\s+(city\s+council|borough\s+council|council|city|borough)/gi, '')
    .trim();

  console.log('[CouncilMatcher] Normalized name:', normalized);

  // Try exact match first
  const { data: exact, error: exactError } = await db
    .from('organizations')
    .select('id, name')
    .eq('type', 'council')
    .ilike('name', `%${normalized}%`)
    .limit(1)
    .single();

  if (exact && !exactError) {
    console.log('[CouncilMatcher] Exact match found:', exact.name);

    // Look up council_id from councils table
    const { data: council } = await db
      .from('councils')
      .select('id')
      .ilike('name', `%${normalized}%`)
      .limit(1)
      .single();

    return {
      organization_id: exact.id,
      council_id: council?.id || null,
      department_id: null,
      confidence: 'high',
      method: 'name_match',
      council_name: exact.name,
    };
  }

  // Try fuzzy match (Levenshtein distance)
  const { data: councils } = await db
    .from('organizations')
    .select('id, name')
    .eq('type', 'council');

  if (!councils || councils.length === 0) {
    return null;
  }

  // Simple fuzzy matching (could use Fuse.js for better results)
  const matches = councils
    .map((council) => {
      const councilNormalized = council.name
        .toLowerCase()
        .replace(/\s+(city\s+council|borough\s+council|council|city|borough)/gi, '')
        .trim();

      const similarity = calculateSimilarity(normalized, councilNormalized);

      return { council, similarity };
    })
    .filter((m) => m.similarity > 0.7)
    .sort((a, b) => b.similarity - a.similarity);

  if (matches.length > 0) {
    const best = matches[0];
    console.log('[CouncilMatcher] Fuzzy match found:', best.council.name, '(', best.similarity, ')');

    // Look up council_id from councils table
    const councilNormalized = best.council.name
      .toLowerCase()
      .replace(/\s+(city\s+council|borough\s+council|council|city|borough)/gi, '')
      .trim();

    const { data: council } = await db
      .from('councils')
      .select('id')
      .ilike('name', `%${councilNormalized}%`)
      .limit(1)
      .single();

    return {
      organization_id: best.council.id,
      council_id: council?.id || null,
      department_id: null,
      confidence: best.similarity > 0.9 ? 'high' : 'medium',
      method: 'name_match',
      council_name: best.council.name,
    };
  }

  return null;
}

/**
 * Master matching function
 * Tries strategies in order of confidence
 */
export async function matchCouncil(options: {
  councilSlug?: string;
  councilName?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
}): Promise<CouncilMatchResult | null> {
  // Strategy 1: Explicit ID (highest confidence)
  if (options.councilSlug) {
    const result = await matchByExplicitId(options.councilSlug);
    if (result) return result;
  }

  // Strategy 2: Postcode lookup (high confidence)
  if (options.postcode) {
    const result = await matchByPostcode(options.postcode);
    if (result) return result;
  }

  // Strategy 3: Geolocation (high confidence)
  if (options.latitude && options.longitude) {
    const result = await matchByGeolocation(options.latitude, options.longitude);
    if (result) return result;
  }

  // Strategy 4: Name matching (medium confidence)
  if (options.councilName) {
    const result = await matchByCouncilName(options.councilName);
    if (result) return result;
  }

  // No match found
  return null;
}

/**
 * Get or create department for a specific notice type
 */
export async function getOrCreateDepartment(
  organizationId: string,
  noticeType: string
): Promise<string | null> {
  const db = getSupabase();

  // Map notice types to department names and types
  const departmentMapping: Record<string, { name: string; type: string; email_suffix: string }> = {
    'premises-licence': { name: 'Licensing', type: 'licensing', email_suffix: 'licensing' },
    'premises-licence-variation': { name: 'Licensing', type: 'licensing', email_suffix: 'licensing' },
    'club-premises-certificate': { name: 'Licensing', type: 'licensing', email_suffix: 'licensing' },
    'gambling-premises': { name: 'Licensing', type: 'licensing', email_suffix: 'licensing' },
    'temporary-event-notice': { name: 'Licensing', type: 'licensing', email_suffix: 'licensing' },
    'planning-permission': { name: 'Planning', type: 'planning', email_suffix: 'planning' },
    'listed-building-consent': { name: 'Planning', type: 'planning', email_suffix: 'planning' },
    'environmental-permit': { name: 'Environmental Health', type: 'environmental', email_suffix: 'environmental' },
    'traffic-regulation-order': { name: 'Highways & Transport', type: 'highways', email_suffix: 'highways' },
    'street-works': { name: 'Highways & Transport', type: 'highways', email_suffix: 'highways' },
    'public-procurement': { name: 'Procurement', type: 'procurement', email_suffix: 'procurement' },
  };

  const deptInfo = departmentMapping[noticeType] || { name: 'General', type: 'general', email_suffix: 'general' };
  const deptName = deptInfo.name;

  // Check if department exists
  const { data: existing } = await db
    .from('departments')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('name', deptName)
    .single();

  if (existing) {
    return existing.id;
  }

  // Get organization email domain to create department email
  const { data: org } = await db
    .from('organizations')
    .select('contact_email')
    .eq('id', organizationId)
    .single();

  const emailDomain = org?.contact_email?.split('@')[1] || 'council.gov.uk';
  const deptEmail = `${deptInfo.email_suffix}@${emailDomain}`;

  // Create department
  const { data: newDept, error } = await db
    .from('departments')
    .insert({
      organization_id: organizationId,
      name: deptName,
      slug: deptName.toLowerCase().replace(/\s+/g, '-'),
      type: deptInfo.type,
      email: deptEmail,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[CouncilMatcher] Failed to create department:', error);
    return null;
  }

  console.log(`[CouncilMatcher] Created department: ${deptName} (${deptInfo.type})`);
  return newDept.id;
}

/**
 * Simple string similarity calculation (Jaro-Winkler-ish)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(str1, str2);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Handle GVOL notices (not tied to councils)
 * These are managed by Traffic Commissioners, not local authorities
 */
export async function handleGVOLNotice(
  operatingCentrePostcode: string,
  trafficArea: string
): Promise<CouncilMatchResult> {
  // GVOLs are NOT tied to councils, but we still track location for objections
  // Traffic Commissioner regions:
  // - East of England
  // - North West of England
  // - London and South East of England
  // - West Midlands
  // - North East of England
  // - Scotland
  // - Wales
  // - West of England

  console.log('[CouncilMatcher] GVOL Notice - Traffic Area:', trafficArea);

  // For GVOLs, we don't assign to a council
  // But we still geocode the operating centre for map display
  return {
    organization_id: null,
    department_id: null,
    confidence: 'high',
    method: 'explicit',
    council_name: `Traffic Commissioner - ${trafficArea}`,
  };
}
