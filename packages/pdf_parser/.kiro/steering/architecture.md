# System Architecture

## High-Level Flow

1. **PDF → Markdown Preprocessing** (out of scope here): upstream tooling
   converts LinkedIn PDFs into markdown while preserving headers and line
   breaks.
2. **Extraction CLI (`bin/extract_markdown.py`)**: command-line entry point that
   accepts a markdown path and orchestrates parsing.
3. **Core Markdown Splitter (`src/extraction/markdown_extractor.py`)**: loads
   the document, splits around the first H1, normalises spacing, removes
   `Page n of x` footers, and returns structured sections.
4. **Section Parsers (`src/extraction/parsers/…`)**: specialised modules (e.g.
   `experience.py`) transform section text into domain-specific JSON.
5. **Output Writer**: the CLI merges the base extraction payload with parsed
   sections and persists the result to `ext.txt` (or a caller-provided output
   path).

## Module Responsibilities

- `src/extraction/markdown_extractor.py`

  - File I/O and markdown normalisation.
  - Splits document into `before_h1`, `h1`, and `after_h1` segments.
  - Converts H3 blocks (before H1) and H2 blocks (after H1) into deterministic
    key/value maps.
  - Produces an `ExtractionResult` dataclass for downstream consumption.

- `src/extraction/parsers/experience.py`

  - Implements timeline-first parsing for the Experience section.
  - Groups roles under company headers using duration lines as anchors.
  - Extracts titles, start/end dates, durations, location hints, and highlights.
  - Emits a flat list of entries tagged with a `type` field (`company_group`
    for multi-role orgs, `standalone_role` otherwise).

- `bin/extract_markdown.py`
  - CLI wiring with argparse and safe output handling.
  - Imports core extractor plus optional section parsers.
  - Writes pretty-printed JSON and exposes the same functions as a reusable API.

## Data Contracts

- **ExtractionResult** – base payload with:

  - `before_h1`: map of H3 headings to strings.
  - `h1_title`: the top-level header text.
  - `after_h1`: map of H2 headings to strings.
  - `raw_text`: normalised document text for fallback use.

- **Experience Parser Output** (stored under `parsed_sections.Experience`):
  - Flat list of dictionaries with shared keys (`type`, `title`, `start_date`,
    `end_date`, `duration_months`, `location`, `highlights`, etc.).
  - Company group entries include a `roles` array of nested role records and
    state flags such as `incomplete` if total durations cannot be reconciled.

## Extensibility

- **Section isolation** – Each parser operates on a single H2 block, so adding
  new section parsers only requires registering them in the CLI or API layer.
- **Configurable output** – Future users can augment `parsed_sections` with
  additional enrichments without modifying the base extraction logic.
- **Testing hooks** – CLI can be scripted in CI or integrated into higher-level
  tests that validate JSON schema and sample inputs.

## Deployment Considerations

- Package the repository as a Python module or container for batch processing.
- Provide environment-agnostic entry points (CLI, Python API, future web API).
- Introduce logging/metrics wrappers around the CLI when embedding in services.
