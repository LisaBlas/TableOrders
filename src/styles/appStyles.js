export const S = {
  root: {
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    background: "#f5f4f0",
    minHeight: "100vh",
    color: "#1a1a1a",
    maxWidth: 480,
    margin: "0 auto",
    position: "relative"
  },
  page: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    animation: "fadeIn 0.25s ease-out"
  },
  toast: {
    position: "fixed",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#1a1a1a",
    color: "#fff",
    padding: "8px 18px",
    borderRadius: 20,
    fontSize: 13,
    zIndex: 999,
    pointerEvents: "none",
    whiteSpace: "nowrap",
    animation: "fadeIn 0.2s ease-out"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 20px 12px",
    background: "#fff",
    borderBottom: "1px solid #ebe9e3"
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: "-0.3px"
  },
  headerSub: {
    fontSize: 13,
    color: "#888"
  },
  back: {
    background: "none",
    border: "none",
    fontSize: 14,
    color: "#555",
    cursor: "pointer",
    padding: 0
  },
  ticketBtn: {
    background: "none",
    border: "none",
    fontSize: 14,
    color: "#555",
    cursor: "pointer",
    padding: 0
  },
  selectAllBtn: {
    background: "none",
    border: "none",
    fontSize: 14,
    color: "#555",
    cursor: "pointer",
    padding: 0,
    fontWeight: 700
  },
  legend: {
    display: "flex",
    gap: 16,
    padding: "10px 20px",
    background: "#fff",
    borderBottom: "1px solid #ebe9e3"
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "#666"
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    padding: 16
  },
  tableCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: "18px 8px",
    borderRadius: 12,
    cursor: "pointer"
  },
  tableDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    marginBottom: 2
  },
  tableNum: {
    fontWeight: 700,
    fontSize: 22,
    lineHeight: 1
  },
  tableStatus: {
    fontSize: 11,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.4px"
  },
  cats: {
    display: "flex",
    gap: 8,
    padding: "12px 16px",
    background: "#fff",
    borderBottom: "1px solid #ebe9e3",
    overflowX: "auto"
  },
  catBtn: {
    padding: "6px 14px",
    borderRadius: 20,
    border: "1.5px solid #ddd",
    background: "#fff",
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
    color: "#555",
    fontWeight: 500,
    animation: "fadeIn 0.2s ease-out"
  },
  catBtnActive: {
    background: "#1a1a1a",
    color: "#fff",
    border: "1.5px solid #1a1a1a"
  },
  orderContent: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column"
  },
  menuList: {
    maxHeight: "300px",
    overflowY: "auto"
  },
  subcategorySeparator: {
    padding: "12px 20px 8px",
    fontSize: 13,
    fontWeight: 600,
    color: "#6b6b6a",
    background: "#fcf6ebff",
    borderBottom: "1px solid #e8e8e6",
    position: "sticky",
    top: 0,
    zIndex: 1
  },
  menuItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "13px 20px",
    borderBottom: "1px solid #ebe9e3",
    background: "#fff",
    marginBottom: 1
  },
  menuItemInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 2
  },
  menuItemName: {
    fontSize: 15,
    fontWeight: 500
  },
  menuItemPrice: {
    fontSize: 13,
    color: "#888"
  },
  qtyControl: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    animation: "fadeIn 0.2s ease-out"
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: "1.5px solid #ccc",
    background: "#fff",
    fontSize: 18,
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#333",
    transition: "all 0.15s ease-out"
  },
  qtyNum: {
    fontSize: 15,
    fontWeight: 600,
    minWidth: 18,
    textAlign: "center",
    animation: "fadeIn 0.2s ease-out"
  },
  addBtn: {
    padding: "6px 16px",
    borderRadius: 20,
    border: "1.5px solid #1a1a1a",
    background: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer"
  },
  variantBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    padding: "6px 12px",
    borderRadius: 8,
    border: "1.5px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    minWidth: 54
  },
  variantLabel: {
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1
  },
  variantPrice: {
    fontSize: 11,
    color: "#666",
    fontWeight: 500
  },
  orderBar: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderTop: "1px solid #ebe9e3",
    padding: "12px 16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    zIndex: 100,
    maxHeight: "50vh",
    overflowY: "auto"
  },
  orderBarList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    maxHeight: "200px",
    overflowY: "auto",
    marginBottom: 4
  },
  orderBarItemWrapper: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ebe9e3",
    animation: "itemAppear 1s ease-out"
  },
  orderBarItem: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  orderBarItemInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2
  },
  orderBarItemName: {
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 1.3
  },
  orderBarItemPrice: {
    fontSize: 11,
    color: "#888"
  },
  orderBarItemControls: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  orderBarQtyBtn: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "1.5px solid #ccc",
    background: "#fff",
    fontSize: 16,
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#333"
  },
  orderBarQtyNum: {
    fontSize: 14,
    fontWeight: 600,
    minWidth: 20,
    textAlign: "center"
  },
  orderBarItems: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6
  },
  orderBarChip: {
    background: "#f0f0ee",
    borderRadius: 12,
    padding: "3px 10px",
    fontSize: 12,
    color: "#444"
  },
  sendBtn: {
    background: "#1a1a1a",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "13px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    width: "100%"
  },
  sentSection: {
    margin: "8px 16px",
    padding: "12px 16px",
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #ebe9e3",
    animation: "fadeIn 0.25s ease-out"
  },
  sentLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "block",
    marginBottom: 8
  },
  sentItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    color: "#666",
    padding: "3px 0"
  },
  sentPrice: {
    color: "#aaa"
  },
  sentDivider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "16px 16px 8px",
    padding: "0",
    animation: "fadeIn 0.25s ease-out"
  },
  sentDividerLine: {
    flex: 1,
    height: 1,
    background: "#d4d2ca"
  },
  sentDividerText: {
    fontSize: 11,
    fontWeight: 600,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap"
  },
  sentSectionsContainer: {
    maxHeight: "300px",
    overflowY: "auto",
    marginBottom: 8
  },
  ticket: {
    margin: 16,
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #ebe9e3",
    padding: "20px",
    animation: "slideUpFade 0.3s ease-out"
  },
  ticketHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    marginBottom: 14
  },
  ticketRestaurant: {
    fontWeight: 700,
    fontSize: 18
  },
  ticketDate: {
    fontSize: 12,
    color: "#aaa"
  },
  divider: {
    height: 1,
    background: "#ebe9e3",
    margin: "12px 0"
  },
  ticketRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    padding: "5px 0"
  },
  ticketRowEditable: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 0"
  },
  ticketRemoveBtn: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: "1.5px solid #ddd",
    background: "#fff",
    fontSize: 16,
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#999",
    flexShrink: 0
  },
  ticketQty: {
    fontSize: 13,
    color: "#aaa",
    minWidth: 24
  },
  ticketName: {
    flex: 1,
    fontSize: 15
  },
  ticketPrice: {
    fontSize: 15,
    fontWeight: 500
  },
  ticketTotal: {
    display: "flex",
    justifyContent: "space-between",
    fontWeight: 700,
    fontSize: 18
  },
  ticketActions: {
    display: "flex",
    gap: 10,
    padding: "0 16px 24px",
    animation: "slideUpFade 0.3s ease-out"
  },
  copyBtn: {
    flex: 1,
    padding: "13px",
    borderRadius: 10,
    border: "1.5px solid #1a1a1a",
    background: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer"
  },
  closeBtn: {
    flex: 1,
    padding: "13px",
    borderRadius: 10,
    border: "none",
    background: "#1a1a1a",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    animation: "fadeIn 0.25s ease-out"
  },

  splitOptions: {
    margin: "0 16px 4px",
    padding: "16px",
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #ebe9e3"
  },
  splitOptionsLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 10
  },
  splitBtns: {
    display: "flex",
    gap: 10
  },
  splitOptionBtn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "14px 8px",
    borderRadius: 10,
    border: "1.5px solid #ddd",
    background: "#fafaf8",
    cursor: "pointer"
  },
  splitOptionIcon: {
    fontSize: 20
  },
  splitOptionTitle: {
    fontWeight: 700,
    fontSize: 13
  },
  splitOptionSub: {
    fontSize: 11,
    color: "#999",
    textAlign: "center"
  },

  equalCard: {
    margin: 16,
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #ebe9e3",
    padding: "20px"
  },
  equalTotalLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline"
  },
  equalTotalLabel: {
    fontSize: 14,
    color: "#888"
  },
  equalTotalAmt: {
    fontSize: 22,
    fontWeight: 700
  },
  guestCountRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  guestCountLabel: {
    fontSize: 15
  },
  guestCounter: {
    display: "flex",
    alignItems: "center",
    gap: 14
  },
  guestCountBtn: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "1.5px solid #ccc",
    background: "#fff",
    fontSize: 20,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  guestCountNum: {
    fontSize: 22,
    fontWeight: 700,
    minWidth: 28,
    textAlign: "center"
  },
  equalShareRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline"
  },
  equalShareLabel: {
    fontSize: 15,
    fontWeight: 500
  },
  equalShareAmt: {
    fontSize: 28,
    fontWeight: 800
  },
  equalBreakdown: {
    marginTop: 12,
    display: "flex",
    flexDirection: "column",
    gap: 6
  },
  equalGuestRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  equalGuestChip: {
    background: "#f0f0ee",
    borderRadius: 10,
    padding: "3px 10px",
    fontSize: 13,
    color: "#555"
  },
  equalGuestAmt: {
    fontSize: 14,
    fontWeight: 600
  },

  splitProgress: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    padding: "10px 16px",
    background: "#fff",
    borderBottom: "1px solid #ebe9e3",
    alignItems: "center"
  },
  splitProgressChip: {
    background: "#e8f3e9",
    borderRadius: 10,
    padding: "3px 10px",
    fontSize: 12,
    color: "#2d5a35",
    fontWeight: 600
  },
  splitProgressRemaining: {
    marginLeft: "auto",
    fontSize: 12,
    color: "#888"
  },

  splitItemList: {
    flex: 1,
    overflowY: "auto",
    padding: "10px 16px",
    paddingBottom: 130,
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  splitItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "13px 16px",
    borderRadius: 10,
    cursor: "pointer",
    width: "100%",
    textAlign: "left"
  },
  splitItemCheck: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
    transition: "background 0.15s"
  },
  splitItemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: 500
  },
  splitItemPrice: {
    fontSize: 15,
    fontWeight: 600
  },

  splitConfirmCard: {
    margin: 16,
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #ebe9e3",
    padding: "28px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  splitConfirmBadge: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "#e8f3e9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    color: "#2d5a35",
    marginBottom: 10
  },
  splitConfirmAmt: {
    fontSize: 36,
    fontWeight: 800,
    marginBottom: 2
  },
  splitConfirmSub: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4
  },
  splitConfirmRow: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    padding: "4px 0",
    fontSize: 14
  },
  splitConfirmName: {
    color: "#555"
  },
  splitConfirmPrice: {
    fontWeight: 600
  },

  splitRemainingBanner: {
    margin: "0 16px 16px",
    padding: "14px 16px",
    background: "#fff8ed",
    border: "1px solid #f0d9a0",
    borderRadius: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  splitRemainingLabel: {
    fontSize: 13,
    color: "#7a5500",
    fontWeight: 600
  },
  splitRemainingItems: {
    fontSize: 12,
    color: "#b07800",
    marginTop: 2
  },
  splitRemainingAmt: {
    fontSize: 22,
    fontWeight: 800,
    color: "#7a5500"
  },

  splitDoneCard: {
    margin: 16,
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #ebe9e3",
    padding: "24px 20px"
  },
  splitDoneBadge: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "#e8f3e9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    color: "#2d5a35",
    margin: "0 auto 10px"
  },
  splitDoneTitle: {
    fontWeight: 800,
    fontSize: 24,
    textAlign: "center"
  },
  splitDoneSub: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginBottom: 4
  },
  splitDoneRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "8px 0",
    borderBottom: "1px solid #f0f0ee"
  },
  splitDoneGuest: {
    fontSize: 13,
    fontWeight: 700,
    minWidth: 56,
    paddingTop: 2
  },
  splitDoneItems: {
    flex: 1,
    display: "flex",
    flexWrap: "wrap",
    gap: 4
  },
  splitDoneItemChip: {
    background: "#f0f0ee",
    borderRadius: 8,
    padding: "2px 8px",
    fontSize: 11,
    color: "#555"
  },
  splitDoneAmt: {
    fontSize: 14,
    fontWeight: 700,
    minWidth: 52,
    textAlign: "right",
    paddingTop: 2
  },
  splitDoneTotal: {
    display: "flex",
    justifyContent: "space-between",
    fontWeight: 700,
    fontSize: 17,
    marginTop: 4
  },

  closeReceipt: {
    margin: 16,
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #ebe9e3",
    padding: "20px"
  },
  closeReceiptBrand: {
    fontWeight: 800,
    fontSize: 22,
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: "-0.5px"
  },
  closeReceiptTitle: {
    fontWeight: 700,
    fontSize: 17,
    marginBottom: 2
  },
  closeReceiptMeta: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
    textAlign: "center"
  },
  closeRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    padding: "5px 0"
  },
  closeRowEditable: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 0"
  },
  closeRemoveBtn: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: "1.5px solid #ddd",
    background: "#fff",
    fontSize: 16,
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#999",
    flexShrink: 0
  },
  closeQty: {
    fontSize: 15,
    fontWeight: 700,
    color: "#333",
    minWidth: 28
  },
  perforationDivider: {
    height: 0,
    borderTop: "2px dashed #d4d2ca",
    margin: "16px 0 14px"
  },
  closeName: {
    flex: 1,
    fontSize: 15
  },
  closeLinePrice: {
    fontSize: 15,
    fontWeight: 500
  },
  subtotalRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "#999",
    padding: "2px 0"
  },
  subtotalLabel: {
    fontWeight: 500
  },
  closeTotalRow: {
    display: "flex",
    justifyContent: "space-between",
    fontWeight: 700,
    fontSize: 20
  },
  closeWarning: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    margin: "0 16px 16px",
    padding: "12px 14px",
    background: "#fff8ed",
    border: "1px solid #f0d9a0",
    borderRadius: 10,
    fontSize: 13,
    color: "#7a5500",
    lineHeight: 1.4
  },
  closeWarningIcon: {
    fontSize: 15,
    flexShrink: 0,
    marginTop: 1
  },
  confirmCloseBtn: {
    flex: 1,
    padding: "13px",
    borderRadius: 10,
    border: "none",
    background: "#c0392b",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    animation: "fadeIn 0.25s ease-out"
  },

  // Tab styles
  tabs: {
    background: "#fff",
    borderBottom: "1px solid #ebe9e3"
  },
  tabsContainer: {
    display: "flex",
    position: "relative"
  },
  tab: {
    flex: 1,
    padding: "12px 16px",
    background: "none",
    border: "none",
    fontSize: 15,
    fontWeight: 600,
    color: "#888",
    cursor: "pointer",
    transition: "color 0.25s ease-out"
  },
  tabActive: {
    color: "#1a1a1a"
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "50%",
    height: 2,
    background: "#1a1a1a",
    transition: "transform 0.25s ease-out"
  },

  // Search styles
  searchBar: {
    position: "relative",
    padding: "12px 16px",
    background: "#fff",
    borderBottom: "1px solid #ebe9e3",
    display: "flex",
    gap: 8,
    alignItems: "center"
  },
  customAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: "1.5px solid #1a1a1a",
    background: "#1a1a1a",
    color: "#fff",
    fontSize: 22,
    fontWeight: 400,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    lineHeight: 1
  },
  searchInput: {
    width: "100%",
    padding: "10px 38px 10px 14px",
    fontSize: 15,
    border: "1.5px solid #ddd",
    borderRadius: 10,
    background: "#fafaf8",
    outline: "none",
    fontFamily: "inherit"
  },
  searchInputWithBtn: {
    flex: 1,
    padding: "10px 38px 10px 14px",
    fontSize: 15,
    border: "1.5px solid #ddd",
    borderRadius: 10,
    background: "#fafaf8",
    outline: "none",
    fontFamily: "inherit"
  },
  searchClear: {
    position: "absolute",
    right: 22,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    fontSize: 16,
    color: "#999",
    cursor: "pointer",
    padding: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  menuItemCategory: {
    fontSize: 12,
    color: "#999",
    fontWeight: 400
  },
  noResults: {
    padding: "40px 20px",
    textAlign: "center"
  },
  noResultsText: {
    fontSize: 14,
    color: "#999"
  },

  // Modal styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: "fadeIn 0.2s ease-out"
  },
  modalCard: {
    background: "#fff",
    borderRadius: 16,
    padding: "24px",
    maxWidth: 360,
    width: "90%",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
    animation: "scaleIn 0.25s ease-out"
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
    color: "#1a1a1a"
  },
  modalMessage: {
    fontSize: 15,
    color: "#666",
    lineHeight: 1.5,
    marginBottom: 24
  },
  modalActions: {
    display: "flex",
    gap: 10
  },
  modalCancelBtn: {
    flex: 1,
    padding: "12px",
    borderRadius: 10,
    border: "1.5px solid #ddd",
    background: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    color: "#555"
  },
  modalConfirmBtn: {
    flex: 1,
    padding: "12px",
    borderRadius: 10,
    border: "none",
    background: "#1a1a1a",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer"
  },
  modalDeleteBtn: {
    flex: 1,
    padding: "12px",
    borderRadius: 10,
    border: "none",
    background: "#c0392b",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer"
  },

  // Daily Sales styles
  salesBtn: {
    background: "#fff",
    border: "1.5px solid #1a1a1a",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    margin: "12px 16px",
    width: "calc(100% - 32px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  salesIcon: {
    fontSize: 16
  },
  salesSummary: {
    margin: 16,
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #ebe9e3",
    padding: "20px"
  },
  salesSummaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0"
  },
  salesLabel: {
    fontSize: 14,
    color: "#888"
  },
  salesValue: {
    fontSize: 14,
    fontWeight: 600
  },
  salesTotalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingTop: 12,
    borderTop: "1px solid #ebe9e3",
    marginTop: 12
  },
  salesTotalLabel: {
    fontSize: 15,
    fontWeight: 600
  },
  salesTotalAmt: {
    fontSize: 32,
    fontWeight: 800,
    color: "#2d5a35"
  },
  billsList: {
    flex: 1,
    overflowY: "auto",
    padding: "0 16px 100px"
  },
  billCard: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #ebe9e3",
    padding: "14px 16px",
    marginBottom: 10
  },
  billCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  billTableNum: {
    fontSize: 15,
    fontWeight: 700
  },
  billTotal: {
    fontSize: 17,
    fontWeight: 700,
    color: "#2d5a35"
  },
  billMeta: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8
  },
  billItemsList: {
    display: "flex",
    flexDirection: "column",
    gap: 3
  },
  billItem: {
    fontSize: 13,
    color: "#666",
    display: "flex",
    justifyContent: "space-between"
  },
  billItemQty: {
    color: "#aaa",
    marginRight: 4
  },
  billItemName: {
    flex: 1
  },
  billItemPrice: {
    fontWeight: 500,
    color: "#555"
  },
  billItemEditable: {
    fontSize: 13,
    color: "#666",
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "3px 0"
  },
  billItemRemoveBtn: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: "1.5px solid #ddd",
    background: "#fff",
    fontSize: 14,
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#999",
    flexShrink: 0
  },
  editBillBtn: {
    padding: "5px 12px",
    borderRadius: 8,
    border: "1.5px solid #ddd",
    background: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    color: "#555"
  },
  doneEditBtn: {
    flex: 1,
    padding: "6px 12px",
    borderRadius: 8,
    border: "none",
    background: "#2d5a35",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer"
  },
  cancelEditBtn: {
    flex: 1,
    padding: "6px 12px",
    borderRadius: 8,
    border: "1.5px solid #ddd",
    background: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    color: "#555"
  },
  deleteBillBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1.5px solid #e0a0a0",
    background: "#fff",
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  clearDayBtn: {
    background: "#c0392b",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "13px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    width: "calc(100% - 32px)",
    margin: "0 16px 24px"
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 40px",
    textAlign: "center"
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.3
  },
  emptyStateText: {
    fontSize: 15,
    color: "#999",
    lineHeight: 1.5
  },

  // Custom item modal styles
  customModalForm: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    marginBottom: 20
  },
  customModalField: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flex: 1
  },
  customModalFieldSmall: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    width: 90
  },
  customModalRow: {
    display: "flex",
    gap: 10
  },
  customModalLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#555"
  },
  customModalInput: {
    padding: "10px 12px",
    fontSize: 15,
    border: "1.5px solid #ddd",
    borderRadius: 8,
    background: "#fafaf8",
    outline: "none",
    fontFamily: "inherit"
  },
};
