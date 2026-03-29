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
    { id: "chablis_bottle", name: "Chablis", price: 38, subcategory: "white" },
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
    { id: "rocailles_bottle", name: "Rocailles", price: 25.5, subcategory: "white" },
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
  "f1":  "SCP [1001]",
  "f2":  "CP [1002]",
  "f4":  "ChP [1003]",
  "f5":  "MixP [1004]",
  "f29": "ChD [1005]",
  // Food — Hot Dishes
  "f6":  "Marc [1006]",
  "f7":  "CamR [1007]",
  "f8":  "MdO [1008]",
  "f9":  "Tart [1009]",
  "f10": "TartS [1010]",
  "f11": "Rac [1011]",
  "f12": "Fond [1012]",
  "f28": "FondA [1013]",
  // Food — Salads
  "f13": "Seg [1014]",
  "f21": "SegS [1015]",
  "f14": "Pap [1016]",
  "f22": "PapSer [1017]",
  "f15": "Bau [1018]",
  "f23": "BauK [1019]",
  "f16": "Port [1020]",
  "f24": "PortS [1021]",
  "f17": "Bas [1022]",
  // Food — Snacks / Dessert
  "f18": "TT [1023]",
  "f27": "TTC [1024]",
  "f19": "Olv [1025]",
  "f20": "OlvG [1026]",
  "f26": "Corn [1027]",

  // Drinks by glass — White
  "wg1-small":  "Picpoul 0,1 [2101]",
  "wg1-large":  "Picpoul 0,2 [2102]",
  "wg2-small":  "SauB 0,1 [2103]",
  "wg2-large":  "SauB 0,2 [2104]",
  "wg3-small":  "Grau 0,1 [2105]",
  "wg3-large":  "Grau 0,2 [2106]",
  "wg4-small":  "BrisMar 0,1 [2107]",
  "wg4-large":  "BrisMar 0,2 [2108]",
  "wg5-small":  "DivSauB 0,1 [2109]",
  "wg5-large":  "DivSauB 0,2 [2110]",
  // Drinks by glass — Sparkling
  "wg6-small":  "Cidre 0,1 [2111]",
  "wg6-large":  "Cidre 0,2 [2112]",
  "wg7-small":  "Sekt 0,1 [2113]",
  "wg7-large":  "Sekt 0,2 [2114]",
  "wg8-small":  "PetNat 0,1 [2115]",
  "wg8-large":  "PetNat 0,2 [2116]",
  // Drinks by glass — Red
  "wg9-small":  "Montep 0,1 [2117]",
  "wg9-large":  "Montep 0,2 [2118]",
  "wg10-small": "Gamay 0,1 [2119]",
  "wg10-large": "Gamay 0,2 [2120]",
  "wg11-small": "Carig 0,1 [2121]",
  "wg11-large": "Carig 0,2 [2122]",
  // Drinks by glass — Other
  "wg12-small": "YellM 0,1 [2123]",
  "wg12-large": "YellM 0,2 [2124]",
  "wg13-small": "CuvGal 0,1 [2125]",
  "wg13-large": "CuvGal 0,2 [2126]",
  "wg14-small": "WeinSch 0,1 [2127]",
  "wg14-large": "WeinSch 0,2 [2128]",
  // Aperitifs & Spirits
  "dr1":  "Aperol [2201]",
  "dr2":  "Cynar [2202]",
  "dr3":  "Campari [2203]",
  "dr17": "Kir [2204]",
  "dr18": "KirRoy [2205]",
  "dr19": "Select [2206]",
  "dr20": "Pastis [2207]",
  // Beer
  "dr5": "PilsU [2301]",
  "dr6": "Stort [2302]",
  "dr4": "PiconB [2303]",
  // Soft Drinks
  "dr7":  "FritzC [2401]",
  "dr8":  "LimoG [2402]",
  "dr9":  "LimoO [2403]",
  "dr10": "LimoM [2404]",
  "dr11": "LimoPamp [2405]",
  // Juices & Water
  "rahbarb_saft-small":    "RhabSaft 0,2 [2501]",
  "rahbarb_saft-large":    "RhabSaft 0,4 [2502]",
  "rhabarb_schorle-small": "RhabSch 0,2 [2503]",
  "rhabarb_schorle-large": "RhabSch 0,4 [2504]",
  "apfel_schorle-small":   "ApfSch 0,2 [2505]",
  "apfel_schorle-large":   "ApfSch 0,4 [2506]",
  "apfel_saft-small":      "ApfSaft 0,2 [2507]",
  "apfel_saft-large":      "ApfSaft 0,4 [2508]",
  "wasser_sprudel-small":  "WassSprud 0,2 [2509]",
  "wasser_sprudel-large":  "WassSprud 0,4 [2510]",
  "wasser-small":          "Wass 0,2 [2511]",
  "wasser-large":          "Wass 0,4 [2512]",
  // Schnaps
  "cognac-small":        "Cogn 0,2 [2601]",
  "cognac-large":        "Cogn 0,4 [2602]",
  "calvados-small":      "Calv 0,2 [2603]",
  "calvados-large":      "Calv 0,4 [2604]",
  "mirabelle-small":     "Mira 0,2 [2605]",
  "mirabelle-large":     "Mira 0,4 [2606]",
  "jameson-small":       "Jame 0,2 [2607]",
  "jameson-large":       "Jame 0,4 [2608]",
  "creme_calvados-small": "CremCalv 0,2 [2609]",
  "creme_calvados-large": "CremCalv 0,4 [2610]",
  // Teas
  "te1": "PfefMin [2701]",
  "te2": "Kamil [2702]",
  "te3": "Salb [2703]",
  "te4": "Kraut [2704]",
  "te5": "BergT [2705]",
  "te6": "Thym [2706]",
  "te7": "HeissZ [2707]",
  "te8": "HeissO [2708]",
  // Coffee
  "co1": "Espr [2801]",
  "co2": "CafCr [2802]",

  // Bottles — White
  "picpoul_bottle-here":         "Picpoul Fl H [3101]",
  "picpoul_bottle-togo":         "Picpoul Fl TG [3102]",
  "sauvignon_bottle-here":       "SauB Fl H [3103]",
  "sauvignon_bottle-togo":       "SauB Fl TG [3104]",
  "grauburgunder_bottle-here":   "Grau Fl H [3105]",
  "grauburgunder_bottle-togo":   "Grau Fl TG [3106]",
  "sancerre_bottle-here":        "Sanc Fl H [3107]",
  "sancerre_bottle-togo":        "Sanc Fl TG [3108]",
  "chablis_bottle":              "Chab Fl [3109]",
  "riesling_bottle-here":        "Riesl Fl H [3110]",
  "riesling_bottle-togo":        "Riesl Fl TG [3111]",
  "entre_deux_mers_bottle-here": "EdM Fl H [3112]",
  "entre_deux_mers_bottle-togo": "EdM Fl TG [3113]",
  "zotz_bottle-here":            "Zotz Fl H [3114]",
  "zotz_bottle-togo":            "Zotz Fl TG [3115]",
  "rocailles_bottle":            "Roca Fl [3116]",
  "divin_sauv_bottle-here":      "DivSauB Fl H [3117]",
  "divin_sauv_bottle-togo":      "DivSauB Fl TG [3118]",
  // Bottles — Rosé
  "brise_marine_bottle-here":  "BrisMar Fl H [3201]",
  "brise_marine_bottle-togo":  "BrisMar Fl TG [3202]",
  "aurore_boreale_bottle-here": "AurBor Fl H [3203]",
  "aurore_boreale_bottle-togo": "AurBor Fl TG [3204]",
  "petnat_rose_bottle-here":   "PetNatR Fl H [3205]",
  "petnat_rose_bottle-togo":   "PetNatR Fl TG [3206]",
  // Bottles — Sparkling
  "cidre_bottle-here":   "Cidre Fl H [3301]",
  "cidre_bottle-togo":   "Cidre Fl TG [3302]",
  "cremant_bottle-here": "Crem Fl H [3303]",
  "cremant_bottle-togo": "Crem Fl TG [3304]",
  "prosecco_bottle-here": "Prosc Fl H [3305]",
  "prosecco_bottle-togo": "Prosc Fl TG [3306]",
  "sekt_bottle-here":    "Sekt Fl H [3307]",
  "sekt_bottle-togo":    "Sekt Fl TG [3308]",
  "petnat_bottle-here":  "PetNat Fl H [3309]",
  "petnat_bottle-togo":  "PetNat Fl TG [3310]",
  // Bottles — Red
  "montepulciano_bottle-here":    "Montep Fl H [3401]",
  "montepulciano_bottle-togo":    "Montep Fl TG [3402]",
  "gamay_bottle-here":            "Gamay Fl H [3403]",
  "gamay_bottle-togo":            "Gamay Fl TG [3404]",
  "carignan_bottle-here":         "Carig Fl H [3405]",
  "carignan_bottle-togo":         "Carig Fl TG [3406]",
  "graves_bottle-here":           "Grav Fl H [3407]",
  "graves_bottle-togo":           "Grav Fl TG [3408]",
  "malbec_bottle-here":           "Malb Fl H [3409]",
  "malbec_bottle-togo":           "Malb Fl TG [3410]",
  "crozes_hermitage_bottle-here": "CrozHer Fl H [3411]",
  "crozes_hermitage_bottle-togo": "CrozHer Fl TG [3412]",
  "der_roth_bottle-here":         "DerRoth Fl H [3413]",
  "der_roth_bottle-togo":         "DerRoth Fl TG [3414]",
  "primitivo_bottle-here":        "Primit Fl H [3415]",
  "primitivo_bottle-togo":        "Primit Fl TG [3416]",
  // Bottles — Natural
  "pinot_grisant_bottle-here":    "PinGri Fl H [3501]",
  "pinot_grisant_bottle-togo":    "PinGri Fl TG [3502]",
  "ca_va_le_faire_bottle-here":   "CavFaire Fl H [3503]",
  "ca_va_le_faire_bottle-togo":   "CavFaire Fl TG [3504]",
  "bonne_mine_bottle-here":       "BonMin Fl H [3505]",
  "bonne_mine_bottle-togo":       "BonMin Fl TG [3506]",
  "yellow_muskat_bottle-here":    "YellM Fl H [3507]",
  "yellow_muskat_bottle-togo":    "YellM Fl TG [3508]",
  "clairette_bottle-here":        "Clair Fl H [3509]",
  "clairette_bottle-togo":        "Clair Fl TG [3510]",
  "infrarouge_bottle-here":       "Infra Fl H [3511]",
  "infrarouge_bottle-togo":       "Infra Fl TG [3512]",
  "grenache_bottle-here":         "Gren Fl H [3513]",
  "grenache_bottle-togo":         "Gren Fl TG [3514]",
  "cuvee_galets_bottle-here":     "CuvGal Fl H [3515]",
  "cuvee_galets_bottle-togo":     "CuvGal Fl TG [3516]",
  // Bottles — Water
  "wasser_sprudel_bottle-here": "SprudWass Fl H [3601]",
  "wasser_sprudel_bottle-togo": "SprudWass Fl TG [3602]",
  "wasser_bottle-here":         "Wass Fl H [3603]",
  "wasser_bottle-togo":         "Wass Fl TG [3604]",
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
