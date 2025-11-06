# PDF Text Extractor

A simple script to extract text from PDF files using PyMuPDF4LLM, which provides LLM-optimized Markdown output.

## Setup

1. **Install PyMuPDF4LLM** (if not already installed):
   ```bash
   pip install pymupdf4llm
   # or using uv in the backend
   cd ../backend && uv pip install pymupdf4llm
   ```

2. **Place your PDF files** in the `PDF/` folder

## Usage

Run the script:
```bash
python pdf_extractor.py
# or
./pdf_extractor.py
```

The script will:
1. Read all PDF files from the `PDF/` folder
2. Extract text from each PDF in Markdown format (optimized for LLMs)
3. Save each result as a `.md` file in the `extracted_text/` folder

## Features

- **LLM-optimized extraction** - Uses PyMuPDF4LLM for better text structure preservation
- **Markdown output** - Preserves formatting, tables, and structure
- **Async processing** - Uses asyncio for efficient file handling
- **Error handling** - Continues processing even if some PDFs fail
- **Progress reporting** - Shows real-time extraction status
- **Summary stats** - Displays success/failure counts at the end

## Output

- Each PDF file `example.pdf` will generate `example.md` in the `extracted_text/` folder
- Text is in Markdown format, preserving headers, lists, tables, and formatting
- Character count is displayed for each successful extraction

## Example

```
$ ./pdf_extractor.py

============================================================
PDF Text Extraction Script
============================================================
PDF folder: /path/to/random_testing/PDF
Output folder: /path/to/random_testing/extracted_text

Found 3 PDF file(s)
============================================================
Processing: resume.pdf
  ✓ Saved to: resume.md (5234 characters)
Processing: linkedin.pdf
  ✓ Saved to: linkedin.md (3421 characters)
Processing: portfolio.pdf
  ✓ Saved to: portfolio.md (8765 characters)

============================================================
SUMMARY
============================================================
Total PDFs processed: 3
Successful: 3
Failed: 0

Output folder: /path/to/random_testing/extracted_text
```

## Notes

- Uses PyMuPDF4LLM for better extraction quality compared to plain PyMuPDF
- Markdown format preserves document structure (headings, lists, tables, etc.)
- Optimized for LLM consumption and processing
- Handles multi-page PDFs automatically
- Output is UTF-8 encoded
