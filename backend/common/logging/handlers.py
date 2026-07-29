from __future__ import annotations

import gzip
import os
from logging.handlers import RotatingFileHandler


class CompressedRotatingFileHandler(RotatingFileHandler):
    """Rotating file handler that compresses rotated logs with gzip."""

    def doRollover(self) -> None:
        super().doRollover()
        rotated_path = f'{self.baseFilename}.1'
        if os.path.exists(rotated_path):
            compressed_path = f'{rotated_path}.gz'
            with open(rotated_path, 'rb') as source, gzip.open(compressed_path, 'wb') as target:
                target.write(source.read())
            os.remove(rotated_path)
