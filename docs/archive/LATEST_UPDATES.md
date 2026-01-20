# Latest Updates - Search Features

## Changes Implemented

### 1. Sorting Functionality ✅
Added ability to sort notices by:
- **Most Recent** (default) - Sorted by publication/creation date, newest first
- **Nearest** - Distance-based sorting (only available when searching by location/postcode)
- **Oldest** - Sorted by publication/creation date, oldest first

**Implementation:**
- Frontend: Added sort dropdown in Notices page header
- Backend: Implemented Haversine formula for distance calculation
- Smart UI: "Nearest" option only shows when user searches by postcode/location

**Files Modified:**
- `src/pages/Notices.tsx` - Added sort UI and parameter handling
- `server/routes/notices.ts` - Added distance-based sorting logic

### 2. Notice Type Filters ✅
Notice type filters already show umbrella categories:
- **Premises Licence** (includes new applications, variations, etc.)
- **Traffic Order**
- **Planning**

This groups all the individual notice types (like "New Premises Licence Application", "Variation", etc.) under their main categories.

### 3. Map Visibility ✅
Map view is accessible via the view toggle buttons:
- Click "Map view" button to see interactive map
- Click "List view" to return to grid layout
- Map includes:
  - Clustering for better performance
  - Individual notice markers
  - Sidebar with notice list
  - "Show More" button to expand results

## How to Use

### Sorting Notices
1. Navigate to the notices page (search for any postcode like SW1A 1AA)
2. Look for the sort dropdown next to the view toggle buttons
3. Select your preferred sorting:
   - **Most Recent**: See latest notices first (useful for staying up-to-date)
   - **Nearest**: See closest notices first (only when searching by location)
   - **Oldest**: See historical notices first

### Viewing the Map
1. On the notices page, click the "Map view" button
2. The map will show:
   - All notices in the area as blue markers/clusters
   - Click clusters to zoom in
   - Click individual markers to see notice details
   - Sidebar on the right shows notice cards
3. Use "List view" button to return to grid layout

### Filtering by Notice Type
1. Use the filter buttons at the top: "Premises Licence", "Traffic Order", "Planning"
2. These are umbrella categories that include all subtypes
3. Click to toggle filters on/off

## Technical Details

### Distance Calculation
When sorting by "Nearest", the system uses the Haversine formula to calculate the great-circle distance between:
- The search location (based on postcode)
- Each notice's premises location

Formula:
```javascript
const R = 6371; // Earth's radius in km
const dLat = (lat2 - lat1) * Math.PI / 180;
const dLon = (lon2 - lon1) * Math.PI / 180;
const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
         Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
         Math.sin(dLon/2) * Math.sin(dLon/2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
distance = R * c; // in kilometers
```

### API Parameters

**Sort Parameter:**
- `sort=created_at.desc` - Most recent (default)
- `sort=created_at.asc` - Oldest
- `sort=distance.asc` - Nearest (requires postcode/coordinates)

**Example Request:**
```
GET /api/notices/search?postcode=SW1A1AA&sort=distance.asc
```

## User Benefits

1. **Better Discovery**: Users can now find notices based on what matters most to them (proximity vs recency)
2. **Clearer Organization**: Umbrella categories make it easier to filter without being overwhelmed by subtypes
3. **Visual Context**: Map view helps users understand geographic distribution of notices
4. **Flexible Views**: Switch between detailed grid view and geographic map view based on task

## Next Potential Enhancements

1. Add distance badges to cards when sorted by "Nearest" (e.g., "0.5 km away")
2. Save user's preferred sort order in localStorage
3. Add "Sort by deadline" option for time-sensitive notices
4. Implement map-based search (draw boundary to search area)
5. Add export functionality for filtered results

All features are now live and ready to use! 🎉
