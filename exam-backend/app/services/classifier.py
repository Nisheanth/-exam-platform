"""Topic classification service using spaCy NLP and keyword matching.

Combines spaCy noun-chunk extraction with a curated keyword taxonomy
for common exam subjects (Physics, Chemistry, Biology, Mathematics).
"""

from __future__ import annotations

from functools import lru_cache

import structlog

logger = structlog.get_logger(__name__)

# ── Curated topic keywords by subject ─────────────────────────────────────────
# Maps lowercase keywords → canonical topic name
TOPIC_KEYWORDS: dict[str, dict[str, str]] = {
    "Physics": {
        "newton": "Laws of Motion",
        "force": "Laws of Motion",
        "friction": "Laws of Motion",
        "momentum": "Laws of Motion",
        "inertia": "Laws of Motion",
        "velocity": "Kinematics",
        "acceleration": "Kinematics",
        "displacement": "Kinematics",
        "projectile": "Kinematics",
        "gravitation": "Gravitation",
        "gravity": "Gravitation",
        "escape velocity": "Gravitation",
        "orbital": "Gravitation",
        "kepler": "Gravitation",
        "work": "Work, Energy & Power",
        "energy": "Work, Energy & Power",
        "power": "Work, Energy & Power",
        "kinetic energy": "Work, Energy & Power",
        "potential energy": "Work, Energy & Power",
        "rotation": "Rotational Motion",
        "angular": "Rotational Motion",
        "torque": "Rotational Motion",
        "moment of inertia": "Rotational Motion",
        "thermodynamics": "Thermodynamics",
        "heat": "Thermodynamics",
        "entropy": "Thermodynamics",
        "carnot": "Thermodynamics",
        "temperature": "Thermodynamics",
        "wave": "Waves",
        "frequency": "Waves",
        "wavelength": "Waves",
        "sound": "Waves",
        "doppler": "Waves",
        "interference": "Wave Optics",
        "diffraction": "Wave Optics",
        "polarization": "Wave Optics",
        "reflection": "Ray Optics",
        "refraction": "Ray Optics",
        "lens": "Ray Optics",
        "mirror": "Ray Optics",
        "prism": "Ray Optics",
        "electric": "Electrostatics",
        "coulomb": "Electrostatics",
        "charge": "Electrostatics",
        "capacitor": "Electrostatics",
        "current": "Current Electricity",
        "resistance": "Current Electricity",
        "ohm": "Current Electricity",
        "circuit": "Current Electricity",
        "magnetic": "Magnetism",
        "magnet": "Magnetism",
        "solenoid": "Magnetism",
        "electromagnetic": "Electromagnetic Induction",
        "faraday": "Electromagnetic Induction",
        "inductor": "Electromagnetic Induction",
        "inductance": "Electromagnetic Induction",
        "nucleus": "Nuclear Physics",
        "radioactive": "Nuclear Physics",
        "fission": "Nuclear Physics",
        "fusion": "Nuclear Physics",
        "decay": "Nuclear Physics",
        "photoelectric": "Modern Physics",
        "photon": "Modern Physics",
        "de broglie": "Modern Physics",
        "bohr": "Atomic Structure",
        "atom": "Atomic Structure",
        "semiconductor": "Semiconductor",
        "diode": "Semiconductor",
        "transistor": "Semiconductor",
        "logic gate": "Semiconductor",
    },
    "Chemistry": {
        "periodic table": "Periodic Classification",
        "electron configuration": "Atomic Structure",
        "orbital": "Atomic Structure",
        "bond": "Chemical Bonding",
        "ionic": "Chemical Bonding",
        "covalent": "Chemical Bonding",
        "hybridization": "Chemical Bonding",
        "equilibrium": "Chemical Equilibrium",
        "le chatelier": "Chemical Equilibrium",
        "acid": "Acids & Bases",
        "base": "Acids & Bases",
        "ph": "Acids & Bases",
        "oxidation": "Redox Reactions",
        "reduction": "Redox Reactions",
        "electrochemistry": "Electrochemistry",
        "cell": "Electrochemistry",
        "organic": "Organic Chemistry",
        "alkane": "Hydrocarbons",
        "alkene": "Hydrocarbons",
        "alkyne": "Hydrocarbons",
        "benzene": "Aromatic Chemistry",
        "polymer": "Polymers",
        "thermochemistry": "Thermodynamics",
        "enthalpy": "Thermodynamics",
        "kinetics": "Chemical Kinetics",
        "rate": "Chemical Kinetics",
        "catalyst": "Chemical Kinetics",
        "solution": "Solutions",
        "molarity": "Solutions",
        "solid state": "Solid State",
        "crystal": "Solid State",
        "coordination": "Coordination Chemistry",
        "ligand": "Coordination Chemistry",
    },
    "Biology": {
        "cell": "Cell Biology",
        "mitosis": "Cell Division",
        "meiosis": "Cell Division",
        "dna": "Molecular Biology",
        "rna": "Molecular Biology",
        "gene": "Genetics",
        "heredity": "Genetics",
        "mendel": "Genetics",
        "evolution": "Evolution",
        "darwin": "Evolution",
        "ecosystem": "Ecology",
        "biodiversity": "Ecology",
        "photosynthesis": "Plant Physiology",
        "respiration": "Respiration",
        "digestion": "Human Physiology",
        "nervous": "Neural Control",
        "hormone": "Endocrine System",
        "reproduction": "Reproduction",
        "immune": "Immunology",
        "microbe": "Microbiology",
        "bacteria": "Microbiology",
        "virus": "Microbiology",
        "biotechnology": "Biotechnology",
        "recombinant": "Biotechnology",
    },
    "Mathematics": {
        "matrix": "Matrices",
        "determinant": "Determinants",
        "integral": "Integration",
        "integration": "Integration",
        "differentiat": "Differentiation",
        "derivative": "Differentiation",
        "limit": "Limits & Continuity",
        "continuity": "Limits & Continuity",
        "probability": "Probability",
        "statistics": "Statistics",
        "vector": "Vectors",
        "trigonometr": "Trigonometry",
        "sequence": "Sequences & Series",
        "series": "Sequences & Series",
        "permutation": "Permutations & Combinations",
        "combination": "Permutations & Combinations",
        "conic": "Conic Sections",
        "parabola": "Conic Sections",
        "ellipse": "Conic Sections",
        "hyperbola": "Conic Sections",
        "linear programming": "Linear Programming",
        "differential equation": "Differential Equations",
        "set": "Sets & Functions",
        "relation": "Relations & Functions",
        "function": "Relations & Functions",
    },
}


@lru_cache(maxsize=1)
def _get_nlp():
    """Load spaCy model once."""
    import spacy
    return spacy.load("en_core_web_sm")


def classify_topic(question_text: str, subject: str = "") -> str:
    """Classify a question into a topic using keyword + NLP approach.

    Parameters
    ----------
    question_text : str
        The question text to classify.
    subject : str
        The exam subject (e.g. "Physics") — used to select the keyword
        taxonomy. If empty, all subjects are searched.

    Returns
    -------
    str
        The classified topic name.
    """
    lower_text = question_text.lower()

    # ── Pass 1: keyword matching against curated taxonomy ─────────────
    subjects_to_check = (
        [subject] if subject in TOPIC_KEYWORDS else list(TOPIC_KEYWORDS.keys())
    )

    best_match: str | None = None
    best_match_len = 0

    for subj in subjects_to_check:
        keyword_map = TOPIC_KEYWORDS.get(subj, {})
        for keyword, topic in keyword_map.items():
            if keyword in lower_text and len(keyword) > best_match_len:
                best_match = topic
                best_match_len = len(keyword)

    if best_match is not None:
        return best_match

    # ── Pass 2: spaCy noun-chunk extraction ───────────────────────────
    try:
        nlp = _get_nlp()
        doc = nlp(question_text)

        # Use the most prominent noun chunk
        chunks = [
            chunk.text.strip().title()
            for chunk in doc.noun_chunks
            if len(chunk.text.strip()) > 3
        ]
        if chunks:
            return chunks[0]

        # Fallback to named entities
        ents = [ent.text.title() for ent in doc.ents if len(ent.text) > 2]
        if ents:
            return ents[0]
    except Exception as exc:
        logger.warning("spacy_classification_failed", error=str(exc))

    # ── Pass 3: fallback ──────────────────────────────────────────────
    words = [w for w in question_text.split() if len(w) > 3]
    if words:
        first_three = words[0:3]  # type: ignore[index]
        return " ".join(first_three).title()
    return "General"


def classify_batch(
    question_texts: list[str], subject: str = ""
) -> list[str]:
    """Classify a batch of questions into topics.

    Parameters
    ----------
    question_texts : list[str]
        Questions to classify.
    subject : str
        The exam subject.

    Returns
    -------
    list[str]
        Topic names, parallel to the input list.
    """
    topics = [classify_topic(text, subject) for text in question_texts]
    logger.info("topic_classification_done", count=len(topics))
    return topics
