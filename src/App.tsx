import { useEffect, useRef, useState } from "react";
import logoImg from "./assets/camidi_logo.jpg";
import { IS_DEMO_MODE, initDemoState } from "./demo";
import { DemoBanner } from "./components/DemoBanner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { MenuProvider, useMenu } from "./contexts/MenuContext";
import { AppProvider, useApp } from "./contexts/AppContext";
import { TableProvider } from "./contexts/TableContext";
import { SplitProvider, useSplit } from "./contexts/SplitContext";
import { UIProvider, useUI, TEXT_SCALE_ZOOM } from "./contexts/UIContext";
import { useBreakpoint } from "./hooks/useBreakpoint";
import { AppNav } from "./components/AppNav";
import { ProfileMenu } from "./components/ProfileMenu";
import { TablesView } from "./views/TablesView";
import type { View } from "./types";
import { OrderView } from "./views/OrderView";
import { TicketView } from "./views/TicketView";
import { SplitEqualView } from "./views/SplitEqualView";
import { SplitItemView } from "./views/SplitItemView";
import { SplitConfirmView } from "./views/SplitConfirmView";
import { SplitDoneView } from "./views/SplitDoneView";
import { DailySalesView } from "./views/DailySalesView";
import { AnalyticsView } from "./views/AnalyticsView";
import { AdminView } from "./views/AdminView";
import LoginView from "./views/LoginView";
import { Toast } from "./components/Toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ConflictResolutionModal } from "./components/ConflictResolutionModal";
import { useTable } from "./contexts/TableContext";
import { S } from "./styles/appStyles";
import { colors } from "./styles/tokens";

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
  const { isTabletLandscape, isTablet, isLaptop, isDesktop } = useBreakpoint();
  const rootStyle = isDesktop
    ? S.rootDesktop
    : isLaptop
      ? S.rootLaptop
      : isTabletLandscape
        ? S.rootTabletLandscape
        : isTablet
          ? S.rootTablet
          : S.root;

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

function MobileTopBar() {
  return (
    <div style={{
      height: 52,
      padding: "0 16px",
      display: "flex",
      alignItems: "center",
      background: colors.surface,
      borderBottom: `1px solid ${colors.border}`,
      flexShrink: 0,
    }}>
      <ProfileMenu />
    </div>
  );
}

function Router() {
  const { view, toast, setView } = useApp();
  const { menuLoading } = useMenu();
  const { isAuthenticated } = useAuth();
  const { syncError, conflicts, resolveConflict } = useTable();
  const { isTabletLandscape, isTablet, isLaptop, isDesktop } = useBreakpoint();
  const { state: splitState, dispatch: splitDispatch } = useSplit();
  const { textScale } = useUI();

  const [splashDone, setSplashDone] = useState(false);
  const splashStartedRef = useRef(false);

  // Refs so the popstate handler always sees current values without re-registering
  const viewRef = useRef(view);
  const splitStateRef = useRef(splitState);
  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { splitStateRef.current = splitState; }, [splitState]);

  useEffect(() => { window.scrollTo(0, 0); }, [view]);

  // Hardware/browser back button interception
  useEffect(() => {
    if (!isAuthenticated) return;

    history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      history.pushState(null, '', window.location.href);

      const v = viewRef.current;
      const ss = splitStateRef.current;

      if (v === 'order') {
        setView('tables');
      } else if (v === 'ticket') {
        setView('order');
      } else if (v === 'dailySales') {
        setView('tables');
      } else if (v === 'analytics') {
        setView('tables');
      } else if (v === 'admin') {
        setView('tables');
      } else if (v === 'split') {
        if (ss.mode === 'equal') {
          splitDispatch({ type: 'RESET' });
          setView('ticket');
        } else if (ss.mode === 'item' && ss.payments.length === 0) {
          splitDispatch({ type: 'RESET' });
          setView('ticket');
        }
        // item split with payments in progress — back is blocked
      }
      // 'tables', 'splitConfirm', 'splitDone' — no navigation
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated, setView, splitDispatch]);

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

  const rootStyle = isDesktop
    ? S.rootDesktop
    : isLaptop
      ? S.rootLaptop
      : isTabletLandscape
        ? S.rootTabletLandscape
        : isTablet
          ? S.rootTablet
          : S.root;

  const zoom = TEXT_SCALE_ZOOM[textScale];

  const NAV_VIEWS: View[] = ["tables", "dailySales", "analytics"];
  const isNavView = NAV_VIEWS.includes(view);
  const isWide = isDesktop || isLaptop || isTabletLandscape;
  const useSidebar = isNavView && isWide;
  const useBottomBar = isNavView && !isWide;
  const navRootStyle = isDesktop ? S.rootNavDesktop : isLaptop ? S.rootNavLaptop : rootStyle;

  // When zoom != 1, the container's nominal height must be 100dvh/zoom so
  // its rendered size (nominal × zoom) still fills exactly 100dvh.
  const dvh = zoom === 1 ? "100dvh" : `calc(100dvh / ${zoom})`;

  const outerStyle: React.CSSProperties = isNavView
    ? {
        ...navRootStyle,
        display: "flex",
        flexDirection: useSidebar ? "row" : "column",
        height: dvh,
        minHeight: dvh,
        overflow: "hidden",
      }
    : rootStyle;

  const contentStyle: React.CSSProperties = isNavView
    ? { flex: 1, overflowY: "auto", minHeight: 0, minWidth: 0 }
    : {};

  const syncBanner = syncError && !IS_DEMO_MODE && (
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
  );

  return (
    <div style={{ ...outerStyle, zoom } as React.CSSProperties}>
      {useSidebar && <AppNav />}
      {useBottomBar && isNavView && <MobileTopBar />}
      <div style={contentStyle}>
        {IS_DEMO_MODE && <DemoBanner />}
        {syncBanner}
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
        {view === "analytics" && (
          <ErrorBoundary inline>
            <AnalyticsView />
          </ErrorBoundary>
        )}
        {view === "admin" && <AdminView />}
      </div>
      {useBottomBar && <AppNav />}
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
  useEffect(() => {
    if (IS_DEMO_MODE) initDemoState();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
    <UIProvider>
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
    </UIProvider>
    </QueryClientProvider>
  );
}
