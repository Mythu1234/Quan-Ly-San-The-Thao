import re

code = open('src/pages/TrangChu.tsx', encoding='utf-8').read()

old_click = """onClick={() => {
                  if (popup.type === 'confirm' && popup.onConfirm) popup.onConfirm();
                  setPopup(null);
                }}"""
new_click = """onClick={() => {
                  const currentPopup = popup;
                  // Clear current popup state first
                  setPopup(null);
                  
                  // Use setTimeout to allow state to clear before triggering a new popup in onConfirm
                  if (currentPopup.type === 'confirm' && currentPopup.onConfirm) {
                    setTimeout(() => currentPopup.onConfirm(), 10);
                  }
                }}"""

code = code.replace(old_click, new_click)
open('src/pages/TrangChu.tsx', 'w', encoding='utf-8').write(code)
print("Popup bug fixed!")
