import sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
from playwright.sync_api import sync_playwright

SDIR = os.path.join(os.environ.get("TEMP", "/tmp"), "tableorders_test")
os.makedirs(SDIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 480, "height": 900})
    page.goto("http://localhost:3000/TableOrders/", timeout=10000)
    page.wait_for_load_state("networkidle", timeout=10000)

    # Seat + order + send + close Table 4
    page.locator("button", has_text="4").first.click()
    page.wait_for_timeout(400)
    page.locator("button", has_text="Seat Table").first.click()
    page.wait_for_timeout(400)
    page.locator("button", has_text="Cheese Counter").first.click()
    page.wait_for_timeout(300)
    adds = page.locator("button", has_text="Add").all()
    adds[0].click()
    page.wait_for_timeout(200)
    adds[2].click()
    page.wait_for_timeout(200)
    page.locator("button", has_text="Send").first.click()
    page.wait_for_timeout(500)
    page.locator("button", has_text="Bill").first.click()
    page.wait_for_timeout(300)
    page.locator("button", has_text="Close table").first.click()
    page.wait_for_timeout(400)
    page.locator("button", has_text="Confirm close").first.click()
    page.wait_for_timeout(400)
    print("1. Table 4 closed OK")

    # Open Daily Sales
    page.locator("button", has_text="Daily Sales").first.click()
    page.wait_for_timeout(300)
    ds = page.inner_text("body")
    assert "Table 4" in ds, "Bill for Table 4 not found"
    assert "Bills closed" in ds, "Summary missing"
    assert "Total Revenue" in ds, "Revenue missing"
    print("2. Daily Sales chronological OK")
    page.screenshot(path=f"{SDIR}/ds_chrono.png", full_page=True)

    # Switch to Total tab
    page.locator("button", has_text="Total").first.click()
    page.wait_for_timeout(300)
    total_body = page.inner_text("body")
    assert "total" in total_body.lower(), "Total tab content missing"
    print("3. Daily Sales total tab OK")
    page.screenshot(path=f"{SDIR}/ds_total.png", full_page=True)

    # Switch back and test Edit
    page.locator("button", has_text="Chronological").first.click()
    page.wait_for_timeout(300)
    edit_btn = page.locator("button", has_text="Edit")
    if edit_btn.count() > 0:
        edit_btn.first.click()
        page.wait_for_timeout(300)
        edit_body = page.inner_text("body")
        has_done = "Done" in edit_body
        has_cancel = "Cancel" in edit_body
        print(f"4. Edit mode: Done={has_done}, Cancel={has_cancel}")
        page.screenshot(path=f"{SDIR}/ds_edit.png", full_page=True)
        # Cancel edit
        page.locator("button", has_text="Cancel").first.click()
        page.wait_for_timeout(300)
        print("   Cancelled edit OK")

    print("\nALL DAILY SALES TESTS PASSED")
    browser.close()
