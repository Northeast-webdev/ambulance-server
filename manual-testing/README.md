# CROCE DEMO - Manual Testing Instructions

This document provides step-by-step instructions for manual testing of the CROCE DEMO features. Use this as a checklist and reference during your testing sessions.

---

## 1. Run Management

### 1.1 Creating a Run

- Navigate to the admin panel.
- Go to the Runs section.
- Click on "Create Run" or equivalent button.
- Fill in the required details (date, time, vehicle, etc.).
- Save the run and verify it appears in the list.

### 1.2 Modifying a Run

- Select an existing run from the list.
- Click "Edit" or equivalent.
- Change one or more fields (e.g., time, vehicle).
- Save changes and verify updates are reflected.

### 1.3 Assigning a Run Directly to a User

- Open a run that is unassigned.
- Use the assignment feature to select a user.
- Confirm the assignment and verify the user is notified.

### 1.4 Assigning a Programmed Run to a User

- Locate a programmed (recurring) run.
- Assign it to a user as above.
- Verify the assignment and notification.

### 1.5 Accepting the Run

- Log in as the assigned user (app side).
- View the assigned run.
- Accept the run and verify status update.

### 1.6 Completing the Run

- As the assigned user, mark the run as completed.
- Confirm completion is reflected in admin and user views.

### 1.7 Refusing the Run

- As the assigned user, refuse the run.
- Confirm refusal is reflected in admin and user views.

### 1.8 Cancelling the Run (Admin Side)

- As admin, select a run and cancel it.
- Verify cancellation is reflected for all users.

### 1.9 Resending the Run Reminder After Timeout

- Wait for the reminder timeout period to elapse.
- As admin, resend the reminder.
- Verify the user receives the new notification.

### 1.10 Max Number of Run Reminders & Forced Cancel

- Trigger reminders until the max is reached.
- Confirm the run is cancelled for the user.
- Verify the run is reassigned to another user and notification is sent.

### 1.11 Push Notifications

- For each action above, verify the correct push notification is displayed on the app and admin sides.

---

## 2. Location Tracking & Sync

### 2.1 Location Tracking

- Start a run as a user.
- Move with the device and verify location is tracked in real-time.

### 2.2 Location Sync (Admin/App)

- As admin, view the user's location during a run.
- Confirm location updates are synced between admin and app.

---

## 3. Checklists & Inventory

### 3.1 Car Checklist Compilation

- Start a car checklist for a vehicle.
- Complete and submit the checklist.
- Verify data is saved and visible in admin.

### 3.2 Material Checklist Compilation

- Start a material checklist for a vehicle.
- Complete and submit the checklist.
- Verify data is saved and visible in admin.

### 3.3 Inventory Update from Checklists

- After submitting checklists, verify inventory values are updated for the vehicle.

---

## 4. Shift Management

### 4.1 Shift Creation

- As admin, create a new shift.
- Verify it appears in the shift list.

### 4.2 Shift Modification

- Edit an existing shift.
- Save changes and verify updates.

### 4.3 Shift Fetching (App Side)

- Log in as a user on the app.
- Fetch and view assigned shifts.

### 4.4 Active Shift Banner on Home (App Side)

- Start a shift as a user.
- Verify the active shift banner appears on the home screen.

### 4.5 Complete Shift via Banner

- Use the banner to complete the shift.
- Confirm completion is reflected in admin and app.

### 4.6 See Time Left on Banner

- During an active shift, verify the time left is displayed on the banner.

### 4.7 List Shifts on Shifts Page (App/Admin)

- Go to the shifts page on both app and admin.
- Verify all shifts are listed.

### 4.8 Calendar/List View for Shifts (App/Admin)

- Switch between calendar and list views for shifts.
- Confirm both views display correct data.

---

## 5. General / Usability

### 5.1 Login/Logout Flow

- Test login with valid credentials (admin and user).
- Test login with invalid credentials and confirm error message.
- Test logout and ensure session is cleared and user is redirected appropriately.

### 5.2 Role-Based Access

- Log in as a regular user and as an admin.
- Verify each role only sees features they are permitted to access.
- Attempt restricted actions as a regular user and confirm access is denied.

### 5.3 Error Handling & Validation

- Submit forms with missing or invalid data (e.g., empty required fields, invalid dates).
- Confirm appropriate error messages are shown and no data is saved.

### 5.4 UI Responsiveness

- Test the app on different screen sizes (desktop, tablet, mobile).
- Ensure all UI elements are accessible and usable.

### 5.5 Data Persistence

- Refresh the page or log out/in and confirm that all changes (runs, shifts, checklists) persist as expected.

---

## 6. Performance

### 6.1 Large Data Sets

- Populate the system with a large number of runs, shifts, or checklists (if possible).
- Verify that the application remains responsive and UI performance is acceptable.
- Confirm that lists, filters, and searches work efficiently with large data sets.

---

## Notes

- For each step, take screenshots or notes of any issues encountered.
- Confirm all notifications, UI updates, and data changes are correct.
- If a step fails, document the observed behavior and any error messages.
