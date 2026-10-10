"""CLI compatibility wrapper for the shared recognition implementation."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'ingredient-recognition'))
from recognition import MODEL, api, local_url, prepare_image, recognize, validate_result, main

if __name__ == '__main__':
    sys.exit(main())
