#!/usr/bin/env python3
"""Pack css/app.css + js/data.js + js/app.js back into a single-file HTML for sealed distribution."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "css" / "app.css").read_text(encoding="utf-8")
data = (ROOT / "js" / "data.js").read_text(encoding="utf-8")
app = (ROOT / "js" / "app.js").read_text(encoding="utf-8")

html = html.replace(
    '<link rel="stylesheet" href="css/app.css">',
    "<style>\n" + css.rstrip() + "\n</style>",
    1,
)
html = html.replace(
    '<script src="js/data.js"></script>\n<script src="js/app.js"></script>',
    "<script>\n" + data.rstrip() + "\n\n" + app.rstrip() + "\n</script>",
    1,
)

out = ROOT / "dist" / "index.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding="utf-8")
print(f"Wrote {out} ({out.stat().st_size} bytes)")
