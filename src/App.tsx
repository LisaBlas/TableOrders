import { useEffect, useRef, useState } from "react";
import logoImg from "./assets/camidi_logo.jpg";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { MenuProvider, useMenu } from "./contexts/MenuContext";
import { AppProvider, useApp } from "./contexts/AppContext";
import { TableProvider } from "./contexts/TableContext";
import { SplitProvider, useSplit } from "./contexts/SplitContext";
import { useBreakpoint } from "./hooks/useBreakpoint";
import { TablesView } from "./views/TablesView";
import { OrderView } from "./views/OrderView";
import { TicketView } from "./views/TicketView";
import { SplitEqualView } from "./views/SplitEqualView";
import { SplitItemView } from "./views/SplitItemView";
import { SplitConfirmView } from "./views/SplitConfirmView";
import { SplitDoneView } from "./views/SplitDoneView";
import { DailySalesView } from "./views/DailySalesView";
import LoginView from "./views/LoginView";
import { Toast } from "./components/Toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ConflictResolutionModal } from "./components/ConflictResolutionModal";
import { useTable } from "./contexts/TableContext";
import { S } from "./styles/appStyles";

function SplashScreen() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#f5f4f0",
        gap: "20px",
      }}
    >
      <style>{`
        @keyframes splashFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
      <img
        src={logoImg}
        alt="Camidi logo"
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          objectFit: "cover",
          animation: "splashFadeIn 0.7s ease-out 0.1s forwards",
          opacity: 0,
        }}
      />
      <p
        style={{
          fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
          fontSize: 20,
          fontWeight: 500,
          color: "#222",
          letterSpacing: "0.01em",
          animation: "splashFadeIn 0.7s ease-out 0.7s forwards",
          opacity: 0,
        }}
      >
        Camidi – TableOrders
      </p>
    </div>
  );
}

function LoadingScreen() {
  const { isTabletLandscape, isTablet, isDesktop } = useBreakpoint();
  const rootStyle = isDesktop || isTabletLandscape ? S.rootTabletLandscape : isTablet ? S.rootTablet : S.root;

  return (
    <div style={rootStyle}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: "20px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #f3f3f3",
            borderTop: "3px solid #000",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

function Router() {
  const { view, toast } = useApp();
  const { menuLoading } = useMenu();
  const { isAuthenticated } = useAuth();
  const { syncError, conflicts, resolveConflict } = useTable();
  const { isTabletLandscape, isTablet, isDesktop } = useBreakpoint();

  const [splashDone, setSplashDone] = useState(false);
  const splashStartedRef = useRef(false);

  useEffect(() => { window.scrollTo(0, 0); }, [view]);

  useEffect(() => {
    if (!menuLoading && !isAuthenticated && !splashStartedRef.current) {
      splashStartedRef.current = true;
      const timer = setTimeout(() => setSplashDone(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [menuLoading, isAuthenticated]);

  if (menuLoading) return <LoadingScreen />;

  // Auth guard: show splash then login if not authenticated
  if (!isAuthenticated) {
    if (!splashDone) return <SplashScreen />;
    return <LoginView />;
  }

  const rootStyle = isDesktop || isTabletLandscape ? S.rootTabletLandscape : isTablet ? S.rootTablet : S.root;

  return (
    <div style={rootStyle}>
      {syncError && (
        <div
          style={{
            background: "#b45309",
            color: "#fff",
            padding: "6px 12px",
            fontSize: 13,
            textAlign: "center",
            fontWeight: 500,
          }}
        >
          Sync offline — table changes may not save
        </div>
      )}
      {toast && <Toast message={toast} />}

      {conflicts.length > 0 && (
        <ConflictResolutionModal
          conflict={conflicts[0]}
          conflictIndex={1}
          totalConflicts={conflicts.length}
          onResolve={(resolution) => resolveConflict(conflicts[0], resolution)}
        />
      )}

      {view === "tables" && <TablesView />}
      {view === "order" && <OrderView />}
      {view === "ticket" && <TicketView />}
      {view === "split" && <SplitRouter />}
      {view === "splitConfirm" && <SplitConfirmView />}
      {view === "splitDone" && <SplitDoneView />}
      {view === "dailySales" && (
        <ErrorBoundary inline>
          <DailySalesView />
        </ErrorBoundary>
      )}
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

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <MenuProvider>
        <AuthProvider>
          <AppProvider>
            <TableProvider>
              <SplitProvider>
                <Router />
              </SplitProvider>
            </TableProvider>
          </AppProvider>
        </AuthProvider>
      </MenuProvider>
    </ErrorBoundary>
    </QueryClientProvider>
  );
}
