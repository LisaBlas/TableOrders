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
    { id: "f1", name: "Small Cheese Plate", shortName: "CP KL", price: 10, subcategory: "cheese", posId: "11", posName: "CP KL" },
    { id: "f2", name: "Cheese Plate", shortName: "CP1", price: 11, subcategory: "cheese", posId: "10", posName: "CP1" },
    { id: "f4", name: "Charcuterie Plate", shortName: "CH KL", price: 11, subcategory: "cheese", posId: "16", posName: "CH KL" },
    { id: "f5", name: "Mixed Plate", shortName: "MIX", price: 25, subcategory: "cheese", posId: "12", posName: "MIX" },
    { id: "f29", name: "Charcuterie dazu", shortName: "CH Dazu", price: 6.5, subcategory: "cheese", posId: "18", posName: "CH Dazu" },
    // Hot Dishes
    { id: "f6", name: "Marcelin Chaud", shortName: "STM", price: 9, subcategory: "warm", posId: "418", posName: "STM" },
    { id: "f7", name: "Camembert Rôti", shortName: "CAM", price: 17, subcategory: "warm", posId: "401", posName: "CAM" },
    { id: "f8", name: "Mont d'Or", shortName: "Mont d'Or", price: 29, subcategory: "warm", posId: "421", posName: "Mont d'Or" },
    { id: "f9", name: "Tartiflette", shortName: "Tartif", price: 15, subcategory: "warm", posId: "21", posName: "Tartif" },
    { id: "f10", name: "Tartiflette + Speck", shortName: "Tartif + Speck", price: 17, subcategory: "warm", posId: "21-1", posName: "Tartif + Speck" },
    { id: "f11", name: "Raclette", shortName: "Raclette", price: 28, subcategory: "warm", posId: "24", posName: "Raclette" },
    { id: "f12", name: "Fondue", shortName: "Fondue", price: 28, subcategory: "warm", posId: "23", posName: "Fondue" },
    { id: "f28", name: "Fondue Alkoholfrei", shortName: "Fondue Alkfrei", price: 28, subcategory: "warm", posId: "23", posName: "Fondue Alkfrei" },
    { id: "f30", name: "Tartine", shortName: "Tartine", price: 13.5, subcategory: "warm", posId: "26", posName: "Tartine" },
    { id: "f31", name: "Tartine + Schinken", shortName: "Tartine + Schinken", price: 15.5, subcategory: "warm", posId: "26-1", posName: "Tartine + Schinken" },
    // Salads
    { id: "f13", name: "Seguin", shortName: "SEG", price: 12.5, subcategory: "salads", posId: "41", posName: "SEG" },
    { id: "f21", name: "Seguin + Speck", shortName: "SEG + Speck", price: 14.5, subcategory: "salads", posId: "1015", posName: "SEG + Speck" },
    { id: "f14", name: "Papillon", shortName: "PAP", price: 13.5, subcategory: "salads", posId: "43", posName: "PAP" },
    { id: "f22", name: "Papillon + Serrano", shortName: "PAP + Serrano", price: 15.5, subcategory: "salads", posId: "43-1", posName: "PAP + Serrano" },
    { id: "f15", name: "Bauern", shortName: "BAU", price: 12.5, subcategory: "salads", posId: "44", posName: "BAU" },
    { id: "f23", name: "Bauern + Kartoffeln", shortName: "BAU + Kartoffeln", price: 15, subcategory: "salads", posId: "44", posName: "BAU + Kartoffeln" },
    { id: "f16", name: "Porthos", shortName: "POT", price: 13, subcategory: "salads", posId: "42", posName: "POT" },
    { id: "f24", name: "Porthos + Serrano", shortName: "POT + Serrano", price: 15, subcategory: "salads", posId: "42-1", posName: "POT + Serrano" },
    { id: "f17", name: "Basic", shortName: "BASIS", price: 7, subcategory: "salads", posId: "40", posName: "BASIS" },
    // Dessert
    { id: "f18", name: "Tarte Tatin", shortName: "TT", price: 7, subcategory: "snacks", posId: "30", posName: "TT" },
    { id: "f27", name: "Tarte Tatin + Calvados", shortName: "TT + Calva", price: 10, subcategory: "snacks", posId: "30-1", posName: "TT + Calva" },
    { id: "f19", name: "Olives", shortName: "OLV", price: 3, subcategory: "snacks", posId: "9", posName: "OLV" },
    { id: "f20", name: "Olives + Grissini", shortName: "OLV + Grissini", price: 5.5, subcategory: "snacks", posId: "9-1", posName: "OLV + Grissini" },
    { id: "f26", name: "Cornichons", shortName: "Cornichons", price: 2.5, subcategory: "snacks", posId: "20", posName: "Cornichons" },
  ],
  "Wines": [
    // White wines WITH LOCATION VARIANTS (Here / To Go)
    {
      id: "sancerre_bottle",
      name: "Sancerre Fl.",
      shortName: "Sanc",
      subcategory: "white",
      variants: [
        { type: "here", price: 38, label: "Here", posId: "3107", posName: "Sanc Fl." },
        { type: "togo", price: 27.5, label: "To Go", posId: "3108", posName: "Sanc Fl. To Go" }
      ]
    },
    {
      id: "chablis_bottle",
      name: "Chablis Fl.",
      shortName: "Chab",
      subcategory: "white",
      variants: [
        { type: "here", price: 38, label: "Here", posId: "3109", posName: "Chab Fl." },
        { type: "togo", price: 27.5, label: "To Go", posId: "3109", posName: "Chab Fl. To Go" }
      ]
    },
    {
      id: "riesling_bottle",
      name: "Riesling Fl.",
      shortName: "Riesl",
      subcategory: "white",
      variants: [
        { type: "here", price: 24.5, label: "Here", posId: "3110", posName: "Riesl Fl." },
        { type: "togo", price: 13, label: "To Go", posId: "3111", posName: "Riesl Fl. To Go" }
      ]
    },
    {
      id: "entre_deux_mers_bottle",
      name: "Entre-Deux-Mers Fl.",
      shortName: "EdM",
      subcategory: "white",
      variants: [
        { type: "here", price: 23, label: "Here", posId: "3112", posName: "EdM Fl." },
        { type: "togo", price: 12.5, label: "To Go", posId: "3113", posName: "EdM Fl. To Go" }
      ]
    },
    {
      id: "zotz_bottle",
      name: "Zotz Fl.",
      shortName: "Zotz",
      subcategory: "white",
      variants: [
        { type: "here", price: 25.5, label: "Here", posId: "3114", posName: "Zotz Fl." },
        { type: "togo", price: 14, label: "To Go", posId: "3115", posName: "Zotz Fl. To Go" }
      ]
    },
    {
      id: "rocailles_bottle",
      name: "Rocailles Fl.",
      shortName: "Roca",
      subcategory: "white",
      variants: [
        { type: "here", price: 25.5, label: "Here", posId: "3116", posName: "Roca Fl." },
        { type: "togo", price: 14, label: "To Go", posId: "3116", posName: "Roca Fl. To Go" }
      ]
    },
    {
      id: "divin_sauv_bottle",
      name: "Divin Sauvignon Blanc Fl.",
      shortName: "DivSauB",
      subcategory: "white",
      variants: [
        { type: "here", price: 25.5, label: "Here", posId: "152", posName: "DivSauB Fl." },
        { type: "togo", price: 14, label: "To Go", posId: "152", posName: "DivSauB Fl. To Go" }
      ]
    },
    // Rosé
    {
      id: "aurore_boreale_bottle",
      name: "Aurore Boréale Fl.",
      shortName: "AurBor",
      subcategory: "rosé",
      variants: [
        { type: "here", price: 28, label: "Here", posId: "3203", posName: "AurBor Fl." },
        { type: "togo", price: 17.5, label: "To Go", posId: "3204", posName: "AurBor Fl. To Go" }
      ]
    },
    {
      id: "petnat_rose_bottle",
      name: "Pét-Nat Rosé Fl.",
      shortName: "PetNatR",
      subcategory: "rosé",
      variants: [
        { type: "here", price: 33, label: "Here", posId: "3205", posName: "PetNatR Fl." },
        { type: "togo", price: 20, label: "To Go", posId: "3206", posName: "PetNatR Fl. To Go" }
      ]
    },
    // Sparkling wines
    {
      id: "cremant_bottle",
      name: "Crémant Fl.",
      shortName: "Crem",
      subcategory: "sparkling",
      variants: [
        { type: "here", price: 35, label: "Here", posId: "3303", posName: "Crem Fl." },
        { type: "togo", price: 26.5, label: "To Go", posId: "3304", posName: "Crem Fl. To Go" }
      ]
    },
    {
      id: "prosecco_bottle",
      name: "Prosecco Fl.",
      shortName: "Prosc",
      subcategory: "sparkling",
      variants: [
        { type: "here", price: 23, label: "Here", posId: "3305", posName: "Prosc Fl." },
        { type: "togo", price: 12.5, label: "To Go", posId: "3306", posName: "Prosc Fl. To Go" }
      ]
    },
    // Red wines
    {
      id: "graves_bottle",
      name: "Graves Fl.",
      shortName: "Grav",
      subcategory: "red",
      variants: [
        { type: "here", price: 32, label: "Here", posId: "3407", posName: "Grav Fl." },
        { type: "togo", price: 21.5, label: "To Go", posId: "3408", posName: "Grav Fl. To Go" }
      ]
    },
    {
      id: "malbec_bottle",
      name: "Malbec Fl.",
      shortName: "Malb",
      subcategory: "red",
      variants: [
        { type: "here", price: 29, label: "Here", posId: "3409", posName: "Malb Fl." },
        { type: "togo", price: 18.5, label: "To Go", posId: "3410", posName: "Malb Fl. To Go" }
      ]
    },
    {
      id: "crozes_hermitage_bottle",
      name: "Crozes-Hermitage Fl.",
      shortName: "CrozHer",
      subcategory: "red",
      variants: [
        { type: "here", price: 48, label: "Here", posId: "3411", posName: "CrozHer Fl." },
        { type: "togo", price: 24.5, label: "To Go", posId: "3412", posName: "CrozHer Fl. To Go" }
      ]
    },
    {
      id: "der_roth_bottle",
      name: "Der Roth Fl.",
      shortName: "DerRoth",
      subcategory: "red",
      variants: [
        { type: "here", price: 26, label: "Here", posId: "3413", posName: "DerRoth Fl." },
        { type: "togo", price: 15.5, label: "To Go", posId: "3414", posName: "DerRoth Fl. To Go" }
      ]
    },
    {
      id: "primitivo_bottle",
      name: "Primitivo Fl.",
      shortName: "Primit",
      subcategory: "red",
      variants: [
        { type: "here", price: 32, label: "Here", posId: "3415", posName: "Primit Fl." },
        { type: "togo", price: 21.5, label: "To Go", posId: "3416", posName: "Primit Fl. To Go" }
      ]
    },
    // Natural & Other wines
    {
      id: "pinot_grisant_bottle",
      name: "Pinot Grisant Fl.",
      shortName: "PinGri",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here", posId: "3501", posName: "PinGri Fl." },
        { type: "togo", price: 17, label: "To Go", posId: "3502", posName: "PinGri Fl. To Go" }
      ]
    },
    {
      id: "ca_va_le_faire_bottle",
      name: "Ça va le faire Fl.",
      shortName: "CavFaire",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here", posId: "3503", posName: "CavFaire Fl." },
        { type: "togo", price: 17, label: "To Go", posId: "3504", posName: "CavFaire Fl. To Go" }
      ]
    },
    {
      id: "bonne_mine_bottle",
      name: "Bonne Mine Fl.",
      shortName: "BonMin",
      subcategory: "natural",
      variants: [
        { type: "here", price: 32, label: "Here", posId: "3505", posName: "BonMin Fl." },
        { type: "togo", price: 17, label: "To Go", posId: "3506", posName: "BonMin Fl. To Go" }
      ]
    },
    {
      id: "clairette_bottle",
      name: "Clairette Fl.",
      shortName: "Clair",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here", posId: "3509", posName: "Clair Fl." },
        { type: "togo", price: 17, label: "To Go", posId: "3510", posName: "Clair Fl. To Go" }
      ]
    },
    {
      id: "infrarouge_bottle",
      name: "Infrarouge Fl.",
      shortName: "Infra",
      subcategory: "natural",
      variants: [
        { type: "here", price: 29, label: "Here", posId: "3511", posName: "Infra Fl." },
        { type: "togo", price: 19, label: "To Go", posId: "3512", posName: "Infra Fl. To Go" }
      ]
    },
    {
      id: "grenache_bottle",
      name: "Grenache Fl.",
      shortName: "Gren",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here", posId: "3513", posName: "Gren Fl." },
        { type: "togo", price: 17, label: "To Go", posId: "3514", posName: "Gren Fl. To Go" }
      ]
    },
    {
      id: "tete_claques_bottle",
      name: "Tête à Claques Fl.",
      shortName: "TeteCla",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here", posId: "3515", posName: "TeteCla Fl." },
        { type: "togo", price: 17, label: "To Go", posId: "3516", posName: "TeteCla Fl. To Go" }
      ]
    },
    {
      id: "deferlante_rouge_bottle",
      name: "Déferlante Rouge Fl.",
      shortName: "DefRouge",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here", posId: "3517", posName: "DefRouge Fl." },
        { type: "togo", price: 17, label: "To Go", posId: "3518", posName: "DefRouge Fl. To Go" }
      ]
    },
    {
      id: "ya_plus_qua_bottle",
      name: "Y'a plus qu'à Fl.",
      shortName: "YaPlusQ",
      subcategory: "natural",
      variants: [
        { type: "here", price: 29, label: "Here", posId: "3519", posName: "YaPlusQ Fl." },
        { type: "togo", price: 16, label: "To Go", posId: "3520", posName: "YaPlusQ Fl. To Go" }
      ]
    },
    {
      id: "divin_rose_bottle",
      name: "Divin Rosé Fl.",
      shortName: "DivRose",
      subcategory: "natural",
      variants: [
        { type: "here", price: 25.5, label: "Here", posId: "3521", posName: "DivRose Fl." },
        { type: "togo", price: 14, label: "To Go", posId: "3522", posName: "DivRose Fl. To Go" }
      ]
    },
    {
      id: "cremant_alsace_bottle",
      name: "Crémant d'Alsace Fl.",
      shortName: "CremAls",
      subcategory: "natural",
      variants: [
        { type: "here", price: 24, label: "Here", posId: "3523", posName: "CremAls Fl." },
        { type: "togo", price: 21, label: "To Go", posId: "3524", posName: "CremAls Fl. To Go" }
      ]
    },
    {
      id: "vi_no_bottle",
      name: "Vi-No Fl.",
      shortName: "ViNo",
      subcategory: "natural",
      variants: [
        { type: "here", price: 25.5, label: "Here", posId: "3525", posName: "ViNo Fl." },
        { type: "togo", price: 14, label: "To Go", posId: "3526", posName: "ViNo Fl. To Go" }
      ]
    },
    {
      id: "fritz_muller_bottle",
      name: "Fritz Müller Fl.",
      shortName: "FritzM",
      subcategory: "natural",
      variants: [
        { type: "here", price: 25.5, label: "Here", posId: "3527", posName: "FritzM Fl." },
        { type: "togo", price: 14, label: "To Go", posId: "3528", posName: "FritzM Fl. To Go" }
      ]
    },
    {
      id: "divin_pinot_noir_bottle",
      name: "Divin Pinot Noir Fl.",
      shortName: "DivPinNoir",
      subcategory: "natural",
      variants: [
        { type: "here", price: 29, label: "Here", posId: "3529", posName: "DivPinNoir Fl." },
        { type: "togo", price: 18.5, label: "To Go", posId: "3530", posName: "DivPinNoir Fl. To Go" }
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
        { type: "togo", price: 11.5, label: "To Go", posId: "251", posName: "Picpoul Fl. To Go", bottleSubcategory: "white" }
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
        { type: "togo", price: 12.5, label: "To Go", posId: "256", posName: "SauB Fl. To Go", bottleSubcategory: "white" }
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
        { type: "togo", price: 14, label: "To Go", posId: "254", posName: "Grau Fl. To Go", bottleSubcategory: "white" }
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
        { type: "togo", price: 12.5, label: "To Go", posId: "281", posName: "BrisMar Fl. To Go", bottleSubcategory: "rosé" }
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
        { type: "togo", price: 14, label: "To Go", posId: "152", posName: "DivSauB Fl. To Go", bottleSubcategory: "white" }
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
        { type: "togo", price: 10.5, label: "To Go", posId: "299", posName: "Cidre Fl. To Go", bottleSubcategory: "sparkling" }
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
        { type: "togo", price: 17.5, label: "To Go", posId: "271", posName: "Sekt Fl. To Go", bottleSubcategory: "sparkling" }
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
        { type: "togo", price: 20, label: "To Go", posId: "198", posName: "PetNat Fl. To Go", bottleSubcategory: "sparkling" }
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
        { type: "togo", price: 11, label: "To Go", posId: "205", posName: "Montep Fl. To Go", bottleSubcategory: "red" }
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
        { type: "togo", price: 14, label: "To Go", posId: "202", posName: "Gamay Fl. To Go", bottleSubcategory: "red" }
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
        { type: "togo", price: 15.5, label: "To Go", posId: "208", posName: "Carig Fl. To Go", bottleSubcategory: "red" }
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
        { type: "togo", price: 17, label: "To Go", posId: "194", posName: "YellM Fl. To Go", bottleSubcategory: "natural" }
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
        { type: "togo", price: 17, label: "To Go", posId: "280", posName: "CuvGal Fl. To Go", bottleSubcategory: "natural" }
      ]
    },
    // Weinschorle WITH SIZE VARIANTS
    {
      id: "wg14",
      name: "Weißweinschorle",
      shortName: "WWS",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3, label: "0,1", posId: "69-1", posName: "WeinSch 0,1" },
        { type: "large", price: 6, label: "0,2", posId: "69-2", posName: "WeinSch 0,2" }
      ]
    },
    // Aperitifs & Spirits
    { id: "dr1", name: "Aperol", shortName: "Aperol", price: 8, subcategory: "cocktail", posId: "73", posName: "Aperol" },
    { id: "dr2", name: "Cynar", shortName: "Cynar", price: 8, subcategory: "cocktail", posId: "76", posName: "Cynar" },
    { id: "dr3", name: "Campari", shortName: "Campari", price: 8, subcategory: "cocktail", posId: "74", posName: "Campari" },
    { id: "dr17", name: "Kir", shortName: "Kir", price: 5, subcategory: "cocktail", posId: "71", posName: "Kir" },
    { id: "dr18", name: "Kir Royal", shortName: "Kir R.", price: 7.5, subcategory: "cocktail", posId: "72", posName: "Kir R." },
    { id: "dr19", name: "Select", shortName: "Select", price: 8, subcategory: "cocktail", posId: "75", posName: "Select" },
    { id: "dr20", name: "Pastis", shortName: "Pastis", price: 6, subcategory: "cocktail", posId: "67", posName: "Pastis" },
    // Beer
    { id: "dr5", name: "Pilsner Urquell", shortName: "PU", price: 3.8, subcategory: "bier", posId: "64", posName: "PU" },
    { id: "dr6", name: "Störtebecker", shortName: "Störte", price: 3.8, subcategory: "bier", posId: "66", posName: "Störte" },
    { id: "dr4", name: "Picon Bière", shortName: "Picon", price: 4.8, subcategory: "bier", posId: "65", posName: "Picon" },
    // Soft Drinks
    { id: "dr7", name: "Fritz Cola", shortName: "Cola", price: 3.7, subcategory: "soft", posId: "54", posName: "Cola" },
    { id: "dr8", name: "Limo Granada", shortName: "Limo Granada", price: 3.8, subcategory: "soft", posId: "55-1", posName: "Limo Granada" },
    { id: "dr9", name: "Limo Orange", shortName: "Limo Orange", price: 3.8, subcategory: "soft", posId: "55-2", posName: "Limo Orange" },
    { id: "dr10", name: "Limo Minze", shortName: "Limo Minze", price: 3.8, subcategory: "soft", posId: "55-3", posName: "Limo Minze" },
    { id: "dr11", name: "Limo Pamplemousse", shortName: "Limo Grapefruit", price: 3.8, subcategory: "soft", posId: "55-4", posName: "Limo Grapefruit" },
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
      name: "Wasser Sprudel Fl.",
      shortName: "Sprudel Fl.",
      subcategory: "soft",
      price: 5.5,
      holdVariants: [
        { type: "small", price: 1.5, label: "0,2", posId: "50-1", posName: "WassSprud klein" },
        { type: "large", price: 2.8, label: "0,4", posId: "51-1", posName: "WassSprud groß" }
      ]
    },
    {
      id: "wasser_bottle",
      name: "Wasser Fl.",
      shortName: "Wasser Fl.",
      subcategory: "soft",
      price: 5.5,
      holdVariants: [
        { type: "small", price: 1.5, label: "0,2", posId: "50-2", posName: "Wass klein" },
        { type: "large", price: 2.8, label: "0,4", posId: "51-2", posName: "Wass groß" }
      ]
    },
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
    // Teas
    { id: "te1", name: "Pfefferminze", shortName: "PfefMin", price: 3, subcategory: "warm", posId: "93-1", posName: "PfefMin" },
    { id: "te2", name: "Kamille", shortName: "Kamil", price: 3, subcategory: "warm", posId: "93-2", posName: "Kamil" },
    { id: "te3", name: "Salbei", shortName: "Salb", price: 3, subcategory: "warm", posId: "93-3", posName: "Salb" },
    { id: "te4", name: "Kräuter", shortName: "Kraut", price: 3, subcategory: "warm", posId: "93-4", posName: "Kraut" },
    { id: "te5", name: "Bergtee", shortName: "BergT", price: 3.7, subcategory: "warm", posId: "94-1", posName: "BergT" },
    { id: "te6", name: "Thymian", shortName: "Thym", price: 3.7, subcategory: "warm", posId: "94-2", posName: "Thym" },
    { id: "te7", name: "Heiße Zitrone", shortName: "HeissZ", price: 3.7, subcategory: "warm", posId: "94-3", posName: "HeissZ" },
    { id: "te8", name: "Heiße Orange", shortName: "Hot Orange", price: 5, subcategory: "warm", posId: "95", posName: "Hot Orange" },
    // Coffee
    { id: "co1", name: "Espresso", shortName: "Espr", price: 1.9, subcategory: "warm", posId: "91", posName: "Espr" },
    { id: "co2", name: "Café Crème", shortName: "CafCr", price: 2.6, subcategory: "warm", posId: "90", posName: "CafCr" },
  ],
  "Shop": [
    { id: "sh1", name: "Rillettes Lachs", shortName: "Rill Lachs", price: 5.8, posId: "965", posName: "Rillettes Lachs / Thunfisch" },
    { id: "sh2", name: "Rillettes Thunfisch", shortName: "Rill Thunfisch", price: 5.8, posId: "965", posName: "Rillettes Lachs / Thunfisch" },
    { id: "sh3", name: "Cornichons Glass", shortName: "Corni Glass", price: 5.9, posId: "939", posName: "Cornichons Glass" },
    { id: "sh4", name: "Biovette Meersalz", shortName: "Biovette", price: 4.8, posId: "973", posName: "Biovette Meersalz" },
    { id: "sh5", name: "Sardines", shortName: "Sardines", price: 5.8, posId: "967", posName: "Sardines" },
    { id: "sh6", name: "Makrele Sancerre", shortName: "Makrele", price: 6.7, posId: "968", posName: "Makrele Sancerre" },
    { id: "sh7", name: "Terrine / Rillettes 100g", shortName: "Terrine 100g", price: 4.8 },
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

// Items that must always be ordered in multiples of 2 (minimum 2 per order)
export const MIN_QTY_2_IDS = new Set(["f2", "f11", "f12", "f28"]);
