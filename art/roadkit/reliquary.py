import sys; sys.path.insert(0, "art/roadkit")
from common import *
reset()
M = mats({"stone": "stone", "iron": "iron", "wax": "wax", "seal": "seal", "parchment": "parchment", "soot": "soot", "glow": "glow"})
R = random.Random(3)
HX, HY, Z0, Z1 = .43, .3, .16, .86
# plinth, stepped
p = prim("cube", M["stone"], loc=(0, 0, .08), scl=(.52, .38, .08)); jitter(p, .015, 4, 1)
p2 = prim("cube", M["stone"], loc=(0, 0, .14), scl=(.47, .34, .03)); jitter(p2, .01, 5, 2)
# hollow body with carved panels
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
bmesh.ops.scale(bm, vec=(HX * 2, HY * 2, Z1 - Z0), verts=bm.verts); bmesh.ops.translate(bm, vec=(0, 0, (Z0 + Z1) / 2), verts=bm.verts)
bm.faces.ensure_lookup_table()
sides = [f for f in bm.faces if abs(f.normal.z) < .5]
topf = [f for f in bm.faces if f.normal.z > .5]
bmesh.ops.inset_individual(bm, faces=sides, thickness=.06, depth=-.025)
r = bmesh.ops.inset_individual(bm, faces=topf, thickness=.06, depth=0)
bmesh.ops.translate(bm, vec=(0, 0, -.5), verts=list(topf[0].verts))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
me = bpy.data.meshes.new("body"); bm.to_mesh(me); bm.free()
body = link(me, "body", M["stone"]); jitter(body, .012, 5, 4)
prim("cube", M["soot"], loc=(0, 0, Z1 - .49), scl=(HX - .065, HY - .065, .01))
# the Nine: a ring of nine studs on the front, one chiselled away
prim("torus", M["stone"], loc=(0, -HY - .005, .52), rot=(math.pi / 2, 0, 0), major_radius=.13, minor_radius=.012, major_segments=20, minor_segments=4)
for k in range(9):
    if k == 4: continue
    a = k / 9 * 6.283 + math.pi / 2
    prim("ico", M["stone"], loc=(math.cos(a) * .13, -HY - .01, .52 + math.sin(a) * .13), subdivisions=1, radius=.022)
# iron corner straps with rivets
for sx in (-1, 1):
    for sy in (-1, 1):
        prim("cube", M["iron"], loc=(sx * (HX + .004), sy * (HY - .045), (Z0 + Z1) / 2), scl=(.006, .05, (Z1 - Z0) / 2 - .01))
        prim("cube", M["iron"], loc=(sx * (HX - .045), sy * (HY + .004), (Z0 + Z1) / 2), scl=(.05, .006, (Z1 - Z0) / 2 - .01))
        for z in (Z0 + .08, (Z0 + Z1) / 2, Z1 - .08):
            prim("ico", M["iron"], loc=(sx * (HX + .01), sy * (HY - .05), z), subdivisions=1, radius=.012)
            prim("ico", M["iron"], loc=(sx * (HX - .05), sy * (HY + .01), z), subdivisions=1, radius=.012)
# cracked lid: piece A shoved askew on top, piece B fallen and leaning on the side
def crack(n=7): return [(.03 + R.uniform(-.04, .04), -.33 + .66 * i / n) for i in range(n + 1)]
cr = crack()
A = slab([(-.48, -.33)] + cr + [(-.48, .33)], .1, M["stone"], "lidA")
jitter(A, .01, 6, 8)
xform(A, Matrix.Translation((-.1, .06, Z1)) @ Matrix.Rotation(math.radians(9), 4, "Z") @ Matrix.Rotation(math.radians(-3), 4, "Y"))
B = slab([(x - .03, y) for x, y in reversed(cr)] + [(.48 - .03 - .0, -.33), (.45, .33)][::-1][::-1], .1, M["stone"], "lidB") if False else None
bp = [(cx - .03, cy) for cx, cy in cr]  # crack edge shifted to x≈0
B = slab(list(reversed(bp)) + [(.46, -.33), (.46, .33)][::-1], .1, M["stone"], "lidB")
jitter(B, .01, 6, 9)
th = math.radians(68)
xform(B, Matrix.Translation((HX + .2, -.05, .17)) @ Matrix.Rotation(math.radians(8), 4, "Z") @ Matrix.Rotation(-(math.pi - th), 4, "Y") @ Matrix.Translation((-.46, 0, 0)))
# parchment scraps: crumpled in the box, one draped over the front rim, some on the ground
def scrap(cx, cy, cz, w, d, yaw, curl, seed):
    rr = random.Random(seed)
    def f(u, v):
        x, y = (u - .5) * w, (v - .5) * d
        z = curl * math.sin(u * math.pi) + .01 * mnoise.noise(Vector((u * 6 + seed, v * 6, 0)))
        c, s = math.cos(yaw), math.sin(yaw)
        return (cx + x * c - y * s, cy + x * s + y * c, cz + z)
    return sheet(f, 5, 4, M["parchment"])
for i in range(6):
    scrap(R.uniform(-.25, .25), R.uniform(-.15, .15), Z1 - .3 + i * .05, .18, .13, R.uniform(0, 6.28), R.uniform(.02, .05), i)
def drape(x0, w, seed):
    def f(u, v):
        x = x0 + (u - .5) * w
        s = v * .55  # along path: over rim then down the front panel
        if s < .12: y, z = -HY + .12 - s, Z1 + .005
        else:
            a = min((s - .12) / .06, 1) * math.pi / 2; y = -HY - .01 - .02 * math.sin(a); z = Z1 - (s - .12)
        return (x, y, z + .006 * mnoise.noise(Vector((u * 5, v * 5, seed))))
    return sheet(f, 3, 8, M["parchment"])
drape(.22, .14, 1); drape(.32, .1, 2)
for i in range(5):
    a = R.uniform(-1.9, -.4); r = R.uniform(.5, .85)
    scrap(math.cos(a) * r, math.sin(a) * r, .012, .16, .11, R.uniform(0, 6.28), .015, 10 + i)
# wax seals with tails, spilled on top, plinth and ground
def seal(x, y, z, r, seed):
    o = prim("cyl", M["seal"], loc=(x, y, z + .006), vertices=10, radius=r, depth=.012)
    for v in o.data.vertices:
        v.co.xy = Vector((x, y)) + (v.co.xy - Vector((x, y))) * (1 + .25 * mnoise.noise(Vector((v.co.x * 40, v.co.y * 40, seed))))
    prim("cyl", M["seal"], loc=(x, y, z + .014), vertices=8, radius=r * .55, depth=.006)
for (x, y, z) in [(.25, -.4, .16), (-.3, -.38, .16), (.05, -.62, 0), (.55, -.5, 0), (-.6, -.55, 0), (.35, -.85, 0), (-.15, -.1, Z1 - .2), (.1, .05, Z1 - .15), (-.35, .15, Z1 + .1)]:
    seal(x, y, z, R.uniform(.028, .045), R.uniform(0, 9))
# candle cluster on the lid, its wax pooled and running off the edge
cx, cy, cz = -.2, .02, Z1 + .1 - .02
pool = prim("cyl", M["wax"], loc=(cx, cy, cz + .012), vertices=16, radius=.17, depth=.025)
for v in pool.data.vertices:
    v.co.xy = Vector((cx, cy)) + (v.co.xy - Vector((cx, cy))) * (1 + .3 * mnoise.noise(Vector((v.co.x * 9, v.co.y * 9, 1))))
for i, (dx, dy, h, r) in enumerate([(0, 0, .26, .04), (.08, .05, .18, .033), (-.07, .06, .14, .03), (.05, -.08, .21, .035), (-.09, -.05, .09, .03), (.12, -.02, .07, .025)]):
    candle(M, (cx + dx, cy + dy, cz + .02), h, r, True, i)
for i in range(5):  # runs of wax down the front
    x = -.38 + i * .09; L = R.uniform(.15, .4)
    tube([(x, -HY + .01, Z1 + .06), (x, -HY - .012, Z1 - .02), (x + .01, -HY - .01, Z1 - L * .6), (x, -HY - .008, Z1 - L)], [.018, .016, .012, .002], 5, M["wax"])
finish("reliquary")
print("FILES", proof("reliquary", (0, 0, .5), 3.6, [(-.2, -.4, 1.4)]))
