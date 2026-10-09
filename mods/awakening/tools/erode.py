# Offline landscape bake for an Awakening valley: uplift + implicit stream-power fluvial erosion
# (Braun & Willett 2013) with depression filling, hillslope diffusion and a talus pass. This is what
# Gaea/World Machine do: rivers carve dendritic valleys, ridges sharpen between them, scree settles.
# Output: scripts/lib/erosion-data.js (base64 uint16 height grid + uint8 flow grid) and a hillshade.
import numpy as np, heapq, base64, sys, math, argparse
from PIL import Image
# Usage: python3 mods/awakening/tools/erode.py --out scripts/lib/erosion-data.js [--center 0 -70] [--radius 250 210]
#   [--n 320] [--cell 7.5] [--peak 240] [--iter 70] [--seed 11] [--preview /workspace/hillshade.png]
# The massif rises outside an ellipse (center, radius in m): inside it stays a low valley floor (the spawn
# bowl). The grid centres on --center unless --origin x0 z0 is given. Then in scripts/terrain.js:
#   import { createErosion } from "../mods/awakening/erosion.js"; ERO.detail(ctx, x, z) per column.
ap = argparse.ArgumentParser()
ap.add_argument("--out", default="scripts/lib/erosion-data.js"); ap.add_argument("--preview", default="/workspace/hillshade.png")
ap.add_argument("--n", type=int, default=320); ap.add_argument("--cell", type=float, default=7.5)
ap.add_argument("--origin", type=float, nargs=2, default=None); ap.add_argument("--center", type=float, nargs=2, default=[0, -70])
ap.add_argument("--radius", type=float, nargs=2, default=[250, 210]); ap.add_argument("--peak", type=float, default=240)
ap.add_argument("--iter", type=int, default=70); ap.add_argument("--seed", type=int, default=11)
A_ = ap.parse_args()
N = A_.n; CELL = A_.cell; CX, CZ = A_.center; RX, RZ = A_.radius
X0, Z0 = A_.origin if A_.origin else (CX - N * CELL / 2, CZ - N * CELL / 2)
rng = np.random.default_rng(A_.seed)
xs = X0 + np.arange(N) * CELL; zs = Z0 + np.arange(N) * CELL
X, Z = np.meshgrid(xs, zs)  # [row=z, col=x]
def sstep(a, b, v):
    t = np.clip((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def vnoise(freq, seed):
    r = np.random.default_rng(seed); g = int(N * CELL * freq) + 3
    grid = r.random((g + 1, g + 1))
    u = (X - X0) * freq; v = (Z - Z0) * freq
    iu = np.floor(u).astype(int); iv = np.floor(v).astype(int); fu = u - iu; fv = v - iv
    fu = fu * fu * (3 - 2 * fu); fv = fv * fv * (3 - 2 * fv)
    a = grid[iv, iu]; b = grid[iv, iu + 1]; c = grid[iv + 1, iu]; d = grid[iv + 1, iu + 1]
    return (a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + d * fu) * fv
def fbm(freq, oct, seed, ridged=False):
    s = 0; amp = 1; tot = 0
    for o in range(oct):
        n = vnoise(freq * 2 ** o, seed + o)
        if ridged: n = 1 - abs(n * 2 - 1); n = n * n
        s += n * amp; tot += amp; amp *= 0.5
    return s / tot
ve = np.hypot((X - CX) / RX, (Z - CZ) / RZ)
env = sstep(0.6, 1.9, ve)
broad = fbm(1 / 700, 3, 5)
U = env ** 1.2 * (0.45 + broad * 1.1) * (0.9 + fbm(1 / 40, 2, 77) * 0.2)  # tectonic uplift pattern; a small jitter breaks D8 straight runs
h = env * (10 + fbm(1 / 400, 5, 20, True) * 40) + fbm(1 / 60, 3, 40) * 2
fixed = (ve < 0.62)
fixed[0, :] = fixed[-1, :] = fixed[:, 0] = fixed[:, -1] = True
h[fixed & (ve < 0.62)] = np.minimum(h[fixed & (ve < 0.62)], 4.0)
flat = h.ravel().copy() if False else None
nbr = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
dist = np.array([math.hypot(a, b) * CELL for a, b in nbr])
fixf = fixed.ravel()
def fill(hh):  # priority-flood: every cell drains to an outlet
    H = hh.ravel().copy(); done = np.zeros(N * N, bool); pq = []
    for i in np.flatnonzero(fixf): heapq.heappush(pq, (H[i], i)); done[i] = True
    while pq:
        hv, i = heapq.heappop(pq); r, c = divmod(i, N)
        for a, b in nbr:
            rr, cc = r + a, c + b
            if 0 <= rr < N and 0 <= cc < N:
                j = rr * N + cc
                if not done[j]:
                    done[j] = True
                    if H[j] <= hv: H[j] = hv + 1e-3
                    heapq.heappush(pq, (H[j], j))
    return H.reshape(N, N)
K = 0.004; m = 0.5; dt = 12.0; Umax = 0.25; D = 0.06
ITER = A_.iter
for it in range(ITER):
    h = fill(h)
    Hf = h.ravel()
    # receivers: steepest descent
    best = np.zeros(N * N); rec = np.arange(N * N); rd = np.full(N * N, CELL)
    P = np.pad(h, 1, mode="edge")
    for k, (a, b) in enumerate(nbr):
        sh = P[1 + a:1 + a + N, 1 + b:1 + b + N]
        s = ((h - sh) / dist[k]).ravel()
        better = s > best
        idx = np.flatnonzero(better)
        best[idx] = s[idx]
        rr = (idx // N + a); cc = (idx % N + b)
        rec[idx] = rr * N + cc; rd[idx] = dist[k]
    rec[fixf] = np.flatnonzero(fixf); 
    order = np.argsort(Hf)  # ascending
    A = np.full(N * N, CELL * CELL)
    for i in order[::-1]:
        j = rec[i]
        if j != i: A[j] += A[i]
    Hn = Hf.copy(); Uf = (U.ravel() * Umax)
    for i in order:
        if fixf[i]: continue
        j = rec[i]
        F = K * dt * A[i] ** m / rd[i]
        Hn[i] = (Hf[i] + dt * Uf[i] + F * Hn[j]) / (1 + F)
    h = Hn.reshape(N, N)
    # hillslope diffusion
    P = np.pad(h, 1, mode="edge")
    lap = P[:-2, 1:-1] + P[2:, 1:-1] + P[1:-1, :-2] + P[1:-1, 2:] - 4 * h
    h = h + D * lap * (~fixed)
    if it % 10 == 0: print(it, round(float(h.max()), 1), flush=True)
# talus: soften above 42 degrees a little (granite still stands steep)
for _ in range(20):
    P = np.pad(h, 1, mode="edge")
    for a, b in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        sh = P[1 + a:1 + a + N, 1 + b:1 + b + N]
        d = h - sh; ex = np.maximum(d - CELL * 0.95, 0) * 0.12
        h = h - ex * (~fixed)
# final scale: peaks to --peak m
mask = env > 0.3
scale = A_.peak / max(1e-3, h[mask].max())
h = h * scale
inner = ve < 0.62; h[inner] = np.minimum(h[inner], 4.0 * scale)
# final flow for materials
hf = fill(h); Hf = hf.ravel(); order = np.argsort(Hf)
P = np.pad(hf, 1, mode="edge"); best = np.zeros(N * N); rec = np.arange(N * N)
for k, (a, b) in enumerate(nbr):
    sh = P[1 + a:1 + a + N, 1 + b:1 + b + N]; s = ((hf - sh) / dist[k]).ravel()
    idx = np.flatnonzero(s > best); best[idx] = s[idx]; rec[idx] = (idx // N + a) * N + (idx % N + b)
A = np.ones(N * N)
for i in order[::-1]:
    j = rec[i]
    if j != i: A[j] += A[i]
flow = np.clip(np.log(A.reshape(N, N)) / np.log(3000), 0, 1)
print("max", h.max(), "scale", scale)
lo, hi = -10.0, math.ceil(A_.peak * 1.3 + 10)
q = np.clip((h - lo) / (hi - lo) * 65535, 0, 65535).astype("<u2")
f8 = (flow * 255).astype(np.uint8).reshape(N // 2, 2, N // 2, 2).max(axis=(1, 3))
blob = base64.b64encode(q.tobytes() + f8.tobytes()).decode()
open(A_.out, "w").write(
  "// generated by mods/awakening/tools/erode.py: do not edit. %dx%d, %.1f m cells from (%.0f, %.0f); uint16 height in [%g, %g] then uint8 flow at half resolution.\n" % (N, N, CELL, X0, Z0, lo, hi)
  + "export const GRID = { n: %d, cell: %g, x0: %g, z0: %g, lo: %g, hi: %g };\nexport const DATA = \"%s\";\n" % (N, CELL, X0, Z0, lo, hi, blob))
# hillshade preview
gy, gx = np.gradient(h, CELL)
L = np.array([-0.5, 0.6, -0.6]); L /= np.linalg.norm(L)
nrm = np.stack([-gx, np.ones_like(h), -gy], -1); nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True)
shade = np.clip(nrm @ L, 0, 1)
img = (np.stack([shade * 200 + flow * 30, shade * 200 + flow * 40, shade * 210 + flow * 90], -1)).clip(0, 255).astype(np.uint8)
Image.fromarray(img).resize((640, 640)).save(A_.preview)
