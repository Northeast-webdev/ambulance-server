const { InventoryItem } = require("../schema/inventory.schema");

const labels = {
  luciPosizioneAnteriori: "Luci posizione anteriori",
  anabbaglianti: "Anabbaglianti",
  abbaglianti: "Abbaglianti",
  fendinebbia: "Fendinebbia",
  frecceAnteriori: "Frecce anteriori",
  luciPosizionePosteriori: "Luci posizione posteriori",
  luciStop: "Luci stop",
  luciRetromarcia: "Luci retromarcia",
  retronebbia: "Retronebbia",
  freccePosteriori: "Frecce posteriori",
  luceTarga: "Luce targa",
  lampeggianti: "Lampeggianti",
  strobo: "Strobo",
  fariAusiliari: "Fari ausiliari",
  sirene: "Sirene (no dopo le ore 22)",
  triangoloEmergenza: "Triangolo emergenza",
  torcia: "Torcia",
  kitSostituzionePneumatico: "Kit sostituzione pneumatico",
  kitAntiscasso: "Kit antiscasso",
  ruotaDiScorta: "Ruota di scorta",
  cateneDaNeve: "Catene da neve",
  documentiNecessari: "Documenti necessari",
};

const carChecklistItems = [
  {
    category: "VEICOLO",
    items: Object.entries(labels).map(([key, name]) => ({
      name: name,
      minimum_quantity: 1,
    })),
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
