import asyncio
import httpx

async def main():
    url = "https://ep-nameless-flower-apkekuoj.neonauth.c-7.us-east-1.aws.neon.tech/neondb/auth/.well-known/jwks.json"
    print(f"Fetching JWKS from {url}...")
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url)
            print("Status code:", r.status_code)
            if r.status_code == 200:
                print("JWKS content keys count:", len(r.json().get("keys", [])))
                print("JWKS json:", r.json())
            else:
                print("Failed to fetch. Content:", r.text)
    except Exception as e:
        print("Error fetching JWKS:", e)

if __name__ == "__main__":
    asyncio.run(main())
