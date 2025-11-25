# AgentLint - AI Agent & Prompt Configuration Validator

> Ship agents with confidence.

## Overview

AgentLint validates prompt configurations, system messages, and agent instructions for:
- Contradictions
- Edge cases  
- Jailbreak vulnerabilities
- Logical inconsistencies

## Quick Start

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python app.py
```

3. Open http://localhost:5000 and paste your prompt

## Features (MVP)

- **Free Tier**: 5 prompt scans/month with basic contradiction checking
- **Rule Extraction**: Parses explicit rules from prompts
- **Contradiction Detection**: Identifies conflicting instructions
- **Jailbreak Analysis**: Detects common prompt injection patterns
- **Instant Reports**: Get actionable feedback on prompt issues

## Coming Soon

- Pro tier with unlimited scans
- API access for CI/CD integration
- Advanced adversarial testing
- Team collaboration features
