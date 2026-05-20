import re
with open("hotel.html", "rb") as f:
    content_bytes = f.read()

# Let's see the bytes of that specific heading
idx = content_bytes.find(b'class="reviews-title"')
if idx != -1:
    print(content_bytes[idx:idx+50])
