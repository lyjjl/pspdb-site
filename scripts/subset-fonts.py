#!/usr/bin/env python3
"""
按实际用字生成字体子集。

- 正文 400：静态文案 + GB2312 一级常用字（覆盖用户输入的常见中文）
- 粗体 700 / 标题 900 / 一级标题（黑体）700：仅静态文案用字

依赖：fonttools、brotli
    python3 -m venv .venv && .venv/bin/pip install fonttools brotli
    .venv/bin/python scripts/subset-fonts.py
"""

from __future__ import annotations

import glob
import os

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "src", "assets", "fonts")

# 常见标点与拉丁字符，保证任何文本都不会因缺字而回退
EXTRA = (
    "，。、；：？！“”‘’（）【】《》〈〉—…·～￥％＃＠＆＊＋－／＝｜＼＾＿｀｛｝［］＜＞"
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    " .,;:!?'\"()[]{}<>@#$%^&*-+=/\\|_~`"
)


def collect_static_chars() -> set[str]:
    chars: set[str] = set(EXTRA)
    patterns = []
    for ext in ("ts", "tsx", "html", "css", "md"):
        patterns.append(os.path.join(ROOT, "src", "**", f"*.{ext}"))
        patterns.append(os.path.join(ROOT, f"*.{ext}"))
    for pattern in patterns:
        for path in glob.glob(pattern, recursive=True):
            with open(path, encoding="utf-8") as fh:
                chars |= set(fh.read())
    return chars


def gb2312_level1() -> set[str]:
    """GB2312 一级汉字，3755 个常用字。"""
    chars: set[str] = set()
    for hi in range(0xB0, 0xD8):
        for lo in range(0xA1, 0xFF):
            try:
                chars.add(bytes([hi, lo]).decode("gb2312"))
            except UnicodeDecodeError:
                pass
    return chars


def subset(src: str, dest: str, text: str) -> None:
    font = TTFont(src)
    options = Options()
    options.flavor = "woff2"
    options.desubroutinize = True
    options.drop_tables += ["DSIG"]
    subsetter = Subsetter(options=options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    font.save(dest)
    print(f"{os.path.basename(dest):32s} {os.path.getsize(dest) / 1024:7.1f} KB")


FONTS = [
    # (源文件, 输出名, 是否含 GB2312 常用字)
    ("@fontsource/noto-serif-sc/files/noto-serif-sc-chinese-simplified-400-normal.woff2",
     "noto-serif-400.woff2", True),
    ("@fontsource/noto-serif-sc/files/noto-serif-sc-chinese-simplified-700-normal.woff2",
     "noto-serif-700.woff2", False),
    ("@fontsource/noto-serif-sc/files/noto-serif-sc-chinese-simplified-900-normal.woff2",
     "noto-serif-900.woff2", False),
    ("@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-700-normal.woff2",
     "noto-sans-700.woff2", False),
]


def main() -> None:
    static = collect_static_chars()
    common = gb2312_level1()
    print(f"静态用字 {len(static)} 个；GB2312 一级 {len(common)} 个")

    os.makedirs(OUT_DIR, exist_ok=True)
    for rel, name, with_common in FONTS:
        src = os.path.join(ROOT, "node_modules", rel)
        charset = static | common if with_common else static
        subset(src, os.path.join(OUT_DIR, name), "".join(sorted(charset)))


if __name__ == "__main__":
    main()
