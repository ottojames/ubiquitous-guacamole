# Dev Server Status Check ✅

**Date**: 2025-11-20
**Time**: Current
**Status**: All systems operational

---

## Server Status

### Frontend (Vite)
- **Port**: 5173
- **Status**: ✅ Running
- **URL**: http://localhost:5173/
- **Health**: Responding

### Backend (Express API)
- **Port**: 5174
- **Status**: ✅ Running
- **Health Check**: http://localhost:5174/api/health → `{"ok":true}`

---

## Address Search Verification ✅

### Configuration
- **Provider**: getAddress.io (real API, not mock)
- **API Key**: Configured and valid (`VITE_GETADDRESS_KEY`)
- **Endpoint**: `/api/addresses?q={query}`

### Test Results

#### Test 1: Postcode SW1A
```bash
curl "http://localhost:5174/api/addresses?q=SW1A"
```
**Result**: ✅ Returns 4 Westminster addresses
- "Juego, Whitehall, London Sw1a, London"
- "Sw1a Ltd, 3 Holmer Terrace..."
- And more...

#### Test 2: Buckingham Search
```bash
curl "http://localhost:5174/api/addresses?q=Buckingham"
```
**Result**: ✅ Returns 6+ addresses
- "Buckingham's Tea Room Ltd..."
- "Eurogarage Buckingham..."
- And more...

### Frontend Integration
The address search bar on the homepage uses:
1. `AddressSearchBar` component (`src/components/search/AddressSearchBar.tsx`)
2. Autocomplete with 250ms debounce
3. Fetches from `/api/addresses` endpoint
4. Shows suggestions in dropdown
5. Navigates to `/notices?postcode={postcode}` on selection

---

## Video Recording Readiness

### Section 1: Resident Search ✅
**Start URL**: http://localhost:5173/notices?postcode=SW1A1AA

**Address Search Works**:
- Type "Buckingham Palace Road, SW1" → gets suggestions
- Select address → navigates with postcode
- Shows notices within radius

**Test Command**:
```bash
# Open in browser
open "http://localhost:5173/"
# Type in search bar: "Buckingham"
# Should see autocomplete suggestions
```

### Section 2: Public Applicant ✅
**Start URL**: http://localhost:5173/

Confirmed working with address search for postcode filtering.

### Section 3: Law Firm ✅
**Start URL**: http://localhost:5173/f/wilson-partners

Independent of address search - loads directly.

### Section 4: Council Officer ✅
**Start URL**: http://localhost:5173/c/bristol-council/licensing

Independent of address search - loads directly.

### Section 5: Council Manager ✅
**Start URL**: http://localhost:5173/c/westminster-city-of-council/licensing/analytics

Independent of address search - loads directly.

---

## Quick Test Script

Run this to verify all sections:

```bash
# 1. Check servers are running
curl -s http://localhost:5174/api/health
curl -s http://localhost:5173/ | grep -q "Public Notice Portal" && echo "Frontend OK"

# 2. Test address search API
curl -s "http://localhost:5174/api/addresses?q=SW1A" | grep -q "Whitehall" && echo "Address search OK"

# 3. Open showcase landing
open "http://localhost:5173/showcase"
```

---

## Environment Variables

### Active Configuration
```env
ADDRESS_PROVIDER=mock                    # ⚠️ Set but not used (API uses getaddress.io)
VITE_GETADDRESS_KEY=AKda10dDf0K7lT...   # ✅ Valid API key
ADDRESS_API_KEY=${VITE_GETADDRESS_KEY}   # ✅ Referenced correctly
```

**Note**: Even though `ADDRESS_PROVIDER=mock` is set, the backend uses getaddress.io because the `server/routes/address.ts` file directly calls the getaddress.io API with the provided key. The mock provider (`server/services/addressProvider.ts`) is not used by the main address search.

---

## Database Status

From cleanup performed earlier today:

- **Total Notices**: 64 (cleaned from 93)
- **Published**: 53
- **Pending**: 3
- **Draft**: 8
- **Representations**: 40
- **Submissions**: 13
- **Clients**: 15
- **Firms**: 2 (Wilson & Partners, Thompson Legal)
- **Councils**: 349
- **Departments**: 355

---

## Known Working Features

### ✅ Address Autocomplete
- Real-time suggestions from getaddress.io
- Keyboard navigation (Arrow Up/Down)
- Click to select
- Postcode normalization (e.g., "SW1A1AA" → "SW1A 1AA")

### ✅ Postcode Search
- Automatically geocodes via postcodes.io
- Shows notices within radius
- Map clustering works

### ✅ Notice Filtering
- By type (Licensing, Planning, etc.)
- By radius (1km - 50km)
- By council
- By status

### ✅ Map View
- MapLibre GL integration
- Supercluster for clustering
- Click clusters to expand
- Click markers for popups

---

## Video Recording Checklist

Before recording each section:

- [ ] Dev server running (`npm run dev`)
- [ ] Frontend loads: http://localhost:5173/
- [ ] Backend health check passes: http://localhost:5174/api/health
- [ ] Address search tested: Try typing "SW1A" or "Buckingham"
- [ ] Clear browser cache
- [ ] Browser at 100% zoom
- [ ] Close unnecessary tabs

### Live Test Address Search (30 seconds)

1. Open http://localhost:5173/
2. Type "Buckingham Palace" in search box
3. Wait for autocomplete (should see suggestions)
4. Click first suggestion
5. Should navigate to `/notices?postcode=...`
6. Should see Westminster notices on map

**If any issues**, refer to troubleshooting below.

---

## Troubleshooting

### Address Search Not Working

**Symptom**: No suggestions appear when typing

**Solutions**:
1. Check API key is valid:
   ```bash
   curl "http://localhost:5174/api/addresses?q=test"
   # Should return suggestions, not an error
   ```

2. Check browser console for errors (F12)

3. Verify getaddress.io API isn't rate limited

### Server Not Responding

**Symptom**: Port 5173 or 5174 not accessible

**Solutions**:
```bash
# Check if processes are running
lsof -ti tcp:5173
lsof -ti tcp:5174

# If needed, kill and restart
npm run dev
```

### Notices Not Loading

**Symptom**: Search works but no notices appear

**Check database**:
```bash
PGPASSWORD='...' psql -h aws-1-eu-west-2.pooler.supabase.com ... -c "SELECT COUNT(*) FROM notices WHERE status='published';"
# Should return 53
```

---

## Success Criteria

All systems are GO if:
- ✅ Frontend loads at http://localhost:5173/
- ✅ Backend responds at http://localhost:5174/api/health
- ✅ Address search returns suggestions for "SW1A"
- ✅ Showcase landing shows correct stats (64 notices, 40 reps)
- ✅ All 5 demo paths load without errors

**Current Status**: ✅ ALL SYSTEMS GO

---

## Next Steps

1. **Review VIDEO_RECORDING_GUIDE.md** for complete scripts
2. **Test each demo path** by clicking cards on `/showcase`
3. **Record videos** following the 2-minute scripts
4. **Check recordings** for audio/visual quality
5. **Export and upload** to your preferred platform

You're ready to record! 🎬
