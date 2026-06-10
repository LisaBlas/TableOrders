import { useApp } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { SalesIcon, BarChartIcon, GearIcon, LogoutIcon, GridIcon } from "./icons";
import { colors, radii } from "../styles/tokens";
import type { View } from "../types";

type NavTab = {
  id: View;
  label: string;
  Icon: React.FC<{ size?: number; color?: string }>;
};

const NAV_VIEWS: View[] = ["tables", "dailySales", "analytics"];

const itemStyle = (active: boolean): React.CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  padding: "10px 0",
  borderRadius: radii.sm,
  border: "none",
  background: active ? colors.chipBg : "transparent",
  color: active ? colors.fg : colors.muted,
  cursor: "pointer",
  fontSize: 10,
  fontWeight: active ? 700 : 500,
  width: 56,
  fontFamily: "inherit",
  letterSpacing: "0.01em",
});

const ghostItemStyle: React.CSSProperties = {
  ...itemStyle(false),
  background: "transparent",
  color: colors.muted,
};

export function AppNav() {
  const { view, setView } = useApp();
  const { isAdmin, logout } = useAuth();
  const { isTabletLandscape, isDesktop } = useBreakpoint();
  const isWide = isDesktop || isTabletLandscape;

  if (!NAV_VIEWS.includes(view)) return null;

  const tabs: NavTab[] = [
    { id: "tables", label: "Floor", Icon: GridIcon },
    { id: "dailySales", label: "Sales", Icon: SalesIcon },
    ...(isAdmin ? [{ id: "analytics" as View, label: "Analytics", Icon: BarChartIcon }] : []),
  ];

  if (isWide) {
    return (
      <nav
        style={{
          width: 72,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 24,
          paddingBottom: 20,
          background: colors.surface,
          borderRight: `1px solid ${colors.border}`,
          gap: 2,
        }}
      >
        {tabs.map(({ id, label, Icon }) => {
          const active = view === id;
          return (
            <button key={id} onClick={() => setView(id)} style={itemStyle(active)}>
              <Icon size={20} color={active ? colors.fg : colors.muted} />
              {label}
            </button>
          );
        })}

        {isAdmin && (
          <button onClick={() => setView("admin")} style={ghostItemStyle}>
            <GearIcon size={18} color={colors.muted} />
            Menu
          </button>
        )}
        <button onClick={logout} style={ghostItemStyle}>
          <LogoutIcon size={18} color={colors.muted} />
          Logout
        </button>

        <div style={{ flex: 1 }} />
      </nav>
    );
  }

  return (
    <nav
      style={{
        height: 60,
        background: colors.surface,
        borderTop: `1px solid ${colors.border}`,
        display: "flex",
        alignItems: "stretch",
        flexShrink: 0,
      }}
    >
      {tabs.map(({ id, label, Icon }) => {
        const active = view === id;
        return (
          <button
            key={id}
            onClick={() => setView(id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              border: "none",
              background: "transparent",
              color: active ? colors.fg : colors.muted,
              cursor: "pointer",
              fontSize: 10,
              fontWeight: active ? 700 : 500,
              fontFamily: "inherit",
              letterSpacing: "0.01em",
              padding: "8px 4px",
            }}
          >
            <Icon size={20} color={active ? colors.fg : colors.muted} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
