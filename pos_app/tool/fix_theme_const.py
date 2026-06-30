#!/usr/bin/env python3
"""Remove invalid const keywords after theme migration."""

from __future__ import annotations

import re
from pathlib import Path

LIB = Path(__file__).resolve().parent.parent / "lib"

KEEP_CONST = re.compile(
    r"static const|const (EdgeInsets|Duration|Offset|Size|SizedBox|Spacer|"
    r"NeverScrollableScrollPhysics|Icon|double|int|BorderRadius|Radius|"
    r"BoxConstraints|Alignment|MainAxisAlignment|CrossAxisAlignment|"
    r"TextInputType|TextAlign|FontWeight|Axis|Clip)"
)

THEME_MARKERS = ("Theme.of(context)", "context.posSurface", "context.posBrand")

WIDGETS = (
    "Text", "Row", "Column", "Expanded", "Flexible", "Padding", "Center",
    "Container", "Material", "DecoratedBox", "BoxDecoration", "TextStyle",
    "BorderSide", "OutlineInputBorder", "InputDecoration", "RoundedRectangleBorder",
    "ColoredBox", "Ink", "InkWell", "ListTile", "Divider", "Wrap", "Stack",
    "Positioned", "Align", "SizedBox", "Card", "Dialog", "AlertDialog",
    "SingleChildScrollView", "ConstrainedBox", "DefaultTextStyle", "RichText",
    "Icon", "CircleAvatar", "Chip", "FilterChip", "ActionChip", "ChoiceChip",
    "Table", "TableRow", "TableCell", "DataTable", "DataRow", "DataCell",
    "Checkbox", "Radio", "Switch", "Slider", "LinearProgressIndicator",
    "CircularProgressIndicator", "ListView", "GridView", "AspectRatio",
    "AnimatedContainer", "Opacity", "ClipRRect", "Border", "Tab", "TabBar",
    "NavigationRail", "Stepper", "Form", "DropdownButton", "PopupMenuButton",
    "SegmentedButton", "FilledButton", "OutlinedButton", "TextButton",
    "ElevatedButton", "IconButton", "TextField", "SafeArea", "Scaffold",
    "AppBar", "Tooltip", "Badge", "InputDecorator", "ListBody", "ButtonBar",
    "OverflowBar", "AnimatedOpacity", "Visibility", "Offstage", "Baseline",
    "IntrinsicHeight", "IntrinsicWidth", "LimitedBox", "FractionallySizedBox",
)


def fix_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if not any(m in text for m in THEME_MARKERS):
        return False

    original = text

    lines = []
    for line in text.splitlines(keepends=True):
        if any(m in line for m in THEME_MARKERS) and not KEEP_CONST.search(line):
            line = re.sub(r"\bconst\s+", "", line)
        lines.append(line)
    text = "".join(lines)

    for w in WIDGETS:
        text = re.sub(rf"(\n\s*)const ({w}\()", rf"\1\2", text)

    # const [ ... Theme.of ... ]
    text = re.sub(r"const (\[[^\]]*Theme\.of\(context\)[^\]]*\])", r"\1", text, flags=re.DOTALL)

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    n = 0
    for p in sorted(LIB.rglob("*.dart")):
        if fix_file(p):
            n += 1
            print(f"fixed: {p.relative_to(LIB)}")
    print(f"done — {n} files")


if __name__ == "__main__":
    main()
