from __future__ import annotations

import fitz


def extract_pdf_text(file_bytes: bytes) -> tuple[str, int]:
    document = fitz.open(stream=file_bytes, filetype="pdf")
    try:
        pages = [page.get_text("text") for page in document]
        return "\n".join(pages).strip(), document.page_count
    finally:
        document.close()
