import { MENU } from "../data/constants";
import type { Bill, OrderItem } from "../types";

/**
 * Migration utility to add posId/posName to legacy paid bills
 * Looks up items in current MENU and copies metadata
 */
export function migratePaidBills(bills: Bill[]): Bill[] {
  return bills.map((bill) => ({
    ...bill,
    items: bill.items.map((item) => {
      // Skip if already has posId
      if ((item as any).posId) return item;

      // Look up item in menu
      const menuItem = findMenuItem(item.id, item.name);
      if (menuItem) {
        return {
          ...item,
          posId: menuItem.posId,
          posName: menuItem.posName,
        };
      }

      // No match found, return as-is
      return item;
    }),
  }));
}

function findMenuItem(itemId: string, itemName: string): { posId: string; posName: string } | null {
  // Extract base id from variant ids (e.g., "wg13-large" -> "wg13")
  const baseId = itemId.includes('-') ? itemId.split('-')[0] : itemId;

  // Search all categories
  for (const category of Object.values(MENU)) {
    for (const item of category) {
      // Simple items (no variants)
      if ("posId" in item && item.posId && item.id === itemId) {
        return { posId: item.posId, posName: (item as any).posName || item.shortName || item.name };
      }

      // Items with variants (check both full itemId and baseId)
      if ("variants" in item && item.variants && (item.id === itemId || item.id === baseId)) {
        // Try to match by item name pattern (e.g., "Picpoul (0,2)" -> find variant with "0,2" label)
        const variantMatch = itemName.match(/\(([^)]+)\)/);
        if (variantMatch) {
          const labelPart = variantMatch[1]; // e.g., "0,2", "Here", "To Go"
          const variant = item.variants.find((v: any) => v.label === labelPart);
          if (variant && variant.posId) {
            return { posId: variant.posId, posName: variant.posName || (variant as any).shortName };
          }
        }

        // Fallback: try matching the full name with variant.label
        for (const variant of item.variants) {
          const expectedName = `${item.name} (${variant.label})`;
          if (itemName === expectedName && (variant as any).posId) {
            return { posId: (variant as any).posId, posName: (variant as any).posName || (variant as any).shortName };
          }
        }
      }
    }
  }

  return null;
}
