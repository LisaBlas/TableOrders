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
    { id: "f13", name: "Salad Seguin", price: 12.5, subcategory: "salads" },
    { id: "f21", name: "Salad Seguin + Speck", price: 14.5, subcategory: "salads" },
    { id: "f14", name: "Salad Papillon", price: 13.5, subcategory: "salads" },
    { id: "f22", name: "Salad Papillon + Serrano", price: 15.5, subcategory: "salads" },
    { id: "f15", name: "Salad Bauern", price: 12.5, subcategory: "salads" },
    { id: "f23", name: "Salad Bauern + Kartoffeln", price: 15, subcategory: "salads" },
    { id: "f16", name: "Salad Porthos", price: 13, subcategory: "salads" },
    { id: "f24", name: "Salad Porthos + Serrano", price: 15, subcategory: "salads" },
    { id: "f17", name: "Salad Basic", price: 7, subcategory: "salads" },
    // Dessert
    { id: "f18", name: "Tarte Tatin", price: 7, subcategory: "snacks" },
    { id: "f27", name: "Tarte Tatin + Calvados", price: 10, subcategory: "snacks" },
    { id: "f19", name: "Olives", price: 3, subcategory: "snacks" },
    { id: "f20", name: "Olives + Grissini", price: 5.5, subcategory: "snacks" },
    { id: "f26", name: "Cornichons", price: 2.5, subcategory: "snacks" },
  ],
  "Drinks🍷": [
    // Wines by Glass - White
    { id: "wg1", name: "Picpoul de Pinet", price: 6.5, subcategory: "wine" },
    { id: "wg2", name: "Sauvignon Blanc", price: 7, subcategory: "wine" },
    { id: "wg3", name: "Grauburgunder", price: 7.5, subcategory: "wine" },
    { id: "wg4", name: "Brise-Marine", price: 7, subcategory: "wine" },
    { id: "wg5", name: "Divin Sauvignon Blanc", price: 7.5, subcategory: "wine" },
    // Wines by Glass - Sparkling
    { id: "wg6", name: "Cidre", price: 6, subcategory: "wine" },
    { id: "wg7", name: "Sekt", price: 7, subcategory: "wine" },
    { id: "wg8", name: "PetNat", price: 8, subcategory: "wine" },
    // Wines by Glass - Red
    { id: "wg9", name: "Montepulciano D'Abruzzo", price: 6.5, subcategory: "wine" },
    { id: "wg10", name: "Gamay", price: 7, subcategory: "wine" },
    { id: "wg11", name: "Carignan", price: 8, subcategory: "wine" },
    // Wines by Glass - Other
    { id: "wg12", name: "Yellow Muskat", price: 9, subcategory: "wine" },
    { id: "wg13", name: "Cuvée des Galets", price: 9, subcategory: "wine" },
    // Aperitifs & Spirits
    { id: "dr1", name: "Aperol", price: 8, subcategory: "cocktail" },
    { id: "dr2", name: "Cynar", price: 8, subcategory: "cocktail" },
    { id: "dr3", name: "Campari", price: 8, subcategory: "cocktail" },
    // Beer
    { id: "dr5", name: "Pilsner Urquell", price: 3.7, subcategory: "bier" },
    { id: "dr6", name: "Stortebecker", price: 3.7, subcategory: "bier" },
    { id: "dr4", name: "Picon Biere", price: 4.8, subcategory: "bier" },
    // Soft Drinks
    { id: "dr7", name: "Fritz Cola", price: 3.7, subcategory: "soft" },
    { id: "dr8", name: "Limo Granada", price: 3.7, subcategory: "soft" },
    { id: "dr9", name: "Limo Orange", price: 3.7, subcategory: "soft" },
    { id: "dr10", name: "Limo Minze", price: 3.7, subcategory: "soft" },
    { id: "dr11", name: "Limo Pamplemousse", price: 3.7, subcategory: "soft" },
    // Juices & Water
    { id: "dr12", name: "Rahbarb Saft 0.4 cl", price: 4, subcategory: "soft" },
    { id: "dr12b", name: "Rahbarb Saft 0.2 cl", price: 3, subcategory: "soft" },
    { id: "dr13", name: "Rhabarb Schorle 0.4 cl", price: 4, subcategory: "soft" },
    { id: "dr13b", name: "Rhabarb Schorle 0.2 cl", price: 3, subcategory: "soft" },
    { id: "dr14", name: "Apfel Schorle 0.4 cl", price: 4, subcategory: "soft" },
    { id: "dr14b", name: "Apfel Schorle 0.2 cl", price: 3, subcategory: "soft" },
    { id: "dr15", name: "Apfel Saft 0.4 cl", price: 4, subcategory: "soft" },
    { id: "dr15b", name: "Apfel Saft 0.2 cl", price: 3, subcategory: "soft" },
    { id: "dr16", name: "Wasser Sprudel 0.4 cl", price: 2.8, subcategory: "soft" },
    { id: "dr16b", name: "Wasser Sprudel 0.2 cl", price: 1.8, subcategory: "soft" },
  ],
  "Wines 🍾": [
    // White wines (also available by glass marked with *)
    { id: "wb1", name: "Picpoul de Pinet", price: 22.5, subcategory: "white" },
    { id: "wb2", name: "Sauvignon Blanc", price: 24, subcategory: "white" },
    { id: "wb3", name: "Grauburgunder", price: 25.5, subcategory: "white" },
    { id: "wb4", name: "Sancerre", price: 38, subcategory: "white" },
    { id: "wb5", name: "Chablis", price: 38, subcategory: "white" },
    { id: "wb6", name: "Riesling", price: 24.5, subcategory: "white" },
    { id: "wb7", name: "Entre-Deux-Mers", price: 23, subcategory: "white" },
    { id: "wb8", name: "Zotz", price: 25.5, subcategory: "white" },
    { id: "wb9", name: "Rocailles", price: 25.5, subcategory: "white" },
    { id: "wb12", name: "Divin Sauvignon Blanc", price: 25.5, subcategory: "white" },
    // Rosé
    { id: "wb10", name: "Brise-Marine", price: 24, subcategory: "rosé" },
    { id: "wb11", name: "Aurore Boréale", price: 28, subcategory: "rosé" },
    { id: "wb18", name: "PetNat Rosé", price: 33, subcategory: "rosé" },
    // Sparkling wines
    { id: "wb13", name: "Cidre", price: 21, subcategory: "sparkling" },
    { id: "wb14", name: "Crémant", price: 35, subcategory: "sparkling" },
    { id: "wb15", name: "Prosecco", price: 23, subcategory: "sparkling" },
    { id: "wb16", name: "Sekt", price: 28, subcategory: "sparkling" },
    { id: "wb17", name: "PetNat", price: 36, subcategory: "sparkling" },
    // Red wines
    { id: "wb19", name: "Montepulciano D'Abruzzo", price: 22.5, subcategory: "red" },
    { id: "wb20", name: "Gamay", price: 25.5, subcategory: "red" },
    { id: "wb21", name: "Carignan", price: 27, subcategory: "red" },
    { id: "wb22", name: "Graves", price: 32, subcategory: "red" },
    { id: "wb23", name: "Malbec", price: 29, subcategory: "red" },
    { id: "wb24", name: "Crozes Hermitage", price: 48, subcategory: "red" },
    { id: "wb25", name: "Der Roth", price: 26, subcategory: "red" },
    { id: "wb26", name: "Primitivo", price: 32, subcategory: "red" },
    // Natural & Other wines
    { id: "wb27", name: "Pinot Grisant", price: 30, subcategory: "natural" },
    { id: "wb28", name: "Ca va le faire", price: 30, subcategory: "natural" },
    { id: "wb29", name: "Bonne Mine", price: 32, subcategory: "natural" },
    { id: "wb30", name: "Yellow Muskat", price: 30, subcategory: "natural" },
    { id: "wb31", name: "Clairette", price: 30, subcategory: "natural" },
    { id: "wb32", name: "Infrarouge", price: 29, subcategory: "natural" },
    { id: "wb33", name: "Grenache", price: 30, subcategory: "natural" },
    { id: "wb34", name: "Cuvée des Galets", price: 27, subcategory: "natural" },
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

export const DRINKS_SUBCATEGORIES = [
  { id: "wine", label: "🍷 Wine" },
  { id: "bier", label: "🍺 Bier" },
  { id: "cocktail", label: "🍸 Cocktail" },
  { id: "soft", label: "🥤 Soft" },
];

export const WINES_SUBCATEGORIES = [
  { id: "red", label: "🍷 Red" },
  { id: "white", label: "🥂 White" },
  { id: "rosé", label: "🌸 Rosé" },
  { id: "sparkling", label: "🍾 Sparkling" },
  { id: "natural", label: "🍇 Natural" },
];
