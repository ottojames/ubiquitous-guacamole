# Testing Log - Civic Notices
**Date:** 2026-01-15
**Tester:** [Your Name]
**Environment:** Development with Demo Mode

---

## Step 1: Environment Setup ✅
### 1.1 Start the Development Servers
- [x] Tested at: 19:14
- **Status:** ✅ PASS
- **Comments:** Both servers running successfully with demo mode enabled
- **Issues Found:** None

### 1.2 Verify Servers are Running
- [x] Tested at: 19:14
- **Status:** ✅ PASS
- **Comments:** Frontend on :5173, API on :5174 confirmed working
- **Issues Found:** None

---

## Step 2: Test Public Notice Search (US-0001, US-0108, US-0109)

### 2.1 Test Address Search with One-Click Selection
- [ ] Tested at: [time]
- **Status:**
- **Comments:** Okay, so I have navigated to forward slash notices. I can verify that the search radius 500 metres, 1 kilometre, 2 kilometres, 5 kilometres is there. I'm now typing postcode SW1A 1AA into the search box. A drop-down appears. I'm clicking any of the drop-downs and to click on Green Park. Click Green Park and it wants me to click the drop-down again. So that problem is not fixed. I'll click Green Park again. It is automatically on the list view tab and we actually want the results to be on the map view. So I've turned on to map view. I can see a cluster of notices around on the right-hand-sided pill box. It is all a bit crowded and a bit squeezed. And the UI does not look great. I love the size of the map, that's perfect, but we definitely need to get an agent who specialises in UI and UX to look at the right pillbox because it is all squished up and the list of notices below is absolutely tiny and you can't really scroll through them properly. So that needs to be rethought. 
- **Issues Found:** see above

### 2.2 Test Radius Filter Changes
- [ ] Tested at: [time]
- **Status:**
- **Comments:** yes this works as intended
- **Issues Found:** we have to click twice on the dropdown list of addresses, and also it should automatically be in map view, and not list view. Please note the UI and UX comments in 2.1 also.

### 2.3 Test Notice Detail Page
- [ ] Tested at: [time]
- **Status:**
- **Comments:** yes this works well, although I think the radius in the right sided map is unnecessary and can be removed, one red pin on the address of the notice on the map would suffice. I cannot for this particular notice the pilot inn see a representation form, but I can on other notices - this needs to be consistent on every single notice published on our site non negotiable there needs to be the representation form. 
- **Issues Found:**

---

## Step 3: Test Council Portal (US-0002-0004, US-0012-0015, US-0125-0129)

### 3.1 Access Council Portal with Demo Mode
- [ ] Tested at: [time]
- **Status:**
- **Comments:** failed, tried to login with Westminster clicking the amber box with demo accounts but returned the error "Invalid credentials. Please check your email and password." Console log: "dom.js?token=948471-434157-737387:896 initEternlDomAPI: domId 594251-612442-582583 false

dom.js?token=948471-434157-737387:897 initEternlDomAPI: href http://localhost:5173/login
client:733 [vite] connecting...
client:827 [vite] connected.
react-dom_client.js?v=9954f159:32136 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
content_chrome.js:2 [bugsnag] Loaded!
content.js:30 Download the Apollo DevTools for a better development experience: https://chrome.google.com/webstore/detail/apollo-client-developer-t/jdkknkkbebbapilgoeccciglkfbmbnfm
login:1 [DOM] Input elements should have autocomplete attributes (suggested: "current-password"): (More info: https://goo.gl/9p2vKq) 
puemqhpqxgrvrukyrfkm…ant_type=password:1 
 Failed to load resource: the server responded with a status of 400 ()
@sentry_react.js?v=9954f159:7359 Login error: AuthApiError: Invalid login credentials
    at async handleSubmit (Login.tsx:35:42)" - this must be resolved immediately.
- **Issues Found:**

### 3.2 Test Licensing Dashboard (US-0125)
- [ ] Tested at: [time]
- **Status:**
- **Comments:** cannot verify as cannot login.
- **Issues Found:**

### 3.3 Test Department Switching (US-0012)
- [ ] Tested at: [time]
- **Status:**
- **Comments:** cannot verify as cannot login.
- **Issues Found:**

### 3.4 Test Notices Retrieval (US-0002)
- [ ] Tested at: [time]
- **Status:**
- **Comments:** cannot verify as cannot login.
- **Issues Found:**

### 3.5 Test Representations Management (US-0003, US-0126-0129)
- [ ] Tested at: [time]
- **Status:**
- **Comments:** cannot verify as cannot login.
- **Issues Found:**

### 3.6 Test Analytics (US-0004)
- [ ] Tested at: [time]
- **Status:**
- **Comments:** cannot verify as cannot login.
- **Issues Found:**

### 3.7 Test Templates (US-0014-0015)
- [ ] Tested at: [time]
- **Status:**
- **Comments:** cannot verify as cannot login.
- **Issues Found:**

---

## Step 4: Test Firm Portal (US-0005-0010, US-0145-0151)

### 4.1 Access Firm Portal
- [ ] Tested at: [time]
- **Status:**
- **Comments:** failed, tried to login with amber box, it filled in the login details and then the error Invalid credentials. Please check your email and password. Console log: dom.js?token=128804-621041-85376:896 initEternlDomAPI: domId 214931-653006-537185 false

dom.js?token=128804-621041-85376:897 initEternlDomAPI: href http://localhost:5173/login
client:733 [vite] connecting...
client:827 [vite] connected.
react-dom_client.js?v=9954f159:32136 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
content_chrome.js:2 [bugsnag] Loaded!
content.js:30 Download the Apollo DevTools for a better development experience: https://chrome.google.com/webstore/detail/apollo-client-developer-t/jdkknkkbebbapilgoeccciglkfbmbnfm
content_chrome.js:2 XHR finished loading: POST "https://sessions.bugsnag.com/".
login:1 [DOM] Input elements should have autocomplete attributes (suggested: "current-password"): (More info: https://goo.gl/9p2vKq) 
out-4.5.45.js:1 XHR finished loading: POST "https://m.stripe.com/6".
out-4.5.45.js:1 XHR finished loading: POST "https://m.stripe.com/6".
t.js:1 
 POST https://puemqhpqxgrvrukyrfkm.supabase.co/auth/v1/token?grant_type=password 500 (Internal Server Error)
Login.tsx:113 Login error: AuthApiError: Database error querying schema
    at async handleSubmit (Login.tsx:35:42)
t.js:1 Fetch failed loading: POST "https://puemqhpqxgrvrukyrfkm.supabase.co/auth/v1/to
- **Issues Found:**

### 4.2 Test Dashboard Features (US-0148, US-0150, US-0151)
- [ ] Tested at: [time]
- **Status:**
- **Comments:** cannot verify as cannot login.
- **Issues Found:**

### 4.3 Test Payment Button (US-0005)
- [ ] Tested at: [time]
- **Status:**
- **Comments:** cannot verify as cannot login.
- **Issues Found:**

### 4.4 Test Clients Page (US-0006, US-0149)
- [ ] Tested at: [time]
- **Status:**
- **Comments:** cannot verify as cannot login.
- **Issues Found:**

### 4.5 Test Notices Page (US-0007, US-0151)
- [ ] Tested at: [time]
- **Status:**
- **Comments:** cannot verify as cannot login.
- **Issues Found:**

### 4.6 Test Billing Page (US-0008)
- [ ] Tested at: [time]
- **Status:**
- **Comments:** cannot verify as cannot login.
- **Issues Found:**

### 4.7 Test Team Page (US-0009)
- [ ] Tested at: [time]
- **Status:**
- **Comments:** cannot verify as cannot login.
- **Issues Found:**

### 4.8 Test Settings Filter (US-0010, US-0146)
- [ ] Tested at: [time]
- **Status:**
- **Comments:** cannot verify as cannot login.
- **Issues Found:**

---

## Step 5: Test Publish Wizard (US-0011, US-0028, US-0029)

### 5.1 Test Complete Submission Flow
- [ ] Tested at: [time]
- **Status:**
- **Comments:** Okay, I've logged, I've directed myself to slash publish slash step hyphen one. I've selected new premises license. I can verify that the new structure template is the default. I'm now progressing to enter details manually. Applicant status does not need to be there. The trading name does not need to be there. The applicant address does not need to be there. Remove those fields. The company number optional field also does not need to be there. I'm now putting in the premises name. I'm putting in the premises address. The sale of alcohol on and off the premises is still field on the activities. It's still not below opening hours. It needs to be at the top of activities, but below opening hours. That needs to be resolved. Again, the designated premises supervisor is still there. That field is still there. It does not need to be there. The application date I'm putting in, that works fine. The publication date optional field does not need to be there. Remove that. The sampleton, the, sorry, the licensing authority name fails to load councils. So I can't actually progress with this anymore. It says no councils in database. Import councils via superbase SQL editor to populate the dropdown. Once that has been clicked, the authority address should automatically populate because that will be located and stored on the council, the council's account settings where they put in their authority address. So I can't press with this anymore now because of those failures. Also in the council account settings, the authority email should be in their settings, which should automatically populate the authority email on the publish step, publish wizard automatically. The authority phone field can be removed and the online register URL, that should also be populated automatically.
- **Issues Found:**

---

## Step 6: Test Demo Access Controls (US-0025-0027)

### 6.1 Test Demo Mode OFF
- [ ] Tested at: [time]
- **Status:**
- **Comments:** yes this works as intended
- **Issues Found:**

### 6.2 Test Demo Mode ON
- [ ] Tested at: [time]
- **Status:**
- **Comments:** yes this works in demo mode I can see the amber boxes, but, as you know, I cannot login it shows this error "Invalid credentials. Please check your email and password."
- **Issues Found:**

---

## Step 7: Test Blue Notice PDFs (US-0117-0120)

### 7.1 Test PDF Generation
- [ ] Tested at: [time]
- **Status:**
- **Comments:** cannot do this as publishing wizard is not finished due to comments made earlier. 
- **Issues Found:**

---

## Step 8: Test Firm Registration (US-0145)

### 8.1 Test Registration Wizard
- [ ] Tested at: [time]
- **Status:**
- **Comments:** Okay, I'm now navigating to slash register slash firm. And it shows create your organisation, choose the type of organisation you want to create, council or law firm. I don't feel like these should both be here. I feel like on the sign-in page, once you go to either council portal, well, you go to sign in and then it has two options, council portal or professional portal. Below that it should say something like, don't have an account, please create an account here. And then it should go through the steps of, maybe like, it'd be quite cool if it was like a questionnaire sort of thing, like, are you a council or are you a law firm? Sort of thing like that in a really nice looking UI and walk you through all the details that you need to create your account. Whilst I'm also on this login business, I think it'd be really, well, actually I would love to completely remove any reference to a magic link. We do not want to use magic link. We want to have username and password. That's how we want to do things. If you forget your password, you email, you click forgotten password and then an email gets sent and you can reset your password. We do not want any magic link. So let's, I will try create a company anyway. So if I click law firm in the organisation name, it says sampletonburg council, which is completely irrelevant, but we'll go with it. But it does need to be changed. The registration number also, that doesn't need to be there. That field can be removed. Okay, I've selected my practice areas and it says failed to load prescription plans. Please try again. And I cannot progress any more with that. So this needs to be fixed.
- **Issues Found:**

---

## 🐛 Issues Summary

### Critical Issues
1.

### Minor Issues
1.

### Suggestions for Improvement
1.

---

## 📊 Testing Summary

- **Total Features Tested:** X/37
- **Passing:** X
- **Failing:** X
- **Blocked:** X

---

## 📝 General Notes
