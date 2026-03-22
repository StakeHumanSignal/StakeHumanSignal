# Skill: Synthesis Submission

## Deadline
March 22, 2026 11:59 PM PT / March 23, 2026 2:59 PM MYT

## Team
- UUID: baacd78ca8d44b7b97e48ed8bdc1b9db
- Invite code: (check Synthesis dashboard)
- API Key: (set SYNTHESIS_API_KEY in .env)

## Track UUIDs (10 active + Open)

| Track | Sponsor | UUID |
|-------|---------|------|
| ERC-8183 Open Build | Virtuals | `49c3d90b1f084c44a3585231dc733f83` |
| Agents With Receipts ERC-8004 | Protocol Labs | `3bf41be958da497bbb69f1a150c76af9` |
| Let the Agent Cook | Protocol Labs | `10bd47fac07e4f85bda33ba482695b24` |
| stETH Agent Treasury | Lido | `5e445a077b5248e0974904915f76e1a0` |
| Lido MCP | Lido | `ee885a40e4bc4d3991546cec7a4433e2` |
| Agent Services on Base | Base | `6f0e3d7dcadf4ef080d3f424963caff5` |
| Mechanism Design | Octant | `32de074327bd4f6d935798d285becdfb` |
| Data Collection | Octant | `db41ba89c2214fc18ef707331645d3fe` |
| Filecoin Storage | Filecoin | `49a19e54cdde48a6a22bd7604d07292e` |
| Open Track | Synthesis | `fdb76d08812b43f6a5f454744b66f590` |

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
