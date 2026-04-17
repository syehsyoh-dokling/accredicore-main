# Manual Test Guide

## Start The Local Stack

1. Open PowerShell in `C:\Users\Saifuddin\accredicore-main`.
2. Run `.\scripts\start\start-win.ps1`.
3. Wait until these URLs are reachable:
   - Frontend: `http://127.0.0.1:4173`
   - Login page: `http://127.0.0.1:4173/auth`
   - Backend API: `http://127.0.0.1:54321`
   - Supabase Studio: `http://127.0.0.1:54323`

## Manual Test Accounts

| Role | Email | Password |
| --- | --- | --- |
| System Administrator | `local-admin@accredicore.local` | `LocalAdmin123!` |
| Quality Manager | `quality-manager@accredicore.local` | `QualityManager123!` |
| Department Manager | `dept-manager@accredicore.local` | `DeptManager123!` |
| Team Leader | `team-leader@accredicore.local` | `TeamLead123!` |
| Staff User | `staff-user@accredicore.local` | `StaffUser123!` |

## Quick Smoke Path

1. Login as `local-admin@accredicore.local`.
2. Open `Policy Library`.
3. Confirm approved policies show both `Governance` and `Attestation` actions.
4. Open the bell icon in the header and confirm notifications are visible.
5. Open `Incident Reporting` and confirm the list loads.
6. Open `Task Management` and confirm the page loads without errors.
7. Open `Admin Panel > Audit Logs` and confirm recent audit entries are visible.

## Browser Test Flow By Role

### 1. System Administrator

1. Login with `local-admin@accredicore.local`.
2. Open `Policy Library`.
3. Pick an approved policy and click `Attestation`.
4. Assign acknowledgment to `staff-user@accredicore.local` with a due date and instructions.
5. Verify the dialog now shows a new pending attestation row.
6. Click the bell icon in the header.
7. Confirm you can see policy approval and attestation notifications relevant to the administrator.
8. Open `Admin Panel > Audit Logs`.
9. Confirm there is a new `INSERT` or `UPDATE` entry for `policy_attestations` or `notifications`.

### 2. Team Leader

1. Logout and login with `team-leader@accredicore.local`.
2. Open `Policy Library`.
3. Create a new draft policy using `Add New Policy`.
4. Open `Governance` for that new policy.
5. Enter a short change summary.
6. Click `Submit For Approval`.
7. Confirm the approval chain appears with `Super User Review` in `pending` status.
8. Click `Approve` for the first stage.
9. Open the bell icon.
10. Confirm you can see a notification showing the first approval stage activity.

### 3. Department Manager

1. Logout and login with `dept-manager@accredicore.local`.
2. Open the bell icon immediately after the Team Leader completes stage 1.
3. Confirm a notification exists telling you the policy is ready for department approval.
4. Open the same policy in `Policy Library > Governance`.
5. Confirm `Department Manager Approval` is in `pending` status.
6. Click `Approve`.
7. Re-open the bell icon and confirm your notification list updates.

### 4. Quality Manager

1. Logout and login with `quality-manager@accredicore.local`.
2. Open `Policy Library`.
3. Confirm you can view approved policies and open `Governance`.
4. Open the bell icon and verify only your own notifications are visible.
5. Open `Admin Panel > Audit Logs`.
6. Confirm recent policy workflow actions are visible.

### 5. Staff User

1. Logout and login with `staff-user@accredicore.local`.
2. Open the bell icon.
3. Confirm you have a notification asking you to acknowledge a policy.
4. Open `Policy Library`.
5. Open the same approved policy and click `Attestation`.
6. Confirm the dialog shows a pending acknowledgment assigned to your account.
7. Add optional acknowledgment notes.
8. Click `Acknowledge Policy`.
9. Confirm the status changes from `pending` to `acknowledged`.
10. Re-open the bell icon and confirm the pending reminder is no longer unread after you mark it read.

## Scenario-Based Manual Flows

### Scenario A: Accreditation Preparation

1. Login as Team Leader.
2. Create or edit a policy.
3. Submit it for approval.
4. Approve stage 1 as Team Leader.
5. Login as Department Manager and approve stage 2.
6. Login as System Administrator and approve stage 3.
7. Login back as System Administrator and request staff acknowledgment.
8. Login as Staff User and acknowledge the approved policy.
9. Login as System Administrator and confirm the acknowledgment is recorded in both the dialog and audit logs.

### Scenario B: Incident Flow

1. Login as Staff User.
2. Open `Incident Reporting`.
3. Create a new incident with summary, severity, and details.
4. Confirm the new incident appears in the incident list.
5. Login as Department Manager or System Administrator.
6. Open the incident record.
7. Add investigation notes, RCA, and action plans.
8. Move the action plan through approval and completion.
9. Confirm the incident can be closed.
10. Open `Admin Panel > Audit Logs` and confirm incident updates were recorded.

### Scenario C: Policy Update, Archive, Redistribution, Acknowledgment

1. Login as Team Leader or Department Manager.
2. Open an approved policy.
3. Click `Governance`.
4. Click `Archive Current Version`.
5. Edit the policy content and submit for approval again.
6. Complete the approval chain through all three roles.
7. Login as System Administrator and request acknowledgment from Staff User.
8. Login as Staff User and acknowledge the updated policy.
9. Return to the policy and confirm:
   - version history contains the archived version
   - approval chain shows completed stages
   - attestation history shows the staff acknowledgment
   - audit logs contain the policy, approval, and attestation events

## What Must Be Checked In The Browser

1. No blank pages or stuck loading states.
2. No `401`, `403`, or `500` errors for allowed flows.
3. Notification Center only shows notifications for the logged-in user.
4. Approval chain progresses in sequence: Team Leader -> Department Manager -> System Administrator.
5. Attestation can only be requested for approved policies.
6. Staff can acknowledge only records assigned to their own account.
7. Audit Logs show recent policy, incident, and acknowledgment events.
8. Role restrictions still hold:
   - staff cannot create teams
   - staff cannot edit governance steps
   - staff can acknowledge assigned policies
