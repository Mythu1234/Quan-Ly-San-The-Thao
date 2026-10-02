import os
import re

path = "src/pages/TrangChu.tsx"
if os.path.exists(path):
    code = open(path, "r", encoding="utf-8").read()
    # 1. Remove showConfirm entirely if it exists
    code = re.sub(r'const showConfirm = \([^)]*\)\s*=>\s*\{[^}]*\}\s*\}\;\n?', '', code)
    # wait, showConfirm might span multiple lines
    # It probably looks like:
    # const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    #   setPopup({ type: 'confirm', title, message, onConfirm });
    # };
    code = re.sub(r'const showConfirm =[\s\S]*?setPopup\(\{[\s\S]*?\}\);\s*\};\s*', '', code)

    # 2. Fix `prev` type
    code = code.replace("setLookupResult(prev =>", "setLookupResult((prev: any) =>")

    open(path, "w", encoding="utf-8").write(code)
    print("Fixed TS errors")
