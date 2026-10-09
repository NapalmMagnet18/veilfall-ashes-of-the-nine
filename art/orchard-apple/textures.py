# Saint Corvin's black-apple orchard: the shared texture set for appleA/B/C (python3 + PIL + numpy).
# bark_albedo.jpg / bark_normal.png: the CDN black furrowed bark, darkened, lichen patches grown on its ridges (periodic, seamless)
# leaves_atlas.png (1024, 2x2 cells, anchor bottom-centre, content grows up): 0 bare twig spray, 1 twigs + clinging dead leaves,
#   2 rust-red withered cluster, 3 sparse brown cluster.   fruit.png / fruit_emit.png: top half rotten apple skin, bottom half scarlet sap
import numpy as np, math, random, os
from PIL import Image, ImageDraw, ImageFilter
SRC = "/workspace/orchard"; OUT = SRC + "/tex"; os.makedirs(OUT, exist_ok=True)

def pnoise(n, beta, seed, ax=1.0):
    rng = np.random.default_rng(seed); f = np.fft.fft2(rng.standard_normal((n, n)))
    ky = np.fft.fftfreq(n)[:, None] * ax; kx = np.fft.fftfreq(n)[None, :]
    k = np.sqrt(kx ** 2 + ky ** 2); k[0, 0] = 1
    r = np.real(np.fft.ifft2(f / k ** beta)); return (r - r.min()) / (r.max() - r.min())
def pblur(a, sigma):
    ky = np.fft.fftfreq(a.shape[0])[:, None]; kx = np.fft.fftfreq(a.shape[1])[None, :]
    return np.real(np.fft.ifft2(np.fft.fft2(a) * np.exp(-2 * (math.pi * sigma) ** 2 * (kx ** 2 + ky ** 2))))
def sstep(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

# ---------------- bark
bark = np.asarray(Image.open(SRC + "/bark_src.png").convert("RGB").resize((512, 512)), np.float32) / 255
lich = np.asarray(Image.open(SRC + "/lichen_src.png").convert("RGB").resize((512, 512)), np.float32) / 255
N = 1024; B = np.tile(bark, (2, 2, 1)); L = np.tile(lich, (2, 2, 1))
lum = B.mean(-1); llum = L.mean(-1)
col = np.power(B, 1.3) * 0.62
g = col.mean(-1, keepdims=True); col = (col * 0.7 + g * 0.3) * np.array([0.96, 0.96, 1.04])
mask = sstep(0.6, 0.7, pnoise(N, 1.7, 7)) * sstep(0.22, 0.45, lum) * sstep(0.36, 0.52, llum)
col = col * (1 - mask[..., None]) + (L * np.array([0.6, 0.64, 0.57])) * mask[..., None]
col *= (0.82 + 0.32 * pnoise(N, 2.0, 9))[..., None]
Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8)).save(OUT + "/bark_albedo.jpg", quality=92)
h = pblur(lum, 1.1) + mask * 0.06
gx = np.roll(h, -1, 1) - np.roll(h, 1, 1); gy = np.roll(h, 1, 0) - np.roll(h, -1, 0)
nv = np.stack([-gx * 5.5, -gy * 5.5, np.ones_like(h)], -1); nv /= np.linalg.norm(nv, axis=-1, keepdims=True)
Image.fromarray(((nv * 0.5 + 0.5) * 255).astype(np.uint8)).save(OUT + "/bark_normal.png")

# ---------------- leaves / twig atlas
R = random.Random(5); C = 1024
TW = (30, 23, 20, 255)
RUST = [(122, 38, 24), (142, 50, 30), (104, 30, 22), (156, 66, 36), (88, 26, 20), (172, 76, 66)]
BROWN = [(78, 52, 32), (62, 40, 26), (96, 62, 34), (70, 32, 22), (54, 36, 28)]
def seg(dr, p0, p1, w0, w1, col):
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]; L_ = math.hypot(dx, dy) or 1; nx, ny = -dy / L_, dx / L_
    dr.polygon([(p0[0] + nx * w0 / 2, p0[1] + ny * w0 / 2), (p1[0] + nx * w1 / 2, p1[1] + ny * w1 / 2),
                (p1[0] - nx * w1 / 2, p1[1] - ny * w1 / 2), (p0[0] - nx * w0 / 2, p0[1] - ny * w0 / 2)], fill=col)
    r = w1 / 2; dr.ellipse([p1[0] - r, p1[1] - r, p1[0] + r, p1[1] + r], fill=col)
def twig(dr, p, ang, length, w, depth, out, minw=6):
    pts = [p]; a = ang
    for k in range(3):
        a += R.uniform(-0.28, 0.28); pts.append((pts[-1][0] + math.cos(a) * length / 3, pts[-1][1] + math.sin(a) * length / 3))
    for k in range(3): seg(dr, pts[k], pts[k + 1], max(minw, w * (1 - 0.12 * k)), max(minw, w * (0.88 - 0.12 * k)), TW)
    out.append((pts[-1], a, depth)); out.append((pts[2], a, depth))
    if depth <= 0: return
    for j in range(R.choice([2, 2, 3])):
        da = (1 if j % 2 == 0 else -1) * R.uniform(0.3, 0.8)
        twig(dr, pts[3] if j < 2 else pts[2], a + da, length * R.uniform(0.55, 0.78), w * 0.62, depth - 1, out, minw)
def leaf(dr, base, ang, L_, W, col):
    c1 = col + (255,); c2 = tuple(int(v * 0.6) for v in col) + (255,); cm = tuple(int(v * 0.4) for v in col) + (255,)
    ca, sa = math.cos(ang), math.sin(ang)
    P = lambda x, y: (base[0] + ca * x - sa * y, base[1] + sa * x + ca * y)
    seg(dr, base, P(L_ * 0.16, 0), 7, 5, TW)
    curl = R.uniform(-0.25, 0.25); shr = R.uniform(0.4, 1.0); ph = R.uniform(0, 6)
    mid, left, right = [], [], []
    for k in range(15):
        t = k / 14; x = L_ * (0.15 + 0.85 * t); yc = curl * L_ * t * t
        w = W * math.sin(math.pi * t) ** 0.75 * (1 - 0.3 * t) * (1 + 0.16 * math.sin(t * 19 + ph))
        mid.append(P(x, yc)); left.append(P(x, yc - w)); right.append(P(x, yc + w * shr))
    dr.polygon(mid + left[::-1], fill=c1); dr.polygon(mid + right[::-1], fill=c2); dr.line(mid, fill=cm, width=4)
    for _ in range(R.choice([0, 0, 1, 2])):
        t = R.uniform(0.3, 0.8); cx, cy = P(L_ * (0.15 + 0.85 * t), curl * L_ * t * t + R.uniform(-W * .35, W * .35)); r = R.uniform(4, 10)
        dr.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(0, 0, 0, 0))
cells = []
for c in range(4):
    im = Image.new("RGBA", (C, C), (0, 0, 0, 0)); dr = ImageDraw.Draw(im); out = []
    if c == 0:
        twig(dr, (512, 1018), -math.pi / 2, 310, 52, 3, out)
    elif c == 1:
        twig(dr, (512, 1018), -math.pi / 2, 300, 50, 3, out)
        for (p, a, dd) in R.sample(out, 7): leaf(dr, p, a + R.choice([-1, 1]) * R.uniform(0.3, 1.2), R.uniform(120, 170), R.uniform(30, 44), R.choice(RUST[:4] + BROWN))
    elif c == 2:
        twig(dr, (512, 1018), -math.pi / 2, 250, 36, 2, out)
        for (p, a, dd) in out:
            for _ in range(R.choice([1, 2, 2])): leaf(dr, p, a + R.uniform(-1.3, 1.3), R.uniform(150, 220), R.uniform(44, 62), R.choice(RUST))
    else:
        twig(dr, (512, 1018), -math.pi / 2, 280, 34, 2, out)
        for (p, a, dd) in R.sample(out, min(len(out), 7)): leaf(dr, p, a + R.uniform(-1.2, 1.2), R.uniform(140, 190), R.uniform(36, 52), R.choice(BROWN + RUST[:2]))
    cells.append(im)
atlas = Image.new("RGBA", (2 * C, 2 * C), (0, 0, 0, 0))
for c, im in enumerate(cells): atlas.paste(im, ((c % 2) * C, (c // 2) * C))
small = atlas.convert("RGBa").resize((1024, 1024), Image.LANCZOS).convert("RGBA")
A = np.asarray(small, np.float32) / 255; rgb = A[..., :3].copy(); al = A[..., 3]
rgb *= (0.7 + 0.5 * pnoise(1024, 1.6, 21))[..., None]
er = np.asarray(Image.fromarray((al * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)), np.float32) / 255
rgb *= (1 - 0.45 * np.clip(al - er, 0, 1))[..., None]
den = pblur(al, 6) + 1e-4
fill = np.stack([pblur(rgb[..., i] * al, 6) for i in range(3)], -1) / den[..., None]
rgb = np.where(al[..., None] > 0.02, rgb, np.clip(fill, 0, 1))
Image.fromarray((np.dstack([np.clip(rgb, 0, 1), al]) * 255).astype(np.uint8), "RGBA").save(OUT + "/leaves_atlas.png")

# ---------------- fruit + sap
n = 256; a1 = pnoise(n, 1.8, 31); a2 = pnoise(n, 1.2, 32); a3 = pnoise(n, 0.7, 33); st = pnoise(n, 1.4, 34, ax=0.08)
skin = np.array([.055, .022, .026]) * (1 - a1[..., None] ** 1.5) + np.array([.23, .05, .06]) * a1[..., None] ** 1.5
rot = sstep(0.6, 0.72, a2)[..., None]; skin = skin * (1 - rot) + np.array([.2, .13, .08]) * rot
sk = (a3 > 0.86)[..., None]; skin = np.where(sk, np.array([.3, .29, .26]), skin)
sap = np.array([.30, .015, .025]) * (1 - st[..., None]) + np.array([.78, .06, .07]) * st[..., None]
img = np.where((np.arange(n) < n // 2)[:, None, None], skin, sap)
emit = np.where((np.arange(n) < n // 2)[:, None, None], 0.0, sap * 0.55)
Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(OUT + "/fruit.png")
Image.fromarray((np.clip(emit, 0, 1) * 255).astype(np.uint8)).save(OUT + "/fruit_emit.png")
print("textures ok")
