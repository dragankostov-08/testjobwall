import yaml
import os
from pathlib import Path

def load_yaml_config(filename: str) -> dict:
    config_path = Path(__file__).parent.parent / "config" / filename
    if not config_path.exists():
        return {}
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

keywords_config = load_yaml_config("keywords.yaml")
scoring_config = load_yaml_config("scoring_weights.yaml")
