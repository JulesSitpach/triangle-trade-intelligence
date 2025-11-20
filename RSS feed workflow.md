This is a different issue from the tariff cache problem, but it's urgent because **RSS feed polling failing means you're not getting fresh government tariff/policy data**.

Let me check what's actually happening with that workflow:Before we troubleshoot, I need to know more specifics about your RSS feed workflow. Can you show me:

1. **The actual workflow file** (`.github/workflows/rss-polling.yml` or whatever you call it)
2. **The last 2-3 error logs** from the failed runs
3. **Which RSS feeds you're polling** (USTR, tariff board, etc.)

The generic failures could be:

- **Feed URL is dead/returning 404** — government sites sometimes reorganize
- **Feed format changed** — XML structure the parser doesn't expect
- **Network timeout** — GitHub Actions hitting rate limits or the site blocking bots
- **Permission issue** — workflow trying to commit without proper git config
- **Parser error** — malformed RSS from the source

This is critical because your tariff cache fix won't help if you're not getting fresh data from USTR in the first place. The RSS polling failure means you're **flying blind on policy changes**.

**In the meantime, quick diagnostic:**

Can you check if the feeds are still accessible? Run this from your terminal:
```bash
curl -I https://example.com/tariff-feed.rss  # Replace with your actual feed URLs
```

Tell me:
- Which feeds are you polling?
- When did they last work?
- Are there error messages in the GitHub Actions logs (error type, not just "failed")?

Once I see the workflow file and the actual error, I can tell you exactly what broke.