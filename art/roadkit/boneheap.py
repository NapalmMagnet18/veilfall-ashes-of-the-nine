import sys; sys.path.insert(0, "art/roadkit")
from common import *
reset()
M = mats({"bone": "bone", "rust": "rust", "wood": "wood", "wax": "wax", "soot": "soot", "ash": "ash"})
R = random.Random(11)
def H(x, y):
    r = math.hypot(x, y); return .34 * math.exp(-(r / .42) ** 2) + .08 * max(0, 1 - r / .8)
mound = prim("sph", M["ash"], segments=20, ring_count=10, radius=1)
for v in mound.data.vertices:
    x, y = v.co.x * .82, v.co.y * .82; v.co = Vector((x, y, max(0, H(x, y) - .05) if v.co.z > 0 else -.02))
jitter(mound, .03, 5, 2)
def place(o, x, y, yaw, tilt=0, lift=0):
    return xform(o, Matrix.Translation((x, y, H(x, y) + lift)) @ Matrix.Rotation(yaw, 4, "Z") @ Matrix.Rotation(tilt, 4, "X"))
def longbone(x, y, L, r, yaw, seed):
    d = Vector((math.cos(yaw), math.sin(yaw), 0)); a = Vector((x, y, 0)) - d * L / 2; b = Vector((x, y, 0)) + d * L / 2
    a.z = H(a.x, a.y) + r; b.z = H(b.x, b.y) + r
    tube([a, a.lerp(b, .15), a.lerp(b, .5), a.lerp(b, .85), b], [r * 1.2, r * .8, r * .7, r * .8, r * 1.2], 6, M["bone"], name="bone")
    n = d.cross(Vector((0, 0, 1)))
    for e in (a, b):
        for s in (-1, 1): prim("ico", M["bone"], loc=e + n * s * r * .7, subdivisions=1, radius=r * 1.25)
for i in range(30):
    rr = abs(R.gauss(0, .38)); a = R.uniform(0, 6.28)
    longbone(math.cos(a) * min(rr, .7), math.sin(a) * min(rr, .7), R.uniform(.26, .44), R.uniform(.018, .028), R.uniform(0, 6.28), i)
for i in range(10):  # ribs
    a = R.uniform(0, 6.28); r = R.uniform(.1, .6); x, y = math.cos(a) * r, math.sin(a) * r; yaw = R.uniform(0, 6.28)
    pts = [(math.cos(yaw) * (.14 * math.sin(t * 2.4)) + x, math.sin(yaw) * (.14 * math.sin(t * 2.4)) + y + .0, 0) for t in [k / 6 for k in range(7)]]
    pts = [Vector((px + math.cos(yaw + 1.57) * .18 * k / 6, py + math.sin(yaw + 1.57) * .18 * k / 6, 0)) for k, (px, py, _) in enumerate(pts)]
    for p in pts: p.z = H(p.x, p.y) + .012 + .03 * math.sin(pts.index(p) / 6 * 3.14)
    tube(pts, .011, 4, M["bone"])
def skull(x, y, yaw, tilt=0, lift=.06):
    parts = []
    c = prim("sph", M["bone"], segments=12, ring_count=8, radius=1); xform(c, Matrix.Translation((0, 0, .08)) @ Matrix.Diagonal((.085, .105, .09, 1))); parts.append(c)
    parts.append(prim("cube", M["bone"], loc=(0, -.075, .02), scl=(.05, .035, .028)))  # jaw/maxilla
    for s in (-1, 1): parts.append(prim("sph", M["soot"], loc=(s * .035, -.088, .075), segments=8, ring_count=5, radius=.024))
    parts.append(prim("cone", M["soot"], loc=(0, -.1, .045), rot=(math.pi, 0, 0), vertices=4, radius1=.012, depth=.03))
    for o in parts: place(o, x, y, yaw, tilt, lift - .02)
for (x, y, yaw, tilt) in [(0, -.05, .3, -.3), (.42, -.25, -.6, .2), (-.38, -.32, .9, -.1), (-.2, .38, 2.6, .4), (.3, .3, 3.6, 0)]:
    skull(x, y, yaw, tilt)
def helmet(x, y, yaw, tilt, roll):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=14, v_segments=8, radius=.14)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -.005], context="VERTS")
    me = bpy.data.meshes.new("helm"); bm.to_mesh(me); bm.free()
    d = link(me, "helm", M["rust"]); xform(d, Matrix.Diagonal((1, 1.12, .95, 1))); jitter(d, .012, 9, x * 10)
    parts = [d, prim("torus", M["rust"], major_radius=.145, minor_radius=.012, major_segments=14, minor_segments=4)]
    parts[-1].data.transform(Matrix.Diagonal((1, 1.12, 1, 1)))
    parts.append(prim("cube", M["rust"], loc=(0, -.158, -.04), scl=(.014, .008, .07)))  # nasal
    parts.append(prim("cube", M["rust"], loc=(0, 0, .135), scl=(.012, .15, .012)))  # crest ridge
    for o in parts: xform(o, Matrix.Translation((x, y, H(x, y) + .07)) @ Matrix.Rotation(yaw, 4, "Z") @ Matrix.Rotation(tilt, 4, "X") @ Matrix.Rotation(roll, 4, "Y"))
helmet(.22, .1, .8, .3, 1.2)
helmet(-.5, .05, 2.2, -.2, -.4)
# snapped spear: the haft stuck slanting in the heap with a splintered top, the head piece fallen at its foot
base = Vector((-.1, .2, H(-.1, .2) - .05)); dirn = Vector((.35, .25, 1)).normalized(); topp = base + dirn * .95
tube([base, base.lerp(topp, .5), topp], .022, 6, M["wood"])
for i in range(5):
    a = i / 5 * 6.28; o = Vector((math.cos(a), math.sin(a), 0)) * .012
    tube([topp + o, topp + o * 1.3 + dirn * R.uniform(.05, .12)], [.01, .001], 3, M["wood"])
h0 = Vector((.55, .45, .05)); hd = Vector((-.6, .8, .05)).normalized()
tube([h0, h0 + hd * .3], .02, 6, M["wood"])
for i in range(4):
    a = i / 4 * 6.28; o = Vector((math.cos(a), math.sin(a), 0)) * .01
    tube([h0 + o, h0 + o - hd * R.uniform(.04, .09)], [.009, .001], 3, M["wood"])
prim("cyl", M["rust"], loc=h0 + hd * .32, rot=(0, 0, 0), vertices=8, radius=.026, depth=.01)
blade = prim("cone", M["rust"], vertices=4, radius1=.06, depth=.28)
xform(blade, Matrix.Translation(h0 + hd * .47) @ Vector((0, 0, 1)).rotation_difference(hd).to_matrix().to_4x4() @ Matrix.Diagonal((1, .25, 1, 1)))
sock = tube([h0 + hd * .28, h0 + hd * .36], [.024, .02], 8, M["rust"])
# wax melted over everything: blobs on top, drips running down the slopes, pools at the foot
for i in range(7):
    a = R.uniform(0, 6.28); r = R.uniform(0, .3); x, y = math.cos(a) * r, math.sin(a) * r
    b = prim("sph", M["wax"], segments=10, ring_count=6, radius=1)
    xform(b, Matrix.Translation((x, y, H(x, y) + .04)) @ Matrix.Diagonal((R.uniform(.08, .16), R.uniform(.08, .14), .045, 1)))
    jitter(b, .02, 8, i)
for i in range(14):
    a = R.uniform(0, 6.28); r0 = R.uniform(.02, .2); pts = []; rads = []
    for k in range(7):
        r = r0 + k * R.uniform(.05, .08); x, y = math.cos(a) * r, math.sin(a) * r; pts.append(Vector((x, y, H(x, y) + .035))); rads.append(.028 * (1 - k / 7) + .006)
    tube(pts, rads, 5, M["wax"])
    e = pts[-1]; tube([e, e + Vector((0, 0, -.06)), e + Vector((0, 0, -.1))], [.014, .01, .001], 5, M["wax"])
for i in range(3):
    a = R.uniform(0, 6.28); x, y = math.cos(a) * .7, math.sin(a) * .7
    p = prim("cyl", M["wax"], loc=(x, y, .008), vertices=12, radius=R.uniform(.1, .16), depth=.016); jitter(p, .03, 10, i, (1, 1, 0))
for i, (x, y, h) in enumerate([(.08, -.18, .07), (-.16, -.1, .05)]):
    candle(M, (x, y, H(x, y) + .02), h, .028, False, i)
finish("boneheap")
print("FILES", proof("boneheap", (0, 0, .2), 3.4, [(.6, -.8, 1.2)]))
