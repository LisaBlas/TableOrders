import { getItemDestination } from "./helpers";
import type { OrderItem } from "../types";

export type Destination = "bar" | "counter" | "kitchen";

export const DESTINATIONS: Destination[] = ["bar", "counter", "kitchen"];

export const DEST_LABELS: Record<Destination, string> = {
  bar: "🍷 Bar",
  counter: "🧀 Counter",
  kitchen: "🍽️ Kitchen",
};

export function groupByDestination(items: OrderItem[]): Record<Destination, OrderItem[]> {
  const groups: Record<Destination, OrderItem[]> = { bar: [], counter: [], kitchen: [] };
  for (const item of items) {
    groups[getItemDestination(item) as Destination].push(item);
  }
  return groups;
}
