# BOB: Behavioral / Observation-based Forensic Briefing

BOB is the interactive AI forensic explanation assistant in DeepFake ForensicAI.

## Grounding Guarantees
- **No Hallucinations**: BOB inspects structured case JSON and evidence tables. If an anomaly is not documented in the evidence list, BOB will never claim it exists.
- **Non-Definitive Qualifiers**: Always presents findings as statistical indicators requiring human verification.
- **Local Fallback**: Works 100% locally with zero paid API dependencies using deterministic rule templates. If `OPENAI_API_KEY` is provided in `.env`, BOB augments explanations using GPT-4o-mini while enforcing forensic safety prompts.
