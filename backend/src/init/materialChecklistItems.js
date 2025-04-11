const { InventoryItem } = require("../schema/inventory.schema");

const mainTableItems = [
  {
    category: "VANO SANITARIO",
    items: [
      { name: "Sedia portantina", minimum_quantity: 1 },
      { name: "Barella autocaricante", minimum_quantity: 1 },
      { name: "Materasso a depressione", minimum_quantity: 1 },
      { name: "Pompa per materasso a depressione", minimum_quantity: 1 },
      { name: "Telo portaferiti", minimum_quantity: 1 },
      { name: "Lenzuola monouso", minimum_quantity: 5 },
      { name: "Coperte", minimum_quantity: 2 },
      { name: "Cuscino", minimum_quantity: 1 },
      { name: "Padella", minimum_quantity: 1 },
      { name: "Pappagallo", minimum_quantity: 1 },
      { name: "Arcella", minimum_quantity: 2 },
      { name: "Sacchetti rifiuti", minimum_quantity: 5 },
    ],
  },
  {
    category: "ZAINO EMERGENZA",
    subcategory: "Rianimazione",
    items: [
      { name: "Ambu adulti", minimum_quantity: 1 },
      { name: "Ambu pediatrico", minimum_quantity: 1 },
      { name: "Maschere ambu (tutte le misure)", minimum_quantity: 1 },
      { name: "Mascherine O2 adulti", minimum_quantity: 2 },
      { name: "Mascherine O2 pediatriche", minimum_quantity: 2 },
      { name: "Occhialini O2", minimum_quantity: 2 },
      { name: "Guedel (tutte le misure)", minimum_quantity: 1 },
    ],
  },
];

const traumaTableItems = [
  {
    category: "TRAUMA",
    items: [
      { name: "Tavola Spinale", minimum_quantity: 1 },
      { name: "Barella Scoop EXL", minimum_quantity: 1 },
      { name: "Ragno", minimum_quantity: 1 },
      { name: "Fermacapo", minimum_quantity: 1 },
      { name: "Cinture tavola spinale", minimum_quantity: 3 },
      { name: "KED", minimum_quantity: 1 },
      { name: "Steccobende", minimum_quantity: 4 },
      { name: "Collari cervicali", minimum_quantity: 2 },
    ],
  },
];

async function initializeMaterialChecklistItems() {
  try {
    console.log("Initializing material checklist items...");

    // Process main table items
    for (const category of mainTableItems) {
      for (const item of category.items) {
        await InventoryItem.findOneAndUpdate(
          { name: item.name },
          {
            ...item,
            category: category.category,
            subcategory: category.subcategory || "Generale",
            type: "material",
          },
          { upsert: true, new: true }
        );
      }
    }

    // Process trauma table items
    for (const category of traumaTableItems) {
      for (const item of category.items) {
        await InventoryItem.findOneAndUpdate(
          { name: item.name },
          {
            ...item,
            category: category.category,
            subcategory: category.subcategory || "Generale",
            type: "material",
          },
          { upsert: true, new: true }
        );
      }
    }

    console.log("Material checklist items initialized successfully");
  } catch (error) {
    console.error("Error initializing material checklist items:", error);
    throw error;
  }
}

module.exports = { initializeMaterialChecklistItems };
