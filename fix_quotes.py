#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix curly-quote JS string delimiters in TEMPLATES_DATA section of LegalHubPage.jsx"""

filepath = r'c:\Users\Mikołaj\Downloads\stand-dashboard-main\src\pages\LegalHubPage.jsx'

with open(filepath, encoding='utf-8') as f:
    content = f.read()

start_marker = 'const TEMPLATES_DATA = {'
start = content.find(start_marker)
if start == -1:
    print('ERROR: TEMPLATES_DATA not found')
    exit(1)

# Find end by counting braces
depth = 0
end = start
for i, ch in enumerate(content[start:]):
    if ch == '{':
        depth += 1
    elif ch == '}':
        depth -= 1
        if depth == 0:
            end = start + i + 1
            if content[end:end+1] == ';':
                end += 1
            break

templates_section = content[start:end]
print(f'TEMPLATES_DATA: chars {start}..{end}')
print(f'U+201C in section: {templates_section.count(chr(0x201C))}')
print(f'U+201D in section: {templates_section.count(chr(0x201D))}')
print(f'U+201E in section: {templates_section.count(chr(0x201E))}')

def fix_js_string_delimiters(text):
    """Replace U+201C/U+201D used as JS string delimiters with ASCII quotes.
    U+201D inside Polish quote pairs (opened by U+201E) is kept as-is."""
    result = []
    in_js_string = False
    polish_depth = 0

    for ch in text:
        code = ord(ch)
        if not in_js_string:
            if code == 0x201C:  # curly left " used as JS string opener
                in_js_string = True
                result.append('"')  # ASCII "
            else:
                result.append(ch)
        else:
            if code == 0x201E:  # Polish low-9 „ — opens Polish pair
                polish_depth += 1
                result.append(ch)
            elif code == 0x201D:  # curly right " — Polish closer OR JS closer
                if polish_depth > 0:
                    polish_depth -= 1
                    result.append(ch)  # keep as Polish right quote
                else:
                    in_js_string = False
                    result.append('"')  # ASCII " — JS string closer
            else:
                result.append(ch)

    return ''.join(result)

fixed_section = fix_js_string_delimiters(templates_section)

print(f'\nAfter fix:')
print(f'U+201C remaining: {fixed_section.count(chr(0x201C))}')
print(f'U+201D remaining: {fixed_section.count(chr(0x201D))}')
print(f'ASCII " count:    {fixed_section.count(chr(34))}')

new_content = content[:start] + fixed_section + content[end:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('\nFile written successfully.')
