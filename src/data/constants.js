export const TABLES = [
  { isDivider: true, label: "Inside" },
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
  { id: "ToGo", label: "Fl. To Go" },
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
    // Cheese & Charcuterie (posName omitted where it equals shortName)
    { id: "f1", name: "Small Cheese Plate", shortName: "CP KL", price: 10, subcategory: "cheese", posId: "11" },
    { id: "f2", name: "Cheese Plate", shortName: "CP", price: 11, subcategory: "cheese", posId: "10" },
    { id: "f4", name: "Charcuterie Klein", shortName: "CH KL", price: 11, subcategory: "cheese", posId: "16" },
    { id: "f32", name: "Charcuterie Gross", shortName: "CH GR", price: 22, subcategory: "cheese", posId: "17" },
    { id: "f5", name: "Mixed Plate", shortName: "MIX", price: 25, subcategory: "cheese", posId: "12" },
    { id: "f29", name: "Charcuterie dazu", shortName: "CH Dazu", price: 6.5, subcategory: "cheese", posId: "18" },
    // Hot Dishes
    { id: "f6", name: "Marcelin Chaud", shortName: "STM", price: 9, subcategory: "warm", posId: "418" },
    { id: "f7", name: "Camembert Rôti", shortName: "CAM", price: 17, subcategory: "warm", posId: "401" },
    { id: "f8", name: "Mont d'Or", shortName: "Mont d'Or", price: 29, subcategory: "warm", posId: "421" },
    { id: "f9", name: "Tartiflette", shortName: "Tartif", price: 15, subcategory: "warm", posId: "21" },
    { id: "f10", name: "Tartiflette + Speck", shortName: "Tartif + Speck", price: 17, subcategory: "warm", posId: "21-1" },
    { id: "f11", name: "Raclette", shortName: "Raclette", price: 28, subcategory: "warm", posId: "24" },
    { id: "f12", name: "Fondue", shortName: "Fondue", price: 28, subcategory: "warm", posId: "23" },
    { id: "f28", name: "Fondue Alkoholfrei", shortName: "Fondue Alkfrei", price: 28, subcategory: "warm", posId: "23" },
    { id: "f30", name: "Tartine", shortName: "Tartine", price: 13.5, subcategory: "warm", posId: "26" },
    { id: "f31", name: "Tartine + Schinken", shortName: "Tartine + Schinken", price: 15.5, subcategory: "warm", posId: "26-1" },
    { id: "f33", name: "Chicorée Caramel", shortName: "CHIC", price: 15, subcategory: "warm", posId: "22" },
    // Salads
    { id: "f17", name: "Basic", shortName: "BASIS", price: 7, subcategory: "salads", posId: "40" },
    { id: "f13", name: "Seguin", shortName: "SEG", price: 12.5, subcategory: "salads", posId: "41" },
    { id: "f21", name: "Seguin + Speck", shortName: "SEG + Speck", price: 14.5, subcategory: "salads", posId: "41-1" },
    { id: "f14", name: "Papillon", shortName: "PAP", price: 13.5, subcategory: "salads", posId: "43" },
    { id: "f22", name: "Papillon + Serrano", shortName: "PAP + Serrano", price: 15.5, subcategory: "salads", posId: "43-1" },
    { id: "f15", name: "Bauern", shortName: "BAU", price: 12.5, subcategory: "salads", posId: "44" },
    { id: "f23", name: "Bauern + Kartoffeln", shortName: "BAU + Kartoffeln", price: 15, subcategory: "salads", posId: "44" },
    { id: "f16", name: "Porthos", shortName: "POT", price: 13, subcategory: "salads", posId: "42" },
    { id: "f24", name: "Porthos + Serrano", shortName: "POT + Serrano", price: 15, subcategory: "salads", posId: "42-1" },
    // Dessert
    { id: "f18", name: "Tarte Tatin", shortName: "TT", price: 7, subcategory: "snacks", posId: "30" },
    { id: "f27", name: "Tarte Tatin + Calvados", shortName: "TT + Calva", price: 10, subcategory: "snacks", posId: "30-1" },
    { id: "f19", name: "Olives", shortName: "OLV", price: 3, subcategory: "snacks", posId: "9" },
    { id: "f20", name: "Olives + Grissini", shortName: "OLV + Grissini", price: 5.5, subcategory: "snacks", posId: "9-1" },
    // Extras
    { id: "f26", name: "Cornichons", shortName: "Cornichons", price: 2.5, subcategory: "extras", posId: "20" },
    { id: "f34", name: "Bratkartoffeln", shortName: "Bratkart", price: 4, subcategory: "extras", posId: "20" },
    { id: "f35", name: "Salzkartoffeln", shortName: "Salzkart", price: 3, subcategory: "extras", posId: "20" },
  ],
  "Wines": [
    // White wines - Full variant structure for CMS flexibility
    {
      id: "sancerre_bottle",
      name: "Sancerre Fl.",
      shortName: "Sanc",
      subcategory: "white",
      variants: [
        { type: "here", price: 38, label: "Here", posId: "255", posName: "Sanc Fl." },
        { type: "togo", price: 27.5, label: "Fl. To Go", posId: "255", posName: "Sanc Fl. To Go" }
      ]
    },
    {
      id: "chablis_bottle",
      name: "Chablis Fl.",
      shortName: "Chab",
      subcategory: "white",
      variants: [
        { type: "here", price: 38, label: "Here", posId: "259", posName: "Chab Fl." },
        { type: "togo", price: 27.5, label: "Fl. To Go", posId: "259", posName: "Chab Fl. To Go" }
      ]
    },
    {
      id: "riesling_bottle",
      name: "Riesling Fl.",
      shortName: "Riesl",
      subcategory: "white",
      variants: [
        { type: "here", price: 24.5, label: "Here", posId: "257", posName: "Riesl Fl." },
        { type: "togo", price: 13, label: "Fl. To Go", posId: "257", posName: "Riesl Fl. To Go" }
      ]
    },
    {
      id: "entre_deux_mers_bottle",
      name: "Entre-Deux-Mers Fl.",
      shortName: "EdM",
      subcategory: "white",
      variants: [
        { type: "here", price: 23, label: "Here", posId: "252", posName: "EdM Fl." },
        { type: "togo", price: 12.5, label: "Fl. To Go", posId: "252", posName: "EdM Fl. To Go" }
      ]
    },
    {
      id: "zotz_bottle",
      name: "Zotz Fl.",
      shortName: "Zotz",
      subcategory: "white",
      variants: [
        { type: "here", price: 25.5, label: "Here", posId: "260", posName: "Zotz Fl." },
        { type: "togo", price: 14, label: "Fl. To Go", posId: "260", posName: "Zotz Fl. To Go" }
      ]
    },
    {
      id: "rocailles_bottle",
      name: "Rocailles Fl.",
      shortName: "Roca",
      subcategory: "white",
      variants: [
        { type: "here", price: 25.5, label: "Here", posId: "261", posName: "Roca Fl." },
        { type: "togo", price: 14, label: "Fl. To Go", posId: "261", posName: "Roca Fl. To Go" }
      ]
    },
    {
      id: "divin_sauv_bottle",
      name: "Divin Sauvignon Blanc Fl.",
      shortName: "DivSauB",
      subcategory: "white",
      variants: [
        { type: "here", price: 25.5, label: "Here", posId: "152", posName: "DivSauB Fl." },
        { type: "togo", price: 14, label: "Fl. To Go", posId: "152", posName: "DivSauB Fl. To Go" }
      ]
    },
    // Rosé
    {
      id: "aurore_boreale_bottle",
      name: "Aurore Boréale Fl.",
      shortName: "AurBor",
      subcategory: "rosé",
      variants: [
        { type: "here", price: 28, label: "Here", posId: "282", posName: "AurBor Fl." },
        { type: "togo", price: 17.5, label: "Fl. To Go", posId: "282", posName: "AurBor Fl. To Go" }
      ]
    },
    {
      id: "petnat_rose_bottle",
      name: "Pét-Nat Rosé Fl.",
      shortName: "PetNatR",
      subcategory: "rosé",
      variants: [
        { type: "here", price: 33, label: "Here", posId: "199", posName: "PetNatR Fl." },
        { type: "togo", price: 20, label: "Fl. To Go", posId: "199", posName: "PetNatR Fl. To Go" }
      ]
    },
    // Sparkling
    {
      id: "cremant_bottle",
      name: "Crémant Fl.",
      shortName: "Crem",
      subcategory: "sparkling",
      variants: [
        { type: "here", price: 35, label: "Here", posId: "273", posName: "Crem Fl." },
        { type: "togo", price: 26.5, label: "Fl. To Go", posId: "273", posName: "Crem Fl. To Go" }
      ]
    },
    {
      id: "prosecco_bottle",
      name: "Prosecco Fl.",
      shortName: "Prosc",
      subcategory: "sparkling",
      variants: [
        { type: "here", price: 23, label: "Here", posId: "272", posName: "Prosc Fl." },
        { type: "togo", price: 12.5, label: "Fl. To Go", posId: "272", posName: "Prosc Fl. To Go" }
      ]
    },
    // Red wines
    {
      id: "graves_bottle",
      name: "Graves Fl.",
      shortName: "Grav",
      subcategory: "red",
      variants: [
        { type: "here", price: 32, label: "Here", posId: "211", posName: "Grav Fl." },
        { type: "togo", price: 21.5, label: "Fl. To Go", posId: "211", posName: "Grav Fl. To Go" }
      ]
    },
    {
      id: "malbec_bottle",
      name: "Malbec Fl.",
      shortName: "Malb",
      subcategory: "red",
      variants: [
        { type: "here", price: 29, label: "Here", posId: "206", posName: "Malb Fl." },
        { type: "togo", price: 18.5, label: "Fl. To Go", posId: "206", posName: "Malb Fl. To Go" }
      ]
    },
    {
      id: "crozes_hermitage_bottle",
      name: "Crozes-Hermitage Fl.",
      shortName: "CrozHer",
      subcategory: "red",
      variants: [
        { type: "here", price: 48, label: "Here", posId: "204", posName: "CrozHer Fl." },
        { type: "togo", price: 24.5, label: "Fl. To Go", posId: "204", posName: "CrozHer Fl. To Go" }
      ]
    },
    {
      id: "der_roth_bottle",
      name: "Der Roth Fl.",
      shortName: "DerRoth",
      subcategory: "red",
      variants: [
        { type: "here", price: 26, label: "Here", posId: "212", posName: "DerRoth Fl." },
        { type: "togo", price: 15.5, label: "Fl. To Go", posId: "212", posName: "DerRoth Fl. To Go" }
      ]
    },
    {
      id: "primitivo_bottle",
      name: "Primitivo Fl.",
      shortName: "Primit",
      subcategory: "red",
      variants: [
        { type: "here", price: 32, label: "Here", posId: "213", posName: "Primit Fl." },
        { type: "togo", price: 21.5, label: "Fl. To Go", posId: "213", posName: "Primit Fl. To Go" }
      ]
    },
    {
      id: "st_emilion_bottle",
      name: "St. Emilion Fl.",
      shortName: "StEmilion",
      subcategory: "red",
      variants: [
        { type: "here", price: 29, label: "Here", posId: "209", posName: "StEmi Fl." },
        { type: "togo", price: 18.5, label: "Fl. To Go", posId: "209", posName: "StEmi Fl. To Go" }
      ]
    },
    // Natural wines
    {
      id: "pinot_grisant_bottle",
      name: "Pinot Grisant Fl.",
      shortName: "PinGri",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here", posId: "248", posName: "PinGri Fl." },
        { type: "togo", price: 17, label: "Fl. To Go", posId: "248", posName: "PinGri Fl. To Go" }
      ]
    },
    {
      id: "ca_va_le_faire_bottle",
      name: "Ça va le faire Fl.",
      shortName: "CavFaire",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here", posId: "192", posName: "CavFaire Fl." },
        { type: "togo", price: 17, label: "Fl. To Go", posId: "192", posName: "CavFaire Fl. To Go" }
      ]
    },
    {
      id: "bonne_mine_bottle",
      name: "Bonne Mine Fl.",
      shortName: "BonMin",
      subcategory: "natural",
      variants: [
        { type: "here", price: 32, label: "Here", posId: "242", posName: "BonMin Fl." },
        { type: "togo", price: 17, label: "Fl. To Go", posId: "242", posName: "BonMin Fl. To Go" }
      ]
    },
    {
      id: "clairette_bottle",
      name: "Clairette Fl.",
      shortName: "Clair",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here", posId: "229", posName: "Clair Fl." },
        { type: "togo", price: 17, label: "Fl. To Go", posId: "229", posName: "Clair Fl. To Go" }
      ]
    },
    {
      id: "infrarouge_bottle",
      name: "Infrarouge Fl.",
      shortName: "Infra",
      subcategory: "natural",
      variants: [
        { type: "here", price: 29, label: "Here", posId: "227", posName: "Infra Fl." },
        { type: "togo", price: 19, label: "Fl. To Go", posId: "227", posName: "Infra Fl. To Go" }
      ]
    },
    {
      id: "grenache_bottle",
      name: "Grenache Fl.",
      shortName: "Gren",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here", posId: "241", posName: "Gren Fl." },
        { type: "togo", price: 17, label: "Fl. To Go", posId: "241", posName: "Gren Fl. To Go" }
      ]
    },
    {
      id: "tete_claques_bottle",
      name: "Tête à Claques Fl.",
      shortName: "TeteCla",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here", posId: "246", posName: "TeteCla Fl." },
        { type: "togo", price: 17, label: "Fl. To Go", posId: "246", posName: "TeteCla Fl. To Go" }
      ]
    },
    {
      id: "deferlante_rouge_bottle",
      name: "Déferlante Rouge Fl.",
      shortName: "DefRouge",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here", posId: "239", posName: "DefRouge Fl." },
        { type: "togo", price: 17, label: "Fl. To Go", posId: "239", posName: "DefRouge Fl. To Go" }
      ]
    },
    {
      id: "ya_plus_qua_bottle",
      name: "Y'a plus qu'à Fl.",
      shortName: "YaPlusQ",
      subcategory: "natural",
      variants: [
        { type: "here", price: 29, label: "Here", posId: "226", posName: "YaPlusQ Fl." },
        { type: "togo", price: 16, label: "Fl. To Go", posId: "226", posName: "YaPlusQ Fl. To Go" }
      ]
    },
    {
      id: "divin_rose_bottle",
      name: "Divin Rosé Fl.",
      shortName: "DivRose",
      subcategory: "natural",
      variants: [
        { type: "here", price: 25.5, label: "Here", posId: "151", posName: "DivRose Fl." },
        { type: "togo", price: 14, label: "Fl. To Go", posId: "151", posName: "DivRose Fl. To Go" }
      ]
    },
    {
      id: "cremant_alsace_bottle",
      name: "Crémant d'Alsace Fl.",
      shortName: "CremAls",
      subcategory: "natural",
      variants: [
        { type: "here", price: 24, label: "Here", posId: "191", posName: "CremAls Fl." },
        { type: "togo", price: 21, label: "Fl. To Go", posId: "191", posName: "CremAls Fl. To Go" }
      ]
    },
    {
      id: "vi_no_bottle",
      name: "Vi-No Fl.",
      shortName: "ViNo",
      subcategory: "natural",
      variants: [
        { type: "here", price: 25.5, label: "Here", posId: "153", posName: "ViNo Fl." },
        { type: "togo", price: 14, label: "Fl. To Go", posId: "153", posName: "ViNo Fl. To Go" }
      ]
    },
    {
      id: "fritz_muller_bottle",
      name: "Fritz Müller Fl.",
      shortName: "FritzM",
      subcategory: "natural",
      variants: [
        { type: "here", price: 25.5, label: "Here", posId: "150", posName: "FritzM Fl." },
        { type: "togo", price: 14, label: "Fl. To Go", posId: "150", posName: "FritzM Fl. To Go" }
      ]
    },
    {
      id: "divin_pinot_noir_bottle",
      name: "Divin Pinot Noir Fl.",
      shortName: "DivPinNoir",
      subcategory: "natural",
      variants: [
        { type: "here", price: 29, label: "Here", posId: "154", posName: "DivPinNoir Fl." },
        { type: "togo", price: 18.5, label: "Fl. To Go", posId: "154", posName: "DivPinNoir Fl. To Go" }
      ]
    },
  ],
  "Drinks": [
    // Wines by Glass - White WITH SIZE VARIANTS
    {
      id: "wg1",
      name: "Picpoul",
      shortName: "PP",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3.5, label: "0,1", posId: "251-1", posName: "Picpoul 0,1" },
        { type: "large", price: 6.5, label: "0,2", posId: "251-2", posName: "Picpoul 0,2" },
        { type: "here", price: 22.5, label: "Fl.", posId: "251", posName: "Picpoul Fl.", bottleSubcategory: "white" },
        { type: "togo", price: 11.5, label: "Fl. To Go", posId: "251", posName: "Picpoul Fl. To Go", bottleSubcategory: "white" }
      ]
    },
    {
      id: "wg2",
      name: "Sauvignon Blanc",
      shortName: "SB",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3.5, label: "0,1", posId: "256-1", posName: "SauB 0,1" },
        { type: "large", price: 7, label: "0,2", posId: "256-2", posName: "SauB 0,2" },
        { type: "here", price: 24, label: "Fl.", posId: "256", posName: "SauB Fl.", bottleSubcategory: "white" },
        { type: "togo", price: 12.5, label: "Fl. To Go", posId: "256", posName: "SauB Fl. To Go", bottleSubcategory: "white" }
      ]
    },
    {
      id: "wg3",
      name: "Grauburgunder",
      shortName: "GB",
      subcategory: "wine",
      variants: [
        { type: "small", price: 4, label: "0,1", posId: "254-1", posName: "Grau 0,1" },
        { type: "large", price: 7.5, label: "0,2", posId: "254-2", posName: "Grau 0,2" },
        { type: "here", price: 25.5, label: "Fl.", posId: "254", posName: "Grau Fl.", bottleSubcategory: "white" },
        { type: "togo", price: 14, label: "Fl. To Go", posId: "254", posName: "Grau Fl. To Go", bottleSubcategory: "white" }
      ]
    },
    {
      id: "wg4",
      name: "Brise Marine",
      shortName: "BM",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3.5, label: "0,1", posId: "281-1", posName: "BrisMar 0,1" },
        { type: "large", price: 7, label: "0,2", posId: "281-2", posName: "BrisMar 0,2" },
        { type: "here", price: 24, label: "Fl.", posId: "281", posName: "BrisMar Fl.", bottleSubcategory: "rosé" },
        { type: "togo", price: 12.5, label: "Fl. To Go", posId: "281", posName: "BrisMar Fl. To Go", bottleSubcategory: "rosé" }
      ]
    },
    {
      id: "wg5",
      name: "Divin Sauvignon Blanc",
      shortName: "Divin SB",
      subcategory: "wine",
      variants: [
        { type: "small", price: 4, label: "0,1", posId: "152-1", posName: "DivSauB 0,1" },
        { type: "large", price: 7.5, label: "0,2", posId: "152-2", posName: "DivSauB 0,2" },
        { type: "here", price: 25.5, label: "Fl.", posId: "152", posName: "DivSauB Fl.", bottleSubcategory: "white" },
        { type: "togo", price: 14, label: "Fl. To Go", posId: "152", posName: "DivSauB Fl. To Go", bottleSubcategory: "white" }
      ]
    },
    // Wines by Glass - Sparkling WITH SIZE VARIANTS
    {
      id: "wg6",
      name: "Cidre",
      shortName: "Cidre",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3, label: "0,1", posId: "299-1", posName: "Cidre 0,1" },
        { type: "large", price: 6, label: "0,2", posId: "299-2", posName: "Cidre 0,2" },
        { type: "here", price: 21, label: "Fl.", posId: "299", posName: "Cidre Fl.", bottleSubcategory: "sparkling" },
        { type: "togo", price: 10.5, label: "Fl. To Go", posId: "299", posName: "Cidre Fl. To Go", bottleSubcategory: "sparkling" }
      ]
    },
    {
      id: "wg7",
      name: "Sekt",
      shortName: "Sekt",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3.5, label: "0,1", posId: "271-1", posName: "Sekt 0,1" },
        { type: "large", price: 7, label: "0,2", posId: "271-2", posName: "Sekt 0,2" },
        { type: "here", price: 28, label: "Fl.", posId: "271", posName: "Sekt Fl.", bottleSubcategory: "sparkling" },
        { type: "togo", price: 17.5, label: "Fl. To Go", posId: "271", posName: "Sekt Fl. To Go", bottleSubcategory: "sparkling" }
      ]
    },
    {
      id: "wg8",
      name: "Pét-Nat",
      shortName: "PetNat",
      subcategory: "wine",
      variants: [
        { type: "small", price: 4, label: "0,1", posId: "198-1", posName: "PetNat 0,1" },
        { type: "large", price: 8, label: "0,2", posId: "198-2", posName: "PetNat 0,2" },
        { type: "here", price: 36, label: "Fl.", posId: "198", posName: "PetNat Fl.", bottleSubcategory: "sparkling" },
        { type: "togo", price: 20, label: "Fl. To Go", posId: "198", posName: "PetNat Fl. To Go", bottleSubcategory: "sparkling" }
      ]
    },
    // Wines by Glass - Red WITH SIZE VARIANTS
    {
      id: "wg9",
      name: "Montepulciano",
      shortName: "Monte",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3.5, label: "0,1", posId: "205-1", posName: "Montep 0,1" },
        { type: "large", price: 6.5, label: "0,2", posId: "205-2", posName: "Montep 0,2" },
        { type: "here", price: 22.5, label: "Fl.", posId: "205", posName: "Montep Fl.", bottleSubcategory: "red" },
        { type: "togo", price: 11, label: "Fl. To Go", posId: "205", posName: "Montep Fl. To Go", bottleSubcategory: "red" }
      ]
    },
    {
      id: "wg10",
      name: "Gamay",
      shortName: "Gamay",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3.5, label: "0,1", posId: "202-1", posName: "Gamay 0,1" },
        { type: "large", price: 7.5, label: "0,2", posId: "202-2", posName: "Gamay 0,2" },
        { type: "here", price: 25.5, label: "Fl.", posId: "202", posName: "Gamay Fl.", bottleSubcategory: "red" },
        { type: "togo", price: 14, label: "Fl. To Go", posId: "202", posName: "Gamay Fl. To Go", bottleSubcategory: "red" }
      ]
    },
    {
      id: "wg11",
      name: "Carignan",
      shortName: "Car",
      subcategory: "wine",
      variants: [
        { type: "small", price: 4, label: "0,1", posId: "208-1", posName: "Carig 0,1" },
        { type: "large", price: 8, label: "0,2", posId: "208-2", posName: "Carig 0,2" },
        { type: "here", price: 27, label: "Fl.", posId: "208", posName: "Carig Fl.", bottleSubcategory: "red" },
        { type: "togo", price: 15.5, label: "Fl. To Go", posId: "208", posName: "Carig Fl. To Go", bottleSubcategory: "red" }
      ]
    },
    // Wines by Glass - Other WITH SIZE VARIANTS
    {
      id: "wg12",
      name: "Yellow Muskateller",
      shortName: "Y. Muskat",
      subcategory: "wine",
      variants: [
        { type: "small", price: 4.5, label: "0,1", posId: "194-1", posName: "YellM 0,1" },
        { type: "large", price: 9, label: "0,2", posId: "194-2", posName: "YellM 0,2" },
        { type: "here", price: 30, label: "Fl.", posId: "194", posName: "YellM Fl.", bottleSubcategory: "natural" },
        { type: "togo", price: 17, label: "Fl. To Go", posId: "194", posName: "YellM Fl. To Go", bottleSubcategory: "natural" }
      ]
    },
    {
      id: "wg13",
      name: "Cuvée des Galets",
      shortName: "C. Galets",
      subcategory: "wine",
      variants: [
        { type: "small", price: 4.5, label: "0,1", posId: "280-1", posName: "CuvGal 0,1" },
        { type: "large", price: 9, label: "0,2", posId: "280-2", posName: "CuvGal 0,2" },
        { type: "here", price: 27, label: "Fl.", posId: "280", posName: "CuvGal Fl.", bottleSubcategory: "natural" },
        { type: "togo", price: 17, label: "Fl. To Go", posId: "280", posName: "CuvGal Fl. To Go", bottleSubcategory: "natural" }
      ]
    },
    {
      id: "wg15",
      name: "Vino Verde",
      shortName: "VV",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3.5, label: "0,1", posId: "253-1", posName: "VV 0,1" },
        { type: "large", price: 7, label: "0,2", posId: "253-2", posName: "VV 0,2" },
        { type: "here", price: 24, label: "Fl.", posId: "253", posName: "VV Fl.", bottleSubcategory: "white" },
        { type: "togo", price: 12.5, label: "Fl. To Go", posId: "253", posName: "VV Fl. To Go", bottleSubcategory: "white" }
      ]
    },
    // Weinschorle WITH SIZE VARIANTS
    {
      id: "wg14",
      name: "Weißweinschorle",
      shortName: "WWS",
      subcategory: "soft",
      variants: [
        { type: "small", price: 3, label: "0,1", posId: "69-1", posName: "WeinSch 0,1" },
        { type: "large", price: 6, label: "0,2", posId: "69-2", posName: "WeinSch 0,2" }
      ]
    },
    // Aperitifs & Spirits (posName omitted where it equals shortName)
    { id: "dr1", name: "Aperol", shortName: "Aperol", price: 8, subcategory: "cocktail", posId: "73" },
    { id: "dr2", name: "Cynar", shortName: "Cynar", price: 8, subcategory: "cocktail", posId: "76" },
    { id: "dr3", name: "Campari", shortName: "Campari", price: 8, subcategory: "cocktail", posId: "74" },
    { id: "dr17", name: "Kir", shortName: "Kir", price: 5, subcategory: "cocktail", posId: "71" },
    { id: "dr18", name: "Kir Royal", shortName: "Kir R.", price: 7.5, subcategory: "cocktail", posId: "72" },
    { id: "dr19", name: "Select", shortName: "Select", price: 8, subcategory: "cocktail", posId: "75" },
    { id: "dr20", name: "Pastis", shortName: "Pastis", price: 6, subcategory: "cocktail", posId: "67" },
    // Beer
    { id: "dr5", name: "Pilsner Urquell", shortName: "PU", price: 3.8, subcategory: "bier", posId: "64" },
    { id: "dr6", name: "Störtebecker", shortName: "Störte", price: 3.8, subcategory: "bier", posId: "66" },
    { id: "dr4", name: "Picon Bière", shortName: "Picon", price: 4.8, subcategory: "bier", posId: "65" },
    // Soft Drinks
    { id: "dr7", name: "Fritz Cola", shortName: "Cola", price: 3.7, subcategory: "soft", posId: "54" },
    { id: "dr8", name: "Limo Granada", shortName: "Limo Granada", price: 3.8, subcategory: "soft", posId: "55-1" },
    { id: "dr9", name: "Limo Orange", shortName: "Limo Orange", price: 3.8, subcategory: "soft", posId: "55-2" },
    { id: "dr10", name: "Limo Minze", shortName: "Limo Minze", price: 3.8, subcategory: "soft", posId: "55-3" },
    { id: "dr11", name: "Limo Pamplemousse", shortName: "Limo Grapefruit", price: 3.8, subcategory: "soft", posId: "55-4" },
    // Juices & Water WITH SIZE VARIANTS
    {
      id: "rahbarb_saft",
      name: "Rhabarber Saft",
      shortName: "R. Saft",
      subcategory: "soft",
      variants: [
        { type: "small", price: 3.5, label: "0,2", posId: "56-1", posName: "RhabSaft klein" },
        { type: "large", price: 4.7, label: "0,4", posId: "57-1", posName: "RhabSaft groß" }
      ]
    },
    {
      id: "rhabarb_schorle",
      name: "Rhabarber Schorle",
      shortName: "R. Schorle",
      subcategory: "soft",
      variants: [
        { type: "small", price: 3, label: "0,2", posId: "58-1", posName: "RhabSch klein" },
        { type: "large", price: 4, label: "0,4", posId: "59-1", posName: "RhabSch groß" }
      ]
    },
    {
      id: "apfel_schorle",
      name: "Apfelschorle",
      shortName: "A. Schorle",
      subcategory: "soft",
      variants: [
        { type: "small", price: 3, label: "0,2", posId: "58-2", posName: "ApfSch klein" },
        { type: "large", price: 4, label: "0,4", posId: "59-2", posName: "ApfSch groß" }
      ]
    },
    {
      id: "apfel_saft",
      name: "Apfelsaft",
      shortName: "A. Saft",
      subcategory: "soft",
      variants: [
        { type: "small", price: 3.5, label: "0,2", posId: "56-2", posName: "ApfSaft klein" },
        { type: "large", price: 4.7, label: "0,4", posId: "57-2", posName: "ApfSaft groß" }
      ]
    },
    {
      id: "wasser_sprudel_bottle",
      name: "Wasser Sprudel",
      shortName: "Sprud Wasser",
      subcategory: "soft",
      variants: [
        { type: "small", price: 1.5, label: "0,2", posId: "50-1", posName: "Sprudel klein" },
        { type: "large", price: 2.8, label: "0,4", posId: "51-1", posName: "Sprudel groß" },
        { type: "bottle", price: 5.5, label: "Fl.", posId: "52", posName: "Sprudel Fl." }
      ]
    },
    {
      id: "wasser_bottle",
      name: "Mineralwasser",
      shortName: "M. Wasser",
      subcategory: "soft",
      variants: [
        { type: "small", price: 1.5, label: "0,2", posId: "50-2", posName: "Wass klein" },
        { type: "large", price: 2.8, label: "0,4", posId: "51-2", posName: "Wass groß" },
        { type: "bottle", price: 5.5, label: "Fl.", posId: "52", posName: "Wasser Fl." }
      ]
    },
    { id: "leitungswasser", name: "Leitungswasser", shortName: "LW", price: 0, subcategory: "soft", posId: "0" },
    // Schnaps WITH SIZE VARIANTS
    {
      id: "cognac",
      name: "Cognac",
      shortName: "Cognac",
      subcategory: "schnaps",
      variants: [
        { type: "small", price: 4.5, label: "0,2", posId: "84", posName: "Cognac 0,2" },
        { type: "large", price: 8.5, label: "0,4", posId: "85", posName: "Cognac 0,4" }
      ]
    },
    {
      id: "calvados",
      name: "Calvados",
      shortName: "Calva",
      subcategory: "schnaps",
      variants: [
        { type: "small", price: 3.5, label: "0,2", posId: "86", posName: "Calvados 0,2" },
        { type: "large", price: 6.5, label: "0,4", posId: "87", posName: "Calvados 0,4" }
      ]
    },
    {
      id: "mirabelle",
      name: "Mirabelle",
      shortName: "Mirabelle",
      subcategory: "schnaps",
      variants: [
        { type: "small", price: 3, label: "0,2", posId: "80", posName: "Mirabelle 0,2" },
        { type: "large", price: 5.5, label: "0,4", posId: "81", posName: "Mirabelle 0,4" }
      ]
    },
    {
      id: "jameson",
      name: "Jameson",
      shortName: "Jameson",
      subcategory: "schnaps",
      variants: [
        { type: "small", price: 3, label: "0,2", posId: "82", posName: "Jameson 0,2" },
        { type: "large", price: 5.5, label: "0,4", posId: "83", posName: "Jameson 0,4" }
      ]
    },
    {
      id: "creme_calvados",
      name: "Crème de Calvados",
      shortName: "Crème de Calva",
      subcategory: "schnaps",
      variants: [
        { type: "small", price: 4, label: "0,2", posId: "88", posName: "Creme Calvados 0,2" },
        { type: "large", price: 7.5, label: "0,4", posId: "89", posName: "Creme Calvados 0,4" }
      ]
    },
    // Teas (posName omitted where it equals shortName)
    { id: "te1", name: "Pfefferminze", shortName: "PfefMin", price: 3, subcategory: "warm", posId: "93-1" },
    { id: "te2", name: "Kamille", shortName: "Kamil", price: 3, subcategory: "warm", posId: "93-2" },
    { id: "te3", name: "Salbei", shortName: "Salb", price: 3, subcategory: "warm", posId: "93-3" },
    { id: "te4", name: "Kräuter", shortName: "Kraut", price: 3, subcategory: "warm", posId: "93-4" },
    { id: "te5", name: "Bergtee", shortName: "BergT", price: 3.7, subcategory: "warm", posId: "94-1" },
    { id: "te6", name: "Thymian", shortName: "Thym", price: 3.7, subcategory: "warm", posId: "94-2" },
    { id: "te7", name: "Heiße Zitrone", shortName: "H. Zitrone", price: 3.7, subcategory: "warm", posId: "94-3", posName: "H. Zitrone" },
    { id: "te8", name: "Heiße Orange", shortName: "H. Orange", price: 5, subcategory: "warm", posId: "95", posName: "H. Orange" },
    // Coffee (posName differs from shortName - kept)
    { id: "co1", name: "Espresso", shortName: "Espresso", price: 1.9, subcategory: "warm", posId: "91", posName: "Espr" },
    { id: "co2", name: "Café Crème", shortName: "Café Crema", price: 2.6, subcategory: "warm", posId: "90", posName: "CafCr" },
  ],
  "Shop": [
    // Fish
    { id: "sh1", name: "Rillettes Thunfisch", shortName: "Rill Thun", price: 5.8, subcategory: "fish", posId: "965", posName: "Rillettes Lachs/Thunfisch" },
    { id: "sh2", name: "Rillettes Lachs", shortName: "Rill Lachs", price: 5.8, subcategory: "fish", posId: "965", posName: "Rillettes Lachs/Thunfisch" },
    // Spreads
    { id: "sh3", name: "Terrine 180g Schwein Speck", shortName: "Terr 180 Schw", price: 6.3, subcategory: "spreads", posId: "960", posName: "Terrine/Rillettes 180g" },
    { id: "sh4", name: "Terrine 180g Fines", shortName: "Terr 180 Fines", price: 6.3, subcategory: "spreads", posId: "960", posName: "Terrine/Rillettes 180g" },
    { id: "sh5", name: "Terrine 180g Lapin", shortName: "Terr 180 Lapin", price: 6.3, subcategory: "spreads", posId: "960", posName: "Terrine/Rillettes 180g" },
    { id: "sh6", name: "Terrine 180g Canard", shortName: "Terr 180 Canard", price: 6.3, subcategory: "spreads", posId: "960", posName: "Terrine/Rillettes 180g" },
    { id: "sh7", name: "Terrine 100g Canard", shortName: "Terr 100 Canard", price: 4.8, subcategory: "spreads", posId: "961", posName: "Terrine/Rillettes 100g" },
    { id: "sh8", name: "Terrine 100g Oie", shortName: "Terr 100 Oie", price: 4.8, subcategory: "spreads", posId: "961", posName: "Terrine/Rillettes 100g" },
    { id: "sh9", name: "Terrine 100g Riesling", shortName: "Terr 100 Riesl", price: 4.8, subcategory: "spreads", posId: "961", posName: "Terrine/Rillettes 100g" },
    { id: "sh10", name: "Makrele Sancerre", shortName: "Makrele", price: 6.7, subcategory: "fish", posId: "968", posName: "Makrele Sancerre" },
    { id: "sh11", name: "Sardinen Zitrone", shortName: "Sard Zitrone", price: 5.8, subcategory: "fish", posId: "967", posName: "Sardinen" },
    { id: "sh12", name: "Sardinen Olivenöl", shortName: "Sard Olivenöl", price: 5.8, subcategory: "fish", posId: "967", posName: "Sardinen" },
    { id: "sh13", name: "Sardinen Moutarde", shortName: "Sard Moutarde", price: 5.8, subcategory: "fish", posId: "967", posName: "Sardinen" },
    { id: "sh14", name: "Sardinen Echalotes", shortName: "Sard Echalot", price: 5.8, subcategory: "fish", posId: "967", posName: "Sardinen" },
    { id: "sh15", name: "Sardinen Olivenöl u. Zitrone", shortName: "Sard Öl+Zitr", price: 5.8, subcategory: "fish", posId: "967", posName: "Sardinen" },
    { id: "sh16", name: "Antipasti Zwei Tomaten", shortName: "Anti 2Tom", price: 4.9, subcategory: "spreads", posId: "948", posName: "Antipasti Creme" },
    { id: "sh17", name: "Antipasti Aubergine", shortName: "Anti Auberg", price: 4.9, subcategory: "spreads", posId: "948", posName: "Antipasti Creme" },
    { id: "sh18", name: "Antipasti Tomate Basilikum", shortName: "Anti Tom Bas", price: 4.9, subcategory: "spreads", posId: "948", posName: "Antipasti Creme" },
    { id: "sh19", name: "Kalamon Olivenpaste", shortName: "Oliv Paste", price: 6.75, subcategory: "spreads", posId: "903", posName: "Kalamon Olivenpaste" },
    { id: "sh20", name: "Konfiture Lavendel", shortName: "Konf Lavend", price: 4, subcategory: "spreads", posId: "941", posName: "Konfiture Lavendel" },
    { id: "sh21", name: "Fleur Orange", shortName: "Fleur Ora", price: 6.9, subcategory: "spreads", posId: "942", posName: "Fleur Orange" },
    { id: "sh22", name: "Confit Feige Walnuss", shortName: "Conf Feige", price: 4.9, subcategory: "spreads", posId: "940", posName: "Confit" },
    { id: "sh23", name: "Confit Apfel Calva", shortName: "Conf Apfel", price: 4.9, subcategory: "spreads", posId: "940", posName: "Confit" },
    { id: "sh24", name: "Confit Birne Wein", shortName: "Conf Birne", price: 4.9, subcategory: "spreads", posId: "940", posName: "Confit" },
    { id: "sh25", name: "Confit Aprikose Thym", shortName: "Conf Aprik", price: 4.9, subcategory: "spreads", posId: "940", posName: "Confit" },
    { id: "sh26", name: "Confit Mango Pfeffer", shortName: "Conf Mango", price: 4.9, subcategory: "spreads", posId: "940", posName: "Confit" },
    { id: "sh27", name: "Confit Zwiebel", shortName: "Conf Zwiebel", price: 4.9, subcategory: "spreads", posId: "940", posName: "Confit" },
    { id: "sh28", name: "Wildblumen Pinien Honig", shortName: "Honig Pinien", price: 6.5, subcategory: "spreads", posId: "910", posName: "Wildblumen Pinien Honig" },
    { id: "sh29", name: "Wildblumen Thymian Honig", shortName: "Honig Thym", price: 8, subcategory: "spreads", posId: "911", posName: "Wildblumen Thymian Honig" },
    // Snacks
    { id: "sh30", name: "SandButterkekse", shortName: "SandButt", price: 3.5, subcategory: "snacks", posId: "988", posName: "SandButterkekse" },
    { id: "sh31", name: "Waffelrölchen", shortName: "Waffel", price: 4.2, subcategory: "snacks", posId: "987", posName: "Waffelrölchen" },
    { id: "sh32", name: "Zarbitterschokolade Kekse", shortName: "Zarbit Keks", price: 3.8, subcategory: "snacks", posId: "996", posName: "Zarbitterschokolade Kekse" },
    { id: "sh33", name: "Vollmilch Schoko", shortName: "Vollm Schoko", price: 3.8, subcategory: "snacks", posId: "993", posName: "Vollmilch Schoko" },
    { id: "sh34", name: "Schokostückchen", shortName: "Schoko Stück", price: 3.8, subcategory: "snacks", posId: "990", posName: "Schokostückchen" },
    { id: "sh35", name: "Calisson", shortName: "Calisson", price: 1, subcategory: "snacks", posId: "980", posName: "Calisson" },
    { id: "sh36", name: "Schokotruffel Snack", shortName: "Schoko Truff", price: 2.5, subcategory: "snacks", posId: "981", posName: "Schokotruffel Snack" },
    { id: "sh37", name: "Trüffel Pops 100g", shortName: "Trüff Pops", price: 5, subcategory: "snacks", posId: "985", posName: "Trüffel Pops 100g" },
    { id: "sh38", name: "Natürtruffel", shortName: "Natürtruff", price: 5.8, subcategory: "snacks", posId: "983", posName: "Natürtruffel" },
    { id: "sh39", name: "Mandelgebäch mit Feige Toast", shortName: "Mandel Feige", price: 4.9, subcategory: "snacks", posId: "971", posName: "Mandelgebäch mit Feige Toast" },
    { id: "sh40", name: "Linguettes Olivenöl", shortName: "Ling Olivenöl", price: 6.8, subcategory: "snacks", posId: "976", posName: "Linguettes" },
    { id: "sh41", name: "Linguettes Rosmarin", shortName: "Ling Rosmarin", price: 6.8, subcategory: "snacks", posId: "976", posName: "Linguettes" },
    { id: "sh42", name: "Cracker", shortName: "Cracker", price: 4.9, subcategory: "snacks", posId: "975", posName: "Cracker" },
    { id: "sh43", name: "Biovette", shortName: "Biovette", price: 4.8, subcategory: "snacks", posId: "973", posName: "Biovette" },
    { id: "sh44", name: "Megakitiki Oliven", shortName: "Megakit Oliv", price: 6.5, subcategory: "snacks", posId: "901", posName: "Megakitiki Oliven" },
    { id: "sh55", name: "Chips Bonilla", shortName: "Chips Bon.", price: 2.3, subcategory: "snacks", posId: "978", posName: "Chips Bonilla" },
    { id: "sh56", name: "Feigenbrot Mandeln", shortName: "FeigenBrot Mand.", price: 6.5, subcategory: "snacks", posId: "952", posName: "Feigenbrot Mandeln" },
    // Bottles
    { id: "sh45", name: "Olivenöl 0,25l", shortName: "Olivenöl 0.25", price: 9, subcategory: "bottles", posId: "905", posName: "Olivenöl 0,25l" },
    { id: "sh46", name: "Olivenöl 0,5l", shortName: "Olivenöl 0.5", price: 15, subcategory: "bottles", posId: "906", posName: "Olivenöl 0,5l" },
    { id: "sh47", name: "Olivenöl 1l", shortName: "Olivenöl 1l", price: 26, subcategory: "bottles", posId: "907", posName: "Olivenöl 1l" },
    { id: "sh48", name: "100pct. Bergtee", shortName: "Bergtee", price: 5, subcategory: "bottles", posId: "928", posName: "100pct. Bergtee" },
    { id: "sh49", name: "Calvados Fl", shortName: "Calva Fl", price: 22, subcategory: "bottles", posId: "102", posName: "Calvados Fl" },
    { id: "sh50", name: "Creme Calva Fl", shortName: "Creme Calva Fl", price: 26, subcategory: "bottles", posId: "103", posName: "Creme Calva Fl" },
    { id: "sh51", name: "Mirabelle 0,375l", shortName: "Mirab 0.375", price: 13, subcategory: "bottles", posId: "104", posName: "Mirabelle 0,375l" },
    { id: "sh52", name: "Mirabelle 0,5l", shortName: "Mirab 0.5", price: 15, subcategory: "bottles", posId: "105", posName: "Mirabelle 0,5l" },
    { id: "sh53", name: "Picon Fl", shortName: "Picon Fl", price: 28, subcategory: "bottles", posId: "101", posName: "Picon Fl" },
    { id: "sh54", name: "Winterlimo Fl 1l", shortName: "Winterlimo", price: 7.9, subcategory: "bottles", posId: "60", posName: "Winterlimo Fl 1l" },
  ],
};

export const STATUS_CONFIG = {
  open:        { label: "Open",      dot: "#5b9bd5", bg: "#f0f6fd", border: "#b8d4ef", text: "#1a4a7a" },
  seated:      { label: "Seated",    dot: "#f5c84a", bg: "#fffdf0", border: "#f0e0a0", text: "#7a5c00" },
  unconfirmed: { label: "Ordered",   dot: "#e05252", bg: "#fdf5f5", border: "#f0bfbf", text: "#7a1a1a" },
  confirmed:   { label: "Confirmed", dot: "#52b87a", bg: "#f4fbf6", border: "#b8e6c8", text: "#1a5c35" },
};

export const FOOD_SUBCATEGORIES = [
  { id: "cheese", label: "🧀 Cheese Counter" },
  { id: "salads", label: "🥗 Salads" },
  { id: "warm", label: "🍽️ Warm Dishes" },
  { id: "extras", label: "🥔 Extras" },
  { id: "snacks", label: "🫒 Snacks" },
];

export const DRINKS_SUBCATEGORIES = [
  { id: "bier", label: "🍺 Bier" },
  { id: "cocktail", label: "🍸 Cocktail" },
  { id: "soft", label: "🥤 Soft" },
  { id: "schnaps", label: "🥃 Schnaps" },
  { id: "warm", label: "☕ Warm" },
];

export const BOTTLES_SUBCATEGORIES = [
  { id: "glass", label: "By the glass" },
  { id: "bottle", label: "Bottle only" },
];

export const SHOP_SUBCATEGORIES = [
  { id: "fish", label: "🐟 Fish" },
  { id: "spreads", label: "🍯 Spreads" },
  { id: "snacks", label: "🍪 Snacks" },
  { id: "bottles", label: "🍾 Bottles" },
];

// Items that must always be ordered in multiples of 2 (minimum 2 per order)
export const MIN_QTY_2_IDS = new Set(["f2", "f11", "f12", "f28"]);
