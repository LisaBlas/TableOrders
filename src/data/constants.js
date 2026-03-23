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
    { id: "f1", name: "Small Cheese Plate", price: 8, subcategory: "cheese" },
    { id: "f2", name: "Cheese Plate", price: 14, subcategory: "cheese" },
    { id: "f3", name: "Small Charcuterie Plate", price: 8, subcategory: "cheese" },
    { id: "f4", name: "Charcuterie Plate", price: 14, subcategory: "cheese" },
    { id: "f5", name: "Mixed Plate", price: 16, subcategory: "cheese" },
    // Hot Dishes
    { id: "f6", name: "Marcelin Chaud", price: 12, subcategory: "warm" },
    { id: "f7", name: "Camembert Rôti", price: 12, subcategory: "warm" },
    { id: "f8", name: "Mont d'Or", price: 18, subcategory: "warm" },
    { id: "f9", name: "Tartiflette", price: 14, subcategory: "warm" },
    { id: "f10", name: "Tartiflette + Speck", price: 16, subcategory: "warm" },
    { id: "f11", name: "Raclette", price: 16, subcategory: "warm" },
    { id: "f12", name: "Fondue", price: 20, subcategory: "warm" },
    // Salads
    { id: "f13", name: "Salad Seguin", price: 10, subcategory: "salads" },
    { id: "f14", name: "Salad Papillon", price: 11, subcategory: "salads" },
    { id: "f15", name: "Salad Bauern", price: 10, subcategory: "salads" },
    { id: "f16", name: "Salad Porthos", price: 12, subcategory: "salads" },
    { id: "f17", name: "Salad Basic", price: 8, subcategory: "salads" },
    // Dessert
    { id: "f18", name: "Tarte Tatin", price: 8, subcategory: "snacks" },
  ],
  "Drinks🍷": [
    // Wines by Glass - White
    { id: "wg1", name: "Picpoul de Pinet", price: 8 },
    { id: "wg2", name: "Sauvignon Blanc", price: 8 },
    { id: "wg3", name: "Grauburgunder", price: 8 },
    { id: "wg4", name: "Brise-Marine", price: 9 },
    { id: "wg5", name: "Divin Sauvignon Blanc", price: 9 },
    // Wines by Glass - Sparkling
    { id: "wg6", name: "Cidre", price: 7 },
    { id: "wg7", name: "Sekt", price: 9 },
    { id: "wg8", name: "PetNat", price: 10 },
    // Wines by Glass - Red
    { id: "wg9", name: "Montepulciano D'Abruzzo", price: 8 },
    { id: "wg10", name: "Gamay", price: 8 },
    { id: "wg11", name: "Carignan", price: 8 },
    // Wines by Glass - Other
    { id: "wg12", name: "Yellow Muskat", price: 9 },
    { id: "wg13", name: "Cuvée des Galets", price: 10 },
    // Aperitifs & Spirits
    { id: "dr1", name: "Aperol", price: 6 },
    { id: "dr2", name: "Cynar", price: 6 },
    { id: "dr3", name: "Campari", price: 6 },
    { id: "dr4", name: "Picon Biere", price: 5 },
    // Beer
    { id: "dr5", name: "Pilsner Urquell", price: 5 },
    { id: "dr6", name: "Stortebecker", price: 5 },
    // Soft Drinks
    { id: "dr7", name: "Fritz Cola", price: 4 },
    { id: "dr8", name: "Limo Granada", price: 4 },
    { id: "dr9", name: "Limo Orange", price: 4 },
    { id: "dr10", name: "Limo Minze", price: 4 },
    { id: "dr11", name: "Limo Pamplemousse", price: 4 },
    // Juices & Water
    { id: "dr12", name: "Rahbarb Saft", price: 4 },
    { id: "dr13", name: "Rhabarb Schorle", price: 4 },
    { id: "dr14", name: "Apfel Schorle", price: 4 },
    { id: "dr15", name: "Apfel Saft", price: 4 },
    { id: "dr16", name: "Wasser Sprudel", price: 3 },
  ],
  "Wines 🍾": [
    // White wines (also available by glass marked with *)
    { id: "wb1", name: "Picpoul de Pinet", price: 35 },
    { id: "wb2", name: "Sauvignon Blanc", price: 35 },
    { id: "wb3", name: "Grauburgunder", price: 38 },
    { id: "wb4", name: "Sancerre", price: 42 },
    { id: "wb5", name: "Chablis", price: 40 },
    { id: "wb6", name: "Riesling", price: 38 },
    { id: "wb7", name: "Entre-Deux-Mers", price: 32 },
    { id: "wb8", name: "Zotz", price: 36 },
    { id: "wb9", name: "Rocailles", price: 36 },
    { id: "wb10", name: "Brise-Marine", price: 38 },
    { id: "wb11", name: "Aurore Boréale", price: 40 },
    { id: "wb12", name: "Divin Sauvignon Blanc", price: 38 },
    // Sparkling wines
    { id: "wb13", name: "Cidre", price: 28 },
    { id: "wb14", name: "Crémant", price: 40 },
    { id: "wb15", name: "Prosecco", price: 35 },
    { id: "wb16", name: "Sekt", price: 38 },
    { id: "wb17", name: "PetNat", price: 40 },
    { id: "wb18", name: "PetNat Rosé", price: 42 },
    // Red wines
    { id: "wb19", name: "Montepulciano D'Abruzzo", price: 35 },
    { id: "wb20", name: "Gamay", price: 36 },
    { id: "wb21", name: "Carignan", price: 36 },
    { id: "wb22", name: "Graves", price: 42 },
    { id: "wb23", name: "Malbec", price: 40 },
    { id: "wb24", name: "Crozes Hermitage", price: 48 },
    { id: "wb25", name: "Der Roth", price: 38 },
    { id: "wb26", name: "Primitivo", price: 38 },
    // Natural & Other wines
    { id: "wb27", name: "Pinot Grisant", price: 40 },
    { id: "wb28", name: "Ca va le faire", price: 38 },
    { id: "wb29", name: "Bonne Mine", price: 38 },
    { id: "wb30", name: "Yellow Muskat", price: 40 },
    { id: "wb31", name: "Clairette", price: 36 },
    { id: "wb32", name: "Infrarouge", price: 42 },
    { id: "wb33", name: "Grenache", price: 38 },
    { id: "wb34", name: "Cuvée des Galets", price: 45 },
  ],
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
