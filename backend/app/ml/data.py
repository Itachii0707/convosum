import logging

from datasets import load_dataset

logger = logging.getLogger(__name__)

SUPPORTED_DATASETS = ("samsum", "cnn_dailymail", "xsum")


def load_hf_dataset(dataset_name: str):
    """
    Load a dataset from HuggingFace Hub.

    Supported values: 'samsum', 'cnn_dailymail', 'xsum'
    """
    if dataset_name not in SUPPORTED_DATASETS:
        raise ValueError(
            f"Dataset '{dataset_name}' is not supported. "
            f"Choose from: {SUPPORTED_DATASETS}"
        )

    logger.info("Loading dataset '%s'…", dataset_name)

    if dataset_name == "cnn_dailymail":
        return load_dataset("cnn_dailymail", "3.0.0")

    return load_dataset(dataset_name)


def get_dataset_statistics(dataset) -> dict:
    """Return split sizes for a HuggingFace DatasetDict."""
    return {split: len(dataset[split]) for split in dataset.keys()}
