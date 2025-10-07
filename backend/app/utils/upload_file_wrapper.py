"""Utility wrapper for creating UploadFile-like objects from bytes."""


class OptimizedUploadFile:
    """
    Wrapper class that mimics FastAPI's UploadFile interface.

    Used to create UploadFile-like objects from optimized image data
    that can be passed to Azure Blob Storage service.
    """

    def __init__(self, data: bytes, filename: str, content_type: str):
        self._data = data
        self.filename = filename
        self.content_type = content_type
        self._position = 0

    async def read(self, size: int = -1) -> bytes:
        """Read bytes from the file."""
        if size == -1:
            return self._data[self._position :]
        result = self._data[self._position : self._position + size]
        self._position += len(result)
        return result

    async def seek(self, position: int) -> None:
        """Seek to a position in the file."""
        self._position = position
