#!/usr/bin/env python3
"""Seal INTEGRITY_MD5 in js/app.js from index.html + CSS + JS (same payload the app verifies)."""
from __future__ import annotations

import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP_JS = ROOT / "js" / "app.js"
PLACEHOLDER = "00000000000000000000000000000000"
ASSETS = [
    ("index.html", ROOT / "index.html"),
    ("css/app.css", ROOT / "css" / "app.css"),
    ("js/data.js", ROOT / "js" / "data.js"),
    ("js/app.js", ROOT / "js" / "app.js"),
    ("js/tests.js", ROOT / "js" / "tests.js"),
]
ASSIGN_RE = re.compile(r"const INTEGRITY_MD5\s*=\s*'[0-9a-fA-F]{32}'")
PLACEHOLDER_ASSIGN_RE = re.compile(
    r"const INTEGRITY_MD5\s*=\s*(?:INTEGRITY_PLACEHOLDER|'[0-9a-fA-F]{32}')"
)


def nl(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


def payload() -> str:
    parts = []
    for name, path in ASSETS:
        text = nl(path.read_text(encoding="utf-8"))
        text = ASSIGN_RE.sub(f"const INTEGRITY_MD5 = '{PLACEHOLDER}'", text, count=1)
        parts.append(f"FILE:{name}\n{text}")
    return "\n".join(parts)


def main() -> None:
    app = APP_JS.read_text(encoding="utf-8")
    if not PLACEHOLDER_ASSIGN_RE.search(app):
        raise SystemExit("Could not find INTEGRITY_MD5 assignment in js/app.js")
    APP_JS.write_text(
        PLACEHOLDER_ASSIGN_RE.sub(f"const INTEGRITY_MD5 = '{PLACEHOLDER}'", app, count=1),
        encoding="utf-8",
    )
    digest = hashlib.md5(payload().encode("utf-8")).hexdigest()
    APP_JS.write_text(
        PLACEHOLDER_ASSIGN_RE.sub(f"const INTEGRITY_MD5 = '{digest}'", APP_JS.read_text(encoding="utf-8"), count=1),
        encoding="utf-8",
    )
    check = hashlib.md5(payload().encode("utf-8")).hexdigest()
    if check != digest:
        raise SystemExit(f"Seal unstable: {digest} vs {check}")
    print(f"Sealed INTEGRITY_MD5 = {digest}")


if __name__ == "__main__":
    main()
