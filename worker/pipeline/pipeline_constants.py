"""Shared render pipeline constants (keep in sync with app/src/lib/pipeline-constants.ts)."""

EFFECTS_CYCLE: list[str] = ["zoom_in", "pan_right", "flash", "sparkle"]
RANDOM_EFFECTS: list[str] = ["zoom_in", "zoom_out", "pan_right", "pan_left", "flash", "sparkle"]
TRANSITION_S: float = 0.4


def resolve_effect(effect: str | None, index: int) -> str:
    if effect == "random":
        return RANDOM_EFFECTS[index % len(RANDOM_EFFECTS)]
    if effect and effect != "auto":
        return effect
    return EFFECTS_CYCLE[index % len(EFFECTS_CYCLE)]


def normalize_transition(transition: str | None) -> str:
    value = transition or "slide_left"
    if value == "none":
        return "cut"
    return value
