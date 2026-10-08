# Maelin Sore's cartographer table: scarred trestle, the north road scratched off a red-ink map,
# wicker basket of rolled maps, brass compass + dividers, quill and inkpot, guttering candles,
# satchel on a stool, a tattered sketch on a post with a teal-glass lantern. Front = Blender -Y.
import sys; sys.path.insert(0, "art/roadkit")
from common import *
KINDS["brass"] = ("#3e2a12", "#c49c63", .38, .9, 1)
KINDS["ink"] = ("#4a1512", "#ac4c42", .3, 0, 0)
KINDS["wicker"] = ("#33240f", "#8f6d3e", .85, 0, 3)
KINDS["leather"] = ("#1d120c", "#5a3624", .6, 0, 2)
reset()
M = mats({"wood": "wood", "iron": "iron", "brass": "brass", "parchment": "parchment", "ink": "ink",
          "wax": "wax", "glow": "glow", "soot": "soot", "stone": "stone", "wicker": "wicker", "leather": "leather"})
g = bpy.data.materials.new("teal_glass"); g.use_nodes = True; b = g.node_tree.nodes["Principled BSDF"]
b.inputs["Base Color"].default_value = (.25, .62, .66, 1); b.inputs["Emission Color"].default_value = (.43, .72, .75, 1)
b.inputs["Emission Strength"].default_value = 2.5; b.inputs["Roughness"].default_value = .15
M["teal_glass"] = g
R = random.Random(11)
TOP = .85
def box(mat, c, h, rz=0, j=0, seed=0):
    o = prim("cube", mat, loc=c, rot=(0, 0, rz), scl=h)
    if j: jitter(o, j, 6, seed)
    return o
# ---------- trestle table
for i, y in enumerate((-.265, 0, .265)):
    p = box(M["wood"], (R.uniform(-.01, .01), y, TOP - .025), (.8 + R.uniform(-.01, .02), .128, .025), R.uniform(-.006, .006), .004, i)
    bpy.ops.object.select_all(action="DESELECT")
for x in (-.6, .6):
    box(M["wood"], (x, 0, .78), (.035, .37, .02))
    for s in (-1, 1):
        tube([(x, s * .3, 0.06), (x, s * .2, .4), (x, s * .1, .77)], [.035, .032, .03], 6, M["wood"])
    box(M["wood"], (x, 0, .035), (.04, .36, .035), 0, .006, int(x * 10) + 5)
    box(M["iron"], (x, 0, .6), (.042, .04, .012))
box(M["wood"], (0, 0, .32), (.7, .025, .04), 0, .004, 9)
for x in (-.73, .73):
    box(M["wood"], (x, 0, .32), (.035, .03, .045)); box(M["wood"], (x + (.03 if x > 0 else -.03), 0, .32), (.012, .04, .02))
# knife scars and burns across the top
for i in range(16):
    x, y = R.uniform(-.75, .75), R.uniform(-.38, .38)
    if -.64 < x < .44 and -.35 < y < .35: continue
    box(M["soot"], (x, y, TOP + .0005), (R.uniform(.02, .08), .0018, .0015), R.uniform(0, 3.14))
for (x, y, r) in ((.72, -.3, .035), (-.74, .33, .025)):
    o = prim("cyl", M["soot"], loc=(x, y, TOP + .0008), vertices=10, radius=r, depth=.002); jitter(o, .008, 40, int(x * 9))
# ---------- the map
X0, X1, Y0, Y1 = -.63, .43, -.34, .34
def mapz(x, y):
    z = TOP + .003 + .0018 * math.sin(x * 23 + y * 7) * math.sin(y * 17)
    cu = max(0, (x - .25) / .18) * max(0, (y - .17) / .17)
    return z + .07 * cu ** 2.2
def mfn(u, v):
    x, y = X0 + (X1 - X0) * u, Y0 + (Y1 - Y0) * v
    if u in (0, 1) or v in (0, 1): x += R.uniform(-.004, .004); y += R.uniform(-.004, .004)
    return (x, y - .03 * max(0, (x - .25) / .18) ** 2 * max(0, (y - .17) / .17) ** 2, mapz(x, y))
sheet(mfn, 24, 16, M["parchment"], "map")
def onmap(pts, r, mat, z=.0015):
    return tube([(x, y, mapz(x, y) + z) for x, y in pts], r, 4, mat, cap=False)
road = [(-.15 + .07 * math.sin(t * 5.5) + .05 * t, -.3 + .6 * t) for t in [i / 30 for i in range(31)]]
onmap([p for p in road if p[1] <= .02], .0035, M["ink"])
onmap([p for p in road if p[1] >= -.01], .0028, M["ink"])
for i in range(18):  # the north half hacked out: dense dark scratches
    t = i / 17; cx, cy = road[min(30, 15 + int(t * 15))]
    a = R.uniform(-.6, .6); L = R.uniform(.05, .09)
    pts = [(cx + math.cos(a) * L * (k / 3 - .5) + R.uniform(-.006, .006), cy + math.sin(a) * L * (k / 3 - .5) + (k % 2) * .012) for k in range(4)]
    onmap(pts, .0022, M["soot"], .0025)
for i in range(7):  # a faint new red line being searched for, beside the scratched one
    y = .05 + i * .04; x = road[15][0] + .09 + .02 * math.sin(i)
    onmap([(x, y), (x + .004, y + .022)], .002, M["ink"])
for (cx, cy) in ((-.48, -.12), (-.42, -.05), (-.5, .05), (.18, -.2), (.25, -.12)):  # mountain chevrons
    onmap([(cx - .025, cy - .01), (cx, cy + .015), (cx + .025, cy - .01)], .0018, M["soot"])
onmap([(-.6, .2), (-.45, .16), (-.35, .22), (-.2, .18), (-.05, .26)], .0025, M["soot"])  # a river
o = prim("cyl", M["ink"], loc=(road[0][0], road[0][1], TOP + .006), vertices=8, radius=.012, depth=.004)  # the camp, a red seal-dot
# corner weights: stone, inkpot, dagger
st = prim("ico", M["stone"], loc=(X0 + .02, Y0 + .02, TOP + .035), scl=(.075, .06, .045), subdivisions=2); jitter(st, .012, 8, 4)
ip = (X0 + .03, Y1 - .03)
prim("cyl", M["soot"], loc=(ip[0], ip[1], TOP + .03), vertices=12, radius=.04, depth=.05)
prim("cyl", M["soot"], loc=(ip[0], ip[1], TOP + .065), vertices=10, radius=.018, depth=.025)
prim("torus", M["brass"], loc=(ip[0], ip[1], TOP + .077), major_radius=.019, minor_radius=.004, major_segments=10, minor_segments=4)
prim("cyl", M["ink"], loc=(ip[0], ip[1], TOP + .074), vertices=8, radius=.015, depth=.002)
q0 = Vector((ip[0], ip[1], TOP + .03)); qd = Vector((.25, -.12, .95)).normalized()
tube([q0, q0 + qd * .33], [.003, .002], 4, M["wax"])
def vane(u, v):
    p = q0 + qd * (.12 + .21 * u); w = (.022 * math.sin(math.pi * min(1, u * 1.15)) + .002) * (v - .4)
    side = qd.cross(Vector((0, 0, 1))).normalized()
    return tuple(p + side * w + Vector((0, 0, .01 * (v - .5) ** 2)))
sheet(vane, 10, 3, M["wax"], "vane")
dg = Matrix.Translation((X1 - .02, Y0 + .03, TOP - .03)) @ Matrix.Rotation(math.radians(14), 4, "Y") @ Matrix.Rotation(math.radians(-8), 4, "X")
parts = [prim("cone", M["iron"], loc=(0, 0, .11), rot=(math.pi, 0, 0), scl=(1, .22, 1), vertices=4, radius1=.02, depth=.22),
         prim("cube", M["brass"], loc=(0, 0, .225), scl=(.05, .009, .009)),
         prim("cyl", M["leather"], loc=(0, 0, .285), vertices=8, radius=.012, depth=.11),
         prim("sph", M["brass"], loc=(0, 0, .35), segments=8, ring_count=5, radius=.018)]
for p in parts: xform(p, dg)
# brass compass and dividers
cc = (.3, -.18)
prim("cyl", M["brass"], loc=(cc[0], cc[1], TOP + .012), vertices=16, radius=.045, depth=.018)
prim("cyl", M["parchment"], loc=(cc[0], cc[1], TOP + .0215), vertices=16, radius=.038, depth=.002)
prim("torus", M["brass"], loc=(cc[0], cc[1], TOP + .022), major_radius=.042, minor_radius=.004, major_segments=16, minor_segments=4)
nd = prim("cone", M["ink"], loc=(0, 0, 0), vertices=4, radius1=.006, depth=.06); xform(nd, Matrix.Translation((cc[0], cc[1], TOP + .025)) @ Matrix.Rotation(math.radians(70), 4, "Z") @ Matrix.Rotation(math.pi / 2, 4, "X") @ Matrix.Diagonal((1, .3, 1, 1)))
hg = Vector((.1, -.24, mapz(.1, -.24) + .006))
for a in (-.25, .25):
    d = Vector((math.cos(-1.2 + a), math.sin(-1.2 + a), 0)) * -.16
    tube([hg, hg + d + Vector((0, 0, -.004))], [.004, .0015], 4, M["brass"])
prim("cyl", M["brass"], loc=hg, vertices=8, radius=.009, depth=.008)
# ---------- guttering candle cluster, wax pooled and spilling over the back edge
CC = Vector((.6, .28, TOP))
pool = prim("cyl", M["wax"], loc=(CC.x, CC.y, TOP + .004), vertices=20, radius=.12, depth=.008)
for v in pool.data.vertices:
    d = v.co.xy - CC.xy; d *= 1 + .3 * mnoise.noise(Vector((v.co.x * 9, v.co.y * 9, 1)))
    v.co.xy = CC.xy + d; v.co.y = min(v.co.y, .399)
TIPS = []
for i, (dx, dy, h, r, lit) in enumerate(((-.02, -.02, .17, .024, 1), (.05, .02, .11, .02, 1), (-.06, .05, .065, .026, 1), (.03, -.07, .035, .022, 1), (.08, -.04, .05, .018, 0))):
    base = (CC.x + dx, CC.y + dy, TOP + .006); candle(M, base, h, r, bool(lit), i + 3)
    if lit: TOPS = TIPS.append((base[0], base[1], base[2] + h + .035))
for i, x in enumerate((.52, .58, .61, .67, .7)):
    L = R.uniform(.05, .17)
    tube([(x, .37, TOP + .006), (x, .404, TOP - .004), (x, .408, TOP - .03), (x, .407, TOP - L)], [.008, .009, .007, .002], 6, M["wax"])
for i in range(3):
    x = .55 + i * .06; o = prim("cyl", M["wax"], loc=(x, .45, .003), vertices=8, radius=.025 + i * .006, depth=.006); jitter(o, .006, 20, i)
# ---------- tall wicker basket of rolled maps (left end)
BK = Vector((-1.05, .08, 0)); NS = 14
for k in range(NS):
    a = k / NS * 6.283
    tube([BK + Vector((math.cos(a) * .15, math.sin(a) * .15, .02)), BK + Vector((math.cos(a) * .19, math.sin(a) * .19, .74))], .007, 4, M["wicker"], cap=False)
for j in range(16):
    z = .04 + j * .045; rr = .15 + .04 * z / .74
    tube([BK + Vector((math.cos(t / 56 * 6.283) * (rr + .008 * math.sin(t * math.pi / 2 + j * math.pi / 2)), math.sin(t / 56 * 6.283) * (rr + .008 * math.sin(t * math.pi / 2 + j * math.pi / 2)), z)) for t in range(57)], .017, 4, M["wicker"], cap=False)
prim("torus", M["wicker"], loc=BK + Vector((0, 0, .74)), major_radius=.19, minor_radius=.02, major_segments=20, minor_segments=5)
prim("cyl", M["wicker"], loc=BK + Vector((0, 0, .015)), vertices=14, radius=.16, depth=.03)
for i in range(6):
    a = i / 6 * 6.283 + .4; rr = R.uniform(.03, .1); L = R.uniform(.85, 1.15); r = R.uniform(.03, .045)
    p0 = BK + Vector((math.cos(a) * rr, math.sin(a) * rr, .05)); tilt = Vector((math.cos(a) * .18, math.sin(a) * .18, 1)).normalized()
    roll = tube([p0, p0 + tilt * L], r, 10, M["parchment"]); jitter(roll, .003, 20, i)
    prim("cyl", M["soot"], loc=p0 + tilt * (L + .001), rot=tilt.to_track_quat("Z", "Y").to_euler(), vertices=10, radius=r * .55, depth=.003)
    tie = prim("torus", M["ink"], loc=(0, 0, 0), major_radius=r + .002, minor_radius=.004, major_segments=10, minor_segments=4)
    xform(tie, Matrix.Translation(p0 + tilt * L * .8) @ tilt.to_track_quat("Z", "Y").to_matrix().to_4x4())
# ---------- stool with the satchel slung on it (right end)
SC = Vector((1.12, -.05, 0))
prim("cyl", M["wood"], loc=SC + Vector((0, 0, .49)), vertices=14, radius=.19, depth=.04)
for k in range(3):
    a = k / 3 * 6.283 + .3
    tube([SC + Vector((math.cos(a) * .1, math.sin(a) * .1, .47)), SC + Vector((math.cos(a) * .2, math.sin(a) * .2, 0))], [.022, .02], 6, M["wood"])
sat = box(M["leather"], (0, 0, 0), (.15, .06, .11)); bevelish = jitter(sat, .02, 4, 7)
xform(sat, Matrix.Translation(SC + Vector((.07, -.02, .6))) @ Matrix.Rotation(math.radians(-24), 4, "Y") @ Matrix.Rotation(.4, 4, "Z"))
flap = box(M["leather"], (0, 0, 0), (.152, .065, .012)); jitter(flap, .006, 5, 8)
xform(flap, Matrix.Translation(SC + Vector((.07, -.02, .6))) @ Matrix.Rotation(math.radians(-24), 4, "Y") @ Matrix.Rotation(.4, 4, "Z") @ Matrix.Translation((0, 0, .113)))
bk = box(M["brass"], (0, 0, 0), (.015, .01, .015))
xform(bk, Matrix.Translation(SC + Vector((.07, -.02, .6))) @ Matrix.Rotation(math.radians(-24), 4, "Y") @ Matrix.Rotation(.4, 4, "Z") @ Matrix.Translation((0, -.07, .07)))
tube([SC + Vector((-.06, .02, .7)), SC + Vector((-.16, .0, .6)), SC + Vector((-.2, -.02, .45)), SC + Vector((-.2, -.08, .3)), SC + Vector((-.15, -.13, .25)), SC + Vector((-.06, -.12, .3))], .009, 5, M["leather"], cap=False)
# ---------- post, tattered sketch, teal-glass lantern
PC = Vector((-.55, .62, 0))
pst = tube([PC + Vector((.01 * math.sin(z * 4), .01 * math.cos(z * 3), z)) for z in [i * 1.9 / 10 for i in range(11)]], .05, 8, M["wood"]); jitter(pst, .01, 6, 12)
for i in range(5):
    a = i / 5 * 6.283; o = prim("ico", M["stone"], loc=PC + Vector((math.cos(a) * .1, math.sin(a) * .1, .03)), scl=(.07, .05, .04), subdivisions=1); jitter(o, .01, 7, i)
arm = [PC + Vector((0, 0, 1.78)), PC + Vector((.2, -.02, 1.8)), PC + Vector((.36, -.02, 1.79))]
tube(arm, .03, 6, M["wood"]); tube([PC + Vector((0, 0, 1.55)), PC + Vector((.22, -.02, 1.785))], .018, 5, M["wood"])
hk = PC + Vector((.32, -.02, 1.76))
chain([hk, hk + Vector((0, 0, -.16))], M["iron"], link_len=.04, r=.012, wire=.003)
L0 = hk + Vector((0, 0, -.18))
prim("torus", M["iron"], loc=L0, rot=(math.pi / 2, 0, 0), major_radius=.018, minor_radius=.004, major_segments=8, minor_segments=4)
prim("cone", M["iron"], loc=L0 + Vector((0, 0, -.05)), vertices=4, radius1=.075, radius2=.01, depth=.06, rot=(0, 0, math.pi / 4))
prim("cube", M["teal_glass"], loc=L0 + Vector((0, 0, -.15)), scl=(.045, .045, .07))
prim("cube", M["iron"], loc=L0 + Vector((0, 0, -.235)), scl=(.058, .058, .012))
for sx, sy in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
    tube([L0 + Vector((sx * .05, sy * .05, -.08)), L0 + Vector((sx * .05, sy * .05, -.225))], .006, 4, M["iron"])
prim("cyl", M["wax"], loc=L0 + Vector((0, 0, -.19)), vertices=8, radius=.013, depth=.05)
SKY = PC.y - .055
def sk(u, v):
    x, z = -.75 + .38 * u, 1.12 + .42 * v
    if u in (0, 1) or v in (0, 1): x += R.uniform(-.012, .012); z += R.uniform(-.014, .014)
    if u > .7 and v < .3: x -= (u - .7) * (.3 - v) * .9; z += (u - .7) * (.3 - v) * .6  # torn corner
    return (x, SKY - .015 * u * (1 - u) * 4 - .02 * (1 - v) ** 3, z)
sheet(sk, 8, 8, M["parchment"], "sketch")
def onsk(pts, mat=None): tube([(x, SKY - .018 * 4 * ((x + .75) / .38) * (1 - (x + .75) / .38) - .02 * (1 - (z - 1.12) / .42) ** 3 - .003, z) for x, z in pts], .0022, 4, mat or M["soot"], cap=False)
onsk([(-.66, 1.2), (-.65, 1.42), (-.6, 1.48), (-.55, 1.42), (-.54, 1.2)])  # a ruined tower
onsk([(-.6, 1.48), (-.6, 1.5)]); onsk([(-.62, 1.3), (-.58, 1.3), (-.58, 1.35), (-.62, 1.35), (-.62, 1.3)])
onsk([(-.72, 1.18), (-.6, 1.2), (-.48, 1.17), (-.4, 1.2)])
onsk([(-.5, 1.4), (-.44, 1.46), (-.42, 1.38)], M["ink"])
for x in (-.72, -.41):
    prim("cyl", M["iron"], loc=(x, SKY - .01, 1.52), rot=(math.pi / 2, 0, 0), vertices=6, radius=.007, depth=.03)
finish("maptable")
print("TIPS", ";".join(f"{-x:.3f},{z:.3f},{y:.3f}" for x, y, z in TIPS))
print("LANTERN_LOCAL", f"{-L0.x:.3f},{L0.z - .15:.3f},{L0.y:.3f}")
print("FILES", proof("maptable", (0, .1, .75), 4.2, [(.6, .1, 1.3), (-.6, -.8, 1.4)]))
