import type { ReactNode } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { S } from "../styles/appStyles";
import { ProfileMenu } from "./ProfileMenu";
import { BackIcon } from "./icons";

type HeaderLeft = "back" | "profile" | "none";

interface ScreenHeaderProps {
  title: ReactNode;
  left?: HeaderLeft;
  onBack?: () => void;
  backDisabled?: boolean;
  hideBackOnWide?: boolean;
  right?: ReactNode;
  ariaLabel?: string;
  style?: React.CSSProperties;
}

export function ScreenHeader({
  title,
  left = "none",
  onBack,
  backDisabled = false,
  hideBackOnWide = false,
  right,
  ariaLabel = "Go back",
  style,
}: ScreenHeaderProps) {
  const { isTablet, isTabletLandscape, isLaptop, isDesktop } = useBreakpoint();
  const headerStyle = isTablet || isTabletLandscape || isDesktop ? S.headerTablet : S.header;
  const isWideShell = isTabletLandscape || isLaptop || isDesktop;
  const showBack = left === "back" && !(hideBackOnWide && isWideShell);

  const leftNode =
    showBack ? (
      <button
        style={{
          ...S.back,
          ...(backDisabled ? { opacity: 0.3, cursor: "not-allowed" } : {}),
        }}
        onClick={onBack}
        disabled={backDisabled}
        aria-label={ariaLabel}
      >
        <BackIcon size={22} />
      </button>
    ) : left === "profile" ? (
      <ProfileMenu />
    ) : (
      <span style={S.headerSpacer} />
    );

  return (
    <header
      style={{
        ...headerStyle,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
        columnGap: 12,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", minWidth: 0 }}>
        {leftNode}
      </div>
      <span
        style={{
          ...S.headerTitle,
          position: "static",
          left: "auto",
          transform: "none",
          maxWidth: "min(52vw, 520px)",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {title}
      </span>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", minWidth: 0 }}>
        {right ?? <span style={S.headerSpacer} />}
      </div>
    </header>
  );
}
