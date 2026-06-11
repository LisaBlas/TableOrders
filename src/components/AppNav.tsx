import { useApp } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { SalesIcon, BarChartIcon, GearIcon, GridIcon } from "./icons";
import { ProfileMenu } from "./ProfileMenu";
import { colors, radii } from "../styles/tokens";
import { SHELL_VIEWS } from "../navigation";
import type { View } from "../types";

type NavTab = {
  id: View;
  label: string;
  Icon: React.FC<{ size?: number; color?: string }>;
};

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

export function AppNav() {
  const { view, setView } = useApp();
  const { isAdmin } = useAuth();
  const { isTabletLandscape, isLaptop, isDesktop } = useBreakpoint();
  const isWide = isDesktop || isLaptop || isTabletLandscape;

  if (!SHELL_VIEWS.includes(view)) return null;

  const mobileOnlyTabs: NavTab[] = [
    { id: "tables", label: "Floor", Icon: GridIcon },
    { id: "dailySales", label: "Sales", Icon: SalesIcon },
  ];

  const tabs: NavTab[] = [
    { id: "tables", label: "Floor", Icon: GridIcon },
    { id: "dailySales", label: "Sales", Icon: SalesIcon },
    ...(isAdmin ? [{ id: "analytics" as View, label: "Analytics", Icon: BarChartIcon }] : []),
    ...(isAdmin ? [{ id: "admin" as View, label: "Menu", Icon: GearIcon }] : []),
  ];

  if (isWide) {
    return (
      <nav
        style={{
          width: isLaptop || isDesktop ? 88 : 72,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: isLaptop || isDesktop ? 28 : 24,
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

        <div style={{ flex: 1 }} />
        <div style={{ paddingTop: 12 }}>
          <ProfileMenu placement="right-end" />
        </div>
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
      {mobileOnlyTabs.map(({ id, label, Icon }) => {
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
