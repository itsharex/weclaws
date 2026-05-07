---
name: agent-browser
description: Use when the user needs browser automation for websites, web apps, screenshots, form filling, scraping, QA, exploratory testing, Electron apps, or Slack automation.
---

# agent-browser

Browser automation CLI for AI agents. Uses Chrome/Chromium via CDP directly.

Install: `npm i -g agent-browser && agent-browser install`

## Loading Skills

**You must run `agent-browser skills get <name>` before running any agent-browser commands.**
This file does not contain command syntax, flags, or workflows. That content is served
by the CLI and changes between versions. Guessing at commands without loading the skill
will produce incorrect or outdated invocations.

```bash
agent-browser skills get agent-browser    # Required before any browser automation
agent-browser skills get <name> --full    # Include references and templates
```

## Available Skills

- **agent-browser** — Core browser automation
- **dogfood** — Exploratory testing and QA
- **electron** — Electron desktop app automation
- **slack** — Slack workspace automation
- **vercel-sandbox** — Browser automation in Vercel Sandbox
- **agentcore** — Browser automation on AWS Bedrock AgentCore

## Why agent-browser

- Fast native Rust CLI, not a Node.js wrapper
- Works with any AI agent
- Chrome/Chromium via CDP with no Playwright or Puppeteer dependency
- Accessibility-tree snapshots with element refs for reliable interaction
- Sessions, authentication vault, state persistence, video recording
- Specialized skills for Electron apps, Slack, exploratory testing, and cloud providers
