export const TABLES = [
  { id: 1, label: "Table 1" },
  { id: 2, label: "Table 2" },
  { id: 3, label: "Table 3" },
  { id: 4, label: "Table 4" },
  { id: "MUT", label: "MUT" },
  { id: 10, label: "Table 10" },
  { id: 11, label: "Table 11" },
  { id: 12, label: "Table 12" },
  { id: 13, label: "Table 13" },
  { id: 14, label: "Table 14" },
  { id: 15, label: "Table 15" },
];

export const MENU = {
  Food: [
    // Cheese & Charcuterie
    { id: "f1", name: "Small Cheese Plate", price: 10, subcategory: "cheese" },
    { id: "f2", name: "Cheese Plate", price: 11, subcategory: "cheese" },
    { id: "f4", name: "Charcuterie Plate", price: 11, subcategory: "cheese" },
    { id: "f5", name: "Mixed Plate", price: 25, subcategory: "cheese" },
    { id: "f29", name: "Charcuterie dazu", price: 6.5, subcategory: "cheese" },
    // Hot Dishes
    { id: "f6", name: "Marcelin Chaud", price: 9, subcategory: "warm" },
    { id: "f7", name: "Camembert Rôti", price: 17, subcategory: "warm" },
    { id: "f8", name: "Mont d'Or", price: 29, subcategory: "warm" },
    { id: "f9", name: "Tartiflette", price: 15, subcategory: "warm" },
    { id: "f10", name: "Tartiflette + Speck", price: 17, subcategory: "warm" },
    { id: "f11", name: "Raclette", price: 28, subcategory: "warm" },
    { id: "f12", name: "Fondue", price: 28, subcategory: "warm" },
    { id: "f28", name: "Fondue Alkoholfrei", price: 28, subcategory: "warm" },
    // Salads
    { id: "f13", name: "Seguin", price: 12.5, subcategory: "salads" },
    { id: "f21", name: "Seguin + Speck", price: 14.5, subcategory: "salads" },
    { id: "f14", name: "Papillon", price: 13.5, subcategory: "salads" },
    { id: "f22", name: "Papillon + Serrano", price: 15.5, subcategory: "salads" },
    { id: "f15", name: "Bauern", price: 12.5, subcategory: "salads" },
    { id: "f23", name: "Bauern + Kartoffeln", price: 15, subcategory: "salads" },
    { id: "f16", name: "Porthos", price: 13, subcategory: "salads" },
    { id: "f24", name: "Porthos + Serrano", price: 15, subcategory: "salads" },
    { id: "f17", name: "Basic", price: 7, subcategory: "salads" },
    // Dessert
    { id: "f18", name: "Tarte Tatin", price: 7, subcategory: "snacks" },
    { id: "f27", name: "Tarte Tatin + Calvados", price: 10, subcategory: "snacks" },
    { id: "f19", name: "Olives", price: 3, subcategory: "snacks" },
    { id: "f20", name: "Olives + Grissini", price: 5.5, subcategory: "snacks" },
    { id: "f26", name: "Cornichons", price: 2.5, subcategory: "snacks" },
  ],
  "Drinks🍷": [
    // Wines by Glass - White WITH SIZE VARIANTS
    {
      id: "wg1",
      name: "Picpoul de Pinet",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3.5, label: "0,1" },
        { type: "large", price: 6.5, label: "0,2" }
      ]
    },
    {
      id: "wg2",
      name: "Sauvignon Blanc",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3.5, label: "0,1" },
        { type: "large", price: 7, label: "0,2" }
      ]
    },
    {
      id: "wg3",
      name: "Grauburgunder",
      subcategory: "wine",
      variants: [
        { type: "small", price: 4, label: "0,1" },
        { type: "large", price: 7.5, label: "0,2" }
      ]
    },
    {
      id: "wg4",
      name: "Brise-Marine",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3.5, label: "0,1" },
        { type: "large", price: 7, label: "0,2" }
      ]
    },
    {
      id: "wg5",
      name: "Divin Sauvignon Blanc",
      subcategory: "wine",
      variants: [
        { type: "small", price: 4, label: "0,1" },
        { type: "large", price: 7.5, label: "0,2" }
      ]
    },
    // Wines by Glass - Sparkling WITH SIZE VARIANTS
    {
      id: "wg6",
      name: "Cidre",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3, label: "0,1" },
        { type: "large", price: 6, label: "0,2" }
      ]
    },
    {
      id: "wg7",
      name: "Sekt",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3.5, label: "0,1" },
        { type: "large", price: 7, label: "0,2" }
      ]
    },
    {
      id: "wg8",
      name: "PetNat",
      subcategory: "wine",
      variants: [
        { type: "small", price: 4, label: "0,1" },
        { type: "large", price: 8, label: "0,2" }
      ]
    },
    // Wines by Glass - Red WITH SIZE VARIANTS
    {
      id: "wg9",
      name: "Montepulciano D'Abruzzo",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3.5, label: "0,1" },
        { type: "large", price: 6.5, label: "0,2" }
      ]
    },
    {
      id: "wg10",
      name: "Gamay",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3.5, label: "0,1" },
        { type: "large", price: 7, label: "0,2" }
      ]
    },
    {
      id: "wg11",
      name: "Carignan",
      subcategory: "wine",
      variants: [
        { type: "small", price: 4, label: "0,1" },
        { type: "large", price: 8, label: "0,2" }
      ]
    },
    // Wines by Glass - Other WITH SIZE VARIANTS
    {
      id: "wg12",
      name: "Yellow Muskat",
      subcategory: "wine",
      variants: [
        { type: "small", price: 4.5, label: "0,1" },
        { type: "large", price: 9, label: "0,2" }
      ]
    },
    {
      id: "wg13",
      name: "Cuvée des Galets",
      subcategory: "wine",
      variants: [
        { type: "small", price: 4.5, label: "0,1" },
        { type: "large", price: 9, label: "0,2" }
      ]
    },
    // Weinschorle WITH SIZE VARIANTS
    {
      id: "wg14",
      name: "Weinschorle",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3, label: "0,1" },
        { type: "large", price: 6, label: "0,2" }
      ]
    },
    // Aperitifs & Spirits
    { id: "dr1", name: "Aperol", price: 8, subcategory: "cocktail" },
    { id: "dr2", name: "Cynar", price: 8, subcategory: "cocktail" },
    { id: "dr3", name: "Campari", price: 8, subcategory: "cocktail" },
    { id: "dr17", name: "Kir", price: 5, subcategory: "cocktail" },
    { id: "dr18", name: "Kir Royal", price: 7.5, subcategory: "cocktail" },
    { id: "dr19", name: "Select", price: 8, subcategory: "cocktail" },
    { id: "dr20", name: "Pastis", price: 6, subcategory: "cocktail" },
    // Beer
    { id: "dr5", name: "Pilsner Urquell", price: 3.8, subcategory: "bier" },
    { id: "dr6", name: "Stortebecker", price: 3.8, subcategory: "bier" },
    { id: "dr4", name: "Picon Biere", price: 4.8, subcategory: "bier" },
    // Soft Drinks
    { id: "dr7", name: "Fritz Cola", price: 3.7, subcategory: "soft" },
    { id: "dr8", name: "Limo Granada", price: 3.8, subcategory: "soft" },
    { id: "dr9", name: "Limo Orange", price: 3.8, subcategory: "soft" },
    { id: "dr10", name: "Limo Minze", price: 3.8, subcategory: "soft" },
    { id: "dr11", name: "Limo Pamplemousse", price: 3.8, subcategory: "soft" },
    // Juices & Water WITH SIZE VARIANTS
    {
      id: "rahbarb_saft",
      name: "Rahbarb Saft",
      subcategory: "soft",
      variants: [
        { type: "small", price: 3.5, label: "0,2" },
        { type: "large", price: 4.7, label: "0,4" }
      ]
    },
    {
      id: "rhabarb_schorle",
      name: "Rhabarb Schorle",
      subcategory: "soft",
      variants: [
        { type: "small", price: 3, label: "0,2" },
        { type: "large", price: 4, label: "0,4" }
      ]
    },
    {
      id: "apfel_schorle",
      name: "Apfel Schorle",
      subcategory: "soft",
      variants: [
        { type: "small", price: 3, label: "0,2" },
        { type: "large", price: 4, label: "0,4" }
      ]
    },
    {
      id: "apfel_saft",
      name: "Apfel Saft",
      subcategory: "soft",
      variants: [
        { type: "small", price: 3.5, label: "0,2" },
        { type: "large", price: 4.7, label: "0,4" }
      ]
    },
    {
      id: "wasser_sprudel",
      name: "Wasser Sprudel",
      subcategory: "soft",
      variants: [
        { type: "small", price: 1.5, label: "0,2" },
        { type: "large", price: 2.8, label: "0,4" }
      ]
    },
    {
      id: "wasser",
      name: "Wasser",
      subcategory: "soft",
      variants: [
        { type: "small", price: 1.5, label: "0,2" },
        { type: "large", price: 2.8, label: "0,4" }
      ]
    },
    // Schnaps WITH SIZE VARIANTS
    {
      id: "cognac",
      name: "Cognac",
      subcategory: "schnaps",
      variants: [
        { type: "small", price: 4.5, label: "0,2" },
        { type: "large", price: 8.5, label: "0,4" }
      ]
    },
    {
      id: "calvados",
      name: "Calvados",
      subcategory: "schnaps",
      variants: [
        { type: "small", price: 3.5, label: "0,2" },
        { type: "large", price: 6.5, label: "0,4" }
      ]
    },
    {
      id: "mirabelle",
      name: "Mirabelle",
      subcategory: "schnaps",
      variants: [
        { type: "small", price: 3, label: "0,2" },
        { type: "large", price: 5.5, label: "0,4" }
      ]
    },
    {
      id: "jameson",
      name: "Jameson",
      subcategory: "schnaps",
      variants: [
        { type: "small", price: 3, label: "0,2" },
        { type: "large", price: 5.5, label: "0,4" }
      ]
    },
    {
      id: "creme_calvados",
      name: "Crème de Calvados",
      subcategory: "schnaps",
      variants: [
        { type: "small", price: 4, label: "0,2" },
        { type: "large", price: 7.5, label: "0,4" }
      ]
    },
    // Teas
    { id: "te1", name: "PfefferMinze", price: 3, subcategory: "warm" },
    { id: "te2", name: "Kamille", price: 3, subcategory: "warm" },
    { id: "te3", name: "Salbei", price: 3, subcategory: "warm" },
    { id: "te4", name: "Krauter", price: 3, subcategory: "warm" },
    { id: "te5", name: "Bergtee", price: 3.7, subcategory: "warm" },
    { id: "te6", name: "Thymian", price: 3.7, subcategory: "warm" },
    { id: "te7", name: "Heisse Zitrone", price: 3.7, subcategory: "warm" },
    { id: "te8", name: "Heisse Orange", price: 5, subcategory: "warm" },
    // Coffee
    { id: "co1", name: "Espresso", price: 1.9, subcategory: "warm" },
    { id: "co2", name: "Cafe Crema", price: 2.6, subcategory: "warm" },
  ],
  "Bottles 🍾": [
    // White wines WITH LOCATION VARIANTS (Here / To Go)
    {
      id: "picpoul_bottle",
      name: "Picpoul de Pinet",
      subcategory: "white",
      variants: [
        { type: "here", price: 22.5, label: "Here" },
        { type: "togo", price: 11.5, label: "To Go" }
      ]
    },
    {
      id: "sauvignon_bottle",
      name: "Sauvignon Blanc",
      subcategory: "white",
      variants: [
        { type: "here", price: 24, label: "Here" },
        { type: "togo", price: 12.5, label: "To Go" }
      ]
    },
    {
      id: "grauburgunder_bottle",
      name: "Grauburgunder",
      subcategory: "white",
      variants: [
        { type: "here", price: 25.5, label: "Here" },
        { type: "togo", price: 14, label: "To Go" }
      ]
    },
    {
      id: "sancerre_bottle",
      name: "Sancerre",
      subcategory: "white",
      variants: [
        { type: "here", price: 38, label: "Here" },
        { type: "togo", price: 27.5, label: "To Go" }
      ]
    },
    { id: "chablis_bottle", name: "Chablis", price: 38, subcategory: "white" },
    {
      id: "riesling_bottle",
      name: "Riesling",
      subcategory: "white",
      variants: [
        { type: "here", price: 24.5, label: "Here" },
        { type: "togo", price: 13, label: "To Go" }
      ]
    },
    {
      id: "entre_deux_mers_bottle",
      name: "Entre-Deux-Mers",
      subcategory: "white",
      variants: [
        { type: "here", price: 23, label: "Here" },
        { type: "togo", price: 12.5, label: "To Go" }
      ]
    },
    {
      id: "zotz_bottle",
      name: "Zotz",
      subcategory: "white",
      variants: [
        { type: "here", price: 25.5, label: "Here" },
        { type: "togo", price: 14, label: "To Go" }
      ]
    },
    { id: "rocailles_bottle", name: "Rocailles", price: 25.5, subcategory: "white" },
    {
      id: "divin_sauv_bottle",
      name: "Divin Sauvignon Blanc",
      subcategory: "white",
      variants: [
        { type: "here", price: 25.5, label: "Here" },
        { type: "togo", price: 14, label: "To Go" }
      ]
    },
    // Rosé
    {
      id: "brise_marine_bottle",
      name: "Brise-Marine",
      subcategory: "rosé",
      variants: [
        { type: "here", price: 24, label: "Here" },
        { type: "togo", price: 12.5, label: "To Go" }
      ]
    },
    {
      id: "aurore_boreale_bottle",
      name: "Aurore Boréale",
      subcategory: "rosé",
      variants: [
        { type: "here", price: 28, label: "Here" },
        { type: "togo", price: 17.5, label: "To Go" }
      ]
    },
    {
      id: "petnat_rose_bottle",
      name: "PetNat Rosé",
      subcategory: "rosé",
      variants: [
        { type: "here", price: 33, label: "Here" },
        { type: "togo", price: 20, label: "To Go" }
      ]
    },
    // Sparkling wines
    {
      id: "cidre_bottle",
      name: "Cidre",
      subcategory: "sparkling",
      variants: [
        { type: "here", price: 21, label: "Here" },
        { type: "togo", price: 10.5, label: "To Go" }
      ]
    },
    {
      id: "cremant_bottle",
      name: "Crémant",
      subcategory: "sparkling",
      variants: [
        { type: "here", price: 35, label: "Here" },
        { type: "togo", price: 26.5, label: "To Go" }
      ]
    },
    {
      id: "prosecco_bottle",
      name: "Prosecco",
      subcategory: "sparkling",
      variants: [
        { type: "here", price: 23, label: "Here" },
        { type: "togo", price: 12.5, label: "To Go" }
      ]
    },
    {
      id: "sekt_bottle",
      name: "Sekt",
      subcategory: "sparkling",
      variants: [
        { type: "here", price: 28, label: "Here" },
        { type: "togo", price: 17.5, label: "To Go" }
      ]
    },
    {
      id: "petnat_bottle",
      name: "PetNat",
      subcategory: "sparkling",
      variants: [
        { type: "here", price: 36, label: "Here" },
        { type: "togo", price: 20, label: "To Go" }
      ]
    },
    // Red wines
    {
      id: "montepulciano_bottle",
      name: "Montepulciano D'Abruzzo",
      subcategory: "red",
      variants: [
        { type: "here", price: 22.5, label: "Here" },
        { type: "togo", price: 11, label: "To Go" }
      ]
    },
    {
      id: "gamay_bottle",
      name: "Gamay",
      subcategory: "red",
      variants: [
        { type: "here", price: 25.5, label: "Here" },
        { type: "togo", price: 14, label: "To Go" }
      ]
    },
    {
      id: "carignan_bottle",
      name: "Carignan",
      subcategory: "red",
      variants: [
        { type: "here", price: 27, label: "Here" },
        { type: "togo", price: 15.5, label: "To Go" }
      ]
    },
    {
      id: "graves_bottle",
      name: "Graves",
      subcategory: "red",
      variants: [
        { type: "here", price: 32, label: "Here" },
        { type: "togo", price: 21.5, label: "To Go" }
      ]
    },
    {
      id: "malbec_bottle",
      name: "Malbec",
      subcategory: "red",
      variants: [
        { type: "here", price: 29, label: "Here" },
        { type: "togo", price: 18.5, label: "To Go" }
      ]
    },
    {
      id: "crozes_hermitage_bottle",
      name: "Crozes Hermitage",
      subcategory: "red",
      variants: [
        { type: "here", price: 48, label: "Here" },
        { type: "togo", price: 24.5, label: "To Go" }
      ]
    },
    {
      id: "der_roth_bottle",
      name: "Der Roth",
      subcategory: "red",
      variants: [
        { type: "here", price: 26, label: "Here" },
        { type: "togo", price: 15.5, label: "To Go" }
      ]
    },
    {
      id: "primitivo_bottle",
      name: "Primitivo",
      subcategory: "red",
      variants: [
        { type: "here", price: 32, label: "Here" },
        { type: "togo", price: 21.5, label: "To Go" }
      ]
    },
    // Natural & Other wines
    {
      id: "pinot_grisant_bottle",
      name: "Pinot Grisant",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here" },
        { type: "togo", price: 17, label: "To Go" }
      ]
    },
    {
      id: "ca_va_le_faire_bottle",
      name: "Ca va le faire",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here" },
        { type: "togo", price: 17, label: "To Go" }
      ]
    },
    {
      id: "bonne_mine_bottle",
      name: "Bonne Mine",
      subcategory: "natural",
      variants: [
        { type: "here", price: 32, label: "Here" },
        { type: "togo", price: 17, label: "To Go" }
      ]
    },
    {
      id: "yellow_muskat_bottle",
      name: "Yellow Muskat",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here" },
        { type: "togo", price: 17, label: "To Go" }
      ]
    },
    {
      id: "clairette_bottle",
      name: "Clairette",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here" },
        { type: "togo", price: 17, label: "To Go" }
      ]
    },
    {
      id: "infrarouge_bottle",
      name: "Infrarouge",
      subcategory: "natural",
      variants: [
        { type: "here", price: 29, label: "Here" },
        { type: "togo", price: 19, label: "To Go" }
      ]
    },
    {
      id: "grenache_bottle",
      name: "Grenache",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here" },
        { type: "togo", price: 17, label: "To Go" }
      ]
    },
    {
      id: "cuvee_galets_bottle",
      name: "Cuvée des Galets",
      subcategory: "natural",
      variants: [
        { type: "here", price: 27, label: "Here" },
        { type: "togo", price: 17, label: "To Go" }
      ]
    },
    // Water bottles WITH LOCATION VARIANTS
    {
      id: "wasser_sprudel_bottle",
      name: "Wasser Sprudel Bottle",
      subcategory: "water",
      variants: [
        { type: "here", price: 5.5, label: "Here" },
        { type: "togo", price: 5, label: "To Go" }
      ]
    },
    {
      id: "wasser_bottle",
      name: "Wasser Bottle",
      subcategory: "water",
      variants: [
        { type: "here", price: 5.5, label: "Here" },
        { type: "togo", price: 5, label: "To Go" }
      ]
    },
  ]
};

export const STATUS_CONFIG = {
  open:    { label: "Open",    dot: "#a3c4a8", bg: "#f7faf8", border: "#d4e8d7", text: "#2d5a35" },
  taken:   { label: "Seated",  dot: "#f5c84a", bg: "#fffdf0", border: "#f0e0a0", text: "#7a5c00" },
  ordered: { label: "Ordered", dot: "#e07b5a", bg: "#fdf7f5", border: "#edc9be", text: "#7a3320" },
};

export const FOOD_SUBCATEGORIES = [
  { id: "cheese", label: "🧀 Cheese Counter" },
  { id: "salads", label: "🥗 Salads" },
  { id: "warm", label: "🍽️ Warm Dishes" },
  { id: "snacks", label: "🫒 Snacks" },
];

export const DRINKS_SUBCATEGORIES = [
  { id: "wine", label: "🍷 Wine" },
  { id: "bier", label: "🍺 Bier" },
  { id: "cocktail", label: "🍸 Cocktail" },
  { id: "soft", label: "🥤 Soft" },
  { id: "schnaps", label: "🥃 Schnaps" },
  { id: "warm", label: "☕ Warm" },
];

export const BOTTLES_SUBCATEGORIES = [
  { id: "white", label: "🥂 White" },
  { id: "rosé", label: "🌸 Rosé" },
  { id: "sparkling", label: "🍾 Sparkling" },
  { id: "red", label: "🍷 Red" },
  { id: "natural", label: "🍇 Natural" },
  { id: "water", label: "💧 Water" },
];
