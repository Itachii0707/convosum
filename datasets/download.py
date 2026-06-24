#!/usr/bin/env python
"""
Download all supported datasets from HuggingFace Hub and save them locally.

Usage:
    python datasets/download.py

Requires: pip install datasets
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from datasets import load_dataset

SAVE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASETS = {
    "samsum": ("samsum", None),           # ~2 MB  — best for dialogue
    "cnn_dailymail": ("cnn_dailymail", "3.0.0"),  # ~1.1 GB
    "xsum": ("xsum", None),               # ~245 MB
}


def download_all():
    for name, (hf_name, config) in DATASETS.items():
        dest = os.path.join(SAVE_DIR, name)
        if os.path.exists(dest):
            print(f"✔ {name} already downloaded at {dest}")
            continue
        print(f"⬇  Downloading {name} …")
        ds = load_dataset(hf_name, config) if config else load_dataset(hf_name)
        ds.save_to_disk(dest)
        splits = {split: len(ds[split]) for split in ds.keys()}
        print(f"✔ {name} saved → {splits}")
    print("\n✅ All datasets ready in ./datasets/")


if __name__ == "__main__":
    download_all()
