#!/usr/bin/env python3
"""Migrate PosColors to theme-aware colors (skips static/const field declarations)."""

from __future__ import annotations

import re
from pathlib import Path

LIB = Path(__file__).resolve().parent.parent / "lib"
SKIP_FILES = {"core/theme/pos_theme.dart"}

REPLACEMENTS = [
    ("PosColors.pageBg", "Theme.of(context).scaffoldBackgroundColor"),
    ("PosColors.panelBg", "Theme.of(context).colorScheme.surface"),
    ("PosColors.catalogBg", "Theme.of(context).colorScheme.surface"),
    ("PosColors.textPrimary", "Theme.of(context).colorScheme.onSurface"),
    ("PosColors.textMuted", "Theme.of(context).colorScheme.onSurfaceVariant"),
    ("PosColors.border", "Theme.of(context).dividerColor"),
    ("PosColors.searchFill", "Theme.of(context).colorScheme.surfaceContainerHighest"),
    ("PosColors.searchBorder", "Theme.of(context).dividerColor"),
    ("PosColors.orderPanelBg", "context.posSurface.orderPanelBg"),
    ("PosColors.posSidebarBg", "context.posSurface.posSidebarBg"),
    ("PosColors.productIconBg", "context.posSurface.productIconBg"),
    ("PosColors.connectedPillBg", "context.posSurface.connectedPillBg"),
    ("PosColors.connectedPillText", "context.posSurface.connectedPillText"),
    ("PosColors.loginPageBg", "context.posSurface.loginPageBg"),
    ("PosColors.loginHeaderBg", "context.posSurface.loginHeaderBg"),
    ("PosColors.loginFieldFill", "context.posSurface.loginFieldFill"),
    ("PosColors.loginNumpadFill", "context.posSurface.loginNumpadFill"),
    ("PosColors.loginNumpadBorder", "context.posSurface.loginNumpadBorder"),
    ("PosColors.loginFieldBorder", "context.posSurface.loginFieldBorder"),
    ("PosColors.loginPillBg", "context.posSurface.loginPillBg"),
    ("PosColors.loginText", "context.posSurface.loginText"),
    ("PosColors.loginTextMuted", "context.posSurface.loginTextMuted"),
    ("PosColors.chipInactive", "context.posBrand.chipInactive"),
    ("PosColors.chipInactiveText", "context.posBrand.chipInactiveText"),
    ("PosColors.primaryLight", "context.posBrand.primaryLight"),
    ("PosColors.primaryDark", "context.posBrand.primaryDark"),
    ("PosColors.primary", "context.posBrand.primary"),
    ("PosColors.sidebarBg", "context.posBrand.sidebarBg"),
]

SKIP_LINE = re.compile(
    r"^\s*(static\s+(const|final)|const\s+_|factory\s|PosBrandTheme\.defaults|resolvePos)"
)

THEME_MARKERS = ("Theme.of(context)", "context.posSurface", "context.posBrand", "context.posColors")

NON_CONST_TYPES = (
    "BoxDecoration",
    "TextStyle",
    "BorderSide",
    "OutlineInputBorder",
    "InputDecoration",
    "RoundedRectangleBorder",
    "Material",
    "ColoredBox",
    "DecoratedBox",
    "Container",
)


def migrate_line(line: str) -> str:
    if SKIP_LINE.search(line):
        return line
    for old, new in REPLACEMENTS:
        line = line.replace(old, new)
    if any(m in line for m in THEME_MARKERS):
        line = re.sub(r"\bconst\s+", "", line)
    return line


def migrate_file(path: Path) -> bool:
    rel = path.relative_to(LIB).as_posix()
    if rel in SKIP_FILES:
        return False

    original = path.read_text(encoding="utf-8")
    lines = [migrate_line(ln) for ln in original.splitlines(keepends=True)]
    text = "".join(lines)

    text = re.sub(
        r"color:\s*Colors\.white\b",
        "color: Theme.of(context).colorScheme.surface",
        text,
    )
    text = re.sub(
        r"backgroundColor:\s*Colors\.white\b",
        "backgroundColor: Theme.of(context).colorScheme.surface",
        text,
    )

    text = re.sub(r"\n\s*static const _pageBg = [^;]+;\n", "\n", text)

    text = text.replace(
        "backgroundColor: _pageBg,",
        "backgroundColor: Theme.of(context).scaffoldBackgroundColor,",
    )

    if any(m in text for m in THEME_MARKERS):
        for t in NON_CONST_TYPES:
            text = text.replace(f"const {t}(", f"{t}(")

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    n = sum(1 for p in LIB.rglob("*.dart") if migrate_file(p) and print(f"updated: {p.relative_to(LIB)}"))
    print(f"done — {n} files")


if __name__ == "__main__":
    main()
