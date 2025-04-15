const { InventoryItem } = require("../schema/inventory.schema");

const mainTableItems = [
  {
    category: "VANO SANITARIO",
    items: [
      { name: "Sedia portantina", minimum_quantity: 1 },
      { name: "Barella autocaricante", minimum_quantity: 1 },
      { name: "Telo portaferiti", minimum_quantity: 1 },
      { name: "Lenzuola di riserva", minimum_quantity: 2 },
      { name: "Guanti S", minimum_quantity: 5 },
      { name: "Guanti M", minimum_quantity: 5 },
      { name: "Guanti L", minimum_quantity: 5 },
      { name: "Mascherine chirurgiche", minimum_quantity: 5 },
      { name: "DAE (controllare spia lampeggiante)", minimum_quantity: 1 },
      { name: "Piastre DAE", minimum_quantity: 1 },
      { name: "Tricotomi + garze", minimum_quantity: 1 },
      {
        name: "Aspiratore + tubo + sondino aspirazione rigido (controllare se funzionante staccato dalla piastra)",
        minimum_quantity: 1,
      },
      { name: "Sondino aspirazione verde 14 Ch", minimum_quantity: 1 },
      { name: "Sondino aspirazione bianco 12 Ch", minimum_quantity: 1 },
    ],
  },
  {
    category: "Rianimazione - Vano Sanitario",
    items: [
      { name: "Piastre DAE riserva", minimum_quantity: 1 },
      { name: "Ambu con reservoir (e tubo ossigeno)", minimum_quantity: 1 },
      { name: "Mascherina ambu adulto mis 5", minimum_quantity: 1 },
      { name: "Mascherina ambu adulto mis 4", minimum_quantity: 1 },
      { name: "Filtro ambu", minimum_quantity: 1 },
      { name: "Sacchetto aspiratore riserva", minimum_quantity: 1 },
      { name: "Tubo aspiratore riserva", minimum_quantity: 1 },
      { name: "Cannula di Guedel rossa", minimum_quantity: 1 },
      { name: "Cannula di Guedel gialla", minimum_quantity: 1 },
      { name: "Cannula di Guedel verde", minimum_quantity: 1 },
      { name: "Cannula di Guedel bianca", minimum_quantity: 1 },
      { name: "Cannula di Guedel nera", minimum_quantity: 1 },
      { name: "Cannula di Guedel azzurra", minimum_quantity: 1 },
      { name: "Sondino aspirazione rigido", minimum_quantity: 1 },
      { name: "KIT infettivi con sigillo integro", minimum_quantity: 1 },
      { name: "KIT parto con sigillo integro", minimum_quantity: 1 },
      { name: "Caschetti", minimum_quantity: 3 },
      { name: "Cartellina maxi-emergenza", minimum_quantity: 1 },
      { name: "Alcool", minimum_quantity: 1 },
      { name: "Rotolo di carta", minimum_quantity: 1 },
      { name: "Sacchetti spazzatura", minimum_quantity: 5 },
    ],
  },
];

const traumaTableItems = [
  {
    category: "VANO SANITARIO",
    subcategory: "TRAUMA",
    items: [
      {
        name: "Tavola Spinale (con pianale per fermacapo)",
        minimum_quantity: 1,
      },
      { name: "Barella Scoop EXL", minimum_quantity: 1 },
      { name: "KED", minimum_quantity: 1 },
      {
        name: "Tavola Spinale pediatrica (con pianale per fermacapo)",
        minimum_quantity: 1,
      },
      { name: "Fermacapo spinale pediatrica", minimum_quantity: 1 },
      { name: "Ragno pediatrico", minimum_quantity: 1 },
      { name: "Materassino a depressione", minimum_quantity: 1 },
      { name: "Pompa materassino a depressione", minimum_quantity: 1 },
      { name: "Collare 1", minimum_quantity: 1 },
      { name: "Collare 2", minimum_quantity: 1 },
      { name: "Collare 3", minimum_quantity: 1 },
      { name: "Collare 4", minimum_quantity: 1 },
      { name: "Collare 5", minimum_quantity: 1 },
      { name: "Collare 6", minimum_quantity: 1 },
    ],
  },
  {
    category: "Zaino trauma",
    items: [
      { name: "Ragno", minimum_quantity: 1 },
      { name: "Fermacapo adulto (coppia)", minimum_quantity: 1 },
      { name: "Cinghiette mento/fronte per spinale", minimum_quantity: 2 },
      { name: "Fermacapo per scoop (coppia) + base", minimum_quantity: 1 },
      { name: "Cinghiette mento/fronte per scoop", minimum_quantity: 2 },
      { name: "Cinghia ad H per scoop", minimum_quantity: 1 },
      { name: "Cinghie con gancio", minimum_quantity: 4 },
      { name: "Collare 3", minimum_quantity: 1 },
      { name: "Collare 4", minimum_quantity: 1 },
      { name: "Cinghie", minimum_quantity: 2 },
    ],
  },
  {
    category: "Sacca steccobende",
    items: [
      { name: "Steccobenda rigida gamba lunga", minimum_quantity: 1 },
      { name: "Steccobenda gamba", minimum_quantity: 1 },
      { name: "Steccobenda braccio", minimum_quantity: 1 },
      { name: "Steccobenda gomito", minimum_quantity: 1 },
      { name: "Steccobenda braccio corto", minimum_quantity: 1 },
      { name: "Steccobenda polso", minimum_quantity: 1 },
    ],
  },
];

const oxygenTableItems = [
  {
    category: "OSSIGENO-TERAPIA",
    items: [
      { name: "Bombola fissa 1", minimum_quantity: 1 },
      { name: "Bombola fissa 2", minimum_quantity: 1 },
      { name: "Bombolino portatile", minimum_quantity: 1 },
      { name: "Bombolino di riserva", minimum_quantity: 1 },
      { name: "Maschera O2 adulto con reservoir", minimum_quantity: 1 },
    ],
  },
];

const borsaTableItems = [
  {
    category: "Tasca anteriore",
    subcategory: "BORSA SOCCORSO",
    items: [
      { name: "Pulsiossimetro (prova accensione)", minimum_quantity: 1 },
      { name: "Fonendoscopio", minimum_quantity: 1 },
      { name: "Sfigmomanometro", minimum_quantity: 1 },
      { name: "Termometro", minimum_quantity: 1 },
      { name: "Sacchetti vomito", minimum_quantity: 4 },
      { name: "Telino termico", minimum_quantity: 1 },
      { name: "Mascherine chirurgiche", minimum_quantity: 4 },
      { name: "Calzari (paia)", minimum_quantity: 2 },
    ],
  },
  {
    category: "Tasca laterale 1",
    subcategory: "BORSA SOCCORSO",
    items: [{ name: "Maschera O2 adulto con reservoir", minimum_quantity: 2 }],
  },
  {
    category: "Tasca laterale 2",
    subcategory: "BORSA SOCCORSO",
    items: [{ name: "Guanti L", minimum_quantity: 5 }],
  },
  {
    category: "Tasca posteriore",
    subcategory: "BORSA SOCCORSO",
    items: [
      { name: "Ambu pediatrico con reservoir", minimum_quantity: 1 },
      { name: "Mascherina ambu pediatrica mis 2", minimum_quantity: 1 },
      { name: "Mascherina ambu neonatale mis 0", minimum_quantity: 1 },
      {
        name: "Cannule di Guedel (bianca, nera, azzurra)",
        minimum_quantity: 3,
      },
      { name: "Maschera O2 pediatrica con reservoir", minimum_quantity: 1 },
      { name: "Sonda saturimetro pediatrico", minimum_quantity: 1 },
      { name: "Sfigmomanometro pediatrico", minimum_quantity: 1 },
    ],
  },
  {
    category: "Interno",
    subcategory: "BORSA SOCCORSO",
    items: [
      { name: "Ambu con reservoir (e tubo ossigeno)", minimum_quantity: 1 },
      { name: "Mascherina ambu adulto mis 5", minimum_quantity: 1 },
      { name: "Mascherina ambu adulto mis 4", minimum_quantity: 1 },
      { name: "Filtro ambu", minimum_quantity: 1 },
      { name: "Ghiacco", minimum_quantity: 3 },
      { name: "Fisiologica", minimum_quantity: 8 },
      { name: "Garze non sterili", minimum_quantity: 10 },
    ],
  },
  {
    category: "Sacca sondini/cannule",
    subcategory: "BORSA SOCCORSO",
    items: [
      { name: "Sondino aspirazione rigido", minimum_quantity: 1 },
      { name: "Sondino aspirazione verde 14 Ch", minimum_quantity: 2 },
      { name: "Sondino aspirazione bianco 12 Ch", minimum_quantity: 2 },
      { name: "Cannule di Guedel (rossa, gialla, verde)", minimum_quantity: 3 },
    ],
  },
  {
    category: "Sacca medicazione",
    subcategory: "BORSA SOCCORSO",
    items: [
      { name: "Garze sterili", minimum_quantity: 6 },
      { name: "Telino sterile", minimum_quantity: 2 },
      { name: "Selfix piccolo (4m x 8cm)", minimum_quantity: 3 },
      { name: "Selfix grande", minimum_quantity: 1 },
      { name: "Nastro adesivo", minimum_quantity: 1 },
      { name: "Forbici", minimum_quantity: 1 },
      { name: "Acqua ossigenata", minimum_quantity: 1 },
      { name: "Disinfettante", minimum_quantity: 1 },
    ],
  },
];

const cassettiTableItems = [
  {
    category: "Cassetti medicazione",
    subcategory: "CASSETTI",
    items: [
      { name: "Garze non sterili", minimum_quantity: 10 },
      { name: "Garze sterili", minimum_quantity: 8 },
      { name: "Selfix piccolo (4m x 8cm)", minimum_quantity: 3 },
      { name: "Selfix grande", minimum_quantity: 1 },
      { name: "Nastro adesivo", minimum_quantity: 1 },
      { name: "Forbici", minimum_quantity: 1 },
      { name: "Telino sterile", minimum_quantity: 3 },
      { name: "Sacchetti vomito", minimum_quantity: 5 },
      { name: "Fisiologica", minimum_quantity: 5 },
      { name: "Fisiologica 500 ml", minimum_quantity: 1 },
      { name: "Acqua ossigenata", minimum_quantity: 1 },
      { name: "Disinfettante", minimum_quantity: 1 },
      { name: "Contenitore taglienti", minimum_quantity: 1 },
      { name: "Ghiacco", minimum_quantity: 4 },
      { name: "Cerotto Medipore", minimum_quantity: 1 },
      { name: "Telino termico", minimum_quantity: 3 },
    ],
  },
  {
    category: "Cassetti medicazione",
    subcategory: "CASSETTI",
    items: [
      { name: "Maschera O2 adulto con reservoir", minimum_quantity: 4 },
      { name: "Maschera O2 pediatrica con reservoir", minimum_quantity: 2 },
    ],
  },
  {
    category: "Contenitore rifiuti",
    subcategory: "CASSETTI",
    items: [
      {
        name: "Contenitore rifiuti (verificare sacchetto)",
        minimum_quantity: 1,
      },
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

    // Process oxygen table items
    for (const category of oxygenTableItems) {
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

    // Process borsa table items
    for (const category of borsaTableItems) {
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

    // Process cassetti table items
    for (const category of cassettiTableItems) {
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
