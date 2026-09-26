import re

with open('src/pages/TrangChu.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

pattern = r'</div>\s*<div className="flex justify-between text-slate-700">\s*<span>Pickleball.*?</div>\s*</div>'
code = re.sub(pattern, '', code, flags=re.DOTALL)

with open('src/pages/TrangChu.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
