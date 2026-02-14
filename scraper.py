import os
import time
import random
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. Load your credentials
load_dotenv(".env.local")
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def fetch_flight_data():
    """
    In a production app, you would use Playwright or an API like 
    Seats.aero or AwardTool here. For now, we simulate a successful scrape.
    """
    print("Searching for BOM ⇄ JFK Award Space...")
    time.sleep(2) # Simulate network delay
    
    # Mocked 'Scraped' result
    # In reality, you'd scrape the airline site and extract these values
    miles = random.choice([80000, 85000, 90000, 110000, 120000])
    tax = random.randint(200, 600)
    
    return {
        "airline": "Air India",
        "program": "Aeroplan",
        "miles_required": miles,
        "tax_usd": tax
    }

def update_supabase():
    flight = fetch_flight_data()
    
    # 2. Push to Supabase
    try:
        data, count = supabase.table("award_snapshots").insert({
            "airline": flight["airline"],
            "program": flight["program"],
            "miles_required": flight["miles_required"],
            "tax_usd": flight["tax_usd"]
        }).execute()
        
        print(f"✅ Success! Inserted {flight['miles_required']} miles into Dashboard.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    update_supabase()