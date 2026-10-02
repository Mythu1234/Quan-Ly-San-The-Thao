import os

path = "src/pages/TrangChu.tsx"
if os.path.exists(path):
    code = open(path, "r", encoding="utf-8").read()
    code = code.replace("const showConfirm = (title: string, message: string, onConfirm: () => void) => setPopup({ type: 'confirm', title, message, onConfirm });\n", "")
    open(path, "w", encoding="utf-8").write(code)
    print("Fixed TS errors 2")
