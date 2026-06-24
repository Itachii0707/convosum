"""
Shared pytest fixtures for the ConvoSum backend test suite.

The backend package lives at <repo-root>/backend/, so we add it to sys.path
here (pytest.ini also sets pythonpath = backend as a fallback).
"""
import sys
import os

# Ensure the backend package is importable when pytest is run from the repo root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
