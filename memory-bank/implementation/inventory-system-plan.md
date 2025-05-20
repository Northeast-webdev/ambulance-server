# Inventory System Implementation Plan

## Current State Analysis

### Data Models

- **InventoryItem**: Defines inventory items with fields: name, description, unit, minimum_quantity, type (material/car), category, subcategory
- **CarInventory**: Tracks vehicle-specific inventory with fields: car (ref), item (ref), quantity, updated_by, last_updated
- **CarChecklist** and **MaterialChecklist**: Both reference inventory items

### Current Implementation

- When a new car is created, `initializeCarInventory()` creates inventory entries for all items
- Checklists already update inventory quantities after completion, but the implementation needs to be improved
- Inventory updates are currently handled in the checklist controllers

## Requirements

1. Each vehicle has an inventory with items that are present in both checklists
2. When a checklist is compiled, inventory items' quantities should be automatically updated
3. The inventory quantities are overwritten by the quantities from the compiled checklist

## Implementation Steps

### 1. Service Layer for Inventory Management

Create an `InventoryService` to encapsulate inventory logic:

```javascript
class InventoryService {
  // Update inventory based on checklist
  static async updateFromChecklist(carId, items) {
    // Implementation...
  }

  // Get low inventory items
  static async getLowInventoryItems(carId) {
    // Implementation...
  }

  // Other inventory operations...
}
```

### 2. Update Checklist Controllers

Modify `materialChecklistController.js` and `carChecklistController.js` to use the new service:

```javascript
// After checklist is saved
await InventoryService.updateFromChecklist(carId, checklistItems);
```

### 3. Validation Improvements

Add validation to ensure inventory quantity changes make sense:

```javascript
// Within the InventoryService
static validateQuantityChange(item, newQuantity) {
  // Business rules for validation
}
```

### 4. UI Enhancements

1. **Inventory Status Dashboard**: Create a visual indicator of inventory status
2. **Low Inventory Alerts**: Highlight items below minimum quantities
3. **Checklist Integration**: Show current inventory quantities while filling checklists

### 5. Notifications

Add WebSocket notifications for inventory changes:

```javascript
// After inventory update
fastify.websocketService.publish("inventory", {
  action: "updated",
  carId,
  lowItems: lowInventoryItems,
});
```

## Testing Plan

1. **Unit Tests**:

   - Test InventoryService methods
   - Test validation logic

2. **Integration Tests**:

   - Test checklist submission → inventory update flow
   - Test inventory initialization for new vehicles

3. **UI Tests**:
   - Test inventory status displays
   - Test alerts for low inventory

## Timeline

1. **Week 1**: Implement InventoryService and update controllers
2. **Week 2**: Add validation and UI enhancements
3. **Week 3**: Implement notifications and testing
