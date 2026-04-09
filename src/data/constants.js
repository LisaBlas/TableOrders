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
    { id: "f1", name: "Small Cheese Plate", price: 10, subcategory: "cheese", posId: "11", posName: "Kleiner Kâseteller" },
    { id: "f2", name: "Cheese Plate", price: 11, subcategory: "cheese", posId: "10", posName: "CP 1PAX" },
    { id: "f4", name: "Charcuterie Plate", price: 11, subcategory: "cheese", posId: "16", posName: "Charcuterie klein" },
    { id: "f5", name: "Mixed Plate", price: 25, subcategory: "cheese", posId: "12", posName: "MixPlate 2PAX" },
    { id: "f29", name: "Charcuterie dazu", price: 6.5, subcategory: "cheese", posId: "18", posName: "Charcuterie Dazu?" },
    // Hot Dishes
    { id: "f6", name: "Marcelin Chaud", price: 9, subcategory: "warm", posId: "418", posName: "ST.M" },
    { id: "f7", name: "Camembert Rôti", price: 17, subcategory: "warm", posId: "401", posName: "CAM" },
    { id: "f8", name: "Mont d'Or", price: 29, subcategory: "warm", posId: "421", posName: "Mont d'Or" },
    { id: "f9", name: "Tartiflette", price: 15, subcategory: "warm", posId: "21", posName: "Tartiflette" },
    { id: "f10", name: "Tartiflette + Speck", price: 17, subcategory: "warm", posId: "0000", posName: "TartSpeck?" },
    { id: "f11", name: "Raclette", price: 28, subcategory: "warm", posId: "24", posName: "Raclettemenü" },
    { id: "f12", name: "Fondue", price: 28, subcategory: "warm", posId: "23", posName: "Fonduemenü" },
    { id: "f28", name: "Fondue Alkoholfrei", price: 28, subcategory: "warm", posId: "0000", posName: "Fondue Alkoholfrei?" },
    { id: "f30", name: "Tartine", price: 13.5, subcategory: "warm", posId: "26", posName: "Tartine" },
    { id: "f31", name: "Tartine + Schinken", price: 15.5, subcategory: "warm", posId: "26-1", posName: "Tartine Schinken" },
    // Salads
    { id: "f13", name: "Seguin", price: 12.5, subcategory: "salads", posId: "41", posName: "Seguin Salat" },
    { id: "f21", name: "Seguin + Speck", price: 14.5, subcategory: "salads", posId: "1015", posName: "SegSpeck?" },
    { id: "f14", name: "Papillon", price: 13.5, subcategory: "salads", posId: "43", posName: "Papillon Salat" },
    { id: "f22", name: "Papillon + Serrano", price: 15.5, subcategory: "salads", posId: "0000", posName: "PapSerrano?" },
    { id: "f15", name: "Bauern", price: 12.5, subcategory: "salads", posId: "44", posName: "Bauernsalat" },
    { id: "f23", name: "Bauern + Kartoffeln", price: 15, subcategory: "salads", posId: "0000", posName: "BauKartoffel?" },
    { id: "f16", name: "Porthos", price: 13, subcategory: "salads", posId: "43", posName: "Porthos Salat" },
    { id: "f24", name: "Porthos + Serrano", price: 15, subcategory: "salads", posId: "0000", posName: "PortSerrano?" },
    { id: "f17", name: "Basic", price: 7, subcategory: "salads", posId: "40", posName: "Basissalat" },
    // Dessert
    { id: "f18", name: "Tarte Tatin", price: 7, subcategory: "snacks", posId: "30", posName: "Tarte Tatin" },
    { id: "f27", name: "Tarte Tatin + Calvados", price: 10, subcategory: "snacks", posId: "0000", posName: "Tarte Tatin Calvados?" },
    { id: "f19", name: "Olives", price: 3, subcategory: "snacks", posId: "9", posName: "Oliven" },
    { id: "f20", name: "Olives + Grissini", price: 5.5, subcategory: "snacks", posId: "0000", posName: "Oliven Grissini?" },
    { id: "f26", name: "Cornichons", price: 2.5, subcategory: "snacks", posId: "0000", posName: "Cornichons?" },
  ],
  "Drinks🍷": [
    // Wines by Glass - White WITH SIZE VARIANTS
    {
      id: "wg1",
      name: "Picpoul",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3.5, label: "0,1", posId: "251-1", posName: "Picpoul 0,1" },
        { type: "large", price: 6.5, label: "0,2", posId: "251-2", posName: "Picpoul 0,2" },
        { type: "here", price: 22.5, label: "Here", posId: "251", posName: "Picpoul Fl H", bottleSubcategory: "white" },
        { type: "togo", price: 11.5, label: "To Go", posId: "251", posName: "Picpoul Fl TG", bottleSubcategory: "white" }
      ]
    },
    {
      id: "wg2",
      name: "Sauvignon Blanc",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3.5, label: "0,1", posId: "256-1", posName: "SauB 0,1" },
        { type: "large", price: 7, label: "0,2", posId: "256-2", posName: "SauB 0,2" },
        { type: "here", price: 24, label: "Here", posId: "256", posName: "SauB Fl H", bottleSubcategory: "white" },
        { type: "togo", price: 12.5, label: "To Go", posId: "256", posName: "SauB Fl TG", bottleSubcategory: "white" }
      ]
    },
    {
      id: "wg3",
      name: "Grauburgunder",
      subcategory: "wine",
      variants: [
        { type: "small", price: 4, label: "0,1", posId: "254-1", posName: "Grau 0,1" },
        { type: "large", price: 7.5, label: "0,2", posId: "254-2", posName: "Grau 0,2" },
        { type: "here", price: 25.5, label: "Here", posId: "254", posName: "Grau Fl H", bottleSubcategory: "white" },
        { type: "togo", price: 14, label: "To Go", posId: "254", posName: "Grau Fl TG", bottleSubcategory: "white" }
      ]
    },
    {
      id: "wg4",
      name: "Brise-Marine",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3.5, label: "0,1", posId: "281-1", posName: "BrisMar 0,1" },
        { type: "large", price: 7, label: "0,2", posId: "281-2", posName: "BrisMar 0,2" },
        { type: "here", price: 24, label: "Here", posId: "281", posName: "BrisMar Fl H", bottleSubcategory: "rosé" },
        { type: "togo", price: 12.5, label: "To Go", posId: "281", posName: "BrisMar Fl TG", bottleSubcategory: "rosé" }
      ]
    },
    {
      id: "wg5",
      name: "Divin Sauvignon Blanc",
      subcategory: "wine",
      variants: [
        { type: "small", price: 4, label: "0,1", posId: "152-1", posName: "DivSauB 0,1" },
        { type: "large", price: 7.5, label: "0,2", posId: "152-2", posName: "DivSauB 0,2" },
        { type: "here", price: 25.5, label: "Here", posId: "152", posName: "DivSauB Fl H", bottleSubcategory: "white" },
        { type: "togo", price: 14, label: "To Go", posId: "152", posName: "DivSauB Fl TG", bottleSubcategory: "white" }
      ]
    },
    // Wines by Glass - Sparkling WITH SIZE VARIANTS
    {
      id: "wg6",
      name: "Cidre",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3, label: "0,1", posId: "299-1", posName: "Cidre 0,1" },
        { type: "large", price: 6, label: "0,2", posId: "299-2", posName: "Cidre 0,2" },
        { type: "here", price: 21, label: "Here", posId: "299", posName: "Cidre Fl H", bottleSubcategory: "sparkling" },
        { type: "togo", price: 10.5, label: "To Go", posId: "299", posName: "Cidre Fl TG", bottleSubcategory: "sparkling" }
      ]
    },
    {
      id: "wg7",
      name: "Sekt",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3.5, label: "0,1", posId: "271-1", posName: "Sekt 0,1" },
        { type: "large", price: 7, label: "0,2", posId: "271-2", posName: "Sekt 0,2" },
        { type: "here", price: 28, label: "Here", posId: "271", posName: "Sekt Fl H", bottleSubcategory: "sparkling" },
        { type: "togo", price: 17.5, label: "To Go", posId: "271", posName: "Sekt Fl TG", bottleSubcategory: "sparkling" }
      ]
    },
    {
      id: "wg8",
      name: "PetNat",
      subcategory: "wine",
      variants: [
        { type: "small", price: 4, label: "0,1", posId: "198-1", posName: "PetNat 0,1" },
        { type: "large", price: 8, label: "0,2", posId: "198-2", posName: "PetNat 0,2" },
        { type: "here", price: 36, label: "Here", posId: "198", posName: "PetNat Fl H", bottleSubcategory: "sparkling" },
        { type: "togo", price: 20, label: "To Go", posId: "198", posName: "PetNat Fl TG", bottleSubcategory: "sparkling" }
      ]
    },
    // Wines by Glass - Red WITH SIZE VARIANTS
    {
      id: "wg9",
      name: "Montepulciano",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3.5, label: "0,1", posId: "205-1", posName: "Montep 0,1" },
        { type: "large", price: 6.5, label: "0,2", posId: "205-2", posName: "Montep 0,2" },
        { type: "here", price: 22.5, label: "Here", posId: "205", posName: "Montep Fl H", bottleSubcategory: "red" },
        { type: "togo", price: 11, label: "To Go", posId: "205", posName: "Montep Fl TG", bottleSubcategory: "red" }
      ]
    },
    {
      id: "wg10",
      name: "Gamay",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3.5, label: "0,1", posId: "202-1", posName: "Gamay 0,1" },
        { type: "large", price: 7, label: "0,2", posId: "202-2", posName: "Gamay 0,2" },
        { type: "here", price: 25.5, label: "Here", posId: "202", posName: "Gamay Fl H", bottleSubcategory: "red" },
        { type: "togo", price: 14, label: "To Go", posId: "202", posName: "Gamay Fl TG", bottleSubcategory: "red" }
      ]
    },
    {
      id: "wg11",
      name: "Carignan",
      subcategory: "wine",
      variants: [
        { type: "small", price: 4, label: "0,1", posId: "208-1", posName: "Carig 0,1" },
        { type: "large", price: 8, label: "0,2", posId: "208-2", posName: "Carig 0,2" },
        { type: "here", price: 27, label: "Here", posId: "208", posName: "Carig Fl H", bottleSubcategory: "red" },
        { type: "togo", price: 15.5, label: "To Go", posId: "208", posName: "Carig Fl TG", bottleSubcategory: "red" }
      ]
    },
    // Wines by Glass - Other WITH SIZE VARIANTS
    {
      id: "wg12",
      name: "Yellow Muskat",
      subcategory: "wine",
      variants: [
        { type: "small", price: 4.5, label: "0,1", posId: "194-1", posName: "YellM 0,1" },
        { type: "large", price: 9, label: "0,2", posId: "194-2", posName: "YellM 0,2" },
        { type: "here", price: 30, label: "Here", posId: "194", posName: "YellM Fl H", bottleSubcategory: "natural" },
        { type: "togo", price: 17, label: "To Go", posId: "194", posName: "YellM Fl TG", bottleSubcategory: "natural" }
      ]
    },
    {
      id: "wg13",
      name: "Cuvée des Galets",
      subcategory: "wine",
      variants: [
        { type: "small", price: 4.5, label: "0,1", posId: "280-1", posName: "CuvGal 0,1" },
        { type: "large", price: 9, label: "0,2", posId: "280-2", posName: "CuvGal 0,2" },
        { type: "here", price: 27, label: "Here", posId: "280", posName: "CuvGal Fl H", bottleSubcategory: "natural" },
        { type: "togo", price: 17, label: "To Go", posId: "280", posName: "CuvGal Fl TG", bottleSubcategory: "natural" }
      ]
    },
    // Weinschorle WITH SIZE VARIANTS
    {
      id: "wg14",
      name: "Weinschorle",
      subcategory: "wine",
      variants: [
        { type: "small", price: 3, label: "0,1", posId: "69-1", posName: "WeinSch 0,1" },
        { type: "large", price: 6, label: "0,2", posId: "69-2", posName: "WeinSch 0,2" }
      ]
    },
    // Aperitifs & Spirits
    { id: "dr1", name: "Aperol", price: 8, subcategory: "cocktail", posId: "73", posName: "Aperol" },
    { id: "dr2", name: "Cynar", price: 8, subcategory: "cocktail", posId: "76", posName: "Cynar" },
    { id: "dr3", name: "Campari", price: 8, subcategory: "cocktail", posId: "74", posName: "Campari" },
    { id: "dr17", name: "Kir", price: 5, subcategory: "cocktail", posId: "71", posName: "Kir" },
    { id: "dr18", name: "Kir Royal", price: 7.5, subcategory: "cocktail", posId: "72", posName: "KirRoy" },
    { id: "dr19", name: "Select", price: 8, subcategory: "cocktail", posId: "75", posName: "Select" },
    { id: "dr20", name: "Pastis", price: 6, subcategory: "cocktail", posId: "67", posName: "Pastis" },
    // Beer
    { id: "dr5", name: "Pilsner Urquell", price: 3.8, subcategory: "bier", posId: "64", posName: "Pilsner Urquell" },
    { id: "dr6", name: "Stortebecker", price: 3.8, subcategory: "bier", posId: "66", posName: "Störtebecker" },
    { id: "dr4", name: "Picon Biere", price: 4.8, subcategory: "bier", posId: "65", posName: "Picon Bier" },
    // Soft Drinks
    { id: "dr7", name: "Fritz Cola", price: 3.7, subcategory: "soft", posId: "54", posName: "Fritz Cola" },
    { id: "dr8", name: "Limo Granada", price: 3.8, subcategory: "soft", posId: "55-1", posName: "Mortuacienne Granada" },
    { id: "dr9", name: "Limo Orange", price: 3.8, subcategory: "soft", posId: "55-2", posName: "Mortuacienne Orange" },
    { id: "dr10", name: "Limo Minze", price: 3.8, subcategory: "soft", posId: "55-3", posName: "Mortuacienne Minze" },
    { id: "dr11", name: "Limo Pamplemousse", price: 3.8, subcategory: "soft", posId: "55-4", posName: "Mortuacienne Pamplemousse" },
    // Juices & Water WITH SIZE VARIANTS
    {
      id: "rahbarb_saft",
      name: "Rahbarb Saft",
      subcategory: "soft",
      variants: [
        { type: "small", price: 3.5, label: "0,2", posId: "56-1", posName: "RhabSaft klein" },
        { type: "large", price: 4.7, label: "0,4", posId: "57-1", posName: "RhabSaft groß" }
      ]
    },
    {
      id: "rhabarb_schorle",
      name: "Rhabarb Schorle",
      subcategory: "soft",
      variants: [
        { type: "small", price: 3, label: "0,2", posId: "58-1", posName: "RhabSch klein" },
        { type: "large", price: 4, label: "0,4", posId: "59-1", posName: "RhabSch groß" }
      ]
    },
    {
      id: "apfel_schorle",
      name: "Apfel Schorle",
      subcategory: "soft",
      variants: [
        { type: "small", price: 3, label: "0,2", posId: "58-2", posName: "ApfSch klein" },
        { type: "large", price: 4, label: "0,4", posId: "59-2", posName: "ApfSch groß" }
      ]
    },
    {
      id: "apfel_saft",
      name: "Apfel Saft",
      subcategory: "soft",
      variants: [
        { type: "small", price: 3.5, label: "0,2", posId: "56-2", posName: "ApfSaft klein" },
        { type: "large", price: 4.7, label: "0,4", posId: "57-2", posName: "ApfSaft groß" }
      ]
    },
    {
      id: "wasser_sprudel_bottle",
      name: "Sprudel Wasser Fl.",
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
      subcategory: "schnaps",
      variants: [
        { type: "small", price: 4.5, label: "0,2", posId: "84", posName: "Cognac 0,2" },
        { type: "large", price: 8.5, label: "0,4", posId: "85", posName: "Cognac 0,4" }
      ]
    },
    {
      id: "calvados",
      name: "Calvados",
      subcategory: "schnaps",
      variants: [
        { type: "small", price: 3.5, label: "0,2", posId: "86", posName: "Calvados 0,2" },
        { type: "large", price: 6.5, label: "0,4", posId: "87", posName: "Calvados 0,4" }
      ]
    },
    {
      id: "mirabelle",
      name: "Mirabelle",
      subcategory: "schnaps",
      variants: [
        { type: "small", price: 3, label: "0,2", posId: "80", posName: "Mirabelle 0,2" },
        { type: "large", price: 5.5, label: "0,4", posId: "81", posName: "Mirabelle 0,4" }
      ]
    },
    {
      id: "jameson",
      name: "Jameson",
      subcategory: "schnaps",
      variants: [
        { type: "small", price: 3, label: "0,2", posId: "82", posName: "Jameson 0,2" },
        { type: "large", price: 5.5, label: "0,4", posId: "83", posName: "Jameson 0,4" }
      ]
    },
    {
      id: "creme_calvados",
      name: "Crème de Calvados",
      subcategory: "schnaps",
      variants: [
        { type: "small", price: 4, label: "0,2", posId: "88", posName: "Creme Calvados 0,2" },
        { type: "large", price: 7.5, label: "0,4", posId: "89", posName: "Creme Calvados 0,4" }
      ]
    },
    // Teas
    { id: "te1", name: "PfefferMinze", price: 3, subcategory: "warm", posId: "93-1", posName: "PfefMin" },
    { id: "te2", name: "Kamille", price: 3, subcategory: "warm", posId: "93-2", posName: "Kamil" },
    { id: "te3", name: "Salbei", price: 3, subcategory: "warm", posId: "93-3", posName: "Salb" },
    { id: "te4", name: "Krauter", price: 3, subcategory: "warm", posId: "93-4", posName: "Kraut" },
    { id: "te5", name: "Bergtee", price: 3.7, subcategory: "warm", posId: "94-1", posName: "BergT" },
    { id: "te6", name: "Thymian", price: 3.7, subcategory: "warm", posId: "94-2", posName: "Thym" },
    { id: "te7", name: "Heisse Zitrone", price: 3.7, subcategory: "warm", posId: "0000", posName: "HeissZ" },
    { id: "te8", name: "Heisse Orange", price: 5, subcategory: "warm", posId: "95", posName: "Hot Orange" },
    // Coffee
    { id: "co1", name: "Espresso", price: 1.9, subcategory: "warm", posId: "91", posName: "Espr" },
    { id: "co2", name: "Cafe Crema", price: 2.6, subcategory: "warm", posId: "90", posName: "CafCr" },
  ],
  "Wines 🍷": [
    // White wines WITH LOCATION VARIANTS (Here / To Go)
    {
      id: "sancerre_bottle",
      name: "Sancerre Fl.",
      subcategory: "white",
      variants: [
        { type: "here", price: 38, label: "Here", posId: "3107", posName: "Sanc Fl H" },
        { type: "togo", price: 27.5, label: "To Go", posId: "3108", posName: "Sanc Fl TG" }
      ]
    },
    {
      id: "chablis_bottle",
      name: "Chablis Fl.",
      subcategory: "white",
      variants: [
        { type: "here", price: 38, label: "Here", posId: "3109", posName: "Chab Fl H" },
        { type: "togo", price: 27.5, label: "To Go", posId: "3109", posName: "Chab Fl TG" }
      ]
    },
    {
      id: "riesling_bottle",
      name: "Riesling Fl.",
      subcategory: "white",
      variants: [
        { type: "here", price: 24.5, label: "Here", posId: "3110", posName: "Riesl Fl H" },
        { type: "togo", price: 13, label: "To Go", posId: "3111", posName: "Riesl Fl TG" }
      ]
    },
    {
      id: "entre_deux_mers_bottle",
      name: "Entre-Deux-Mers Fl.",
      subcategory: "white",
      variants: [
        { type: "here", price: 23, label: "Here", posId: "3112", posName: "EdM Fl H" },
        { type: "togo", price: 12.5, label: "To Go", posId: "3113", posName: "EdM Fl TG" }
      ]
    },
    {
      id: "zotz_bottle",
      name: "Zotz Fl.",
      subcategory: "white",
      variants: [
        { type: "here", price: 25.5, label: "Here", posId: "3114", posName: "Zotz Fl H" },
        { type: "togo", price: 14, label: "To Go", posId: "3115", posName: "Zotz Fl TG" }
      ]
    },
    {
      id: "rocailles_bottle",
      name: "Rocailles Fl.",
      subcategory: "white",
      variants: [
        { type: "here", price: 25.5, label: "Here", posId: "3116", posName: "Roca Fl H" },
        { type: "togo", price: 14, label: "To Go", posId: "3116", posName: "Roca Fl TG" }
      ]
    },
    {
      id: "divin_sauv_bottle",
      name: "Divin Sauvignon Blanc Fl.",
      subcategory: "white",
      variants: [
        { type: "here", price: 25.5, label: "Here", posId: "152", posName: "DivSauB Fl H" },
        { type: "togo", price: 14, label: "To Go", posId: "152", posName: "DivSauB Fl TG" }
      ]
    },
    // Rosé
    {
      id: "aurore_boreale_bottle",
      name: "Aurore Boréale Fl.",
      subcategory: "rosé",
      variants: [
        { type: "here", price: 28, label: "Here", posId: "3203", posName: "AurBor Fl H" },
        { type: "togo", price: 17.5, label: "To Go", posId: "3204", posName: "AurBor Fl TG" }
      ]
    },
    {
      id: "petnat_rose_bottle",
      name: "PetNat Rosé Fl.",
      subcategory: "rosé",
      variants: [
        { type: "here", price: 33, label: "Here", posId: "3205", posName: "PetNatR Fl H" },
        { type: "togo", price: 20, label: "To Go", posId: "3206", posName: "PetNatR Fl TG" }
      ]
    },
    // Sparkling wines
    {
      id: "cremant_bottle",
      name: "Crémant Fl.",
      subcategory: "sparkling",
      variants: [
        { type: "here", price: 35, label: "Here", posId: "3303", posName: "Crem Fl H" },
        { type: "togo", price: 26.5, label: "To Go", posId: "3304", posName: "Crem Fl TG" }
      ]
    },
    {
      id: "prosecco_bottle",
      name: "Prosecco Fl.",
      subcategory: "sparkling",
      variants: [
        { type: "here", price: 23, label: "Here", posId: "3305", posName: "Prosc Fl H" },
        { type: "togo", price: 12.5, label: "To Go", posId: "3306", posName: "Prosc Fl TG" }
      ]
    },
    // Red wines
    {
      id: "graves_bottle",
      name: "Graves Fl.",
      subcategory: "red",
      variants: [
        { type: "here", price: 32, label: "Here", posId: "3407", posName: "Grav Fl H" },
        { type: "togo", price: 21.5, label: "To Go", posId: "3408", posName: "Grav Fl TG" }
      ]
    },
    {
      id: "malbec_bottle",
      name: "Malbec Fl.",
      subcategory: "red",
      variants: [
        { type: "here", price: 29, label: "Here", posId: "3409", posName: "Malb Fl H" },
        { type: "togo", price: 18.5, label: "To Go", posId: "3410", posName: "Malb Fl TG" }
      ]
    },
    {
      id: "crozes_hermitage_bottle",
      name: "Crozes Hermitage Fl.",
      subcategory: "red",
      variants: [
        { type: "here", price: 48, label: "Here", posId: "3411", posName: "CrozHer Fl H" },
        { type: "togo", price: 24.5, label: "To Go", posId: "3412", posName: "CrozHer Fl TG" }
      ]
    },
    {
      id: "der_roth_bottle",
      name: "Der Roth Fl.",
      subcategory: "red",
      variants: [
        { type: "here", price: 26, label: "Here", posId: "3413", posName: "DerRoth Fl H" },
        { type: "togo", price: 15.5, label: "To Go", posId: "3414", posName: "DerRoth Fl TG" }
      ]
    },
    {
      id: "primitivo_bottle",
      name: "Primitivo Fl.",
      subcategory: "red",
      variants: [
        { type: "here", price: 32, label: "Here", posId: "3415", posName: "Primit Fl H" },
        { type: "togo", price: 21.5, label: "To Go", posId: "3416", posName: "Primit Fl TG" }
      ]
    },
    // Natural & Other wines
    {
      id: "pinot_grisant_bottle",
      name: "Pinot Grisant Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here", posId: "3501", posName: "PinGri Fl H" },
        { type: "togo", price: 17, label: "To Go", posId: "3502", posName: "PinGri Fl TG" }
      ]
    },
    {
      id: "ca_va_le_faire_bottle",
      name: "Ca va le faire Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here", posId: "3503", posName: "CavFaire Fl H" },
        { type: "togo", price: 17, label: "To Go", posId: "3504", posName: "CavFaire Fl TG" }
      ]
    },
    {
      id: "bonne_mine_bottle",
      name: "Bonne Mine Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 32, label: "Here", posId: "3505", posName: "BonMin Fl H" },
        { type: "togo", price: 17, label: "To Go", posId: "3506", posName: "BonMin Fl TG" }
      ]
    },
    {
      id: "clairette_bottle",
      name: "Clairette Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here", posId: "3509", posName: "Clair Fl H" },
        { type: "togo", price: 17, label: "To Go", posId: "3510", posName: "Clair Fl TG" }
      ]
    },
    {
      id: "infrarouge_bottle",
      name: "Infrarouge Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 29, label: "Here", posId: "3511", posName: "Infra Fl H" },
        { type: "togo", price: 19, label: "To Go", posId: "3512", posName: "Infra Fl TG" }
      ]
    },
    {
      id: "grenache_bottle",
      name: "Grenache Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here", posId: "3513", posName: "Gren Fl H" },
        { type: "togo", price: 17, label: "To Go", posId: "3514", posName: "Gren Fl TG" }
      ]
    },
    {
      id: "tete_claques_bottle",
      name: "Tête à Claques Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here", posId: "3515", posName: "TeteCla Fl H" },
        { type: "togo", price: 17, label: "To Go", posId: "3516", posName: "TeteCla Fl TG" }
      ]
    },
    {
      id: "deferlante_rouge_bottle",
      name: "Deferlante Rouge Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 30, label: "Here", posId: "3517", posName: "DefRouge Fl H" },
        { type: "togo", price: 17, label: "To Go", posId: "3518", posName: "DefRouge Fl TG" }
      ]
    },
    {
      id: "ya_plus_qua_bottle",
      name: "Y'a plus qu'à Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 29, label: "Here", posId: "3519", posName: "YaPlusQ Fl H" },
        { type: "togo", price: 16, label: "To Go", posId: "3520", posName: "YaPlusQ Fl TG" }
      ]
    },
    {
      id: "divin_rose_bottle",
      name: "Divin Rosé Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 25.5, label: "Here", posId: "3521", posName: "DivRose Fl H" },
        { type: "togo", price: 14, label: "To Go", posId: "3522", posName: "DivRose Fl TG" }
      ]
    },
    {
      id: "cremant_alsace_bottle",
      name: "Crémant d'Alsace Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 24, label: "Here", posId: "3523", posName: "CremAls Fl H" },
        { type: "togo", price: 21, label: "To Go", posId: "3524", posName: "CremAls Fl TG" }
      ]
    },
    {
      id: "vi_no_bottle",
      name: "Vi-No Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 25.5, label: "Here", posId: "3525", posName: "ViNo Fl H" },
        { type: "togo", price: 14, label: "To Go", posId: "3526", posName: "ViNo Fl TG" }
      ]
    },
    {
      id: "fritz_muller_bottle",
      name: "Fritz Müller Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 25.5, label: "Here", posId: "3527", posName: "FritzM Fl H" },
        { type: "togo", price: 14, label: "To Go", posId: "3528", posName: "FritzM Fl TG" }
      ]
    },
    {
      id: "divin_pinot_noir_bottle",
      name: "Divin Pinot Noir Fl.",
      subcategory: "natural",
      variants: [
        { type: "here", price: 29, label: "Here", posId: "3529", posName: "DivPinNoir Fl H" },
        { type: "togo", price: 18.5, label: "To Go", posId: "3530", posName: "DivPinNoir Fl TG" }
      ]
    },
  ]
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
  { id: "white", label: "🥂 White" },
  { id: "rosé", label: "🌸 Rosé" },
  { id: "sparkling", label: "🍾 Sparkling" },
  { id: "red", label: "🍷 Red" },
  { id: "natural", label: "🍇 Natural" },
  { id: "water", label: "💧 Water" },
];
