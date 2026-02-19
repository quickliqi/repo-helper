"""
QuickLiqi Scraper Microservice
────────────────────────────────
A standalone FastAPI service that uses Playwright + playwright-stealth
to extract property listings from Realtor.com based on user filters.

Run via: ./start-scraper.sh
"""

import asyncio
import random
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from playwright.async_api import async_playwright
from playwright_stealth import Stealth

# ─── App Setup ──────────────────────────────────────────────────────
app = FastAPI(title="QuickLiqi Scraper Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response Models ──────────────────────────────────────
class ScrapeRequest(BaseModel):
    location: str                   # e.g. "Coupeville, WA"
    max_price: Optional[int] = None # e.g. 300000
    min_beds: Optional[int] = None  # e.g. 3
    max_dom: Optional[int] = None   # e.g. 14  (Days on Market)


class PropertyResult(BaseModel):
    address: str
    url: str
    list_price: str
    dom: str


# ─── Helpers ────────────────────────────────────────────────────────
def build_realtor_url(location: str, max_price: int | None, min_beds: int | None, max_dom: int | None) -> str:
    """Construct a Realtor.com search URL from filter parameters."""
    # Realtor.com path format: /realestateandhomes-search/Coupeville_WA/beds-3/price-na-300000
    slug = location.replace(", ", "_").replace(" ", "-")
    base = f"https://www.realtor.com/realestateandhomes-search/{slug}"

    segments: list[str] = []
    if min_beds:
        segments.append(f"beds-{min_beds}")
    if max_price:
        segments.append(f"price-na-{max_price}")
    if max_dom:
        segments.append(f"dom-{max_dom}")

    return f"{base}/{'/'.join(segments)}" if segments else base


async def human_delay(low: float = 0.8, high: float = 2.5) -> None:
    """Random sleep to simulate human latency."""
    await asyncio.sleep(random.uniform(low, high))


# ─── Core Scraping Logic ───────────────────────────────────────────
async def run_scraper(params: ScrapeRequest) -> List[Dict[str, Any]]:
    """Launch a stealth Chromium instance and scrape property cards."""

    target_url = build_realtor_url(
        location=params.location,
        max_price=params.max_price,
        min_beds=params.min_beds,
        max_dom=params.max_dom,
    )

    results: List[Dict[str, Any]] = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=False,   # Set True for production / CI
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-infobars",
                "--window-size=1920,1080",
            ],
        )

        # Initialize stealth config
        stealth = Stealth()

        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/121.0.0.0 Safari/537.36"
            ),
            locale="en-US",
            timezone_id="America/New_York",
        )

        # Apply stealth patches at context level (removes navigator.webdriver, etc.)
        await stealth.use_async(context)

        page = await context.new_page()


        try:
            # ── Navigate ────────────────────────────────────────────
            await human_delay(1.0, 3.0)
            await page.goto(target_url, wait_until="domcontentloaded", timeout=60_000)
            await human_delay(2.5, 4.5)

            # ── Simulate human scrolling to trigger lazy-load ───────
            for _ in range(random.randint(4, 7)):
                await page.mouse.wheel(delta_x=0, delta_y=random.randint(300, 700))
                await human_delay(0.4, 1.2)

            # ── Wait for property cards ─────────────────────────────
            try:
                await page.wait_for_selector(
                    'div[data-testid="property-card"]', timeout=15_000
                )
            except Exception:
                # Fallback: try alternate selectors that Realtor.com may use
                await page.wait_for_selector(
                    '[data-testid="card-content"]', timeout=10_000
                )

            cards = await page.locator('div[data-testid="property-card"]').all()

            # ── Extract data from each card ─────────────────────────
            for card in cards:
                try:
                    await card.scroll_into_view_if_needed()
                    await human_delay(0.05, 0.2)

                    # URL
                    link = card.locator('a[href*="/realestateandhomes-detail/"]')
                    if await link.count() == 0:
                        continue
                    href = await link.first.get_attribute("href") or ""
                    full_url = f"https://www.realtor.com{href}" if href.startswith("/") else href

                    # Price
                    price_el = card.locator('[data-testid="card-price"]')
                    list_price = (await price_el.inner_text()).strip() if await price_el.count() > 0 else "N/A"

                    # Address
                    addr_el = card.locator('[data-testid="card-address"]')
                    address = (await addr_el.inner_text()).strip().replace("\n", ", ") if await addr_el.count() > 0 else "N/A"

                    # Days on Market (may appear as badge text)
                    dom_el = card.locator('[data-testid="card-description"]')
                    dom_text = (await dom_el.inner_text()).strip() if await dom_el.count() > 0 else "Unknown"

                    results.append({
                        "address": address,
                        "url": full_url,
                        "list_price": list_price,
                        "dom": dom_text,
                    })

                except Exception:
                    continue  # Skip malformed cards gracefully

        finally:
            await browser.close()

    return results


# ─── API Endpoint ───────────────────────────────────────────────────
@app.post("/scrape", response_model=List[PropertyResult])
async def scrape_properties(req: ScrapeRequest):
    """
    Accepts filter parameters and returns scraped property listings.

    Example request body:
    {
        "location": "Coupeville, WA",
        "max_price": 300000,
        "min_beds": 3,
        "max_dom": 14
    }
    """
    try:
        data = await run_scraper(req)
        return data
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Health Check ───────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "scraper-service"}
