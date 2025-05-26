# Croceverde - Manual Testing Instructions

This document provides step-by-step instructions for manual testing of the Croceverde features. Use this as a checklist and reference during your testing sessions.

---

## 1. Run Management

### 1.1 Creating a Run

- Navigate to the admin panel.
- Go to the Runs page.
- Click on "Create Run" or equivalent button.
- Fill in the required details (date, time, vehicle, etc.).
- Save the run and verify it appears in the list.

### 1.2 Modifying a Run

- Navigate to the admin panel.
- Go to the Patients page.
- Select a patient from the list.
- From the selected patient's section, select the run you want to modify.
- Click "Edit" or equivalent.
- Change one or more fields (e.g., time, vehicle).
- Save changes and verify updates are reflected.

### 1.3 Assigning a Run Directly to a User

- Navigate to the admin panel.
- Go to the Runs page.
- Open a run that is unassigned.
- Use the assignment feature to select a user.
- Confirm the assignment and verify the user is notified.

### 1.4 Assigning a Programmed Run to a User

- Navigate to the admin panel.
- Go to the Runs page.
- Locate a programmed (recurring) run.
- Assign it to a user as above.
- Verify the assignment and notification.

### 1.5 Accepting the Run

- Navigate to the app.
- Log in as the assigned user.
- Send the run to the user.
- Verify the run popup is displayed.
- Accept the run from the popup.
- Verify the run status is updated.

### 1.6 Completing the Run

- Navigate to the app.
- Log in as the assigned user.
- View the assigned run in the runs screen.
- Mark the run as completed.
- Confirm completion is reflected in admin and user views.

### 1.7 Refusing the Run

- Navigate to the app.
- Log in as the assigned user.
- Send the run to the user.
- Verify the run popup is displayed.
- Refuse the run from the popup.
- Confirm refusal is reflected in admin and user views.

### 1.8 Cancelling the Run (Admin Side)

- Navigate to the admin panel.
- Go to the Runs page.
- Select a run.
- Click "Cancel" or equivalent.
- Verify cancellation is reflected for all users.

### 1.9 Resending the Run Reminder After Timeout

- Navigate to the admin panel.
- Go to the Runs page.
- Select a run.
- Click "Remind driver" or equivalent.
- Verify the user receives the new notification.

### 1.10 Max Number of Run Reminders & Forced Cancel

- Navigate to the admin panel.
- Go to the Runs page.
- Select a run.
- Click "Remind driver" or equivalent.
- Trigger reminders until the max is reached.
- Confirm the run is cancelled for the user.
- Verify the run is reassigned to another user and notification is sent.

### 1.11 Push Notifications

- For each action above, verify the correct push notification is displayed on the app and admin sides.

---

## 2. Location Tracking & Sync

### 2.1 Location Tracking

- Navigate to the app.
- Log in as a user.
- Start a run.
- Move with the device and verify location is tracked in real-time.

### 2.2 Location Sync (Admin/App)

- Navigate to the admin panel.
- Go to the Runs page.
- Select a run.
- Confirm location updates are synced between admin and app.

---

## 3. Checklists & Inventory

### 3.1 Car Checklist Compilation

- Navigate to the app.
- Log in as a user.
- Start a car checklist for a vehicle.
- Complete and submit the checklist.
- Verify data is saved and visible in admin.

### 3.2 Material Checklist Compilation

- Navigate to the app.
- Log in as a user.
- Start a material checklist for a vehicle.
- Complete and submit the checklist.
- Verify data is saved and visible in admin.

### 3.3 Inventory Update from Checklists

- Navigate to the admin panel.
- Go to the Garage page.
- Select a vehicle.
- After submitting checklists, verify inventory values are updated for the vehicle.

---

## 4. Shift Management

### 4.1 Shift Creation

- Navigate to the admin panel.
- Go to the Shifts page.
- Click "Create Shift" or equivalent.
- Fill in the required details (date, time, vehicle).
- Save the shift and verify it appears in the list.

### 4.2 Shift Modification

- Navigate to the admin panel.
- Go to the Shifts page.
- Select a shift.
- Click "Edit" or equivalent.
- Change one or more fields (e.g., time, vehicle).
- Save changes and verify updates.

### 4.3 Shift Fetching (App Side)

- Navigate to the app.
- Log in as a user.
- Fetch and view assigned shifts.

### 4.4 Active Shift Banner on Home (App Side)

- Navigate to the app.
- Log in as a user.
- If there is an active shift, verify the active shift banner appears on the home screen.

### 4.5 Complete Shift via Banner

- Navigate to the app.
- Log in as a user.
- If there is an active shift, use the banner to complete the shift.
- Confirm completion is reflected in admin and app.

### 4.6 See Time Left on Banner

- Navigate to the app.
- Log in as a user.
- If there is an active shift, verify the time left is displayed on the banner.

### 4.7 List Shifts on Shifts Page (App/Admin)

- Navigate to the admin panel.
- Go to the Shifts page.
- Verify all shifts are listed.

### 4.8 Calendar/List View for Shifts (App/Admin)

- Navigate to the admin panel.
- Go to the Shifts page.
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
