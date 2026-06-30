#!/usr/bin/env python3
"""Final pass: strip remaining invalid const near theme expressions."""

from __future__ import annotations

import re
from pathlib import Path

LIB = Path(__file__).resolve().parent.parent / "lib"
SKIP = {"core/theme/pos_theme.dart"}

STATIC_CONST = re.compile(r"^\s*static\s+const\b")


def fix_line(line: str) -> str:
    if STATIC_CONST.match(line):
        return line
    if "Theme.of(context)" in line or "context.pos" in line:
        return re.sub(r"\bconst\s+", "", line)
    return line


def fix_multiline_const_blocks(text: str) -> str:
    # const Padding( ... Theme.of(context) ... ) -> Padding(
    pattern = re.compile(
        r"const\s+(Padding|SizedBox|Text|Icon|Row|Column|DecoratedBox|Container)\(",
        re.MULTILINE,
    )

    def replacer(match: re.Match[str]) -> str:
        start = match.start()
        widget = match.group(1)
        # Find matching paren depth
        i = match.end() - 1
        depth = 0
        while i < len(text):
            if text[i] == "(":
                depth += 1
            elif text[i] == ")":
                depth -= 1
                if depth == 0:
                    block = text[start : i + 1]
                    if "Theme.of(context)" in block or "context.pos" in block:
                        return block.replace("const ", "", 1)
                    return match.group(0)
            i += 1
        return match.group(0)

    return pattern.sub(lambda m: replacer(m) if False else m.group(0), text)

    # Simpler: iterative line fix only
    return text


def main() -> None:
    for path in sorted(LIB.rglob("*.dart")):
        rel = path.relative_to(LIB).as_posix()
        if rel in SKIP:
            continue
        text = path.read_text(encoding="utf-8")
        if "Theme.of(context)" not in text and "context.pos" not in text:
            continue
        original = text
        lines = [fix_line(ln) for ln in text.splitlines(keepends=True)]
        text = "".join(lines)
        # Broader widget const removal when block contains theme on subsequent lines
        text = re.sub(
            r"const (Padding|SizedBox|Text|Icon|Row|Column)\(",
            lambda m: m.group(0).replace("const ", "")
            if "Theme.of(context)" in text[text.find(m.group(0)) : text.find(m.group(0)) + 800]
            or "context.pos" in text[text.find(m.group(0)) : text.find(m.group(0)) + 800]
            else m.group(0),
            text,
        )
        if text != original:
            path.write_text(text, encoding="utf-8")
            print(f"fixed: {rel}")


if __name__ == "__main__":
    main()
