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
  { id: "ToGo", label: "To Go" },
  { isDivider: true, label: "Outside" },
  { id: "A", label: "A" },
  { id: "B", label: "B" },
  { id: "C", label: "C" },
  { id: "Left", label: "Left" },
  { id: "Mid", label: "Mid" },
  { id: "Right", label: "Right" },
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
      name: "Picpoul",
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
      name: "Montepulciano",
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
      name: "Picpoul Fl.",
      subcategory: "white",
      variants: [
        { type: "here", price: 22.5, label: "Here" },
        { type: "togo", price: 11.5, label: "To Go" }
      ]
    },
    {
      id: "sauvignon_bottle",
      name: "Sauvignon Blanc Fl.",
      subcategory: "white",
      variants: [
        { type: "here", price: 24, label: "Here" },
        { type: "togo", price: 12.5, label: "To Go" }
      ]
    },
    {
      id: "grauburgunder_bottle",
      name: "Grauburgunder Fl.",
      subcategory: "white",
      variants: [
        { type: "here", price: 25.5, label: "Here" },
        { type: "togo", price: 14, label: "To Go" }
      ]
    },
    {
      id: "sancerre_bottle",
      name: "Sancerre Fl.",
      subcategory: "white",
      variants: [
        { type: "here", price: 38, label: "Here" },
        { type: "togo", price: 27.5, label: "To Go" }
      ]
    },
    {
      id: "chablis_bottle",
      name: "Chablis Fl.",
      subcategory: "white",
      variants: [
        { type: "here", price: 38, label: "Here" },
        { type: "togo", price: 27.5, label: "To Go" }
      ]
    },
    {
      id: "riesling_bottle",
      name: "Riesling Fl.",
      subcategory: "white",
      variants: [
        { type: "here", price: 24.5, label: "Here" },
        { type: "togo", price: 13, label: "To Go" }
      ]
    },
    {
      id: "entre_deux_mers_bottle",
      name: "Entre-Deux-Mers Fl.",
      subcategory: "white",
      variants: [
        { type: "here", price: 23, label: "Here" },
        { type: "togo", price: 12.5, label: "To Go" }
      ]
    },
    {
      id: "zotz_bottle",
      name: "Zotz Fl.",
      subcategory: "white",
      variants: [
        { type: "here", price: 25.5, label: "Here" },
        { type: "togo", price: 14, label: "To Go" }
      ]
    },
    {
      id: "rocailles_bottle",
      name: "Rocailles Fl.",
      subcategory: "white",
      variants: [
        { type: "here", price: 25.5, label: "Here" },
        { type: "togo", price: 14, label: "To Go" }
      ]
    },
    {
      id: "divin_sauv_bottle",
      name: "Divin Sauvignon Blanc Fl.",
      subcategory: "white",
      variants: [
        { type: "here", price: 25.5, label: "Here" },
        { type: "togo", price: 14, label: "To Go" }
      ]
    },
    // Rosé
    {
      id: "brise_marine_bottle",
      name: "Brise-Marine Fl.",
      subcategory: "rosé",
      variants: [
        { type: "here", price: 24, label: "Here" },
        { type: "togo", price: 12.5, label: "To Go" }
      ]
    },
    {
      id: "aurore_boreale_bottle",
      name: "Aurore Boréale Fl.",
      subcategory: "rosé",
      variants: [
        { type: "here", price: 28, label: "Here" },
        { type: "togo", price: 17.5, label: "To Go" }
      ]
    },
    {
      id: "petnat_rose_bottle",
      name: "PetNat Rosé Fl.",
      subcategory: "rosé",
      variants: [
        { type: "here", price: 33, label: "Here" },
        { type: "togo", price: 20, label: "To Go" }
      ]
    },
    // Sparkling wines
    {
      id: "cidre_bottle",
      name: "Cidre Fl.",
      subcategory: "sparkling",
      variants: [
        { type: "here", price: 21, label: "Here" },
        { type: "togo", price: 10.5, label: "To Go" }
      ]
    },
    {
      id: "cremant_bottle",
      name: "Crémant Fl.",
      subcategory: "sparkling",
      variants: [
        { type: "here", price: 35, label: "Here" },
        { type: "togo", price: 26.5, label: "To Go" }
      ]
    },
    {
      id: "prosecco_bottle",
      name: "Prosecco Fl.",
      subcategory: "sparkling",
      variants: [
        { type: "here", price: 23, label: "Here" },
        { type: "togo", price: 12.5, label: "To Go" }
      ]
    },
    {
      id: "sekt_bottle",
      name: "Sekt Fl.",
      subcategory: "sparkling",
      variants: [
        { type: "here", price: 28, label: "Here" },
        { type: "togo", price: 17.5, label: "To Go" }
      ]
    },
    {
      id: "petnat_bottle",
      name: "PetNat Fl.",
      subcategory: "sparkling",
      variants: [
        { type: "here", price: 36, label: "Here" },
        { type: "togo", price: 20, label: "To Go" }
      ]
    },
    // Red wines
    {
      id: "montepulciano_bottle",
      name: "Montepulciano Fl.",
      subcategory: "red",
      variants: [
        { type: "here", price: 22.5, label: "Here" },
        { type: "togo", price: 11, label: "To Go" }
      ]
    },
    {
      id: "gamay_bottle",
      name: "Gamay Fl.",
      subcategory: "red",
      variants: [
        { type: "here", price: 25.5, label: "Here" },
        { type: "togo", price: 14, label: "To Go" }
      ]
    },
    {
      id: "carignan_bottle",
      name: "Carignan Fl.",
      subcategory: "red",
      variants: [
        { type: "here", price: 27, label: "Here" },
        { type: "togo", price: 15.5, label: "To Go" }
      ]
    },
    {
      id: "graves_bottle",
      name: "Graves Fl.",
      subcategory: "red",
      variants: [
        { type: "here", price: 32, label: "Here" },
        { type: "togo", price: 21.5, label: "To Go" }
      ]
    },
    {
      id: "malbec_bottle",
      name: "Malbec Fl.",
      subcategory: "red",
      variants: [
        { type: "here", price: 29, label: "Here" },
        { type: "togo", price: 18.5, label: "To Go" }
      ]
    },
    {
      id: "crozes_hermitage_bottle",
      name: "Crozes Hermitage Fl.",
      subcategory: "red",
      variants: [
        { type: "here", price: 48, label: "Here" },
        { type: "togo", price: 24.5, label: "To Go" }
      ]
    },
    {
      id: "der_roth_bottle",
      name: "Der Roth Fl.",
      subcategory: "red",
      variants: [
        { type: "here", price: 26, label: "Here" },
        { type: "togo", price: 15.5, label: "To Go" }
      ]
    },
    {
      id: "primitivo_bottle",
      name: "Primitivo Fl.",
      subcategory: "red",
      variants: [
        { type: "here", price: 32, label: "Here" },
        { type: "togo", price: 21.5, label: "To Go" }
      ]
    },
    // Natural & Other wines
    {
      id: "pinot_grisant_bottle",
      name: "Pinot Grisant Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here" },
        { type: "togo", price: 17, label: "To Go" }
      ]
    },
    {
      id: "ca_va_le_faire_bottle",
      name: "Ca va le faire Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here" },
        { type: "togo", price: 17, label: "To Go" }
      ]
    },
    {
      id: "bonne_mine_bottle",
      name: "Bonne Mine Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 32, label: "Here" },
        { type: "togo", price: 17, label: "To Go" }
      ]
    },
    {
      id: "yellow_muskat_bottle",
      name: "Yellow Muskat Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here" },
        { type: "togo", price: 17, label: "To Go" }
      ]
    },
    {
      id: "clairette_bottle",
      name: "Clairette Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here" },
        { type: "togo", price: 17, label: "To Go" }
      ]
    },
    {
      id: "infrarouge_bottle",
      name: "Infrarouge Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 29, label: "Here" },
        { type: "togo", price: 19, label: "To Go" }
      ]
    },
    {
      id: "grenache_bottle",
      name: "Grenache Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here" },
        { type: "togo", price: 17, label: "To Go" }
      ]
    },
    {
      id: "cuvee_galets_bottle",
      name: "Cuvée des Galets Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 27, label: "Here" },
        { type: "togo", price: 17, label: "To Go" }
      ]
    },
    {
      id: "tete_claques_bottle",
      name: "Tête à Claques Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here" },
        { type: "togo", price: 17, label: "To Go" }
      ]
    },
    {
      id: "deferlante_rouge_bottle",
      name: "Deferlante Rouge Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here" },
        { type: "togo", price: 17, label: "To Go" }
      ]
    },
    {
      id: "ya_plus_qua_bottle",
      name: "Y'a plus qu'à Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 29, label: "Here" },
        { type: "togo", price: 16, label: "To Go" }
      ]
    },
    {
      id: "divin_rose_bottle",
      name: "Divin Rosé Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 25.5, label: "Here" },
        { type: "togo", price: 14, label: "To Go" }
      ]
    },
    {
      id: "cremant_alsace_bottle",
      name: "Crémant d'Alsace Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 24, label: "Here" },
        { type: "togo", price: 21, label: "To Go" }
      ]
    },
    {
      id: "vi_no_bottle",
      name: "Vi-No Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 25.5, label: "Here" },
        { type: "togo", price: 14, label: "To Go" }
      ]
    },
    {
      id: "fritz_muller_bottle",
      name: "Fritz Müller Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 25.5, label: "Here" },
        { type: "togo", price: 14, label: "To Go" }
      ]
    },
    {
      id: "divin_pinot_noir_bottle",
      name: "Divin Pinot Noir Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 29, label: "Here" },
        { type: "togo", price: 18.5, label: "To Go" }
      ]
    },
    // Water bottles WITH LOCATION VARIANTS
    {
      id: "wasser_sprudel_bottle",
      name: "Sprudel Wasser Fl.",
      subcategory: "water",
      variants: [
        { type: "here", price: 5.5, label: "Here" },
        { type: "togo", price: 5, label: "To Go" }
      ]
    },
    {
      id: "wasser_bottle",
      name: "Wasser Fl.",
      subcategory: "water",
      variants: [
        { type: "here", price: 5.5, label: "Here" },
        { type: "togo", price: 5, label: "To Go" }
      ]
    },
  ]
};

// Aliases for the Total tab in Daily Sales — maps item ID to POS alias (Simplified Name [POS_ID])
export const ARTICLE_ALIASES = {
  // Food — Cheese & Charcuterie
  "f1":  "Kleiner Kâseteller [11]",
  "f2":  "CP 1PAX [10]",
  "f4":  "Charcuterie klein [16]",
  "f5":  "MixPlate 2PAX [12]",
  "f29": "Charcuterie Dazu? [18]",
  // Food — Hot Dishes
  "f6":  "ST.M [418]",
  "f7":  "CAM [401]",
  "f8":  "Mont d'Or [421]",
  "f9":  "Tartiflette [21]",
  "f10": "Tartiflette Speck [21-1]",
  "f11": "Raclettemenü [24]",
  "f12": "Fonduemenü [23]",
  "f28": "Fondue Alkoholfrei [23-1]",
  // Food — Salads
  "f13": "Seguin Salat [41]",
  "f21": "Seguin Speck [41-1]",
  "f14": "Papillon Salat [43]",
  "f22": "Papillon Serrano [43-1]",
  "f15": "Bauernsalat [44]",
  "f23": "Bauernsalat Kartoffel [44-1]",
  "f16": "Porthos Salat [43]",
  "f24": "Porthos Serrano [43-1]",
  "f17": "Basissalat [40]",
  // Food — Snacks / Dessert
  "f18": "Tarte Tatin [30]",
  "f27": "Tarte Tatin Calvados [30-1]",
  "f19": "Oliven [9]",
  "f20": "Oliven Grissini [9-1]",
  "f26": "Cornichons [0000]",

  // Drinks by glass — White
  "wg1-small":  "Picpoul 0,1 [251-1]",
  "wg1-large":  "Picpoul 0,2 [251-2]",
  "wg2-small":  "SauB 0,1 [256-1]",
  "wg2-large":  "SauB 0,2 [256-2]",
  "wg3-small":  "Grau 0,1 [254-1]",
  "wg3-large":  "Grau 0,2 [254-2]",
  "wg4-small":  "BrisMar 0,1 [281-1]",
  "wg4-large":  "BrisMar 0,2 [281-2]",
  "wg5-small":  "DivSauB 0,1 [152-1]",
  "wg5-large":  "DivSauB 0,2 [152-2]",
  // Drinks by glass — Sparkling
  "wg6-small":  "Cidre 0,1 [299-1]",
  "wg6-large":  "Cidre 0,2 [299-2]",
  "wg7-small":  "Sekt 0,1 [271-1]",
  "wg7-large":  "Sekt 0,2 [271-2]",
  "wg8-small":  "PetNat 0,1 [198-1]",
  "wg8-large":  "PetNat 0,2 [198-2]",
  // Drinks by glass — Red
  "wg9-small":  "Montep 0,1 [205-1]",
  "wg9-large":  "Montep 0,2 [205-2]",
  "wg10-small": "Gamay 0,1 [202-1]",
  "wg10-large": "Gamay 0,2 [202-2]",
  "wg11-small": "Carig 0,1 [208-1]",
  "wg11-large": "Carig 0,2 [208-2]",
  // Drinks by glass — Other
  "wg12-small": "YellM 0,1 [194-1]",
  "wg12-large": "YellM 0,2 [194-2]",
  "wg13-small": "CuvGal 0,1 [247-1]",
  "wg13-large": "CuvGal 0,2 [247-2]",
  "wg14-small": "WeinSch 0,1 [69-1]",
  "wg14-large": "WeinSch 0,2 [69-2]",
  // Aperitifs & Spirits
  "dr1":  "Aperol [73]",
  "dr2":  "Cynar [76]",
  "dr3":  "Campari [74]",
  "dr17": "Kir [71]",
  "dr18": "KirRoy [72]",
  "dr19": "Select [75]",
  "dr20": "Pastis [67]",
  // Beer
  "dr5": "Pilsner Urquell [64]",
  "dr6": "Störtebecker [66]",
  "dr4": "Picon Bier [65]",
  // Soft Drinks
  "dr7":  "Fritz Cola [54]",
  "dr8":  "Mortuacienne Granada [55-1]",
  "dr9":  "Mortuacienne Orange [55-2]",
  "dr10": "Mortuacienne Minze [55-3]",
  "dr11": "Mortuacienne Pamplemousse [55-4]",
  // Juices & Water
  "rahbarb_saft-small":    "RhabSaft klein [56-1]",
  "rahbarb_saft-large":    "RhabSaft groß [57-1]",
  "rhabarb_schorle-small": "RhabSch klein [58-1]",
  "rhabarb_schorle-large": "RhabSch groß [59-1]",
  "apfel_schorle-small":   "ApfSch klein [58-2]",
  "apfel_schorle-large":   "ApfSch groß [59-2]",
  "apfel_saft-small":      "ApfSaft klein [56-2]",
  "apfel_saft-large":      "ApfSaft groß [57-2]",
  "wasser_sprudel-small":  "WassSprud klein [50-1]",
  "wasser_sprudel-large":  "WassSprud groß [51-1]",
  "wasser-small":          "Wass klein [50-2]",
  "wasser-large":          "Wass groß [51-2]",
  // Schnaps
  "cognac-small":        "Cognac 0,2 [84]",
  "cognac-large":        "Cognac 0,4 [85]",
  "calvados-small":      "Calvados 0,2 [86]",
  "calvados-large":      "Calvados 0,4 [87]",
  "mirabelle-small":     "Mirabelle 0,2 [80]",
  "mirabelle-large":     "Mirabelle 0,4 [81]",
  "jameson-small":       "Jameson 0,2 [82]",
  "jameson-large":       "Jameson 0,4 [83]",
  "creme_calvados-small": "Creme Calvados 0,2 [88]",
  "creme_calvados-large": "Creme Calvados 0,4 [89]",
  // Teas
  "te1": "PfefMin [93-1]",
  "te2": "Kamil [93-2]",
  "te3": "Salb [93-3]",
  "te4": "Kraut [93-4]",
  "te5": "BergT [94-1]",
  "te6": "Thym [94-2]",
  "te7": "HeissZ [0000]",
  "te8": "Hot Orange [95]",
  // Coffee
  "co1": "Espr [91]",
  "co2": "CafCr [90]",

  // Bottles — White
  "picpoul_bottle-here":         "Picpoul Fl H [251]",
  "picpoul_bottle-togo":         "Picpoul Fl TG [251]",
  "sauvignon_bottle-here":       "SauB Fl H [256]",
  "sauvignon_bottle-togo":       "SauB Fl TG [256]",
  "grauburgunder_bottle-here":   "Grau Fl H [254]",
  "grauburgunder_bottle-togo":   "Grau Fl TG [254]",
  "sancerre_bottle-here":        "Sanc Fl H [255]",
  "sancerre_bottle-togo":        "Sanc Fl TG [255]",
  "chablis_bottle-here":         "Chab Fl H [259]",
  "chablis_bottle-togo":         "Chab Fl TG [259]",
  "riesling_bottle-here":        "Riesl Fl H [257]",
  "riesling_bottle-togo":        "Riesl Fl TG [257]",
  "entre_deux_mers_bottle-here": "EdM Fl H [252]",
  "entre_deux_mers_bottle-togo": "EdM Fl TG [252]",
  "zotz_bottle-here":            "Zotz Fl H [260]",
  "zotz_bottle-togo":            "Zotz Fl TG [260]",
  "rocailles_bottle-here":       "Roca Fl H [261]",
  "rocailles_bottle-togo":       "Roca Fl TG [261]",
  "divin_sauv_bottle-here":      "DivSauB Fl H [152]",
  "divin_sauv_bottle-togo":      "DivSauB Fl TG [152]",
  // Bottles — Rosé
  "brise_marine_bottle-here":  "BrisMar Fl H [281]",
  "brise_marine_bottle-togo":  "BrisMar Fl TG [281]",
  "aurore_boreale_bottle-here": "AurBor Fl H [282]",
  "aurore_boreale_bottle-togo": "AurBor Fl TG [282]",
  "petnat_rose_bottle-here":   "PetNatR Fl H [199]",
  "petnat_rose_bottle-togo":   "PetNatR Fl TG [199]",
  // Bottles — Sparkling
  "cidre_bottle-here":   "Cidre Fl H [299]",
  "cidre_bottle-togo":   "Cidre Fl TG [299]",
  "cremant_bottle-here": "Crem Fl H [273]",
  "cremant_bottle-togo": "Crem Fl TG [273]",
  "prosecco_bottle-here": "Prosc Fl H [272]",
  "prosecco_bottle-togo": "Prosc Fl TG [272]",
  "sekt_bottle-here":    "Sekt Fl H [271]",
  "sekt_bottle-togo":    "Sekt Fl TG [271]",
  "petnat_bottle-here":  "PetNat Fl H [198]",
  "petnat_bottle-togo":  "PetNat Fl TG [198]",
  // Bottles — Red
  "montepulciano_bottle-here":    "Montep Fl H [205]",
  "montepulciano_bottle-togo":    "Montep Fl TG [205]",
  "gamay_bottle-here":            "Gamay Fl H [202]",
  "gamay_bottle-togo":            "Gamay Fl TG [202]",
  "carignan_bottle-here":         "Carig Fl H [208]",
  "carignan_bottle-togo":         "Carig Fl TG [208]",
  "graves_bottle-here":           "Graves Fl H [211]",
  "graves_bottle-togo":           "Graves Fl TG [211]",
  "malbec_bottle-here":           "Malbec Fl H [206]",
  "malbec_bottle-togo":           "Malbec Fl TG [206]",
  "crozes_hermitage_bottle-here": "CrozHer Fl H [204]",
  "crozes_hermitage_bottle-togo": "CrozHer Fl TG [204]",
  "der_roth_bottle-here":         "DerRoth Fl H [212]",
  "der_roth_bottle-togo":         "DerRoth Fl TG [212]",
  "primitivo_bottle-here":        "Primit Fl H [213]",
  "primitivo_bottle-togo":        "Primit Fl TG [213]",
  // Bottles — Natural
  "pinot_grisant_bottle-here":    "PinGri Fl H [248]",
  "pinot_grisant_bottle-togo":    "PinGri Fl TG [248]",
  "ca_va_le_faire_bottle-here":   "CavFaire Fl H [192]",
  "ca_va_le_faire_bottle-togo":   "CavFaire Fl TG [192]",
  "bonne_mine_bottle-here":       "BonMin Fl H [242]",
  "bonne_mine_bottle-togo":       "BonMin Fl TG [242]",
  "yellow_muskat_bottle-here":    "YellM Fl H [194]",
  "yellow_muskat_bottle-togo":    "YellM Fl TG [194]",
  "clairette_bottle-here":        "Clair Fl H [229]",
  "clairette_bottle-togo":        "Clair Fl TG [229]",
  "infrarouge_bottle-here":       "Infra Fl H [227]",
  "infrarouge_bottle-togo":       "Infra Fl TG [227]",
  "grenache_bottle-here":         "Grenache Fl H [241]",
  "grenache_bottle-togo":         "Grenache Fl TG [241]",
  "cuvee_galets_bottle-here":     "CuvGal Fl H [247]",
  "cuvee_galets_bottle-togo":     "CuvGal Fl TG [247]",
  "tete_claques_bottle-here":     "TeteCla Fl H [246]",
  "tete_claques_bottle-togo":     "TeteCla Fl TG [246]",
  "deferlante_rouge_bottle-here": "DefRouge Fl H [239]",
  "deferlante_rouge_bottle-togo": "DefRouge Fl TG [239]",
  "ya_plus_qua_bottle-here":      "YaPlusQ Fl H [226]",
  "ya_plus_qua_bottle-togo":      "YaPlusQ Fl TG [226]",
  "divin_rose_bottle-here":       "DivRose Fl H [151]",
  "divin_rose_bottle-togo":       "DivRose Fl TG [151]",
  "cremant_alsace_bottle-here":   "CremAls Fl H [191]",
  "cremant_alsace_bottle-togo":   "CremAls Fl TG [191]",
  "vi_no_bottle-here":            "ViNo Fl H [153]",
  "vi_no_bottle-togo":            "ViNo Fl TG [153]",
  "fritz_muller_bottle-here":     "FritzM Fl H [150]",
  "fritz_muller_bottle-togo":     "FritzM Fl TG [150]",
  "divin_pinot_noir_bottle-here": "DivPinNoir Fl H [154]",
  "divin_pinot_noir_bottle-togo": "DivPinNoir Fl TG [154]",
  // Bottles — Water
  "wasser_sprudel_bottle-here": "SprudWass Fl H [52]",
  "wasser_sprudel_bottle-togo": "SprudWass Fl TG [52]",
  "wasser_bottle-here":         "Wass Fl H [52]",
  "wasser_bottle-togo":         "Wass Fl TG [52]",
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
