# StakeHumanSignal — Command Reference

## Setup

```bash
git clone https://github.com/StakeHumanSignal/StakeHumanSignal
cd StakeHumanSignal
bun install
cd filecoin-bridge && bun install && cd ..
cd lido-mcp && bun install && cd ..
cd frontend && bun install && cd ..
pip install -r requirements.txt
cp .env.example .env
# Fill: PRIVATE_KEY, BASE_SEPOLIA_PRIVATE_KEY, RECEIVER_ADDRESS, LIGHTHOUSE_API_KEY
```

## Smart Contracts

```bash
npx hardhat compile                    # Compile (MUST use npx, not bun)
npx hardhat test                       # Run all 91 Solidity tests
npx hardhat test test/SessionEscrow.test.js  # Run specific test file

# Deploy to Base Sepolia
npx hardhat run scripts/deploy-sepolia.js --network base-sepolia
npx hardhat run scripts/deploy-escrow-sepolia.js --network base-sepolia

# E2E test on Sepolia
npx hardhat run scripts/deploy-and-e2e-sepolia.js --network base-sepolia
```

## Python API

```bash
uvicorn api.main:app --reload --port 8000    # Start with hot-reload
python -m pytest test/ -v                     # Run all 71 Python tests (52% coverage)
python -m pytest test/test_integration.py -v  # Integration tests only

# Verify imports
python3 -c "from api.main import app; print('OK')"
```

## Services (4 terminals)

```bash
# Terminal 1: API
uvicorn api.main:app --port 8000

# Terminal 2: Filecoin FOC bridge (real Synapse SDK)
cd filecoin-bridge && node index.js

# Terminal 3: Lido MCP server (real Ethereum mainnet reads)
cd lido-mcp && node index.js

# Terminal 4: Frontend
cd frontend && NEXT_PUBLIC_API_URL=http://localhost:8000 bun dev
```

## Buyer Agent

```bash
python -m api.agent.buyer_agent --once    # Single cycle
python -m api.agent.buyer_agent           # Continuous (60s loop)
```

## Seed Data

```bash
python3 scripts/seed.py                   # POST 5 reviews to running API
python3 scripts/seed_file.py              # Generate seed JSON directly
```

## Lido MCP Server

```bash
cd lido-mcp && node index.js              # Start MCP server (11 tools, real Ethereum mainnet)
cd lido-mcp && node live-test.js          # Run live integration test (11/11 tools)
cd lido-mcp && npm test                   # Run 12 unit + mainnet tests
cd lido-mcp && node vault-monitor.js      # Start vault monitor (5 min polls)
```

## Filecoin FOC Bridge

```bash
cd filecoin-bridge && node index.js       # Start FOC bridge (Synapse SDK, calibration)
cd filecoin-bridge && npm test            # Run 6 FOC integration tests
```

## MCP Tests

```bash
cd lido-mcp && npm test                   # 12 tests (including live mainnet read)
cd stakesignal-mcp && npm test            # 6 tests
cd filecoin-bridge && npm test            # 6 tests
```

## Frontend

```bash
cd frontend && bun dev                    # Dev server (localhost:3000)
cd frontend && bun run build              # Production build
cd frontend && vercel --prod --yes        # Deploy to Vercel
```

## Railway Deploy

```bash
railway whoami                            # Check login
railway link -p b71f5989-6886-48d9-bdde-b4ebeb611182  # Link project
railway up --detach                       # Deploy
railway deployment list                   # Check status
railway logs                              # View logs
railway vars --set "KEY=VALUE"            # Set env var
railway domain                            # Get/create domain
```

## Git

```bash
git push org main                         # Push to org repo (Railway watches this)
# origin = personal repo (read-only mirror, do not use)
```

## Filecoin (Lighthouse)

```bash
# Generate API key via wallet signature
python3 -c "
from eth_account import Account
from eth_account.messages import encode_defunct
import httpx, os
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path('.env'))
pk = os.getenv('PRIVATE_KEY') or os.getenv('BASE_SEPOLIA_PRIVATE_KEY')
account = Account.from_key(pk if pk.startswith('0x') else '0x'+pk)
r = httpx.get(f'https://api.lighthouse.storage/api/auth/get_message?publicKey={account.address}')
signed = account.sign_message(encode_defunct(text=str(r.json())))
r2 = httpx.post('https://api.lighthouse.storage/api/auth/create_api_key', json={
    'publicKey': account.address, 'signedMessage': '0x'+signed.signature.hex(), 'keyName': 'stakesignal'
})
print('Key:', r2.json())
"

# Test real upload
python3 -c "
import io, os
from lighthouseweb3 import Lighthouse
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path('.env'))
lh = Lighthouse(token=os.getenv('LIGHTHOUSE_API_KEY'))
r = lh.uploadBlob(io.BytesIO(b'{\"test\":true}'), 'test.json')
print('CID:', r['data']['Hash'])
"
```

## Smoke Tests (live services)

```bash
curl -s https://stakesignal-api-production.up.railway.app/health
curl -s https://stakesignal-api-production.up.railway.app/reviews | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{d.get(\"count\",0)} reviews')"
curl -s https://stakesignal-api-production.up.railway.app/agent/log | python3 -c "import sys,json; print(f'{len(json.load(sys.stdin))} entries')"
curl -s -o /dev/null -w "%{http_code}" https://stakehumansignal.vercel.app
```

## Hackathon Submission

```bash
# Check team
curl -s "https://synthesis.devfolio.co/teams/baacd78ca8d44b7b97e48ed8bdc1b9db" \
  -H "Authorization: Bearer $SYNTHESIS_API_KEY"

# Post on Moltbook
curl -X POST https://www.moltbook.com/api/v1/posts \
  -H "Authorization: Bearer $MOLTBOOK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"submolt_name":"general","title":"StakeHumanSignal","content":"..."}'
```
