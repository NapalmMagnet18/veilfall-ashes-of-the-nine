# Oswin Tallowmonger's peddler handcart (Wayside Fire). Blender -Y = the shafts = engine -Z after forward "+z".
# engine local (ex, ey, ez) = blender (-ex, ez, ey). Lantern flames (engine rows cart-lantern-1/-2) sit at
# blender (0.82, 1.22, 1.22) and (-0.365, 1.22, 1.41); the hooks on the back rail hang them there.
import sys; sys.path.insert(0, "art/roadkit")
import common
from common import *
RES = {"wood": 1024, "canvas": 1024, "tar": 1024, "tallow": 512, "slate": 512}
_tex = common.tex
common.tex = lambda k, s, n=256: _tex(k, s, RES.get(k, 256))
KINDS.update({
    "tar": ("#0b0a09", "#2a221c", .4, 0, 2), "canvas": ("#4f4335", "#9a8b6c", .95, 0, 2),
    "patch": ("#3a1c18", "#7a4236", .95, 0, 2), "tallow": KINDS["wax"], "straw": ("#4e3f22", "#a08850", .95, 0, 3),
    "tonic": ("#260505", "#8e2a22", .12, 0, .4), "glass": ("#0e1416", "#2c3a3c", .08, 0, .3),
    "brass": ("#4e3a1c", "#c49c63", .35, 1, 1), "slate": ("#121419", "#2c2e36", .7, 0, 2),
    "chalk": ("#a8a08e", "#e7d9b8", .95, 0, 1), "rope": ("#3e3020", "#86704c", .95, 0, 3),
    "sack": ("#2e2720", "#615444", .95, 0, 3), "shards": ("#4a4943", "#8a877e", .5, 0, 1),
})
reset()
M = mats({"wood": "wood", "tar": "tar", "iron": "iron", "rust": "rust", "canvas": "canvas", "patch": "patch",
          "tallow": "tallow", "straw": "straw", "tonic": "tonic", "glass": "glass", "brass": "brass", "slate": "slate",
          "chalk": "chalk", "rope": "rope", "sack": "sack", "shards": "shards", "stone": "stone", "glow": "glow", "soot": "soot"})
M["wax"] = M["tallow"]
R = random.Random(23)
V = Vector

def box(mat, c, s, rot=(0, 0, 0), j=0, seed=0):
    o = prim("cube", mat, loc=c, rot=rot, scl=(s[0] / 2, s[1] / 2, s[2] / 2))
    if j: jitter(o, j, 6, seed)
    return o

def bevbox(mat, c, s, rot=(0, 0, 0), bev=.012):
    o = box(mat, c, s, rot)
    md = o.modifiers.new("b", "BEVEL"); md.width = bev; md.segments = 1
    bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier="b")
    return o

BED = .78  # top of the planks
# ---- bed: frame, planks, tarred sides, stakes, iron corner straps
for x in (-.5, .5): bevbox(M["wood"], (x, 0, .67), (.1, 2.42, .1))
for y in (-1.1, -.4, .3, 1.0): bevbox(M["wood"], (0, y, .66), (1.12, .08, .08))
for i in range(5):
    w = .235; x = -.47 + i * .235; L = 2.38 if i != 3 else 2.2
    p = bevbox(M["wood"], (x + R.uniform(-.005, .005), (2.38 - L) / 2 * (-1 if i % 2 else 1), BED - .03), (w - .012, L, .05), rot=(0, R.uniform(-.015, .015), 0), bev=.008)
    jitter(p, .006, 4, i)
for x in (-.6, .6):
    for z0, h in ((BED, .09), (BED + .095, .085)):
        b = bevbox(M["tar"], (x, 0, z0 + h / 2), (.04, 2.4, h), bev=.006); jitter(b, .005, 3, int(z0 * 100))
for y, h in ((1.2, .17), (-1.2, .1)):
    bevbox(M["tar"], (0, y, BED + h / 2), (1.24, .04, h), bev=.006)
for x in (-.63, .63):
    for y in (-1.15, -.4, .4, 1.15): bevbox(M["wood"], (x, y, .79), (.05, .06, .3), bev=.008)
    for y in (-1.2, 1.2): box(M["iron"], (x * 1.005, y * .985, BED + .08), (.045, .07, .2))
for x in (-.62, .62):  # tar drips under the sides
    for k in range(5):
        y = R.uniform(-1.1, 1.1); L = R.uniform(.03, .09)
        tube([(x * 1.03, y, BED + .01), (x * 1.035, y, BED - L * .5), (x * 1.035, y, BED - L)], [.008, .006, .002], 4, M["tar"])

# ---- axle and wheels
AY, AZ, WR = .2, .56, .54
tube([(-.86, AY, AZ), (.86, AY, AZ)], .035, 8, M["iron"])
for x in (-.5, .5): box(M["iron"], (x, AY, AZ + .05), (.08, .1, .1))

def ring(cx, r, a0, a1, n):
    return [V((cx, AY + r * math.cos(a0 + (a1 - a0) * i / n), AZ + r * math.sin(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]

def wheel(cx, cracked):
    s = 1 if cx > 0 else -1
    hub = prim("cyl", M["wood"], loc=(cx, AY, AZ), rot=(0, math.pi / 2, 0), vertices=12, radius=.095, depth=.2)
    for dx in (-.08, .08): prim("torus", M["iron"], loc=(cx + dx, AY, AZ), rot=(0, math.pi / 2, 0), major_radius=.097, minor_radius=.014, major_segments=14, minor_segments=4)
    prim("cyl", M["iron"], loc=(cx + s * .11, AY, AZ), rot=(0, math.pi / 2, 0), vertices=8, radius=.05, depth=.04)
    gap = (2.2, 2.32) if cracked else None  # the split, up and forward of the axle
    if gap:
        tube(ring(cx, WR - .04, gap[1], gap[0] + 6.283, 40), .042, 6, M["wood"])
        tube(ring(cx, WR + .005, gap[1] + .02, gap[0] + 6.283 - .02, 46), .02, 5, M["rust"])
        # splint across the crack, lashed with rope
        mid = (gap[0] + gap[1]) / 2; c = ring(cx, WR - .04, mid, mid, 1)[0]
        t = V((0, -math.sin(mid), math.cos(mid)))
        sp = box(M["wood"], c + V((s * .05, 0, 0)), (.03, .07, .34))
        xform(sp, Matrix.Translation(c + V((s * .05, 0, 0))) @ Matrix.Rotation(-mid + math.pi / 2, 4, "X") @ Matrix.Rotation(math.pi / 2, 4, "X") @ Matrix.Translation(-(c + V((s * .05, 0, 0)))))
        hel = []
        for i in range(70):
            u = i / 69; a = mid - .22 + .44 * u; ph = u * 6.283 * 7
            base = ring(cx, WR - .04, a, a, 1)[0]; rad_dir = V((0, math.cos(a), math.sin(a)))
            hel.append(base + V((math.cos(ph) * .07 + s * .01, 0, 0)) + rad_dir * math.sin(ph) * .065)
        tube(hel, .009, 4, M["rope"], cap=True)
        # a bent tyre end springing loose
        e = ring(cx, WR + .005, gap[0] - .02, gap[0] - .02, 1)[0]
        tube([e, e + V((s * .02, -.06, .1)), e + V((s * .04, -.08, .16))], .018, 4, M["rust"])
    else:
        tube(ring(cx, WR - .04, 0, 6.283, 40), .042, 6, M["wood"])
        tube(ring(cx, WR + .005, 0, 6.283, 46), .02, 5, M["iron"])
    for k in range(10):
        a = k / 10 * 6.283 + .15
        if cracked and k == 3:  # snapped spoke
            p0 = ring(cx, .09, a, a, 1)[0]; p1 = ring(cx, .27, a + .06, a + .06, 1)[0]
            tube([p0, p1], [.02, .015], 5, M["wood"]); continue
        tube([ring(cx, .09, a, a, 1)[0], ring(cx, .3, a, a, 1)[0], ring(cx, WR - .06, a, a, 1)[0]], [.024, .02, .017], 5, M["wood"])
    for k in range(8):  # tyre nails
        a = k / 8 * 6.283 + .3
        if gap and gap[0] - .1 < a < gap[1] + .1: continue
        p = ring(cx, WR + .02, a, a, 1)[0]; prim("sph", M["iron"], loc=p + V((s * .012, 0, 0)), segments=6, ring_count=3, radius=.012)

wheel(.79, True)
wheel(-.79, False)

# ---- shafts resting on a stone
for x in (-.42, .42):
    sh = tube([(x, -.6, .63), (x, -1.2, .58), (x * 1.08, -1.8, .4), (x * 1.13, -2.38, .25), (x * 1.12, -2.48, .25)], [.05, .048, .044, .04, .035], 7, M["wood"])
    jitter(sh, .006, 5, int(x * 10) + 5)
    for y, z in ((-1.1, .59), (-.75, .62)): prim("torus", M["iron"], loc=(x, y, z), rot=(math.pi / 2, 0, 0), major_radius=.052, minor_radius=.01, major_segments=10, minor_segments=4)
tube([(-.47, -2.1, .33), (.47, -2.1, .33)], .03, 6, M["wood"])
rk = prim("ico", M["stone"], loc=(0, -2.33, .1), scl=(.62, .26, .14), subdivisions=3)
jitter(rk, .03, 4, 2)
for i, (x, y) in enumerate(((.42, -2.62), (-.55, -2.5))):
    s2 = prim("ico", M["stone"], loc=(x, y, .04), scl=(.12, .09, .06), subdivisions=2); jitter(s2, .015, 6, 9 + i)

# ---- crooked pole canopy: lean-to over the back half, open front, rail at the back
def zb(x): return 1.70 - .176 * x          # back rail
def zf(x): return 1.98 - .09 * x           # front bar
YF, YB = .02, 1.22
poles = []
for x in (-.66, .66):
    for y, top in ((YF, zf), (YB - .06, zb)):
        t = top(x * 1.02)
        p = tube([(x, y, .62), (x + .01, y + .02 * (1 if x > 0 else -1), (t + .62) / 2), (x * 1.02 + .025, y + .01, t + .05)], [.035, .032, .028], 6, M["wood"])
        jitter(p, .006, 3, int(y * 9 + x * 5)); poles.append(p)
        for zz in (.86, .7): prim("torus", M["rope"], loc=(x, y, zz), major_radius=.04, minor_radius=.008, major_segments=10, minor_segments=4)
tube([V((-.92, YB, zb(-.92))), V((0, YB, zb(0) - .02)), V((.92, YB, zb(.92)))], .028, 6, M["wood"])
tube([V((-.88, YF, zf(-.88))), V((0, YF, zf(0) - .03)), V((.88, YF, zf(.88)))], .028, 6, M["wood"])
for x in (-.66, .66): tube([V((x, YF, zf(x) - .02)), V((x, YB - .05, zb(x) - .02))], .022, 5, M["wood"])
tube([V((0, YF, zf(0) - .03)), V((0, (YF + YB) / 2, 2.02)), V((0, YB, zb(0)))], .022, 5, M["wood"])  # ridge stick
tube([V((.66, YB - .06, .9)), V((.66, YF + .05, 1.6))], .018, 5, M["wood"])  # brace
for x in (-.66, .66):
    for y, top in ((YF, zf), (YB - .06, zb)):
        prim("torus", M["rope"], loc=(x, y, top(x) - .01), rot=(0, math.pi / 2, 0), major_radius=.036, minor_radius=.009, major_segments=10, minor_segments=4)

def canvas_z(x, y):
    v = (y - YF) / (YB - YF); u = (x + .9) / 1.8
    z = zf(x) * (1 - v) + zb(x) * v + .07 * (1 - abs(2 * v - 1)) * 0 + .04
    z += .06 * (1 - abs(2 * u - 1)) * math.sin(math.pi * min(max(v, 0), 1))   # ridge lift
    z -= .05 * math.sin(math.pi * min(max(v, 0), 1)) * abs(math.sin(math.pi * u * 2))   # sag between sticks
    ov = max(0, abs(x) - .66); z -= ov * 1.6
    z += .012 * mnoise.noise(V((x * 6, y * 6, 1.3)))
    return z
def cfn(u, v):
    x = -1.0 + 2.0 * u; y = YF - .1 + (YB - YF + .18) * v
    return V((x, y, canvas_z(x, y)))
cv = sheet(cfn, 30, 22, M["canvas"], "canvas")
for i, (x0, y0, w, h) in enumerate(((.15, .35, .32, .26), (-.6, .7, .28, .3), (-.2, .15, .22, .18))):
    sheet(lambda u, v, x0=x0, y0=y0, w=w, h=h: V((x0 + w * u, y0 + h * v, canvas_z(x0 + w * u, y0 + h * v) + .008)), 6, 6, M["patch"], "patch")
    for k in range(10):  # tacking stitches round the patch
        u = k / 10; pts = [(x0 + w * u, y0 - .01), (x0 + w * u, y0 + h + .01)]
        for (px, py) in pts: box(M["rope"], (px, py, canvas_z(px, py) + .012), (.012, .03, .006))
for i in range(5):  # tattered strips off the front edge
    x = -.7 + i * .33 + R.uniform(-.05, .05); y = YF - .1; z = canvas_z(x, y)
    L = R.uniform(.12, .3)
    sheet(lambda u, v, x=x, y=y, z=z, L=L: V((x + .06 * u + .02 * v, y - .01 * v, z - L * v + .01 * math.sin(u * 6))), 2, 4, M["canvas"], "strip")
for side in (-1, 1):  # side flaps hanging over the eaves
    pass

# ---- lanterns on hooks at the back rail
LANT = [V((.82, YB, 1.22)), V((-.365, YB, 1.41))]
for F in LANT:
    zr = zb(F.x) - .02
    prim("torus", M["iron"], loc=(F.x, YB, zr), rot=(0, math.pi / 2, 0), major_radius=.04, minor_radius=.008, major_segments=10, minor_segments=4)
    tube([V((F.x, YB, zr - .04)), V((F.x, YB - .03, zr - .07)), V((F.x, YB, zr - .1)), V((F.x, YB + .02, zr - .085))], .007, 4, M["iron"])  # S-hook
    top = F.z + .17
    chain([V((F.x, YB, zr - .1)), V((F.x, YB, top + .02))], M["iron"], link_len=.05, r=.016, wire=.005)
    prim("torus", M["iron"], loc=(F.x, YB, top), rot=(math.pi / 2, 0, 0), major_radius=.025, minor_radius=.006, major_segments=10, minor_segments=4)
    prim("cone", M["iron"], loc=(F.x, YB, F.z + .12), vertices=4, radius1=.085, radius2=.02, depth=.08, rot=(0, 0, math.pi / 4))
    prim("cyl", M["iron"], loc=(F.x, YB, F.z - .1), vertices=4, radius=.08, depth=.025, rot=(0, 0, math.pi / 4))
    for dx in (-.055, .055):
        for dy in (-.055, .055):
            tube([V((F.x + dx, YB + dy, F.z - .09)), V((F.x + dx, YB + dy, F.z + .09))], .007, 4, M["iron"])
    for zz in (F.z - .08, F.z + .08):
        tube([V((F.x - .056, YB - .056, zz)), V((F.x + .056, YB - .056, zz)), V((F.x + .056, YB + .056, zz)), V((F.x - .056, YB + .056, zz)), V((F.x - .056, YB - .056, zz))], .005, 4, M["iron"], cap=False)
    stub = prim("cyl", M["tallow"], loc=(F.x, YB, F.z - .06), vertices=8, radius=.022, depth=.06); jitter(stub, .004, 30, 4)
    prim("cyl", M["soot"], loc=(F.x, YB, F.z - .02), vertices=4, radius=.003, depth=.02)

# ---- tallow candle bundles hanging off the front bar
def bundle(x, y, ztop, n, seed):
    rr = random.Random(seed); L = rr.uniform(.22, .3); zt = ztop - rr.uniform(.12, .22)
    tube([V((x, y, ztop)), V((x + .01, y, (ztop + zt) / 2)), V((x, y, zt))], .005, 4, M["rope"], cap=False)
    sw = rr.uniform(-.12, .12)
    for k in range(n):
        a = k / n * 6.283; ox, oy = math.cos(a) * .028, math.sin(a) * .028
        top = V((x + ox * .4, y + oy * .4, zt)); bot = V((x + ox + sw * L, y + oy, zt - L + rr.uniform(0, .05)))
        c = tube([top, top.lerp(bot, .5), bot], [.012, .016, .017], 6, M["tallow"]); jitter(c, .002, 25, seed + k)
    prim("torus", M["rope"], loc=(x + sw * .02, y, zt - .04), major_radius=.04, minor_radius=.007, major_segments=10, minor_segments=4)
for i, x in enumerate((-.5, -.2, .1, .4)):
    bundle(x, YF - .02, zf(x) - .03, 7, 40 + i)
for i, x in enumerate((-.62, .18)):  # two more under the rail, clear of the lanterns
    bundle(x, YB - .04, zb(x) - .03, 6, 60 + i)

# ---- under the canopy: stacked tallow bricks, a candle crate
def bricks(x0, y0, layers, seed):
    rr = random.Random(seed)
    for L in range(layers):
        for i in range(2):
            for j in range(2 if L < layers - 1 else 1):
                rot = (0, 0, math.pi / 2 * (L % 2) + rr.uniform(-.06, .06))
                b = bevbox(M["tallow"], (x0 + (i - .5) * .11, y0 + (j - .5) * .21, BED + .035 + L * .072), (.1, .2, .066), rot=rot, bev=.012)
                jitter(b, .004, 12, seed + L * 7 + i * 3 + j)
bricks(-.28, .85, 4, 3)
bricks(.05, .9, 3, 11)
cx, cy = .32, .55
bevbox(M["wood"], (cx, cy, BED + .1), (.36, .46, .2), bev=.01)
bevbox(M["wood"], (cx, cy, BED + .12), (.3, .4, .2), bev=.004)  # inner: reads as a lid-less box
for i in range(10):
    for j in range(5):
        c = prim("cyl", M["tallow"], loc=(cx - .12 + i * .027, cy - .16 + j * .08, BED + .2 + .01 * ((i + j) % 2)), rot=(math.pi / 2, 0, 0), vertices=6, radius=.012, depth=.07)
tube([V((-.55, .15, BED + .02)), V((-.3, .2, BED + .05)), V((-.05, .12, BED + .02))], .028, 8, M["sack"])  # rolled bolt of spare canvas

# ---- open front: tonics in a straw crate, charm tray, scale and weights, coin box
cx, cy = .26, -.72  # crate of tonics
for sx, sy, w, h in ((-.2, 0, .02, .36), (.2, 0, .02, .36), (0, -.17, .42, .02), (0, .17, .42, .02)):
    bevbox(M["wood"], (cx + sx, cy + sy, BED + .07), (w if w > .03 else .02, h if h > .03 else .02, .14) if False else ((.02, .36, .14) if w == .02 else (.42, .02, .14)), bev=.004)
box(M["wood"], (cx, cy, BED + .01), (.4, .34, .02))
for k in range(26):
    t = prim("ico", M["straw"], loc=(cx + R.uniform(-.18, .18), cy + R.uniform(-.15, .15), BED + .1 + R.uniform(-.02, .02)), scl=(R.uniform(.03, .06), R.uniform(.03, .06), .02), subdivisions=1)
    jitter(t, .012, 20, k)
for k in range(10):
    p0 = V((cx + R.uniform(-.2, .2), cy + R.uniform(-.17, .17), BED + .14)); d = V((R.uniform(-1, 1), R.uniform(-1, 1), R.uniform(-.2, .3))).normalized()
    tube([p0, p0 + d * .08], .003, 3, M["straw"])
for i in range(3):
    for j in range(2):
        if (i, j) == (2, 1): continue  # one sold
        bx, by = cx - .12 + i * .12, cy - .07 + j * .14; tilt = R.uniform(-.08, .08)
        body = prim("cyl", M["tonic"], loc=(bx, by, BED + .08), vertices=10, radius=.038, depth=.13, rot=(tilt, 0, 0))
        prim("sph", M["glass"], loc=(bx, by, BED + .145), segments=10, ring_count=5, radius=.039, scl=(1, 1, .5))
        prim("cyl", M["glass"], loc=(bx, by + tilt * .1, BED + .18), vertices=8, radius=.013, depth=.06)
        prim("cyl", M["wood"], loc=(bx, by + tilt * .1, BED + .22), vertices=8, radius=.016, depth=.03)
        prim("cyl", M["seal"] if "seal" in M else M["patch"], loc=(bx, by + tilt * .1, BED + .2), vertices=8, radius=.018, depth=.012)
b = prim("cyl", M["tonic"], loc=(cx + .3, cy + .1, BED + .04), rot=(math.pi / 2, 0, .9), vertices=10, radius=.038, depth=.13)  # one lying out for show
prim("cyl", M["glass"], loc=(cx + .3 + .07 * math.sin(.9), cy + .1 - .07 * math.cos(.9), BED + .04), rot=(math.pi / 2, 0, .9), vertices=8, radius=.013, depth=.07)

cx, cy = .3, -.22  # brass charm tray
bevbox(M["wood"], (cx, cy, BED + .012), (.42, .3, .024), bev=.006)
for sx in (-.2, .2): box(M["wood"], (cx + sx, cy, BED + .035), (.02, .3, .03))
for sy in (-.14, .14): box(M["wood"], (cx, cy + sy, BED + .035), (.42, .02, .03))
box(M["patch"], (cx, cy, BED + .026), (.37, .25, .004))  # red cloth lining
for i in range(4):
    for j in range(3):
        px, py, pz = cx - .14 + i * .093 + R.uniform(-.01, .01), cy - .08 + j * .08, BED + .033
        k = (i + j * 4) % 4
        if k == 0: prim("torus", M["brass"], loc=(px, py, pz + .004), major_radius=.022, minor_radius=.005, major_segments=12, minor_segments=4)
        elif k == 1: prim("cyl", M["brass"], loc=(px, py, pz + .003), vertices=10, radius=.022, depth=.006)
        elif k == 2: prim("cone", M["brass"], loc=(px, py, pz + .004), rot=(math.pi / 2, 0, R.uniform(0, 6)), vertices=3, radius1=.025, depth=.008)
        else:
            prim("sph", M["brass"], loc=(px, py, pz + .01), segments=8, ring_count=4, radius=.014)
            prim("torus", M["brass"], loc=(px, py + .018, pz + .01), rot=(0, math.pi / 2, 0), major_radius=.008, minor_radius=.0025, major_segments=8, minor_segments=3)
        tube([V((px, py + .02, pz + .003)), V((px + .03, py + .05, pz + .002)), V((px + .01, py + .06, pz + .002))], .0025, 3, M["rope"], cap=False)

cx, cy = -.28, -.38  # the scale
bevbox(M["wood"], (cx, cy, BED + .015), (.2, .14, .03), bev=.006)
tube([V((cx, cy, BED + .03)), V((cx, cy, BED + .36))], .012, 6, M["brass"])
prim("cone", M["brass"], loc=(cx, cy, BED + .375), vertices=6, radius1=.02, depth=.03)
tilt = .09
beam = tube([V((cx - .2, cy, BED + .35 + .2 * tilt)), V((cx + .2, cy, BED + .35 - .2 * tilt))], .006, 4, M["brass"])
for s in (-1, 1):
    end = V((cx + s * .2, cy, BED + .35 - s * .2 * tilt)); pan = V((cx + s * .2, cy, BED + .12 - s * .05))
    for k in range(3):
        a = k / 3 * 6.283; rim = pan + V((math.cos(a) * .065, math.sin(a) * .065, .01))
        tube([end, rim], .0018, 3, M["brass"], cap=False)
    prim("cyl", M["brass"], loc=pan, vertices=14, radius=.07, depth=.012)
    prim("torus", M["brass"], loc=pan + V((0, 0, .008)), major_radius=.068, minor_radius=.005, major_segments=14, minor_segments=3)
for k in range(5):  # shards on the low pan
    prim("ico", M["shards"], loc=(cx - .2 + R.uniform(-.03, .03), cy + R.uniform(-.03, .03), BED + .19), scl=(R.uniform(.012, .022),) * 3, subdivisions=1, rot=(R.uniform(0, 3), R.uniform(0, 3), 0))
for k, (r, h) in enumerate(((.03, .04), (.024, .032), (.019, .026), (.014, .02))):  # weights
    prim("cyl", M["brass"], loc=(cx + .12 + (k % 2) * .05, cy + .1 + (k // 2) * .05, BED + h / 2), vertices=10, radius=r, depth=h)
    prim("sph", M["brass"], loc=(cx + .12 + (k % 2) * .05, cy + .1 + (k // 2) * .05, BED + h + .005), segments=6, ring_count=3, radius=r * .35)

cx, cy = -.27, -.92  # locked coin box
bevbox(M["wood"], (cx, cy, BED + .065), (.24, .16, .13), rot=(0, 0, .2), bev=.008)
for t in (-.07, .07):
    box(M["iron"], (cx + t * math.cos(.2), cy + t * math.sin(.2), BED + .066), (.022, .168, .134), rot=(0, 0, .2))
box(M["iron"], (cx + .05 * math.sin(.2), cy - .08 * math.cos(.2) - .004, BED + .1), (.05, .012, .05), rot=(0, 0, .2))
lock = V((cx + .088 * math.sin(.2), cy - .095, BED + .08))
box(M["brass"], lock, (.04, .016, .04), rot=(0, 0, .2))
prim("torus", M["iron"], loc=lock + V((0, 0, .03)), rot=(math.pi / 2, 0, .2), major_radius=.014, minor_radius=.004, major_segments=10, minor_segments=3)
for k in range(5):  # a few copper coins out front
    prim("cyl", M["brass"], loc=(cx + .16 + R.uniform(-.03, .04), cy + R.uniform(-.05, .05), BED + .004 + k * .0), vertices=10, radius=.013, depth=.004)

# ---- on the ground: the shard sack (he buys them) and the slate price board
sx, sy = 1.08, -.85
sk = prim("sph", M["sack"], loc=(sx, sy, .2), segments=16, ring_count=10, radius=1, scl=(.24, .22, .22))
for v in sk.data.vertices:
    if v.co.z < .04: v.co.z = .04 + (v.co.z - .04) * .2
    if v.co.z > .32: v.co.xy = V((sx, sy)) + (v.co.xy - V((sx, sy))) * .85
jitter(sk, .025, 6, 7)
tube([V((sx + .16 * math.cos(a), sy + .16 * math.sin(a), .4 + .02 * math.sin(a * 5))) for a in [i / 16 * 6.283 for i in range(17)]], .03, 6, M["sack"], cap=False)
for k in range(16):
    a = R.uniform(0, 6.28); r = R.uniform(0, .13)
    prim("ico", M["shards"], loc=(sx + math.cos(a) * r, sy + math.sin(a) * r, .41 + R.uniform(0, .04)), scl=(R.uniform(.025, .04), R.uniform(.02, .035), R.uniform(.03, .05)), rot=(R.uniform(0, 3), R.uniform(0, 3), R.uniform(0, 3)), subdivisions=1)
for k in range(9):
    a = R.uniform(-1.5, 1.5); r = R.uniform(.26, .5)
    prim("ico", M["shards"], loc=(sx + math.cos(a) * r, sy + math.sin(a) * r, .015), scl=(R.uniform(.02, .035), R.uniform(.015, .03), .015), rot=(0, 0, R.uniform(0, 3)), subdivisions=1)
tube([V((sx - .1, sy - .12, .43)), V((sx - .2, sy - .22, .3)), V((sx - .24, sy - .28, .05))], .008, 4, M["rope"])
# slate board on a little easel, tilted up at the camp
bx, by = 1.02, .98; lean = math.radians(28)
Mb = Matrix.Translation((bx, by, .05)) @ Matrix.Rotation(math.radians(-90), 4, "Z") @ Matrix.Rotation(-lean, 4, "X")
def onb(o): return xform(o, Mb)
onb(box(M["wood"], (0, 0, .33), (.56, .035, .62)))
onb(box(M["slate"], (0, -.02, .33), (.5, .012, .56)))
strokes = [  # chalk scrawl: a candle sigil, a bottle sigil, price marks, a tally
    [(-.2, .55), (-.2, .43)], [(-.22, .43), (-.18, .43)], [(-.2, .56), (-.19, .58)],
    [(-.12, .5), (-.08, .55), (-.04, .5), (0, .55), (.04, .5)], [(.08, .55), (.08, .48), (.12, .48)],
    [(-.2, .36), (-.2, .26), (-.17, .26), (-.17, .36)], [(-.205, .38), (-.165, .38)],
    [(-.12, .32), (-.06, .32)], [(-.02, .36), (.02, .28), (.06, .36)], [(.1, .36), (.1, .28), (.15, .32), (.1, .36)],
    [(-.21, .2), (-.17, .14), (-.21, .1)], [(-.12, .17), (-.06, .17)], [(-.02, .2), (-.02, .12)], [(.03, .2), (.03, .12)], [(.08, .2), (.08, .12)], [(.13, .2), (.13, .12)], [(-.03, .13), (.15, .19)],
    [(-.22, .07), (.2, .06)],
]
for st in strokes:
    onb(tube([V((x, -.028, z)) for x, z in st], .0045, 3, M["chalk"], cap=False))
for s in (-1, 1): onb(tube([V((s * .22, .0, .62)), V((s * .24, .3, 0))], .012, 4, M["wood"]))

# ---- ground litter: drips of tallow and a dropped candle
for k in range(6):
    p = prim("cyl", M["tallow"], loc=(R.uniform(-.5, .9), R.uniform(-1.3, 1.3), .004), vertices=8, radius=R.uniform(.02, .05), depth=.008)
    jitter(p, .01, 20, k)
prim("cyl", M["tallow"], loc=(.95, -.3, .016), rot=(math.pi / 2, 0, .5), vertices=6, radius=.015, depth=.26)

zmin = min((o.matrix_world @ v.co).z for o in bpy.context.scene.objects if o.type == "MESH" for v in o.data.vertices)
print("ZMIN", zmin)
o = finish("handcart")
print("FILES", proof("handcart", (0, -.4, .9), 7.0, [(.82, 1.3, 1.22), (-.365, 1.3, 1.41), (2.5, -2, 1.5)]))
