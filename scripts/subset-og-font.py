"""シェア用画像のフォント(Noto Sans JP Bold)を、日本語の記事見出しで使う文字だけに絞る。

使い方: pip install fonttools
        python scripts/subset-og-font.py <元のNotoSansJP-Bold.ttf> assets/fonts/NotoSansJP-Bold.ttf
"""
import sys
from fontTools import subset

cps = set(range(0x20, 0x7F)) | set(range(0xA0, 0x180)) | set(range(0x2000, 0x2070))
cps |= set(range(0x2100, 0x2300)) | set(range(0x2460, 0x2500)) | set(range(0x25A0, 0x2700))
cps |= set(range(0x3000, 0x3100)) | set(range(0xFF00, 0xFFF0))
for a in range(0x81, 0xFF):
    for b in range(0x40, 0xFF):
        try:
            cps.update(ord(ch) for ch in bytes([a, b]).decode("cp932"))
        except UnicodeDecodeError:
            pass

src, dst = sys.argv[1], sys.argv[2]
options = subset.Options()
options.layout_features = ["palt", "kern"]
options.hinting = False
font = subset.load_font(src, options)
subsetter = subset.Subsetter(options)
subsetter.populate(unicodes=cps)
subsetter.subset(font)
subset.save_font(font, dst, options)
print(f"{dst}: {len(cps)} characters")
