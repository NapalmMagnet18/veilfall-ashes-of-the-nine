# Awakening hi-res texture cook: a 2048 painted photo -> seamless albedo + tangent normal + roughness.
# usage: python3 hires.py in.png outprefix [normalStrength] [roughBase] [roughRange]
import sys, numpy as np
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
ns = float(sys.argv[3]) if len(sys.argv) > 3 else 6.0
rb = float(sys.argv[4]) if len(sys.argv) > 4 else 0.85
rr = float(sys.argv[5]) if len(sys.argv) > 5 else 0.25
a = np.asarray(Image.open(src).convert("RGB").resize((2048, 2048), Image.LANCZOS), dtype=np.float32) / 255
n = a.shape[0]
# seamless: blend the picture with itself rolled by half, weighted so each edge takes the rolled copy
t = np.linspace(0, 1, n, dtype=np.float32)
w1 = np.minimum(t, 1 - t) * 2  # 0 at edges, 1 in middle
w = np.clip(np.minimum.outer(w1, w1) * 2.2, 0, 1)[..., None]
w = w * w * (3 - 2 * w)
r = np.roll(np.roll(a, n // 2, 0), n // 2, 1)
s = a * w + r * (1 - w)
# restore contrast the blend washed out in the seam zones
mean = s.mean((0, 1)); std_s = s.std(); std_a = a.std()
s = np.clip((s - mean) * (std_a / max(std_s, 1e-4)) + mean, 0, 1)
Image.fromarray((s * 255).astype(np.uint8)).save(out + "-albedo.jpg", quality=92)
# height from luminance, high-passed so broad shading does not become slope
L = s @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
def blur(x, k):
    for ax in (0, 1):
        acc = np.zeros_like(x)
        for d in range(-k, k + 1): acc += np.roll(x, d, ax)
        x = acc / (2 * k + 1)
    return x
H = L - blur(blur(L, 24), 24)
H = blur(H, 1)
dx = (np.roll(H, -1, 1) - np.roll(H, 1, 1)) * ns
dy = (np.roll(H, -1, 0) - np.roll(H, 1, 0)) * ns
nz = np.ones_like(dx)
nrm = np.stack([-dx, dy, nz], -1)
nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True)
Image.fromarray(((nrm * 0.5 + 0.5) * 255).astype(np.uint8)).save(out + "-normal.png", optimize=True)
# roughness: cavities rougher, raised bright faces a touch smoother
hn = (H - H.min()) / (H.max() - H.min() + 1e-6)
R = np.clip(rb + (0.5 - hn) * rr, 0.04, 1)
Image.fromarray((R * 255).astype(np.uint8)).save(out + "-rough.jpg", quality=90)
print(out, "done")
