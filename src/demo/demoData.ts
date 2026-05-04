import type { TableSession } from "../services/directusSessions";
import type { Bill } from "../types";

export function buildSeedSessions(): TableSession[] {
  const now = Date.now();
  return [
    {
      id: 1,
      table_id: "4",
      seated: true,
      gutschein: null,
      orders: [
        { id: "f2", name: "Cheese Plate", shortName: "CP", price: 11, qty: 2, sentQty: 0, subcategory: "cheese" },
        { id: "dr5", name: "Pilsner Urquell", shortName: "PU", price: 3.8, qty: 2, sentQty: 0, subcategory: "bier" },
      ],
      sent_batches: [],
      marked_batches: [],
    },
    {
      id: 2,
      table_id: "10",
      seated: true,
      gutschein: null,
      orders: [
        { id: "f7", name: "Camembert Rôti", shortName: "CAM", price: 17, qty: 1, sentQty: 1, subcategory: "warm" },
        { id: "wg1-large", name: "Picpoul (0,2)", shortName: "PP", price: 6.5, qty: 1, sentQty: 0, subcategory: "wine", baseId: "wg1", variantType: "large" },
      ],
      sent_batches: [
        {
          id: "batch-t10-1",
          timestamp: new Date(now - 30 * 60 * 1000).toISOString(),
          items: [
            { id: "f7", name: "Camembert Rôti", shortName: "CAM", price: 17, qty: 1, sentQty: 1, subcategory: "warm" },
          ],
        },
      ],
      marked_batches: [],
    },
    {
      id: 3,
      table_id: "12",
      seated: true,
      gutschein: null,
      orders: [
        { id: "f11", name: "Raclette", shortName: "Raclette", price: 28, qty: 2, sentQty: 2, subcategory: "warm" },
        { id: "wg3-large", name: "Grauburgunder (0,2)", shortName: "GB", price: 7.5, qty: 2, sentQty: 2, subcategory: "wine", baseId: "wg3", variantType: "large" },
        { id: "dr1", name: "Aperol", shortName: "Aperol", price: 8, qty: 2, sentQty: 2, subcategory: "cocktail" },
      ],
      sent_batches: [
        {
          id: "batch-t12-1",
          timestamp: new Date(now - 90 * 60 * 1000).toISOString(),
          items: [
            { id: "f11", name: "Raclette", shortName: "Raclette", price: 28, qty: 2, sentQty: 2, subcategory: "warm" },
            { id: "wg3-large", name: "Grauburgunder (0,2)", shortName: "GB", price: 7.5, qty: 2, sentQty: 2, subcategory: "wine" },
            { id: "dr1", name: "Aperol", shortName: "Aperol", price: 8, qty: 2, sentQty: 2, subcategory: "cocktail" },
          ],
        },
      ],
      marked_batches: ["batch-t12-1"],
    },
  ] as unknown as TableSession[];
}

export function buildSeedBills(): Bill[] {
  const now = Date.now();
  return [
    {
      directusId: "demo-bill-1",
      tableId: 1,
      total: 49.5,
      timestamp: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      paymentMode: "full",
      addedToPOS: false,
      items: [
        { directusId: "demo-item-1-1", id: "f7", name: "Camembert Rôti", shortName: "CAM", price: 17, qty: 1, sentQty: 1, subcategory: "warm", crossedQty: 0 },
        { directusId: "demo-item-1-2", id: "f19", name: "Olives", shortName: "OLV", price: 3, qty: 1, sentQty: 1, subcategory: "snacks", crossedQty: 0 },
        { directusId: "demo-item-1-3", id: "wg2-large", name: "Sauvignon Blanc (0,2)", shortName: "SB", price: 7, qty: 2, sentQty: 2, subcategory: "wine", crossedQty: 0 },
        { directusId: "demo-item-1-4", id: "dr5", name: "Pilsner Urquell", shortName: "PU", price: 3.8, qty: 2, sentQty: 2, subcategory: "bier", crossedQty: 0 },
        { directusId: "demo-item-1-5", id: "co2", name: "Café Crème", shortName: "Café Crema", price: 2.6, qty: 1, sentQty: 1, subcategory: "warm", crossedQty: 0 },
      ],
    },
    {
      directusId: "demo-bill-2",
      tableId: 3,
      total: 87,
      timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      paymentMode: "equal",
      splitData: { guests: 2 },
      addedToPOS: false,
      items: [
        { directusId: "demo-item-2-1", id: "f2", name: "Cheese Plate", shortName: "CP", price: 11, qty: 2, sentQty: 2, subcategory: "cheese", crossedQty: 0 },
        { directusId: "demo-item-2-2", id: "f12", name: "Fondue", shortName: "Fondue", price: 28, qty: 2, sentQty: 2, subcategory: "warm", crossedQty: 0 },
        { directusId: "demo-item-2-3", id: "wg3-large", name: "Grauburgunder (0,2)", shortName: "GB", price: 7.5, qty: 2, sentQty: 2, subcategory: "wine", crossedQty: 0 },
      ],
    },
    {
      directusId: "demo-bill-3",
      tableId: "A",
      total: 34.3,
      timestamp: new Date(now - 60 * 60 * 1000).toISOString(),
      paymentMode: "full",
      addedToPOS: true,
      items: [
        { directusId: "demo-item-3-1", id: "f13", name: "Seguin", shortName: "SEG", price: 12.5, qty: 1, sentQty: 1, subcategory: "salads", crossedQty: 1 },
        { directusId: "demo-item-3-2", id: "f19", name: "Olives", shortName: "OLV", price: 3, qty: 2, sentQty: 2, subcategory: "snacks", crossedQty: 2 },
        { directusId: "demo-item-3-3", id: "wg1-large", name: "Picpoul (0,2)", shortName: "PP", price: 6.5, qty: 1, sentQty: 1, subcategory: "wine", crossedQty: 1 },
        { directusId: "demo-item-3-4", id: "dr5", name: "Pilsner Urquell", shortName: "PU", price: 3.8, qty: 2, sentQty: 2, subcategory: "bier", crossedQty: 2 },
      ],
    },
  ];
}
