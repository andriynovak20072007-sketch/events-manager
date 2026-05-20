# -*- coding: utf-8 -*-
with open("hotel.html", "r", encoding="utf-8") as f:
    content = f.read()

import re
matches = re.findall(r'Р’С–РґРіСѓРєРё', content)
print("Found matches in UTF-8 read:", len(matches))
if matches:
    print("Match 1:", matches[0])
    fixed = matches[0].encode('cp1251').decode('utf-8')
    print("Fixed:", fixed)
