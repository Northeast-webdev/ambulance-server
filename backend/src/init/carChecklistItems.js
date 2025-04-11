const { InventoryItem } = require("../schema/inventory.schema");

const carChecklistItems = [
  {
    category: "VEICOLO",
    items: [
      { name: "Estintore", minimum_quantity: 1 },
      { name: "Triangolo", minimum_quantity: 1 },
      { name: "Giubbotto riflettente", minimum_quantity: 2 },
      { name: "Cozzale", minimum_quantity: 1 },
      { name: "Catenaccio", minimum_quantity: 1 },
      { name: "Cunei", minimum_quantity: 2 },
      { name: "Kit riparazione pneumatici", minimum_quantity: 1 },
      { name: "Ruota di scorta", minimum_quantity: 1 },
      { name: "Cavalletti", minimum_quantity: 2 },
      { name: "Cric", minimum_quantity: 1 },
      { name: "Chiave per ruote", minimum_quantity: 1 },
      { name: "Chiave per batteria", minimum_quantity: 1 },
      { name: "Cavi di emergenza", minimum_quantity: 1 },
      { name: "Lampada di emergenza", minimum_quantity: 1 },
      { name: "Torcia", minimum_quantity: 1 },
      { name: "Radio portatile", minimum_quantity: 1 },
      { name: "Batterie di riserva", minimum_quantity: 1 },
      { name: "Caricabatterie", minimum_quantity: 1 },
      { name: "Carta stradale", minimum_quantity: 1 },
      { name: "Guanti monouso", minimum_quantity: 1 },
      { name: "Mascherine", minimum_quantity: 1 },
      { name: "Occhiali protettivi", minimum_quantity: 1 },
      { name: "Tuta protettiva", minimum_quantity: 1 },
      { name: "Sapone liquido", minimum_quantity: 1 },
      { name: "Gel disinfettante", minimum_quantity: 1 },
      { name: "Carta assorbente", minimum_quantity: 1 },
      { name: "Sacchetti per rifiuti", minimum_quantity: 1 },
      { name: "Documentazione veicolo", minimum_quantity: 1 },
      { name: "Documentazione conducente", minimum_quantity: 1 },
      { name: "Documentazione assicurativa", minimum_quantity: 1 },
      { name: "Documentazione tecnica", minimum_quantity: 1 },
      { name: "Documentazione sanitaria", minimum_quantity: 1 },
      { name: "Documentazione amministrativa", minimum_quantity: 1 },
      { name: "Documentazione contabile", minimum_quantity: 1 },
      { name: "Documentazione fiscale", minimum_quantity: 1 },
      { name: "Documentazione legale", minimum_quantity: 1 },
      { name: "Documentazione operativa", minimum_quantity: 1 },
      { name: "Documentazione di sicurezza", minimum_quantity: 1 },
      { name: "Documentazione di emergenza", minimum_quantity: 1 },
      { name: "Documentazione di manutenzione", minimum_quantity: 1 },
      { name: "Documentazione di revisione", minimum_quantity: 1 },
      { name: "Documentazione di controllo", minimum_quantity: 1 },
      { name: "Documentazione di verifica", minimum_quantity: 1 },
      { name: "Documentazione di ispezione", minimum_quantity: 1 },
      { name: "Documentazione di certificazione", minimum_quantity: 1 },
      { name: "Documentazione di autorizzazione", minimum_quantity: 1 },
      { name: "Documentazione di abilitazione", minimum_quantity: 1 },
      { name: "Documentazione di qualifica", minimum_quantity: 1 },
      { name: "Documentazione di formazione", minimum_quantity: 1 },
      { name: "Documentazione di addestramento", minimum_quantity: 1 },
      { name: "Documentazione di aggiornamento", minimum_quantity: 1 },
      { name: "Documentazione di valutazione", minimum_quantity: 1 },
      { name: "Documentazione di monitoraggio", minimum_quantity: 1 },
      { name: "Documentazione di controllo qualità", minimum_quantity: 1 },
      { name: "Documentazione di gestione", minimum_quantity: 1 },
      { name: "Documentazione di organizzazione", minimum_quantity: 1 },
      { name: "Documentazione di pianificazione", minimum_quantity: 1 },
      { name: "Documentazione di programmazione", minimum_quantity: 1 },
      { name: "Documentazione di coordinamento", minimum_quantity: 1 },
      { name: "Documentazione di comunicazione", minimum_quantity: 1 },
      { name: "Documentazione di informazione", minimum_quantity: 1 },
    ],
  },
];

async function initializeCarChecklistItems() {
  try {
    console.log("Initializing car checklist items...");

    // Process car checklist items
    for (const category of carChecklistItems) {
      for (const item of category.items) {
        await InventoryItem.findOneAndUpdate(
          { name: item.name },
          {
            ...item,
            category: category.category,
            type: "car",
          },
          { upsert: true, new: true }
        );
      }
    }

    console.log("Car checklist items initialized successfully");
  } catch (error) {
    console.error("Error initializing car checklist items:", error);
    throw error;
  }
}

module.exports = { initializeCarChecklistItems };
