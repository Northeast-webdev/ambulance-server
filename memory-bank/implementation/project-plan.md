# Ambulance Server Project Plan

## Current State Analysis

The application is a server for ambulance management with the following components:

- Backend: Node.js with Fastify
- Database: MongoDB
- Frontend: Svelte-based UI
- Authentication: JWT-based auth system

We've identified and fixed several architectural issues:

- Inconsistent service pattern implementation (see service-pattern-note.md)
- WebSocket service redundancy
- Environment variable handling issues

## High Priority Requirements

### 1. Inventory System

**Overview:**
Each ambulance vehicle needs an inventory management system that integrates with the existing checklists.

**Requirements:**

- Each vehicle has an inventory with items that are present in both checklists
- When a checklist is compiled, inventory items' quantities should be automatically updated
- The inventory quantities are overwritten by the quantities from the compiled checklist

**Implementation Plan:**

1. Analyze existing inventory and checklist data models
2. Create/modify API endpoints for inventory updates
3. Implement checklist-to-inventory synchronization logic
4. Update frontend to display current inventory status
5. Add validation to ensure inventory items match checklist items

### 2. Shift Assignment System

**Overview:**
A shift management system for admin users to assign shifts to staff.

**Requirements:**

- Admin interface with calendar-like layout for shift assignments
- Ability to assign shifts to users (or vehicles, to be determined)
- 15-minute notifications before shift starts (with adjustable timing)
- Record shift data including:
  - Start/end times
  - User role during shift (doctor, nurse, driver)

**Implementation Plan:**

1. Design shift data model
2. Create shift assignment API endpoints
3. Implement notification system using WebSockets
4. Build admin calendar interface
5. Add user shift dashboard
6. Create reporting for shift analytics

## Technical Debt and Improvements

1. **Service Pattern Standardization**

   - Further standardize service patterns across the application
   - Consider implementing a proper dependency injection system

2. **Testing**

   - Add unit tests for critical components
   - Implement integration tests for inventory and shift systems

3. **Documentation**

   - Create comprehensive API documentation
   - Document service patterns for future developers

4. **Security**
   - Audit authentication and authorization implementations
   - Ensure proper input validation and sanitization

## Implementation Timeline

### Phase 1: Foundation (Current)

- ✅ Fix service pattern inconsistencies
- ✅ Streamline WebSocket implementation
- ✅ Fix environment configuration

### Phase 2: Inventory System

- Design inventory update mechanism
- Implement synchronization with checklists
- Create frontend components for inventory management

### Phase 3: Shift Management

- Implement shift assignment API
- Create notification system
- Build admin calendar interface

### Phase 4: Quality Improvements

- Add comprehensive testing
- Enhance documentation
- Review and optimize performance
