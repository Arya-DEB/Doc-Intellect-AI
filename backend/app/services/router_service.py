import re
from functools import lru_cache

import numpy as np

from app.services.embedding_service import embed_query, embed_texts

MAX_WORDS = 6        # longer messages are real questions, so skip the router
THRESHOLD = 0.80     # tune by printing scores (see below)

INTENTS: dict[str, tuple[list[str], str]] = {
    "greeting": (
        ["hi", "hello", "hey", "heyy", "yo", "yoo", "sup", "what's up",
         "good morning", "good afternoon", "good evening", "hola", "namaste"],
        "Hi! Ask me anything about your uploaded documents.",
    ),
    "identity": (
        ["who are you", "what are you", "what is your name", "introduce yourself"],
        "I'm Doc Intellect AI. I answer questions from the documents you upload, with sources.",
    ),
    "help": (
        ["what can you do", "help", "how do you work", "how to use this"],
        "Upload a PDF, then ask questions about it. I'll answer from the document and show sources.",
    ),
    "thanks": (
        ["thanks", "thank you", "thx", "ty", "appreciate it", "great, thanks"],
        "You're welcome! Ask another question anytime.",
    ),
    "bye": (
        ["bye", "goodbye", "see you", "good night", "cya"],
        "Goodbye! Come back whenever you have more questions.",
    ),
    "chitchat": (
        ["how are you", "how's it going", "tell me a joke", "what's the weather",
         "lol", "ok", "okay", "cool", "nice", "haha"],
        "I'm best at answering questions about your uploaded documents. Try asking about one.",
    ),
}

_LABELS: list[str] = []
_EXAMPLES: list[str] = []
for label, (examples, _) in INTENTS.items():
    for ex in examples:
        _LABELS.append(label)
        _EXAMPLES.append(ex)


def normalize(text: str) -> str:
    q = text.lower().strip()
    q = re.sub(r"(.)\1{2,}", r"\1\1", q)       # yooooo -> yoo, heyyyy -> heyy
    q = re.sub(r"[^\w\s']", " ", q)            # drop punctuation and emojis
    return re.sub(r"\s+", " ", q).strip()


@lru_cache(maxsize=1)
def _example_vectors() -> np.ndarray:
    return np.array(embed_texts(_EXAMPLES))


@lru_cache(maxsize=512)
def smalltalk_reply(question: str) -> str | None:
    """Return a canned reply for small talk, or None if it's a real question."""
    q = normalize(question)
    if not q:
        return "Please type a question about your documents."
    if len(q.split()) > MAX_WORDS:
        return None

    scores = _example_vectors() @ np.array(embed_query(q))
    best = int(scores.argmax())
    if float(scores[best]) >= THRESHOLD:
        return INTENTS[_LABELS[best]][1]
    return None