#!/usr/bin/env python3
"""
Test script for Brandfetch API to measure response times for brand searches.
"""
import os
import time
import requests
from dotenv import load_dotenv
from rich import print

# Load environment variables
load_dotenv()

# Get API key from environment
API_KEY = os.getenv("BRANDFETCH_API_KEY")

if not API_KEY:
    raise ValueError("BRANDFETCH_API_KEY not found in environment variables")

# Base URL for Brandfetch API
BASE_URL = "https://api.brandfetch.io/v2/search"

# List of brands to test
BRANDS = [
    "google",
    "apple",
    "microsoft",
    "amazon",
    "VISA",
    "META",
    "Tesla",
    "Nestle",
    "Netflix",
    "Uber",
    "Airbnb",
    "Spotify",
    "LinkedIn",
    "Instagram",
    "Twitter",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "Discord",
    "Steam",
    "Epic Games",
    "EA",
    "Activision",
    "Blizzard",
    "Bethesda",
    "Ubisoft",
    "Square Enix",
    "Konami",
    "Capcom",
    "Nintendo",
    "Sony",
    "Microsoft",
    "Apple",
    "Google",
    "Amazon",
    "Facebook",
    "Twitter",
    "Instagram",
    "YouTube",
    "TikTok",
    "Instagram",
    "Saudi Aramco",
]


def search_brand(brand_name: str) -> dict:
    """
    Search for a brand using Brandfetch API and measure response time.

    Args:
        brand_name: Name of the brand to search

    Returns:
        dict with brand_name, status_code, response_time, and data
    """
    url = f"{BASE_URL}/{brand_name}"
    params = {"c": API_KEY}

    print(f"\nSearching for: {brand_name}")
    print(f"URL: {url}")

    start_time = time.time()

    try:
        response = requests.get(url, params=params, timeout=10)
        end_time = time.time()
        response_time = end_time - start_time

        result = {
            "brand_name": brand_name,
            "status_code": response.status_code,
            "response_time": response_time,
            "success": response.status_code == 200,
            "data": response.json() if response.status_code == 200 else None,
            "error": response.text if response.status_code != 200 else None,
        }

        print(f"Status: {response.status_code}")
        print(f"Response time: {response_time:.3f} seconds")

        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                print(f"Found {len(data)} result(s)")
                first_result = data[0]
                print(f"Top result: {first_result.get('name', 'N/A')}")
                print(f"Domain: {first_result.get('domain', 'N/A')}")
        else:
            print(f"Error: {response.text}")

        return result

    except requests.exceptions.RequestException as e:
        end_time = time.time()
        response_time = end_time - start_time

        print(f"Request failed: {str(e)}")
        print(f"Time taken: {response_time:.3f} seconds")

        return {
            "brand_name": brand_name,
            "status_code": None,
            "response_time": response_time,
            "success": False,
            "data": None,
            "error": str(e),
        }


def main():
    """Main function to run brand searches and display results."""
    print("=" * 60)
    print("Brandfetch API Test Script")
    print("=" * 60)
    print(f"Testing {len(BRANDS)} brand searches...")

    results = []
    total_start_time = time.time()

    # Search for each brand
    for idx, brand in enumerate(BRANDS):
        if idx > 32:
            break
        print(f"Searching for {idx + 1} of {len(BRANDS)}: {brand}")
        result = search_brand(brand)
        print(result)
        results.append(result)
        # Small delay between requests to be respectful to the API
        # time.sleep(0.5)

    total_end_time = time.time()
    total_time = total_end_time - total_start_time

    # Print summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    successful_requests = sum(1 for r in results if r["success"])
    failed_requests = len(results) - successful_requests

    print(f"\nTotal requests: {len(results)}")
    print(f"Successful: {successful_requests}")
    print(f"Failed: {failed_requests}")
    print(f"\nTotal time: {total_time:.3f} seconds")
    print(f"Average time per request: {total_time / len(results):.3f} seconds")

    # Individual response times
    print("\nIndividual response times:")
    print("-" * 60)
    for result in results:
        status = "✓" if result["success"] else "✗"
        print(f"{status} {result['brand_name']:<15} {result['response_time']:.3f}s")

    # Calculate statistics for successful requests
    successful_times = [r["response_time"] for r in results if r["success"]]
    if successful_times:
        min_time = min(successful_times)
        max_time = max(successful_times)
        avg_time = sum(successful_times) / len(successful_times)

        print(f"\nResponse time statistics (successful requests only):")
        print(f"  Minimum: {min_time:.3f}s")
        print(f"  Maximum: {max_time:.3f}s")
        print(f"  Average: {avg_time:.3f}s")

    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
