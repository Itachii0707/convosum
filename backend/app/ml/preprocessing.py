import re


def clean_text(text: str) -> str:
    """
    Clean input dialogue or document text.

    Steps:
      1. Remove HTML tags
      2. Remove URLs
      3. Collapse extra whitespace
    """
    if not isinstance(text, str):
        return ""

    # Remove HTML tags
    text = re.sub(r"<[^>]+>", "", text)
    # Remove URLs
    text = re.sub(r"https?://\S+|www\.\S+", "", text, flags=re.MULTILINE)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


def preprocess_dataset(
    dataset,
    text_column: str = "dialogue",
    summary_column: str = "summary",
):
    """Apply text cleaning to all splits of a HuggingFace Dataset."""

    def clean_batch(batch):
        batch[text_column] = [clean_text(t) for t in batch[text_column]]
        batch[summary_column] = [clean_text(s) for s in batch[summary_column]]
        return batch

    return dataset.map(clean_batch, batched=True)
