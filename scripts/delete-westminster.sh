#!/bin/bash
set -e

# Load env vars
source "$(dirname "$0")/../.env"

WESTMINSTER_ID="a1111111-1111-1111-1111-111111111111"
SUPABASE_URL="https://puemqhpqxgrvrukyrfkm.supabase.co"

echo "Deleting Westminster council..."

# First delete related records
echo "Deleting related departments..."
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/departments?organization_id=eq.${WESTMINSTER_ID}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"

echo "Deleting related memberships..."
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/organization_memberships?organization_id=eq.${WESTMINSTER_ID}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"

echo "Deleting related department_memberships..."
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/department_memberships?department_id=in.(select id from departments where organization_id='${WESTMINSTER_ID}')" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"

echo "Deleting organization..."
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/organizations?id=eq.${WESTMINSTER_ID}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Prefer: return=representation"

echo ""
echo "Verifying deletion..."
result=$(curl -s "${SUPABASE_URL}/rest/v1/organizations?id=eq.${WESTMINSTER_ID}&select=id" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}")

if [ "$result" = "[]" ]; then
  echo "Westminster council deleted successfully!"
else
  echo "Warning: Organization may still exist: $result"
fi
