import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useApp } from "../contexts/AppContext";
import { useUI, type TextScale } from "../contexts/UIContext";
import { GearIcon, LogoutIcon, SunIcon, MoonIcon, BarChartIcon } from "./icons";
import { Modal } from "./Modal";
import { colors, radii } from "../styles/tokens";

const ROW_BTN: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "11px 16px",
  background: "none",
  border: "none",
  width: "100%",
  textAlign: "left",
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  color: colors.fg,
};

const DIVIDER: React.CSSProperties = {
  height: 1,
  background: colors.border,
  margin: "3px 0",
};

export function ProfileMenu({ placement = "bottom-start" }: { placement?: "bottom-start" | "right-end" }) {
  const { isAdmin, logout } = useAuth();
  const { setView, showToast } = useApp();
  const { darkMode, toggleDarkMode, textScale, setTextScale } = useUI();

  const [open, setOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const username = isAdmin ? "admin" : "staff";
  const initials = isAdmin ? "A" : "S";

  return (
    <>
      <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
        {/* Avatar circle */}
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: colors.chipBg,
            border: `1.5px solid ${colors.border}`,
            color: colors.fg,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "inherit",
            letterSpacing: "0.02em",
            flexShrink: 0,
          }}
        >
          {initials}
        </button>

        {/* Dropdown */}
        {open && (
          <div
            style={{
              position: "absolute",
              ...(placement === "right-end"
                ? { left: "calc(100% + 8px)", bottom: 0 }
                : { top: "calc(100% + 8px)", left: 0 }),
              width: 224,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.lg,
              boxShadow: "0 6px 24px rgba(0,0,0,0.14)",
              zIndex: 500,
              overflow: "hidden",
              animation: "scaleIn 0.12s ease-out",
              transformOrigin: placement === "right-end" ? "bottom left" : "top left",
            }}
          >
            {/* Username row */}
            <div style={{ padding: "12px 16px 10px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: colors.chipBg,
                border: `1px solid ${colors.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: colors.fg,
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.fg, letterSpacing: "0.01em" }}>
                {username}
              </span>
            </div>

            <div style={DIVIDER} />

            {/* Dark mode toggle */}
            <button
              style={{ ...ROW_BTN, justifyContent: "space-between" }}
              onClick={toggleDarkMode}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {darkMode
                  ? <SunIcon size={15} color={colors.subtle} />
                  : <MoonIcon size={15} color={colors.subtle} />
                }
                <span style={{ color: colors.fg }}>Dark mode</span>
              </div>
              {/* Toggle switch */}
              <div style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                background: darkMode ? colors.fg : colors.border,
                position: "relative",
                transition: "background 0.18s",
                flexShrink: 0,
              }}>
                <div style={{
                  position: "absolute",
                  top: 2,
                  left: darkMode ? 18 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.18s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </div>
            </button>

            {/* Text scale */}
            <div style={{ ...ROW_BTN, justifyContent: "space-between", cursor: "default" }}>
              <span style={{ color: colors.fg }}>Text size</span>
              <div style={{ display: "flex", gap: 4 }}>
                {(["sm", "md", "lg"] as TextScale[]).map((s) => {
                  const active = textScale === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setTextScale(s)}
                      style={{
                        padding: "3px 9px",
                        borderRadius: 6,
                        border: `1.5px solid ${active ? colors.fg : colors.border}`,
                        background: active ? colors.chipBg : "transparent",
                        color: active ? colors.fg : colors.muted,
                        fontSize: s === "sm" ? 11 : s === "md" ? 13 : 15,
                        fontWeight: active ? 700 : 500,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        lineHeight: 1.4,
                      }}
                    >
                      {s === "sm" ? "S" : s === "md" ? "M" : "L"}
                    </button>
                  );
                })}
              </div>
            </div>

            {isAdmin && (
              <>
                <div style={DIVIDER} />
                <button
                  style={ROW_BTN}
                  onClick={() => { setView("analytics"); setOpen(false); }}
                >
                  <BarChartIcon size={15} color={colors.subtle} />
                  <span style={{ color: colors.fg }}>Analytics</span>
                </button>
                <button
                  style={ROW_BTN}
                  onClick={() => { setView("admin"); setOpen(false); }}
                >
                  <GearIcon size={15} color={colors.subtle} />
                  <span style={{ color: colors.fg }}>Menu editor</span>
                </button>
              </>
            )}

            <div style={DIVIDER} />

            <button
              style={{ ...ROW_BTN, color: colors.danger }}
              onClick={() => { setOpen(false); setShowLogoutModal(true); }}
            >
              <LogoutIcon size={15} color={colors.danger} />
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>

      {showLogoutModal && (
        <Modal
          title="Log Out"
          onClose={() => setShowLogoutModal(false)}
          onConfirm={() => {
            logout();
            setShowLogoutModal(false);
            showToast("Logged out");
          }}
          confirmText="Log Out"
        >
          <div style={{ fontSize: 14, color: colors.subtle, lineHeight: 1.5 }}>
            Are you sure you want to log out?
          </div>
        </Modal>
      )}
    </>
  );
}
