# Phase 2: Follow-Up Discipline - Walkthrough

This document outlines the changes implemented to enforce lead follow-up discipline.

## Features Implemented

### 1. Mandatory Next Follow-Up

- **Backend/Service Validation**: Updated `useLeads.ts` hook to enforce that any lead with status other than "Closed" or "Lost" MUST have a `next_follow_up_date`. This check happens before any Supabase network request.
- **Frontend Validation**: Updated `LeadForm.tsx` with a Zod refinement to show an error message ("Follow-up date is required for active leads") directly in the form if the user tries to save an active lead without a date.

### 2. Overdue Follow-Up Detection

- **Shared Logic**: Created `src/lib/leads.ts` with `isLeadOverdue` and `validateLeadFollowUp` functions.
- **Logic**: A lead is overdue if `status` is active (not Closed/Lost) AND `next_follow_up_date` is less than or equal to today.

### 3. Daily Follow-Up Engine (Internal)

- **Daily Check**: Created `useDailyFollowUp` hook that runs in `LeadInbox`.
- **Mechanism**: On page load, it checks if the "daily check" has already run today (using localStorage). If not, it scans for overdue leads.
- **Notification**: If overdue leads are found, a Toast notification appears: "You have X leads pending follow-up today." with a "View" button that switches the view.

### 4. Follow-Up Views

- **New View**: Added "Today's Follow-ups" tab to `LeadInbox`.
- **Functionality**:
  - Filters leads to show only those overdue or due today.
  - Default sorting: **Oldest follow-up date first** (Ascending).
- **Visuals**: Updated `LeadsTable` to highlight the "Follow-up" date column in **red** with an alert icon if the lead is overdue.

### 5. Internal Reminder

- The daily check engine serves as the internal reminder via the Toast notification.

## Files Modified

- `src/types/lead.ts`: (Verified Lead types)
- `src/lib/leads.ts`: [NEW] Shared logic.
- `src/hooks/useLeads.ts`: Added validation to `useCreateLead`, `useUpdateLead`, `useBulkCreateLeads`.
- `src/hooks/useDailyFollowUp.ts`: [NEW] Daily check logic.
- `src/components/leads/LeadForm.tsx`: Added form validation.
- `src/components/leads/LeadInbox.tsx`: Added Tabs, State, and Daily Hook integration.
- `src/components/leads/LeadsTable.tsx`: Added visual indicators and support for initial sort order.

## Verification

1.  **Try to add a lead** with Status="New" and empty "Next Follow-up". -> **Expect Error**.
2.  **Try to add a lead** with Status="New" and a valid date. -> **Success**.
3.  **Set a lead's follow-up date** to yesterday. -> **Expect Red Highlight** in the table.
4.  **Refresh the page**. -> **Expect Toast Notification** "You have X leads..." (if strictly once per day logic is cleared or first run).
5.  **Click "Today's Follow-ups"**. -> **Expect Filtered List** sorted by date ascending.
