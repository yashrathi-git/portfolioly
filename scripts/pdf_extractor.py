#!/usr/bin/env python3
"""
PDF Text Extraction Script

Reads all PDFs from the PDF folder and extracts text to extracted_text folder.
Uses PyMuPDF4LLM for LLM-optimized Markdown text extraction.
"""

import asyncio
from pathlib import Path
import pymupdf4llm
import pymupdf

text = pymupdf.get_text("random_testing/PDF/resume.pdf")
print(text)

class PDFExtractor:
    """Extract text from PDF files using PyMuPDF4LLM."""

    def __init__(self, pdf_folder: str, output_folder: str):
        """
        Initialize the PDF extractor.

        Args:
            pdf_folder: Path to folder containing PDF files
            output_folder: Path to folder for extracted text files
        """
        self.pdf_folder = Path(pdf_folder)
        self.output_folder = Path(output_folder)

        # Create folders if they don't exist
        self.pdf_folder.mkdir(parents=True, exist_ok=True)
        self.output_folder.mkdir(parents=True, exist_ok=True)

    async def _extract_text_from_pdf(self, pdf_path: Path) -> str:
        """
        Extract text from a single PDF file using PyMuPDF4LLM.

        Args:
            pdf_path: Path to the PDF file

        Returns:
            Extracted markdown text
        """

        def extract_text():
            """Synchronous extraction function to run in thread pool."""
            try:
                # Extract text as markdown using PyMuPDF4LLM
                md_text = pymupdf4llm.to_markdown(str(pdf_path))
                return md_text

            except Exception as e:
                print(f"Error extracting text from {pdf_path.name}: {e}")
                return ""

        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        text = await loop.run_in_executor(None, extract_text)

        return text

    async def process_pdf(self, pdf_path: Path) -> bool:
        """
        Process a single PDF file and save extracted text.

        Args:
            pdf_path: Path to the PDF file

        Returns:
            True if successful, False otherwise
        """
        try:
            print(f"Processing: {pdf_path.name}")

            # Extract text as markdown
            md_text = await self._extract_text_from_pdf(pdf_path)

            if not md_text.strip():
                print(f"  ⚠️  Warning: No text extracted from {pdf_path.name}")
                return False

            # Create output filename (replace .pdf with .md for markdown)
            output_filename = pdf_path.stem + ".md"
            output_path = self.output_folder / output_filename

            # Save extracted markdown text as UTF-8
            output_path.write_bytes(md_text.encode('utf-8'))

            print(f"  ✓ Saved to: {output_filename} ({len(md_text)} characters)")
            return True

        except Exception as e:
            print(f"  ✗ Error processing {pdf_path.name}: {e}")
            return False

    async def process_all_pdfs(self) -> None:
        """Process all PDF files in the PDF folder."""
        # Find all PDF files
        pdf_files = list(self.pdf_folder.glob("*.pdf"))

        if not pdf_files:
            print(f"No PDF files found in {self.pdf_folder}")
            return

        print(f"\nFound {len(pdf_files)} PDF file(s)")
        print("=" * 60)

        # Process each PDF
        successful = 0
        failed = 0

        for pdf_path in pdf_files:
            success = await self.process_pdf(pdf_path)
            if success:
                successful += 1
            else:
                failed += 1

        # Print summary
        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print(f"Total PDFs processed: {len(pdf_files)}")
        print(f"Successful: {successful}")
        print(f"Failed: {failed}")
        print(f"\nOutput folder: {self.output_folder.absolute()}")


async def main():
    """Main function to run the PDF extractor."""
    # Get script directory
    script_dir = Path(__file__).parent

    # Define folder paths
    pdf_folder = script_dir / "PDF"
    output_folder = script_dir / "extracted_text"

    print("=" * 60)
    print("PDF Text Extraction Script")
    print("=" * 60)
    print(f"PDF folder: {pdf_folder.absolute()}")
    print(f"Output folder: {output_folder.absolute()}")

    # Create extractor and process all PDFs
    extractor = PDFExtractor(pdf_folder, output_folder)
    await extractor.process_all_pdfs()


if __name__ == "__main__":
    asyncio.run(main())
