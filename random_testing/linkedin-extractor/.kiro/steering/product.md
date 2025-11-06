# Product Overview

## Problem

Recruiters and workflow tools need consistent, structured profile data, but
most candidates export their résumés from LinkedIn as PDF files. These PDFs lose
semantic structure, forcing teams to resort to brittle heuristics or manual
copy/paste when trying to populate downstream CRMs, ATS systems, or analytics
dashboards.

## Solution

`linkedin-extractor` ingests LinkedIn PDF exports (and intermediate markdown
transcriptions) and converts them into structured JSON that preserves the
original layout semantics. The tool focuses on:

- Detecting canonical sections such as headline, summary, experience, and
  education.
- Recovering nested hierarchies (e.g. multiple roles inside the same company).
- Normalising dates, durations, and location fields so they can be compared or
  merged across sources.
- Providing deterministic, extensible parsing hooks so additional business logic
  can be layered on later without rewriting the core extraction pipeline.

## Key Capabilities

- **Markdown-first pipeline** – PDF text is preprocessed into markdown to
  preserve headers, bullets, and structural cues before parsing.
- **Section extractors** – Each major profile section is parsed independently,
  allowing rapid iteration on one section without destabilising others.
- **CLI harness** – A simple command, `python bin/extract_markdown.py`,
  converts an input markdown file into a JSON payload saved as `ext.txt` (or a
  user-provided path).
- **Composable API surface** – Downstream services can import the parser
  functions directly, bypassing the CLI when needed.

## Target Users

- Internal ingestion services that need to enrich or transform LinkedIn profile
  data.
- Operators validating extracted timelines, job histories, or skill summaries.
- Developers prototyping downstream enrichment or ranking models that rely on
  structured profile data.

## Near-Term Roadmap

1. Expand section coverage beyond Experience to Education, Skills, Projects,
   and Contact information.
2. Add confidence scoring and parser diagnostics so ingestion pipelines can
   flag ambiguous fields.
3. Introduce schema validation and versioned output contracts.
4. Bundle a fast API wrapper for integration with web services.
