"""
Test: table swap mode — verify that after long-pressing a table to enter swap mode,
tapping a second table correctly selects it as the destination instead of exiting.
"""
from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.goto("http://localhost:3000/TableOrders/")
        page.wait_for_load_state("networkidle")

        # Take initial screenshot
        page.screenshot(path="/tmp/swap_01_initial.png", full_page=True)
        print("✓ App loaded")

        # Find table buttons (not dividers) — grab first two
        table_buttons = page.locator("button").filter(has_text=lambda t: t.strip().isdigit() or len(t.strip()) <= 3)
        all_buttons = page.locator("button").all()
        print(f"  Total buttons: {len(all_buttons)}")

        # Long-press on a table to activate swap mode
        # Tables render as buttons with numeric text — find one
        # First take a screenshot to see the layout
        content = page.content()

        # Locate table grid buttons by their style (tableCard buttons)
        # They have a span with table number. Try clicking the grid area.
        # Let's find buttons that contain short numeric text
        grid_buttons = page.locator("div button").all()
        print(f"  Grid buttons found: {len(grid_buttons)}")

        if len(grid_buttons) < 2:
            print("✗ Not enough table buttons found")
            browser.close()
            return

        first_table = grid_buttons[0]
        second_table = grid_buttons[1]

        # Long press first table (500ms) to enter swap mode
        box = first_table.bounding_box()
        print(f"  Long-pressing table at {box}")
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.mouse.down()
        page.wait_for_timeout(600)  # hold 600ms (threshold is 500ms)
        page.mouse.up()
        page.wait_for_timeout(200)

        page.screenshot(path="/tmp/swap_02_after_longpress.png", full_page=True)

        # Check if swap mode activated — look for "MOVING" text
        moving_text = page.locator("text=MOVING").count()
        bottom_sheet = page.locator("text=Move Table").count()
        print(f"  MOVING label visible: {moving_text > 0}")
        print(f"  Bottom sheet visible: {bottom_sheet > 0}")

        if moving_text == 0:
            print("✗ Swap mode did not activate — check long press timing")
            browser.close()
            return

        print("✓ Swap mode activated")

        # Now tap the second table — this was broken before the fix
        box2 = second_table.bounding_box()
        print(f"  Tapping second table at {box2}")
        page.mouse.click(box2["x"] + box2["width"] / 2, box2["y"] + box2["height"] / 2)
        page.wait_for_timeout(200)

        page.screenshot(path="/tmp/swap_03_after_tap_target.png", full_page=True)

        # Check DESTINATION label appears
        dest_text = page.locator("text=DESTINATION").count()
        arrow_text = page.locator("text=→").count()
        confirm_enabled = page.locator("button:not([disabled])").filter(has_text="Confirm").count()

        print(f"  DESTINATION label visible: {dest_text > 0}")
        print(f"  Arrow in sheet visible: {arrow_text > 0}")
        print(f"  Confirm button enabled: {confirm_enabled > 0}")

        if dest_text > 0 or confirm_enabled > 0:
            print("✓ PASS: Second table selected as destination correctly")
        else:
            print("✗ FAIL: Second table tap did not select it as destination")

        browser.close()

if __name__ == "__main__":
    main()
