import { createContext, useContext, useReducer, useCallback, type ReactNode } from "react";
import { expandItems } from "../utils/helpers";
import type { OrderItem, SplitPayment, PaymentInput, ExpandedItem } from "../types";

// ── State ──

interface SplitState {
  mode: "equal" | "item" | null;
  remaining: ExpandedItem[];
  selected: Set<string>;
  payments: SplitPayment[];
  equalGuests: number;
  equalPayments: PaymentInput[];
  itemPayments: Record<number, PaymentInput>;
}

const initialState: SplitState = {
  mode: null,
  remaining: [],
  selected: new Set(),
  payments: [],
  equalGuests: 2,
  equalPayments: [{ amount: "", confirmed: false }],
  itemPayments: {},
};

// ── Actions ──

type SplitAction =
  | { type: "INITIATE_EQUAL"; items: OrderItem[] }
  | { type: "INITIATE_ITEM"; items: OrderItem[] }
  | { type: "TOGGLE_ITEM"; uid: string }
  | { type: "SELECT_ALL" }
  | { type: "SET_EQUAL_GUESTS"; count: number }
  | { type: "UPDATE_EQUAL_PAYMENT"; index: number; payment: PaymentInput }
  | { type: "ADD_EQUAL_PAYMENT"; payments: PaymentInput[] }
  | { type: "UPDATE_ITEM_PAYMENT"; guestNum: number; payment: PaymentInput }
  | { type: "CONFIRM_GUEST"; guestNum: number; items: ExpandedItem[]; total: number }
  | { type: "NEXT_GUEST" }
  | { type: "RESET" };

function splitReducer(state: SplitState, action: SplitAction): SplitState {
  switch (action.type) {
    case "INITIATE_EQUAL":
      return {
        ...initialState,
        mode: "equal",
        remaining: expandItems(action.items) as ExpandedItem[],
        equalPayments: [{ amount: "", confirmed: false }],
      };

    case "INITIATE_ITEM":
      return {
        ...initialState,
        mode: "item",
        remaining: expandItems(action.items) as ExpandedItem[],
      };

    case "TOGGLE_ITEM": {
      const next = new Set(state.selected);
      if (next.has(action.uid)) {
        next.delete(action.uid);
      } else {
        next.add(action.uid);
      }
      return { ...state, selected: next };
    }

    case "SELECT_ALL": {
      const allUids = new Set(state.remaining.map((i) => i._uid));
      return { ...state, selected: allUids };
    }

    case "SET_EQUAL_GUESTS":
      return { ...state, equalGuests: action.count };

    case "UPDATE_EQUAL_PAYMENT": {
      const payments = [...state.equalPayments];
      payments[action.index] = action.payment;
      return { ...state, equalPayments: payments };
    }

    case "ADD_EQUAL_PAYMENT":
      return { ...state, equalPayments: action.payments };

    case "UPDATE_ITEM_PAYMENT":
      return {
        ...state,
        itemPayments: {
          ...state.itemPayments,
          [action.guestNum]: action.payment,
        },
      };

    case "CONFIRM_GUEST": {
      const selectedUids = state.selected;
      const remaining = state.remaining.filter((i) => !selectedUids.has(i._uid));
      const payment: SplitPayment = {
        guestNum: action.guestNum,
        items: action.items,
        total: action.total,
      };
      return {
        ...state,
        remaining,
        selected: new Set(),
        payments: [...state.payments, payment],
      };
    }

    case "NEXT_GUEST":
      return { ...state, selected: new Set() };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// ── Context ──

interface SplitContextValue {
  state: SplitState;
  dispatch: React.Dispatch<SplitAction>;
  // Derived
  selectedItems: ExpandedItem[];
  selectedTotal: number;
  remainingTotal: number;
  currentGuestNum: number;
  lastPayment: SplitPayment | null;
}

const SplitContext = createContext<SplitContextValue | null>(null);

export function SplitProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(splitReducer, initialState);

  const selectedItems = state.remaining.filter((i) => state.selected.has(i._uid));
  const selectedTotal = selectedItems.reduce((s, i) => s + i.price, 0);
  const remainingTotal = state.remaining.reduce((s, i) => s + i.price, 0);
  const currentGuestNum = state.payments.length + 1;
  const lastPayment = state.payments.length > 0 ? state.payments[state.payments.length - 1] : null;

  return (
    <SplitContext.Provider value={{
      state, dispatch,
      selectedItems, selectedTotal, remainingTotal,
      currentGuestNum, lastPayment,
    }}>
      {children}
    </SplitContext.Provider>
  );
}

export function useSplit() {
  const ctx = useContext(SplitContext);
  if (!ctx) throw new Error("useSplit must be used within SplitProvider");
  return ctx;
}
