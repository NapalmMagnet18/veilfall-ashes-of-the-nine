# The ruined bell tower of the Ashen Abbey: tapering square shaft, belfry lancets, askew cracked bell, the front-right
# corner fallen open on the stair, dead creepers, wax bleeding down from the belfry. Front -Y (glTF +Z). Floor z=0.
import sys; sys.path.insert(0, "art/abbey")
from kit import *
reset()
M = materials(2); M["soot"] = M["sooted"]
R = random.Random(14)

def frustum(h0, h1, z0, z1, mat, name="fr"):
    bm = bmesh.new()
    b = [bm.verts.new((sx * h0, sy * h0, z0)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    t = [bm.verts.new((sx * h1, sy * h1, z1)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    bm.faces.new(list(reversed(b))); bm.faces.new(t)
    for i in range(4): bm.faces.new((b[i], b[(i + 1) % 4], t[(i + 1) % 4], t[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); return link(me, name, mat)
def half(z):  # outer half-width of the shaft
    return 3.3 - .4 * (z - 1.2) / 14.8
def corner_cut():
    cs = []
    for z0, hw in ((6.5, 1.5), (9.5, 2.3), (13.0, 3.1), (17.5, 3.8)):
        c = prim("cube", M["sooted"], loc=(0, 0, 0), scl=(hw, hw, 10))
        xform(c, Matrix.Translation((3.4 + R.uniform(-.3, .3), -3.4 + R.uniform(-.3, .3), z0 + 10)) @ Matrix.Rotation(math.radians(45 + R.uniform(-12, 12)), 4, "Z"))
        cs.append(c)
    return cs
def lancets(z_spring, w, hz, half_w, offs):
    cs = []
    for face in range(4):
        for ox in offs:
            c = prism_xz([(-w, z_spring - hz), (w, z_spring - hz)] + arch_curve(w, z_spring, 1.0, 8), -half_w - 1, -half_w + 1.5, M["sooted"])
            xform(c, Matrix.Translation((0, 0, 0)) @ Matrix.Rotation(face * math.pi / 2, 4, "Z") @ Matrix.Translation((ox, 0, 0)))
            cs.append(c)
    return cs

# shaft (hollow, 0.9 m walls) on a 3 m foundation, plinth, string courses
shaft = frustum(3.3 + .4 * 4.2 / 14.8, 2.9, -FOUND, 16.0, M["stone"], "shaft")
inner = frustum(2.4, 2.1, .3, 16.5, M["sooted"]); 
slits = []
for face, z in ((1, 5.5), (2, 9.0), (3, 12.5), (0, 3.0)):   # stair slits
    c = prism_xz([(-.16, z), (.16, z)] + arch_curve(.16, z + 1.0, 1.0, 4), -4.2, -2.0, M["sooted"]); xform(c, Matrix.Rotation(face * math.pi / 2, 4, "Z")); slits.append(c)
door = prism_xz([(-.8, 0), (.8, 0)] + arch_curve(.8, 1.9, 1.0, 8), 2.0, 4.2, M["sooted"])  # back door, dark
boolean(shaft, [inner] + corner_cut() + slits + [door], transfer=True)
plinth = frustum(3.6, 3.45, -.2, 1.2, M["stone"], "plinth"); _cc = corner_cut()
for _c in _cc[1:]: bpy.data.objects.remove(_c, do_unlink=True)
boolean(plinth, [frustum(3.0, 3.0, -1, 2, M["sooted"])] + _cc[:1] + [prism_xz([(-.8, -1), (.8, -1)] + arch_curve(.8, 1.9, 1.0, 8), 2.0, 4.2, M["sooted"])], transfer=True)
for z, hw in ((1.25, 3.42), (8.0, half(8) + .1), (16.0, 3.02)):
    s = frustum(hw, hw - .02, z - .12, z + .12, M["stone"], "course"); boolean(s, [frustum(hw - .5, hw - .5, z - 1, z + 1, M["sooted"])] + corner_cut())
# corner buttresses on the three standing corners (taper with the shaft)
for sx, sy in ((-1, -1), (-1, 1), (1, 1)):
    for z0, z1, d in ((-FOUND, 5.5, .55), (5.5, 11.5, .4), (11.5, 15.8, .25)):
        h0, h1 = half(max(z0, 0)), half(z1)
        bt = frustum(d, d * .85, z0, z1, M["stone"], "bt")
        xform(bt, Matrix.Translation((sx * (h0 + h1) / 2, sy * (h0 + h1) / 2, 0)))
        wed = prim("cube", M["stone"], loc=(sx * ((h0 + h1) / 2 + d * .4), sy * ((h0 + h1) / 2 + d * .4), z1 + .15), scl=(d * .9, d * .9, .18))
# belfry stage: set back, two lancets per face
bel = frustum(2.85, 2.72, 16.0, 21.6, M["stone"], "belfry")
boolean(bel, [frustum(2.15, 2.05, 15.5, 22.5, M["sooted"])] + corner_cut() + lancets(19.6, .5, 3.2, 2.85, (-1.05, 1.05)), transfer=True)
for face in range(4):   # hood moulds over the lancets, sills
    for ox in (-1.05, 1.05):
        rot = Matrix.Rotation(face * math.pi / 2, 4, "Z")
        if face == 0 and ox > 0: continue  # that one fell with the corner
        if face == 1 and ox < 0: continue
        pts = [rot @ Vector((ox + x, -2.9, z)) for x, z in [(.62, 19.5)] + arch_curve(.62, 19.6, 1.0, 8) + [(-.62, 19.5)]]
        tube(pts, .08, 5, M["stone"], True, "hood")
        sl = prim("cube", M["stone"], scl=(.6, .25, .08)); xform(sl, rot @ Matrix.Translation((ox, -2.85, 16.38)))
        # charred louvre boards, some fallen out
        for k in range(5):
            if R.random() < .4: continue
            bd = prim("cube", M["char"], scl=(.5 * R.uniform(.6, 1), .04, .2)); jitter(bd, .02, 5, k)
            xform(bd, rot @ Matrix.Translation((ox + R.uniform(-.05, .05), -2.45, 16.9 + k * .6)) @ Matrix.Rotation(math.radians(-35 + R.uniform(-10, 10)), 4, "X"))
# broken parapet: merlons along the top, many gone, two corner pinnacles (one standing, one a stump)
for face in range(4):
    rot = Matrix.Rotation(face * math.pi / 2, 4, "Z")
    for i, x in enumerate(np.linspace(-2.3, 2.3, 5)):
        p = rot @ Vector((x, -2.55, 0))
        if p.x > .5 and p.y < -.5: continue
        if R.random() < .3: continue
        m = prim("cube", M["stone"], loc=(p.x, p.y, 21.6 + .55), scl=(.35 if face % 2 == 0 else .3, .3 if face % 2 == 0 else .35, .55 * R.uniform(.5, 1)))
        jitter(m, .04, 2, i + face * 9)
for sx, sy, ok in ((-1, 1, True), (-1, -1, False), (1, 1, False)):
    b = prim("cube", M["stone"], loc=(sx * 2.45, sy * 2.45, 21.6 + (.9 if ok else .35)), scl=(.42, .42, .9 if ok else .35)); jitter(b, .05, 2, 3)
    if ok:
        bm = bmesh.new(); bs = [bm.verts.new((sx * 2.45 + a * .5, sy * 2.45 + c * .5, 23.4)) for a, c in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        ap = bm.verts.new((sx * 2.45, sy * 2.45, 25.4)); bm.faces.new(list(reversed(bs)))
        for i in range(4): bm.faces.new((bs[i], bs[(i + 1) % 4], ap))
        me = bpy.data.meshes.new("pin"); bm.to_mesh(me); bm.free(); link(me, "pin", M["stone"])
        prim("ico", M["stone"], loc=(sx * 2.45, sy * 2.45, 25.5), subdivisions=1, radius=.16)
# scorched roof: a few rafters of the pyramid roof that burned, the ridge post leaning
for sx, sy, k in ((-1, 1, 1.0), (-1, -1, .55), (1, 1, .7), (0, 1, .8), (-1, 0, .45)):
    a = Vector((sx * 2.3, sy * 2.3, 21.6)); b = a.lerp(Vector((0, 0, 24.2)), k); d = b - a
    o = prim("cube", M["char"], scl=(.12, .12, d.length / 2))
    for v in o.data.vertices:
        if v.co.z > 0: v.co.x *= R.uniform(.3, 1); v.co.z -= R.uniform(0, .3)
    xform(o, Matrix.Translation((a + b) / 2) @ Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4())
# charred bell beam across the belfry (one end dropped from its pocket) and the cracked bell hanging askew
bA, bB = Vector((-2.4, .2, 20.6)), Vector((2.0, .2, 19.95)); d = bB - bA
beam = prim("cube", M["char"], scl=(.2, .2, d.length / 2)); jitter(beam, .03, 3, 4)
xform(beam, Matrix.Translation((bA + bB) / 2) @ Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4())
prof = [(.0, 0), (.75, 0), (.8, .08), (.7, .2), (.55, .55), (.47, 1.0), (.42, 1.25), (.3, 1.42), (0, 1.46)]
bm = bmesh.new(); rings = []
SEG = 28
for j, (r, z) in enumerate(prof):
    rings.append([bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for a in np.linspace(0, 2 * math.pi, SEG, endpoint=False)])
inner_prof = [(.68, .06), (.5, .55), (.4, 1.15), (0, 1.3)]
irings = [[bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for a in np.linspace(0, 2 * math.pi, SEG, endpoint=False)] for r, z in inner_prof]
seq = rings[1:] [:-1]
allr = list(reversed(irings)) + rings[1:]
for ra, rb in zip(allr[:-1], allr[1:]):
    for i in range(SEG): bm.faces.new((ra[i], ra[(i + 1) % SEG], rb[(i + 1) % SEG], rb[i]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
me = bpy.data.meshes.new("bell"); bm.to_mesh(me); bm.free(); bell = link(me, "bell", M["bronze"])
crack = prism_xz([(-.04, -.1), (.06, -.1), (.02, .7), (.07, .95), (.0, 1.1), (-.03, .8)], -1, 0, M["sooted"]); boolean(bell, [crack], transfer=True)
xform(bell, Matrix.Translation((.0, .2, 20.2 - 1.6)) @ Matrix.Rotation(math.radians(16), 4, "X") @ Matrix.Rotation(math.radians(-9), 4, "Y"))
prim("cube", M["iron"], loc=(.05, .1, 20.05), scl=(.08, .2, .35))   # yoke strap
tube([(.1, .3, 19.9), (.12, .05, 19.0), (.18, -.15, 18.6)], .03, 4, M["iron"], True, "clapper")
prim("sph", M["iron"], loc=(.18, -.18, 18.5), segments=8, ring_count=5, radius=.12)
# a burned belfry floor, half gone
for k in range(9):
    if k in (6, 7, 8): continue
    pl = prim("cube", M["char"], loc=(-2.0 + k * .48, 0, 16.1), scl=(.22, 2.0 * R.uniform(.4, 1), .06)); jitter(pl, .03, 3, k)
    xform(pl, Matrix.Translation((0, -1.9 + pl.dimensions.y / 2, 0)))
# the spiral stair seen through the fallen corner: stone treads cantilevered from the inner walls
inh = lambda z: 2.4 - .3 * z / 16.5
z = .3; step = 0; side = 0; pos = -1.9
while z < 16:
    hh = inh(z) - .02; rot = Matrix.Rotation(-side * math.pi / 2, 4, "Z")
    t = prim("cube", M["stone"], scl=(.2, .45, .1)); jitter(t, .015, 4, step)
    xform(t, rot @ Matrix.Translation((pos, hh - .45, z)))
    z += .27; pos += .42; step += 1
    if pos > 1.9: pos = -1.9; side = (side + 1) % 4
    prim("cube", M["stone"], loc=(0, 0, -50), scl=(.01, .01, .01)).data.clear_geometry() if False else None
# rubble of the fallen corner spilling out onto the yard, and inside
rubble(M, 26, (1.5, 6.5, -6.5, -1.8, 0), 81, (.2, .7)); rubble(M, 10, (2.4, 5.2, -5.2, -2.4, .8), 82, (.3, .8))
rubble(M, 8, (-1.5, 1.8, -1.8, 1.5, .3), 83, (.25, .6), "sooted")
for k in range(3):
    o = prim("cube", M["stone"], loc=(3.5 + k * 1.1, -4.2 - k * .8, .35), scl=(.5, .35, .35)); xform(o, Matrix.Translation((3.5 + k, -4.2 - k * .8, 0)) @ Matrix.Rotation(R.uniform(0, 3), 4, "Z") @ Matrix.Translation((-3.5 - k, 4.2 + k * .8, 0)))

# wax bleeding from the belfry: pools on the sills, runs down every face
def wall_front(face, z):
    return (half(z) if z < 16 else 2.85) + .04
drips = []
for face in range(4):
    rot = Matrix.Rotation(face * math.pi / 2, 4, "Z")
    for k in range(7 if face in (0, 3) else 4):
        x = R.uniform(-2.3, 2.3) if k > 1 else (-1.05 if k == 0 else 1.05) + R.uniform(-.3, .3)
        p_ = rot @ Vector((x, -1, 0))
        if p_.x > .2 and p_.y < -.2 and (face in (0, 1)) and abs(x) > .6 and ((face == 0 and x > 0) or (face == 1 and x < 0)): continue
        ztop = 16.35 if k < 3 else R.uniform(17, 21.4); L = R.uniform(2.5, 9.0) if k < 4 else R.uniform(1.2, 4)
        def wl(p, face=face, x=x):
            yy = -wall_front(face, p.z) - .02
            return rot @ Vector((x + (p.x - x0) if False else x, yy, p.z))
        pts = []; rads = []; n = max(5, int(L / .5))
        for i in range(n + 1):
            t = i / n; zz = ztop - t * L
            q = rot @ Vector((x + .08 * math.sin(t * 7 + k), -wall_front(face, zz) - .03, zz))
            pts.append(q); rads.append(R.uniform(.05, .09) * (1.3 - .7 * t) if i else .12)
        tube(pts, rads, 6, M["wax"] if t < 2 else None, True, "drip")
        prim("sph", M["waxamber" if R.random() < .5 else "wax"], loc=pts[-1] + Vector((0, 0, -.04)), segments=6, ring_count=4, radius=rads[-1] * 1.4)
    # sill pools that froze and overhang
    els = [("ELLIPSOID", tuple(rot @ Vector((ox, -2.75, 16.5))), .5, (.7, .35, .2)) for ox in (-1.05, 1.05)]
    els += [("BALL", tuple(rot @ Vector((ox + R.uniform(-.35, .35), -2.98, 16.3))), .22, ()) for ox in (-1.05, 1.05) for _ in range(2)]
    metawax(els, M["wax"], .1, .6, "sillwax")
# amber pools on the plinth where the runs land
els = [("ELLIPSOID", (x, -3.62, 1.3), .5, (1.0, .35, .15)) for x in (-2.2, -.6, 1.0)] + [("ELLIPSOID", (-3.62, y, 1.3), .5, (.35, 1.0, .15)) for y in (-1.5, .9, 2.4)]
metawax(els, M["waxamber"], .1, .6, "plinthwax")
# a few stub candles left on the plinth ledge and the fallen stones
for k, p in enumerate(((-2.6, -3.55, 1.37), (-1.2, -3.55, 1.37), (.3, -3.5, 1.37), (-3.55, .2, 1.37), (2.9, -4.4, .6), (-3.55, 1.7, 1.37))):
    candle(M, p, R.uniform(.08, .25), .05, k % 2 == 0, 200 + k)

# dead creepers: grey-brown vines climbing the left and back faces, branching
def vine(face, x, top, seed):
    rr = random.Random(seed); rot = Matrix.Rotation(face * math.pi / 2, 4, "Z"); pts = []; z = 0
    while z < top:
        x += rr.uniform(-.35, .35); pts.append(rot @ Vector((x, -half(z) - .07, z))); z += .6
    tube(pts, [.07 * (1 - .6 * i / len(pts)) + .015 for i in range(len(pts))], 5, M["ivy"], True, "vine")
    for j in range(2, len(pts) - 1, 2):
        b0 = pts[j]; dx = rr.choice((-1, 1)); bpts = []
        for i in range(4):
            bpts.append(b0 + rot.to_3x3() @ Vector((dx * i * .35, -.03, i * .25 - (i * i * .06))))
        tube(bpts, [.035, .028, .02, .012], 4, M["ivy"], True, "twig")
for face, x, top, s in ((3, -1.6, 13, 1), (3, .4, 9, 2), (3, 1.8, 15, 3), (2, -.8, 11, 4), (2, 1.6, 7, 5), (0, -2.6, 10, 6), (0, -1.2, 5, 7), (1, 2.4, 6, 8)):
    vine(face, x, top, s)
# soot plumes over the lancets and slits
for face in range(4):
    rot = Matrix.Rotation(face * math.pi / 2, 4, "Z")
    for ox in (-1.05, 1.05):
        if (face == 0 and ox > 0) or (face == 1 and ox < 0): continue
        dd = decal(ox, 20.4, 1.6, 1.4, -2.78, M["sootdecal"]); xform(dd, rot)
o = finish("abbey-belltower")
print("FILES", proof("abbey-belltower", (0, 0, 11), 46, [(5, -7, 2, 900), (3, -4, 18, 900), (-6, -6, 6, 700), (8, -8, 12, 1500)]))
