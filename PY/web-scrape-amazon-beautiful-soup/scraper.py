# Uses requests, beautiful soup and lxml to scrape data from Amazon
# pip install requests beautifulsoup4 lxml

import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

def _clean(text: str) -> str:
    return " ".join(text.split()) if text else text

def _extract_price(soup: BeautifulSoup) -> str | None:
    price_el = soup.select_one(".a-price .a-offscreen")
    if price_el and price_el.get_text(strip=True):
        return _clean(price_el.get_text(strip=True))

    whole = soup.select_one(".a-price .a-price-whole")
    frac = soup.select_one(".a-price .a-price-fraction")
    if whole and frac:
        w = whole.get_text(strip=True).replace(",", "")
        f = frac.get_text(strip=True)
        return f"${w}.{f}"

    alt = soup.select_one("#priceblock_ourprice, #priceblock_dealprice, #priceblock_saleprice")
    if alt and alt.get_text(strip=True):
        return _clean(alt.get_text(strip=True))

    return None

def get_product_details(product_url: str) -> dict:
    details: dict[str, str | None] = {
        "title": None,
        "price": None,
        "product_url": product_url,
    }

    try:
        resp = requests.get(product_url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
    except requests.RequestException as e:
        print("Network error when fetching product page:", e)
        return details

    soup = BeautifulSoup(resp.text, "lxml")

    # Basic anti-bot/CAPTCHA check
    if soup.select_one('form[action*="validateCaptcha"]') or "Enter the characters you see below" in soup.get_text():
        print("Blocked by Amazon (CAPTCHA/anti-bot page). Try different headers, a logged-in session, or slower requests.")
        return details

    title_el = soup.select_one("#productTitle") or soup.select_one("#title span")
    if title_el:
        details["title"] = _clean(title_el.get_text(strip=True))

    details["price"] = _extract_price(soup)

    return details

if __name__ == "__main__":
    product_url = input("Enter product url: ").strip()
    product_details = get_product_details(product_url)
    print(product_details)
