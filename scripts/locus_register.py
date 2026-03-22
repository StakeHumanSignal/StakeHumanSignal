"""Register StakeHumanSignal agent with Locus."""
import asyncio
from api.services.locus import register_agent


async def main():
    result = await register_agent("StakeHumanSignal", "lingsiewwin99@gmail.com")
    print("Registration result:", result)
    if "apiKey" in result:
        print(f"\nAdd to .env:\nLOCUS_API_KEY={result['apiKey']}")


if __name__ == "__main__":
    asyncio.run(main())
