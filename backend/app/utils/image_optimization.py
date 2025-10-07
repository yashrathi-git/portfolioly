"""Image optimization utilities for web use."""

from PIL import Image
from io import BytesIO
from fastapi import UploadFile
import logging

from ..core.config import settings

logger = logging.getLogger(__name__)


async def optimize_image(file: UploadFile) -> BytesIO:
    """
    Optimize image for web use - resize and compress.
    GIFs are not optimized to preserve animation.

    Args:
        file: The uploaded image file

    Returns:
        BytesIO: Optimized image data

    Raises:
        Exception: If image processing fails
    """
    contents = await file.read()
    await file.seek(0)

    # GIFs are returned as-is to preserve animation
    if file.content_type == "image/gif":
        logger.info("Skipping optimization for GIF to preserve animation")
        output = BytesIO(contents)
        output.seek(0)
        return output

    try:
        img = Image.open(BytesIO(contents))

        # Convert RGBA to RGB if necessary (for WebP compatibility)
        if img.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
            img = background

        # Resize if needed
        max_dim = settings.upload.MAX_IMAGE_DIMENSION
        if img.width > max_dim or img.height > max_dim:
            logger.info(
                f"Resizing image from {img.width}x{img.height} to max dimension {max_dim}"
            )
            img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

        # Save as WebP with quality setting
        output = BytesIO()
        img.save(
            output, format="WEBP", quality=settings.upload.IMAGE_QUALITY, optimize=True
        )
        output.seek(0)

        logger.info(
            f"Image optimized: original size {len(contents)} bytes, optimized size {len(output.getvalue())} bytes"
        )

        return output

    except Exception as e:
        logger.error(f"Image optimization failed: {str(e)}")
        raise Exception(f"Failed to optimize image: {str(e)}")
