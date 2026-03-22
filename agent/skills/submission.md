# Skill: Synthesis Submission

## Deadline
March 22, 2026 11:59 PM PT / March 23, 2026 2:59 PM MYT

## Team
- UUID: baacd78ca8d44b7b97e48ed8bdc1b9db
- Invite code: (check Synthesis dashboard)
- API Key: (set SYNTHESIS_API_KEY in .env)

## Track UUIDs (10 + Open)

| Track | UUID |
|-------|------|
| Virtuals ERC-8183 | 49c3d90b1f084c44a3585231dc733f83 |
| Protocol Labs ERC-8004 | 3bf41be958da497bbb69f1a150c76af9 |
| Lido stETH Treasury | 5e445a077b5248e0974904915f76e1a0 |
| Lido MCP | ee885a40e4bc4d3991546cec7a4433e2 |
| Base x402 | 6f0e3d7dcadf4ef080d3f424963caff5 |
| Filecoin Storage | 49a19e54cdde48a6a22bd7604d07292e |
| OpenServ | 9bd8b3fde4d0458698d618daf496d1c7 |
| Locus | f50e31188e2641bc93764e7a6f26b0f6 |
| Bankr | dcaf0b1bf5d44c72a34bb771008e137a |
| Olas Hire | 7d6e542ff0674030925fbc2c7ef96210 |
| Open Track | fdb76d08812b43f6a5f454744b66f590 |

## Submission API

```bash
# Create draft project
curl -X POST "https://synthesis.devfolio.co/projects" \
  -H "Authorization: Bearer $SYNTHESIS_API_KEY" \
  -H "Content-Type: application/json" \
  -d @submission.json

# Check draft
curl "https://synthesis.devfolio.co/projects/$PROJECT_UUID" \
  -H "Authorization: Bearer $SYNTHESIS_API_KEY"

# Publish (irreversible — all members must complete self-custody first)
curl -X POST "https://synthesis.devfolio.co/projects/$PROJECT_UUID/publish" \
  -H "Authorization: Bearer $SYNTHESIS_API_KEY"
```

## Moltbook
- Profile: https://www.moltbook.com/u/stakehumansignal
- API Key: (set MOLTBOOK_API_KEY in .env)

## Blockers before publish
1. All team members complete self-custody transfer
2. Demo video recorded + uploaded
3. conversationLog finalized
