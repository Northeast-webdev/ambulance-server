# Shift Assignment System Implementation Plan

## Current State Analysis

### Data Models

- **Shift**: Includes vehicle (ref), date, shift_start, shift_end, crew (with driver, doctor, nurse sub-objects), status, notes
- **Car**: Contains shift_start and shift_end fields
- **User**: No explicit shift-related fields currently

### Current Implementation

- Basic shift CRUD operations exist in `shiftController.js`
- The system tracks shift status (scheduled, in_progress, completed, cancelled)
- Some logic exists to update shift status based on time

## Requirements

1. Admin interface with calendar-like layout for shift assignments
2. Ability to assign shifts to users (or vehicles)
3. 15-minute notifications before shift starts (with adjustable timing)
4. Record shift data including:
   - Start/end times
   - User role during shift (doctor, nurse, driver)

## Implementation Steps

### 1. Enhanced Shift Service Layer

Create a `ShiftService` to encapsulate shift management logic:

```javascript
class ShiftService {
  // Create a new shift with notifications
  static async createShift(shiftData) {
    // Create shift and schedule notifications
  }

  // Schedule notifications for a shift
  static async scheduleNotifications(shiftId, notifyMinutesBefore = 15) {
    // Implementation...
  }

  // Send notifications to crew members
  static async notifyCrewMembers(shiftId) {
    // Implementation...
  }

  // Handle shift status transitions
  static async updateShiftStatus(shiftId, newStatus) {
    // Implementation...
  }
}
```

### 2. Notification System

Create a notification system using WebSockets and possibly email/SMS:

```javascript
class NotificationService {
  // Schedule a notification
  static async scheduleNotification(userId, message, scheduledTime) {
    // Implementation...
  }

  // Send a real-time notification via WebSocket
  static async sendWebSocketNotification(userId, notification) {
    // Implementation...
  }
}
```

### 3. Scheduler System

Implement a job scheduler for shift notifications:

```javascript
// Using existing fastify-cron
fastify.register(require("fastify-cron"), {
  jobs: [
    {
      name: "processShiftNotifications",
      cronTime: "* * * * *", // Every minute
      onTick: async () => {
        await ShiftService.processScheduledNotifications();
      },
    },
  ],
});
```

### 4. API Endpoints

Extend the existing shift API endpoints:

1. **Calendar View Endpoints**:

   ```
   GET /api/shifts/calendar?year=2023&month=5
   ```

2. **User Assignment Endpoints**:

   ```
   POST /api/shifts/:id/assign
   ```

3. **Notification Settings**:
   ```
   POST /api/users/:id/notification-settings
   ```

### 5. Admin Calendar UI

1. **Calendar Component**: Monthly/weekly view with drag-and-drop capabilities
2. **Shift Assignment Form**: Form for assigning users to roles
3. **Shift Status Dashboard**: Overview of active and upcoming shifts

### 6. User Notifications

1. **Notification Center**: UI component for users to see shift notifications
2. **Shift Details View**: UI for viewing assigned shifts and details
3. **Notification Preferences**: Allow users to customize notification timing

## Testing Plan

1. **Unit Tests**:

   - Test ShiftService methods
   - Test notification scheduling and delivery

2. **Integration Tests**:

   - Test end-to-end shift creation and notification flow
   - Test shift status transitions

3. **UI Tests**:
   - Test calendar interactions
   - Test notification displays

## Timeline

1. **Week 1**: Implement ShiftService and NotificationService
2. **Week 2**: Create scheduler system and extend API endpoints
3. **Week 3**: Develop admin calendar UI components
4. **Week 4**: Implement user notification interface and testing
