# Complete Video Recording Guide - 5 × 2-Minute Demos

**Total Recording Time**: ~10 minutes (5 videos × 2 minutes each)
**Setup Time**: 15 minutes
**Editing Time**: 30 minutes (optional)

---

## 🎬 Quick Start

### Software You'll Need

**Option 1: macOS (Built-in)**
- QuickTime Player (File → New Screen Recording)
- Screenshot app (Cmd + Shift + 5)

**Option 2: Windows (Free)**
- Xbox Game Bar (Win + G)
- OBS Studio (free, professional)

**Option 3: Cross-Platform (Professional)**
- OBS Studio (free): https://obsproject.com
- Loom (free for up to 5 min videos): https://loom.com
- ScreenFlow (paid, Mac): https://www.telestream.net/screenflow

**Recommended**: Use macOS Screenshot tool or Loom for simplicity

---

## 🎥 Recording Setup (5 minutes)

### 1. Start the Dev Server
```bash
cd /Users/ottoclarke/projects/ubiquitous-guacamole
npm run dev
```

Wait for: `Local: http://localhost:5173/`

### 2. Browser Setup
- Open Chrome or Safari
- Set browser window to 1920×1080 (full HD)
- Zoom to 100%
- Hide bookmarks bar (Cmd + Shift + B)
- Open: http://localhost:5173/showcase
- Pin this tab

### 3. Screen Recording Settings
- **Resolution**: 1920×1080 (Full HD) or 1280×720 (HD)
- **Frame Rate**: 30 fps minimum
- **Audio**: Optional (can add voiceover later)
- **Recording Area**: Full screen or app window only

### 4. Test Recording
- Record 10 seconds of the showcase page
- Play back to check quality
- Adjust if needed

---

## 📹 Video 1: Resident Search (2 minutes)

### Setup
- Navigate to: http://localhost:5173/showcase
- Click "Resident Search" card
- Should load: http://localhost:5173/notices?postcode=SW1A1AA

### Recording Script (0:00 - 2:00)

**0:00 - 0:15** | Homepage & Search
```
Action: Page loads with map view showing Westminster notices
Narration: "Welcome to Civic Notices. Let's explore how residents discover public notices in their area. We're starting with a postcode search in Westminster - SW1A 1AA."
```

**0:15 - 0:30** | Map Interaction
```
Action:
- Zoom in on map (scroll or +/- buttons)
- Click on a cluster to expand
- Hover over markers to see popups

Narration: "The map shows 106 published notices across the UK, with clustering for easy navigation. Notice how markers group together for better visibility."
```

**0:30 - 0:50** | Filters
```
Action:
- Click radius dropdown → change from 5km to 10km
- Map updates with more results
- Click "Notice Type" dropdown → select "Licensing"
- Map filters to only licensing notices

Narration: "Residents can adjust the search radius and filter by notice type. Let's filter to licensing applications only - these are premises seeking alcohol licenses or variations."
```

**0:50 - 1:15** | Notice Details
```
Action:
- Click a notice marker on map
- Popup appears with notice preview
- Click "View Notice" button
- Notice detail page loads

Narration: "Each notice displays full details: the applicant, the premises address, what's being applied for, and critically - the consultation deadline. This one expires in 7 days."
```

**1:15 - 1:40** | Representations
```
Action:
- Scroll down to "Representations" section
- Show existing objections/support (should have 2-3)
- Highlight the counts (e.g., "3 objections, 1 support")

Narration: "We can see that 3 residents have already objected citing noise concerns, and 1 has submitted support. This transparency shows community engagement in action."
```

**1:40 - 2:00** | Email Alerts CTA
```
Action:
- Scroll to top
- Click "Subscribe to Email Alerts" button (if visible)
- Or return to notices page
- Show the search form

Narration: "Residents can subscribe to weekly email alerts for their postcode, ensuring they never miss a consultation that affects their neighbourhood. Democracy becomes accessible."
```

---

## 📹 Video 2: Public Applicant (2 minutes)

### Setup
- Navigate to: http://localhost:5173/
- Identify a notice with upcoming deadline

### Recording Script (0:00 - 2:00)

**0:00 - 0:20** | Homepage Browse
```
Action:
- Homepage loads with recent notices
- Scroll through 3-4 notices
- Show different notice types (licensing, planning, gambling)

Narration: "Any member of the public can browse active consultations without creating an account. Let's look at a controversial licensing application that's receiving significant attention."
```

**0:20 - 0:40** | Select Notice
```
Action:
- Click on a notice with representations (e.g., "The Black Swan")
- Notice detail page loads
- Show notice text, applicant details

Narration: "This is The Black Swan in Bath - they're applying to extend their hours until 2am on weekends. The consultation closes in 12 days."
```

**0:40 - 1:00** | View Existing Representations
```
Action:
- Scroll to representations section
- Show 2-3 existing objections
- Highlight grounds cited (e.g., "prevention of public nuisance")

Narration: "Two residents have already objected, citing concerns about late-night noise and public nuisance. Let's add our own representation."
```

**1:00 - 1:30** | Submit Representation
```
Action:
- Click "Submit Your Representation" button
- Form loads
- Fill in:
  - Name: "Michael Chen"
  - Email: "michael.chen@example.com"
  - Address: "15 Park Road, Bath, BA1 2AB"
  - Type: Select "Objection"
  - Grounds: Check "Prevention of Public Nuisance"
  - Comments: Type "I am concerned about increased noise..."

Narration: "The form is straightforward - name, address, whether you're objecting or supporting, and your reasons. For licensing, we cite the relevant statutory grounds."
```

**1:30 - 2:00** | Confirmation
```
Action:
- Click "Submit Representation"
- Email client opens with pre-filled template (or show success message)
- Show reference number (e.g., REP-004932)

Narration: "Upon submission, a reference number is provided for tracking. The representation is sent directly to the council's licensing team. Civic participation made simple."
```

---

## 📹 Video 3: Law Firm (2 minutes)

### Setup
- Navigate to: http://localhost:5173/showcase
- Click "Legal Firm" card
- Loads: http://localhost:5173/f/wilson-partners

### Recording Script (0:00 - 2:00)

**0:00 - 0:25** | Firm Dashboard
```
Action:
- Dashboard loads showing overview
- Highlight key stats:
  - 8 clients
  - 13 active submissions
  - £2,450 outstanding billing

Narration: "Wilson & Partners LLP manages statutory notices for multiple clients. The dashboard shows 13 active submissions across licensing, planning, and traffic categories, with £2,450 in outstanding billing."
```

**0:25 - 0:45** | Client Management
```
Action:
- Click "Clients" tab
- Show list of 8 clients
- Click on one client (e.g., "Bristol Hospitality Group")
- Show client detail with their notices

Narration: "The firm manages 8 clients including restaurants, property developers, and transport companies. Each client has their own portfolio of notices and billing history."
```

**0:45 - 1:10** | Submissions Workflow
```
Action:
- Click "Submissions" tab
- Show submission list with different statuses:
  - 6 "New" (pending council review)
  - 3 "Under Review" (council reviewing)
  - 2 "Changes Requested" (awaiting revisions)
  - 2 "Accepted" (approved for publication)
- Click on one "Under Review" submission

Narration: "The submissions workflow tracks each notice through council review. Six are awaiting initial review, three are being assessed by licensing officers, and two have been approved for publication."
```

**1:10 - 1:35** | Publishing Cost Savings
```
Action:
- Click "Publish New Notice" button
- Modal/page loads with notice type selector
- Show range of options:
  - Licensing (premises, variations, reviews)
  - Planning (applications, listed buildings)
  - Traffic orders
- Select "Premises License - New Application"
- Show price: £49.99

Narration: "Publishing a new notice is streamlined. The firm selects the notice type from over 50 statutory categories. At £49.99 compared to the traditional £280 newspaper ad, that's an 82% cost reduction."
```

**1:35 - 2:00** | OCR & Templates
```
Action:
- Show upload method options:
  - "Upload PDF (OCR)" - highlight this
  - "Manual Entry"
  - "Use Template"
- Hover over OCR option to show description

Narration: "The platform's OCR technology extracts data from client application forms automatically - eliminating manual data entry. For solicitors, this means 80% time savings while serving more clients. Efficiency meets compliance."
```

---

## 📹 Video 4: Council Officer (2 minutes)

### Setup
- Navigate to: http://localhost:5173/showcase
- Click "Council Officer" card
- Loads: http://localhost:5173/c/bristol-council/licensing

### Recording Script (0:00 - 2:00)

**0:00 - 0:25** | Officer Dashboard
```
Action:
- Dashboard loads showing department overview
- Highlight key metrics:
  - 10 published notices
  - 3 pending submissions (amber indicator)
  - 15 representations requiring attention
- Point out visual indicators (amber dots for urgency)

Narration: "Emma Martinez logs into Bristol's licensing department dashboard. She can see 10 published notices, 3 pending submissions awaiting review, and 15 representations from residents - with amber indicators highlighting items requiring attention."
```

**0:25 - 0:55** | Review Pending Submission
```
Action:
- Click "Pending Submissions" tab
- Show list of 3 submissions from law firms
- Click on one (e.g., from Wilson & Partners)
- Review page loads with:
  - Applicant details
  - Premises information
  - Consultation period
  - All statutory fields
- Show action buttons:
  - "Accept & Publish"
  - "Request Changes"
  - "Reject"

Narration: "Emma reviews a premises license application from Wilson & Partners. The platform presents all statutory fields for verification - applicant details, premises location, proposed activities, consultation periods. Everything is structured and auditable."
```

**0:55 - 1:00** | Approve Notice
```
Action:
- Click "Accept & Publish" button
- Confirmation modal appears
- Confirm action
- Success message shows

Narration: "After verifying compliance, Emma approves the notice for publication. It goes live immediately and the 28-day statutory consultation begins."
```

**1:00 - 1:35** | Manage Representations
```
Action:
- Click "Representations" tab (or navigate to Notices → select one with reps)
- Show notice with multiple representations (e.g., 3 objections, 1 support)
- Click to view details of each representation:
  - Resident name and address
  - Type (objection/support)
  - Grounds cited (for licensing)
  - Full comments
- Check "Mark as Read" on one or two

Narration: "Emma now reviews representations on a controversial notice. Three residents object citing noise concerns and prevention of public nuisance. One supports the application. Emma marks each as read as she prepares her report for the licensing sub-committee."
```

**1:35 - 2:00** | Deadline Monitoring
```
Action:
- Return to dashboard or notices list
- Show deadline indicators:
  - Green: 14+ days remaining
  - Amber: 7-13 days remaining
  - Red: Less than 7 days or expired
- Point out one expiring soon

Narration: "The platform monitors consultation deadlines automatically. This notice expires tomorrow - flagged with an amber warning. Emma's team can see at a glance which consultations need priority attention. Complete workflow automation with statutory compliance built in."
```

---

## 📹 Video 5: Council Manager (2 minutes)

### Setup
- Navigate to: http://localhost:5173/showcase
- Click "Council Manager" card
- Loads: http://localhost:5173/c/westminster-city-of-council/licensing/analytics

### Recording Script (0:00 - 2:00)

**0:00 - 0:30** | Analytics Dashboard Overview
```
Action:
- Analytics dashboard loads
- Pan across key KPI cards at top:
  - Total Notices: 106
  - Published: 88
  - Representations: 80
  - Avg Response Time: 4.2 days
- Show percentage indicators (e.g., +12% vs last quarter)

Narration: "David Chen, Westminster's Head of Regulatory Services, views his analytics dashboard. The council has processed 106 notices this quarter with 88 currently published. Public engagement is strong with 80 representations submitted - that's a 50% engagement rate."
```

**0:30 - 0:55** | Cost Savings Analysis
```
Action:
- Scroll to "Cost Savings" section (or highlight it)
- Show calculation:
  - Traditional newspaper ad: £280 per notice
  - Digital platform cost: £49.99 per notice
  - Net savings: £230 per notice
  - Total quarterly savings: £18,000+
- Point out the trend chart (if visible)

Narration: "Here's the financial impact: traditional newspaper ads cost £280 per notice. The digital platform costs just £49.99 - that's £230 saved per notice. Over this quarter, Westminster has saved over £18,000 - money that goes directly back to public services."
```

**0:55 - 1:20** | Engagement & Compliance Metrics
```
Action:
- Show engagement metrics:
  - 80 representations on 53 notices
  - 50% of notices received public feedback
  - Compare to previous period (e.g., "35% engagement with newspaper ads")
- Show compliance metrics:
  - 98% of notices met statutory deadlines
  - Average 4.2 day approval time
  - 2 notices currently overdue (flagged)

Narration: "Public engagement has increased dramatically - 50% of notices receive representations compared to 35% under the old newspaper system. Compliance is excellent: 98% of consultations meet statutory timescales, with only 2 notices currently requiring attention."
```

**1:20 - 1:45** | Department Comparison
```
Action:
- Show department comparison view (if available):
  - Licensing: 72 notices, 4.2 day avg
  - Planning: 3 notices, 6.1 day avg
  - Traffic: 1 notice
- Or show notice type breakdown chart

Narration: "David can compare departments. Licensing has processed 72 notices with a 4.2 day average approval time - faster than planning's 6.1 days. This granular insight helps identify best practices and areas for improvement."
```

**1:45 - 2:00** | Export & Reporting
```
Action:
- Click "Export Report" button (or show export options)
- Show download options (CSV, PDF)
- Or show the audit log link
- Return to dashboard overview

Narration: "When reporting to elected members, David exports comprehensive data sets as PDF or CSV. The platform maintains a complete audit log - every action, every deadline, every decision is tracked. This level of transparency and accountability is what modern local government requires."
```

---

## 🎬 Production Tips

### Recording Quality
- **Audio**: Record voiceover separately in quiet room, sync later
- **Lighting**: Ensure screen is clearly visible (not too bright/dark)
- **Mouse**: Move smoothly, pause on important elements
- **Cursor**: Use a cursor highlighter app if available

### Common Mistakes to Avoid
- ❌ Moving too fast through screens
- ❌ Not pausing to let viewers read content
- ❌ Missing deadlines when demonstrating features
- ❌ Forgetting to show key metrics

### Success Checklist for Each Video
- ✅ Clear audio (or silent with intention to add voiceover)
- ✅ Smooth mouse movements
- ✅ All key features demonstrated
- ✅ 1:50 - 2:10 duration (allows editing buffer)
- ✅ Starts and ends cleanly

---

## 📝 Recording Workflow

### For Each Video:

1. **Prepare** (2 min)
   - Open the correct URL
   - Review the script
   - Test one screen interaction

2. **Record** (2-3 min)
   - Start recording
   - Follow the script timestamps
   - Don't worry about perfection - you can do multiple takes
   - Stop recording

3. **Review** (1 min)
   - Play back the recording
   - Check if all features are visible
   - Decide: keep, re-record, or edit later

4. **Next Video** (1 min)
   - Navigate to next segment
   - Reset any test data if needed
   - Repeat

**Total time for 5 videos**: ~30-40 minutes with preparation

---

## 🎞️ Post-Production (Optional)

### Basic Editing (15-20 min per video)
- Trim start/end for clean opening/closing
- Add title card: "Civic Notices - [Segment Name]"
- Add end card: "civicnotices.co.uk"
- Normalize audio levels
- Speed up slow sections (e.g., form filling) to 1.5x

### Professional Editing (30-45 min per video)
- Add zoom-ins for important UI elements
- Overlay text annotations for key metrics
- Add subtle background music (royalty-free)
- Add transitions between sections
- Color grade for consistency

### Tools for Editing
- **Free**: iMovie (Mac), DaVinci Resolve (all platforms)
- **Paid**: Final Cut Pro (Mac), Adobe Premiere (all)
- **Quick**: Loom has built-in trimming, Camtasia

---

## 📤 Export Settings

### Final Video Specs
- **Resolution**: 1920×1080 (Full HD) or 1280×720 (HD)
- **Frame Rate**: 30 fps
- **Format**: MP4 (H.264 codec)
- **Bitrate**: 5-8 Mbps (high quality)
- **Audio**: AAC, 192 kbps

### File Naming
```
01-civic-notices-resident-search.mp4
02-civic-notices-public-applicant.mp4
03-civic-notices-law-firm.mp4
04-civic-notices-council-officer.mp4
05-civic-notices-council-manager.mp4
```

---

## 🚀 Quick Start Command

```bash
# Terminal 1: Start the server
cd /Users/ottoclarke/projects/ubiquitous-guacamole
npm run dev

# Terminal 2: Open the showcase
open http://localhost:5173/showcase

# macOS: Start screen recording
# Press: Cmd + Shift + 5
# Select: Record Selected Portion (or Full Screen)
# Click: Options → Save to Desktop
# Click: Record

# Begin with Video 1!
```

---

## 🎯 Expected Results

After recording all 5 videos, you'll have:

1. ✅ **5 × 2-minute videos** demonstrating each user journey
2. ✅ **10 minutes total content** for your showcase
3. ✅ **Professional demonstration** of Civic Notices platform
4. ✅ **Reusable assets** for marketing, sales, and presentations

---

## 💡 Alternative Approaches

### Option 1: Silent Videos + Voiceover Later
- Record all 5 videos without audio
- Write final scripts based on actual footage
- Record voiceover in one session with good mic
- Sync audio in post-production

### Option 2: Live Narration While Recording
- Practice the script 2-3 times
- Record screen + microphone simultaneously
- More natural but may require multiple takes

### Option 3: Hire a Voiceover Artist
- Record silent videos
- Send scripts to Fiverr/Upwork voiceover artist (£50-150)
- Receive professional audio in 2-3 days
- Sync and export

---

**Ready to record? Start with Video 1 and work through sequentially. Each video takes ~5 minutes including setup. You've got this! 🎬**
