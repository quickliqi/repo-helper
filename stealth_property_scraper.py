import asyncio
import json
import argparse
import random
from typing import List, Dict

# Require playwright and playwright-stealth
# pip install playwright playwright-stealth
# playwright install chromium
from playwright.async_api import async_playwright
from playwright_stealth import stealth_async

async def scrape_properties(
    location: str,
    max_price: int = None,
    min_beds: int = None,
    max_dom: int = None,
    headless: bool = False
) -> List[Dict]:
    """
    Scrapes property URLs simulating human behavior.
    """
    results = []
    
    # We will target Realtor.com as a primary example, as it handles URL query parameters
    # effectively and displays List Price and Days on Market (DOM) clearly.
    
    # Construct base URL for navigation (Realtor.com format: /realestateandhomes-search/Location/beds-X/price-na-Y/dom-Z)
    url_location = location.replace(", ", "_").replace(" ", "%20")
    base_url = f"https://www.realtor.com/realestateandhomes-search/{url_location}"
    
    filters = []
    if min_beds:
        filters.append(f"beds-{min_beds}")
    if max_price:
        filters.append(f"price-na-{max_price}")
    if max_dom:
        filters.append(f"dom-{max_dom}")
        
    if filters:
        target_url = f"{base_url}/{'/'.join(filters)}"
    else:
        target_url = base_url

    async with async_playwright() as p:
        # Launch browser with human-like arguments (useful for Kali Linux as well)
        browser = await p.chromium.launch(
            headless=headless,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--window-size=1920,1080',
            ]
        )
        
        # Create a realistic context
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            locale='en-US',
            timezone_id='America/New_York'
        )
        
        page = await context.new_page()
        
        # Apply playwright-stealth to bypass basic anti-bot detections
        await stealth_async(page)
        
        print(f"[*] Navigating to: {target_url}")
        
        # Human-like initial navigation delay
        await asyncio.sleep(random.uniform(1.0, 3.0))
        
        try:
            await page.goto(target_url, wait_until='domcontentloaded', timeout=60000)
            
            # Simulate initial human reading time
            await asyncio.sleep(random.uniform(2.5, 4.5))
            
            # Scroll down the page slowly to trigger lazy-loaded property cards
            print("[*] Simulating human scrolling...")
            for _ in range(5):
                scroll_amount = random.randint(300, 700)
                await page.mouse.wheel(delta_x=0, delta_y=scroll_amount)
                await asyncio.sleep(random.uniform(0.5, 1.5))
            
            # Wait for property layer or cards to settle
            await page.wait_for_selector('[data-testid="property-card"]', timeout=15000)
            
            # Extract property cards
            cards = await page.locator('[data-testid="property-card"]').all()
            print(f"[*] Found {len(cards)} property cards.")
            
            for card in cards:
                try:
                    # Scroll slightly to the card
                    await card.scroll_into_view_if_needed()
                    await asyncio.sleep(random.uniform(0.1, 0.4))

                    # Extract relative URL
                    href_locator = card.locator('a[href^="/realestateandhomes-detail/"]')
                    if await href_locator.count() > 0:
                        href = await href_locator.first.get_attribute('href')
                        exact_url = f"https://www.realtor.com{href}"
                    else:
                        continue
                    
                    # Extract Price
                    price_locator = card.locator('[data-testid="card-price"]')
                    list_price = await price_locator.inner_text() if await price_locator.count() > 0 else "N/A"
                    
                    # Extract Address
                    address_locator = card.locator('[data-testid="card-address"]')
                    address = await address_locator.inner_text() if await address_locator.count() > 0 else "N/A"
                    # Clean up address formatting if it contains newlines
                    address = address.replace('\n', ', ')
                    
                    # Extract DOM (Days on Market)
                    # Realtor.com might have a badge for "New" or time on market inside the card metadata
                    dom_locator = card.locator('[data-testid="card-description"]')
                    dom_text = await dom_locator.inner_text() if await dom_locator.count() > 0 else "Unknown"
                    # As a heuristic fallback if it's not explicitly stated on the generic card:
                    dom = dom_text if "on Realtor.com" in dom_text else "Unknown"

                    results.append({
                        "Property Address": address,
                        "Exact URL": exact_url,
                        "List Price": list_price.strip(),
                        "DOM": dom.strip()
                    })
                except Exception as e:
                    print(f"[-] Error parsing card: {e}")
                    continue
                    
        except Exception as e:
            print(f"[-] Navigation or scraping error: {e}")
        finally:
            await browser.close()
            
    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Stealth Property Scraper (Playwright)")
    parser.add_argument("--location", required=True, help="Location to search (e.g., 'Coupeville, WA')")
    parser.add_argument("--max-price", type=int, help="Maximum price (e.g., 300000)")
    parser.add_argument("--min-beds", type=int, help="Minimum bedrooms  (e.g., 3)")
    parser.add_argument("--max-dom", type=int, help="Maximum Days on Market (e.g., 14)")
    parser.add_argument("--headless", action="store_true", help="Run in headless mode")
    
    args = parser.parse_args()
    
    print(f"[*] Starting stealth scraper for {args.location}")
    print(f"[*] Filters -> Max Price: {args.max_price}, Min Beds: {args.min_beds}, Max DOM: {args.max_dom}")
    
    # Run the asyncio event loop
    loop = asyncio.get_event_loop()
    scraped_data = loop.run_until_complete(
        scrape_properties(
            location=args.location,
            max_price=args.max_price,
            min_beds=args.min_beds,
            max_dom=args.max_dom,
            headless=args.headless
        )
    )
    
    print("\n[*] Scraped Results:")
    # Output cleanly as JSON array
    print(json.dumps(scraped_data, indent=4))
    
    # Save to file
    output_filename = "properties_output.json"
    with open(output_filename, 'w') as f:
        json.dump(scraped_data, f, indent=4)
        
    print(f"\n[*] Saved {len(scraped_data)} results to {output_filename}")
