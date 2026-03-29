import { AppProvider, useApp } from "./contexts/AppContext";
import { TableProvider } from "./contexts/TableContext";
import { SplitProvider, useSplit } from "./contexts/SplitContext";
import { TablesView } from "./views/TablesView";
import { OrderView } from "./views/OrderView";
import { TicketView } from "./views/TicketView";
import { SplitEqualView } from "./views/SplitEqualView";
import { SplitItemView } from "./views/SplitItemView";
import { SplitConfirmView } from "./views/SplitConfirmView";
import { SplitDoneView } from "./views/SplitDoneView";
import { DailySalesView } from "./views/DailySalesView";
import { Toast } from "./components/Toast";
import { S } from "./styles/appStyles";

function Router() {
  const { view, toast } = useApp();

  return (
    <div style={S.root}>
      {toast && <Toast message={toast} />}

      {view === "tables" && <TablesView />}
      {view === "order" && <OrderView />}
      {view === "ticket" && <TicketView />}
      {view === "split" && <SplitRouter />}
      {view === "splitConfirm" && <SplitConfirmView />}
      {view === "splitDone" && <SplitDoneView />}
      {view === "dailySales" && <DailySalesView />}
    </div>
  );
}

function SplitRouter() {
  const { state } = useSplit();

  if (state.mode === "equal") return <SplitEqualView />;
  if (state.mode === "item") return <SplitItemView />;

  // Fallback: no mode set yet — shouldn't happen, but handle gracefully
  return <SplitItemView />;
}

export default function App() {
  return (
    <AppProvider>
      <TableProvider>
        <SplitProvider>
          <Router />
        </SplitProvider>
      </TableProvider>
    </AppProvider>
  );
}
