# Demo Workflow - Solicitor to Council to Public

This guide walks through the complete end-to-end workflow of the platform.

## Prerequisites

Ensure you have:
1. Supabase project set up with all tables
2. At least one council organization with a licensing department
3. At least one law firm organization
4. Test users with memberships in both orgs

## Step-by-Step Demo

### Part 1: Firm Submits Application

**As a Solicitor at Law Firm:**

1. **Sign In**
   ```
   http://localhost:5173/auth/sign-in
   ```
   - Use magic link or dev auth
   - Select your law firm from context switcher

2. **Navigate to New Submission**
   ```
   http://localhost:5173/f/{firm-slug}/new-submission
   ```

3. **Fill Out Application**
   - **Target Council/Department**: Select "Westminster Licensing Department" (or your council)
   - **Notice Type**: "Premises Licence - New"
   - **Premises Name**: "The Blue Bell Pub"
   - **Premises Address**: "123 High Street, London"
   - **Premises Postcode**: "SW1A 1AA"
   - **Applicant Name**: "John Smith Ltd"
   - **Applicant Address**: "456 Business Park, London"
   - **Licensing Activities**:
     ```
     Sale of alcohol for consumption on premises
     Monday - Saturday: 11:00 - 23:00
     Sunday: 12:00 - 22:30

     Live music on Friday and Saturday evenings
     ```
   - **Representation Deadline**: [30 days from now]
   - **Expiry Date**: [90 days from now]
   - **Additional Information**: "New premises licence for traditional pub"

4. **Submit**
   - Click "Submit Application"
   - ✅ Status: "Submitted successfully"

5. **View in Submissions List**
   ```
   http://localhost:5173/f/{firm-slug}/submissions
   ```
   - See your submission with status: "Pending Review"
   - Badge shows "New" in yellow

---

### Part 2: Council Reviews Application

**As a Licensing Officer at Council:**

1. **Switch to Council Context**
   ```
   http://localhost:5173/switch-context
   ```
   - Select "Westminster Licensing Department"

2. **Dashboard Shows New Submission**
   ```
   http://localhost:5173/c/{council-slug}/{dept-slug}/dashboard
   ```
   - Stats card shows "1 Pending Submission" (blue)
   - Recent activity shows "New Submission: The Blue Bell Pub"

3. **View Submissions Queue**
   ```
   http://localhost:5173/c/{council-slug}/{dept-slug}/submissions
   ```
   - Filter to "New" submissions
   - See "The Blue Bell Pub" application
   - Shows submitter: "[Law Firm Name]"
   - SLA indicator: "4 days remaining" (within 5-day target)

4. **Review Submission**
   - Click "Start Review" → opens SubmissionReviewer
   ```
   http://localhost:5173/c/{council-slug}/{dept-slug}/submissions/{id}
   ```
   - View all details:
     * Submitter metadata
     * Premises details
     * Applicant information
     * Licensing activities
     * Deadlines and dates

5. **Take Action**

   **Option A: Approve**
   - Click "Approve Application"
   - Confirm in modal
   - ✅ Status: "Approved"
   - Ready for publication

   **Option B: Request Changes**
   - Click "Request Changes"
   - Enter feedback: "Please clarify operating hours for outdoor area"
   - Submit
   - ✅ Status: "Changes Requested"
   - Firm receives feedback

   **Option C: Reject**
   - Click "Reject Application"
   - Enter reason: "Premises not suitable for licensing"
   - Submit
   - ✅ Status: "Rejected"
   - Workflow ends

---

### Part 3: Firm Responds to Feedback (if changes requested)

**Back as Solicitor:**

1. **View Submission Detail**
   ```
   http://localhost:5173/f/{firm-slug}/submissions/{id}
   ```
   - Status card shows: "Changes Requested" (orange)
   - Feedback box displays: "Please clarify operating hours for outdoor area"

2. **Resubmit with Corrections**
   - Click "Resubmit with Changes"
   - Updates licensing activities to include outdoor area hours
   - Re-submits to council
   - ✅ New submission created with corrections

3. **Council Reviews Again**
   - Licensing officer sees resubmission
   - Reviews updated information
   - Approves application

---

### Part 4: Council Publishes Notice

**As Licensing Officer:**

1. **Create Publication from Approved Submission**
   - Navigate to approved submission
   - System creates `notice` record (status: 'published')
   - Alternatively, manually create in Publications section

2. **View in Publications Manager**
   ```
   http://localhost:5173/c/{council-slug}/{dept-slug}/publications
   ```
   - See "The Blue Bell Pub" in Active Publications
   - Stats show: "1 Active Publication"
   - Deadline: [30 days from submission]
   - Representation count: 0

---

### Part 5: Public Views and Responds

**As a Member of the Public (No auth required):**

1. **Browse Public Notices**
   ```
   http://localhost:5173/public/notices
   ```
   - See "The Blue Bell Pub" in list
   - Badge shows "29 days left" (green)
   - Shows council: "Westminster Licensing Department"

2. **View Notice Details**
   ```
   http://localhost:5173/public/notices/{id}
   ```
   - Full application details displayed
   - Deadline alert: "29 days remaining to submit representations"

3. **Submit Representation**
   - Click "Submit Your Representation"
   - Fill out form:
     * **Name**: "Jane Resident"
     * **Email**: "jane@example.com"
     * **Type**: "Resident"
     * **Comment**:
       ```
       I live next door to the proposed premises. I have concerns about
       noise levels from live music on Friday and Saturday evenings.
       I request that music be limited to 22:00 to protect residential amenity.
       ```
   - Click "Submit Representation"
   - ✅ Confirmation: "Your representation has been submitted successfully"

---

### Part 6: Council Reviews Public Feedback

**As Licensing Officer:**

1. **View Representations**
   ```
   http://localhost:5173/c/{council-slug}/{dept-slug}/representations
   ```
   - Stats show: "1 New" representation
   - Filter to notice: "The Blue Bell Pub"

2. **Review Representation**
   - See Jane Resident's feedback
   - Read full comment
   - Actions:
     * Click "Mark as Reviewed" → status: 'reviewed'
     * Click "Mark as Actioned" → status: 'actioned'

3. **Dashboard Updates**
   ```
   http://localhost:5173/c/{council-slug}/{dept-slug}/dashboard
   ```
   - Stats card: "1 New Response" (purple)
   - Recent activity shows representation

---

## Additional Features to Demo

### Compliance Dashboard
```
http://localhost:5173/c/{council-slug}/{dept-slug}/compliance
```
- SLA compliance rate
- Overdue submissions list
- Team performance metrics

### Analytics
```
http://localhost:5173/c/{council-slug}/{dept-slug}/analytics
```
- Submission trends (bar chart)
- Status breakdown
- Notice type performance

### Bulk Actions
```
http://localhost:5173/c/{council-slug}/{dept-slug}/bulk-actions
```
- Multi-select submissions
- Bulk approve/reject
- Batch processing

### Exports
```
http://localhost:5173/c/{council-slug}/{dept-slug}/exports
```
- Export submissions to CSV
- Export publications
- Export representations

---

## Admin Portal Demo

**As Super Admin:**

1. **Platform Dashboard**
   ```
   http://localhost:5173/admin/dashboard
   ```
   - Total organizations, users, submissions
   - Recent activity feed

2. **Create New Organization**
   ```
   http://localhost:5173/admin/organizations
   ```
   - Click "Create Organization"
   - Name: "Camden Council"
   - Type: "Council"
   - Email: "licensing@camden.gov.uk"
   - ✅ Organization created

3. **Manage Users**
   ```
   http://localhost:5173/admin/users
   ```
   - View all platform users
   - See organization memberships
   - Delete users if needed

---

## Success Indicators

After completing this workflow, you should see:

✅ **Firm Portal**: Submission shows "Approved" status
✅ **Council Portal**: Notice appears in Publications
✅ **Public Portal**: Notice visible with representation form
✅ **Council Portal**: Representation appears in queue
✅ **Dashboard**: All stats updated with new counts
✅ **Compliance**: SLA compliance tracked correctly

---

## Troubleshooting

**"No councils in dropdown"**
- Use Admin portal to create council organizations
- Ensure they have licensing departments

**"Can't submit representation"**
- Check notice status is 'published'
- Ensure deadline hasn't passed

**"Submission not appearing in council queue"**
- Verify `receiving_department_id` matches council dept
- Check RLS policies allow council to see firm's submissions

**"SLA compliance not calculating"**
- Ensure `submitted_at` timestamps are correct
- Check status is 'new' or 'in_review'

---

**The entire workflow is already built and functional!** 🎉

This demonstrates the complete solicitor → council → public flow from application to publication to public feedback.
