"""Loaded by pytest before any test module, so the app never opens the real eduadapt.db or uploads folder."""
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
TEST_DIR = Path(os.environ.setdefault("EDUADAPT_TEST_DIR", tempfile.mkdtemp(prefix="eduadapt_test_")))
os.environ["DATABASE_URL"] = "sqlite:///" + (TEST_DIR / "test.db").as_posix()
os.environ["UPLOADS_DIR"] = str(TEST_DIR / "uploads")
