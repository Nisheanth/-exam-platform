"""PDF and image text extraction via pdfplumber + Tesseract OCR fallback."""

from __future__ import annotations

import io
from pathlib import Path

import pdfplumber
import pytesseract
from pdf2image import convert_from_path
from PIL import Image

import structlog

from app.core.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()

# Point pytesseract at the configured binary
pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD


def _extract_text_pdfplumber(pdf_path: str | Path) -> list[str]:
    """Extract text per page using pdfplumber (works for native/text PDFs).

    Returns a list of strings, one per page.  Pages that yield no text
    are returned as empty strings so the caller can decide to OCR them.
    """
    pages: list[str] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            pages.append(text.strip())
    return pages


def _ocr_page_image(image: Image.Image) -> str:
    """Run Tesseract OCR on a single PIL image and return the text."""
    return pytesseract.image_to_string(image).strip()


def _ocr_pdf(pdf_path: str | Path) -> list[str]:
    """Convert every PDF page to an image and OCR it."""
    images = convert_from_path(str(pdf_path), dpi=300)
    pages: list[str] = []
    for idx, img in enumerate(images):
        logger.info("ocr_page", page=idx + 1, total=len(images))
        pages.append(_ocr_page_image(img))
    return pages


def extract_text_from_pdf(pdf_path: str | Path) -> list[str]:
    """High-level extractor: tries pdfplumber first, falls back to OCR.

    For each page, if pdfplumber returns fewer than 20 characters the
    page is considered scanned and is re-extracted with Tesseract.
    """
    pdf_path = Path(pdf_path)
    logger.info("extract_text_start", file=pdf_path.name)

    native_pages = _extract_text_pdfplumber(pdf_path)

    # Check if we got meaningful text
    total_chars = sum(len(p) for p in native_pages)
    if total_chars > 100:
        # Native PDF – but some individual pages may be images
        result: list[str] = []
        ocr_images = None  # lazily loaded
        for idx, page_text in enumerate(native_pages):
            if len(page_text) >= 20:
                result.append(page_text)
            else:
                # Lazy-load images only if needed
                if ocr_images is None:
                    ocr_images = convert_from_path(str(pdf_path), dpi=300)
                logger.info("ocr_fallback_page", page=idx + 1)
                result.append(_ocr_page_image(ocr_images[idx]))
        logger.info("extract_text_done", pages=len(result), method="hybrid")
        return result

    # Fully scanned PDF – OCR every page
    logger.info("extract_text_full_ocr", file=pdf_path.name)
    result = _ocr_pdf(pdf_path)
    logger.info("extract_text_done", pages=len(result), method="ocr")
    return result


def extract_text_from_image(image_path: str | Path) -> list[str]:
    """Extract text from a standalone image file (JPG, PNG, TIFF)."""
    image_path = Path(image_path)
    logger.info("ocr_image", file=image_path.name)
    img = Image.open(image_path)
    text = _ocr_page_image(img)
    return [text]


def extract_text(file_path: str | Path) -> list[str]:
    """Unified entry point – dispatches based on file extension."""
    file_path = Path(file_path)
    ext = file_path.suffix.lower()

    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in {".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp", ".webp"}:
        return extract_text_from_image(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")
