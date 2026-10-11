"""
Source Discovery Module
Discovers Python source files within an extracted project directory.
"""
import os
from pathlib import Path
from typing import List


SUPPORTED_EXTENSIONS = {".py"}
EXCLUDED_DIRS = {
    "__pycache__", ".git", ".svn", "node_modules", ".tox",
    "venv", ".venv", "env", ".env", "build", "dist", ".eggs",
    ".pytest_cache", ".mypy_cache", "*.egg-info",
}


def discover_python_files(root_dir: str) -> List[str]:
    """
    Discover all Python source files in a directory tree.

    Args:
        root_dir: Root directory to search

    Returns:
        List of absolute paths to Python files
    """
    root_path = Path(root_dir).resolve()
    python_files = []

    for dirpath, dirnames, filenames in os.walk(root_path):
        # Prune excluded directories in-place
        dirnames[:] = [
            d for d in dirnames
            if d not in EXCLUDED_DIRS and not d.startswith(".")
        ]

        for filename in filenames:
            filepath = Path(dirpath) / filename
            if filepath.suffix in SUPPORTED_EXTENSIONS:
                python_files.append(str(filepath))

    return sorted(python_files)


def get_relative_path(file_path: str, root_dir: str) -> str:
    """Get path relative to root directory."""
    try:
        return str(Path(file_path).relative_to(Path(root_dir).resolve()))
    except ValueError:
        return file_path
