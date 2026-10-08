# shared bench for the road dressing kit: materials with packed procedural textures, mesh helpers, finish/export/proof
import bpy, bmesh, math, random, os, numpy as np
from mathutils import Vector, Matrix, Quaternion, noise as mnoise

OUT = "/workspace/roadkit"
os.makedirs(OUT, exist_ok=True)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def hexc(h):
    h = h.lstrip("#"); return np.array([int(h[i:i+2], 16) / 255 for i in (0, 2, 4)], np.float32)

def fnoise(n, beta, seed, aniso=1.0):
    rng = np.random.default_rng(seed)
    f = np.fft.fft2(rng.standard_normal((n, n)))
    kx = np.fft.fftfreq(n)[:, None] * aniso; ky = np.fft.fftfreq(n)[None, :]
    k = np.sqrt(kx ** 2 + ky ** 2); k[0, 0] = 1
    r = np.real(np.fft.ifft2(f / k ** beta))
    return (r - r.min()) / (r.max() - r.min())

def lerp3(a, b, t):
    t = np.clip(t, 0, 1)[..., None]; return a * (1 - t) + b * t

KINDS = {  # dark, light, roughness, metal, normal strength
    "stone": ("#1b1d25", "#55565f", .55, 0, 4), "wood": ("#24180f", "#5e4630", .8, 0, 3),
    "iron": ("#1e1e23", "#3e3d43", .5, .75, 2), "rust": ("#33201a", "#86492a", .85, .35, 3),
    "wax": ("#bfb291", "#ece2c4", .42, 0, 1), "bone": ("#8a7a5a", "#dacfae", .7, 0, 2),
    "parchment": ("#86704b", "#d6c292", .9, 0, 1), "seal": ("#5e1d1a", "#ac4c42", .38, 0, 1),
    "soot": ("#0a0a0d", "#1d1b20", .95, 0, 1), "ash": ("#19181b", "#3d3734", .9, 0, 3),
    "cloth": ("#1f1b1c", "#4a3b34", .95, 0, 2),
}

def tex(kind, seed, n=256):
    a = fnoise(n, 1.8, seed); b = fnoise(n, 1.0, seed + 1); c = fnoise(n, 2.4, seed + 2)
    dk, lt = hexc(KINDS[kind][0]), hexc(KINDS[kind][1])
    if kind == "wood":
        s = fnoise(n, 1.3, seed + 4, aniso=12); h = .75 * s + .25 * a
        col = lerp3(dk, lt, h)
    elif kind in ("stone", "ash"):
        cr = (np.abs(fnoise(n, 1.4, seed + 3) - .5) < .012).astype(np.float32)
        h = .55 * a + .3 * c + .15 * b - cr * .35
        col = lerp3(dk, lt, h)
        moss = np.clip((fnoise(n, 2.2, seed + 5) - .68) * 4, 0, 1)
        col = lerp3(col, hexc("#2b3326"), moss * .6)
    elif kind == "iron":
        h = .6 * a + .4 * b; col = lerp3(dk, lt, h)
        col = lerp3(col, hexc("#6b3a22"), np.clip((c - .6) * 4, 0, 1))
    elif kind == "rust":
        h = .5 * a + .5 * b; col = lerp3(dk, lt, h)
        col = lerp3(col, hexc("#2a2a2e"), np.clip((c - .62) * 4, 0, 1))
    elif kind in ("bone", "parchment"):
        h = .6 * a + .4 * b; col = lerp3(dk, lt, h)
        col = lerp3(col, hexc("#3a3024"), np.clip((c - .65) * 3, 0, 1))
    else:
        h = .5 * a + .5 * b; col = lerp3(dk, lt, h * .9 + .1)
    return col, h

def make_mat(name, kind, seed=1, emit=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    m.use_backface_culling = False
    nt = m.node_tree; bsdf = nt.nodes["Principled BSDF"]
    if emit:
        bsdf.inputs["Base Color"].default_value = (*emit, 1)
        bsdf.inputs["Emission Color"].default_value = (*emit, 1)
        bsdf.inputs["Emission Strength"].default_value = 12
        return m
    _, _, rough, metal, ns = KINDS[kind]
    col, h = tex(kind, seed)
    n = col.shape[0]
    img = bpy.data.images.new(name + "_albedo", n, n)
    px = np.ones((n, n, 4), np.float32); px[..., :3] = col
    img.pixels.foreach_set(px.ravel()); img.pack()
    gx = np.roll(h, -1, 1) - np.roll(h, 1, 1); gy = np.roll(h, -1, 0) - np.roll(h, 1, 0)
    nv = np.stack([-gx * ns, -gy * ns, np.ones_like(h)], -1); nv /= np.linalg.norm(nv, axis=-1, keepdims=True)
    nimg = bpy.data.images.new(name + "_normal", n, n); nimg.colorspace_settings.name = "Non-Color"
    px2 = np.ones((n, n, 4), np.float32); px2[..., :3] = nv * .5 + .5
    nimg.pixels.foreach_set(px2.ravel()); nimg.pack()
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = img
    nt.links.new(t.outputs["Color"], bsdf.inputs["Base Color"])
    t2 = nt.nodes.new("ShaderNodeTexImage"); t2.image = nimg
    nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = .8
    nt.links.new(t2.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = rough; bsdf.inputs["Metallic"].default_value = metal
    return m

def mats(spec):  # {slot: kind}
    out = {}
    for i, (slot, kind) in enumerate(spec.items()):
        out[slot] = make_mat(slot, kind, seed=11 + i * 7, emit=(1.0, .55, .18) if kind == "glow" else None)
    return out

def link(me, name, mat):
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    if mat: o.data.materials.append(mat)
    return o

def bake(o):
    o.data.transform(o.matrix_world); o.matrix_world = Matrix.Identity(4); return o

def prim(kind, mat, loc=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1), **kw):
    ops = {"cyl": bpy.ops.mesh.primitive_cylinder_add, "cube": bpy.ops.mesh.primitive_cube_add,
           "sph": bpy.ops.mesh.primitive_uv_sphere_add, "ico": bpy.ops.mesh.primitive_ico_sphere_add,
           "cone": bpy.ops.mesh.primitive_cone_add, "torus": bpy.ops.mesh.primitive_torus_add}
    ops[kind](location=loc, rotation=rot, **kw)
    o = bpy.context.active_object; o.scale = scl
    if mat: o.data.materials.append(mat)
    bpy.context.view_layer.update()
    return bake(o)

def xform(o, M):
    o.data.transform(M); return o

def jitter(o, amt, freq=3.0, seed=0, axes=(1, 1, 1)):
    off = Vector((seed * 13.1, seed * 7.7, seed * 3.3))
    for v in o.data.vertices:
        d = mnoise.noise_vector(v.co * freq + off) * amt
        v.co += Vector((d.x * axes[0], d.y * axes[1], d.z * axes[2]))
    return o

def tube(pts, rad, segs=8, mat=None, cap=True, name="tube"):
    pts = [Vector(p) for p in pts]; n = len(pts)
    if not isinstance(rad, (list, tuple)): rad = [rad] * n
    bm = bmesh.new(); rings = []
    t0 = (pts[1] - pts[0]).normalized()
    up = Vector((0, 0, 1)) if abs(t0.z) < .9 else Vector((1, 0, 0))
    nrm = t0.cross(up).normalized(); prev = t0
    for i, p in enumerate(pts):
        t = t0 if i == 0 else (pts[i] - pts[i - 1]).normalized() if i == n - 1 else (pts[i + 1] - pts[i - 1]).normalized()
        nrm = prev.rotation_difference(t) @ nrm; nrm = (nrm - t * nrm.dot(t)).normalized(); prev = t
        b = t.cross(nrm)
        rings.append([bm.verts.new(p + (nrm * math.cos(2 * math.pi * k / segs) + b * math.sin(2 * math.pi * k / segs)) * max(rad[i], 1e-4)) for k in range(segs)])
    for i in range(n - 1):
        for k in range(segs):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % segs], rings[i + 1][(k + 1) % segs], rings[i + 1][k]))
    if cap:
        bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=3e-4)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    return link(me, name, mat)

def slab(poly, thick, mat, name="slab"):
    bm = bmesh.new()
    vs = [bm.verts.new((x, y, 0)) for x, y in poly]
    f = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, verts=[e for e in r["geom"] if isinstance(e, bmesh.types.BMVert)], vec=(0, 0, thick))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    return link(me, name, mat)

def sheet(fn, nu, nv, mat, name="sheet"):
    bm = bmesh.new()
    g = [[bm.verts.new(fn(i / nu, j / nv)) for j in range(nv + 1)] for i in range(nu + 1)]
    for i in range(nu):
        for j in range(nv):
            bm.faces.new((g[i][j], g[i + 1][j], g[i + 1][j + 1], g[i][j + 1]))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    return link(me, name, mat)

def chain(pts, mat, link_len=.07, r=.022, wire=.007):
    """iron links along a polyline, alternating 90 degrees"""
    pts = [Vector(p) for p in pts]; out = []; k = 0
    for a, b in zip(pts, pts[1:]):
        d = b - a; L = d.length; d.normalize(); s = 0
        while s < L:
            p = a + d * s
            o = prim("torus", mat, major_radius=r, minor_radius=wire, major_segments=8, minor_segments=4)
            q = Vector((0, 1, 0)).rotation_difference(d) @ Quaternion((0, 1, 0), math.pi / 2 * (k % 2))
            xform(o, Matrix.Translation(p) @ q.to_matrix().to_4x4() @ Matrix.Diagonal((1, 1.7, 1, 1)))
            out.append(o); s += link_len; k += 1
    return out

def candle(M, base, h, r=.03, lit=True, seed=0):
    rr = random.Random(seed)
    o = prim("cyl", M["wax"], loc=(base[0], base[1], base[2] + h / 2), vertices=10, radius=r, depth=h)
    jitter(o, r * .25, 30, seed)
    for i in range(2):  # drips down the side
        a = rr.uniform(0, 6.28); top = Vector((base[0] + math.cos(a) * r, base[1] + math.sin(a) * r, base[2] + h))
        L = rr.uniform(.3, .8) * h
        tube([top, top + Vector((0, 0, -L * .5)), top + Vector((0, 0, -L))], [r * .35, r * .3, r * .2], 5, M["wax"])
    if lit:
        prim("cyl", M["soot"], loc=(base[0], base[1], base[2] + h + .01), vertices=4, radius=.003, depth=.02)
        f = prim("sph", M["glow"], loc=(base[0], base[1], base[2] + h + .035), segments=6, ring_count=4, radius=1)
        xform(f, Matrix.Translation((base[0], base[1], base[2] + h + .035)) @ Matrix.Diagonal((.012, .012, .03, 1)) @ Matrix.Translation((-base[0], -base[1], -(base[2] + h + .035))))
    return o

def finish(name, tile=.6):
    objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.active_object; o.name = name; me = o.data
    zmin = min(v.co.z for v in me.vertices)
    me.transform(Matrix.Translation((0, 0, -zmin)))
    uv = me.uv_layers.new(name="UVMap")
    for p in me.polygons:
        n = p.normal; ax = max(range(3), key=lambda i: abs(n[i]))
        for li in p.loop_indices:
            c = me.vertices[me.loops[li].vertex_index].co
            u, v = ((c.y, c.z), (c.x, c.z), (c.x, c.y))[ax]
            uv.data[li].uv = (u / tile, v / tile)
    try:
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
    except Exception:
        for p in me.polygons: p.use_smooth = True
    bpy.ops.export_scene.gltf(filepath=f"{OUT}/{name}.glb", export_format="GLB", use_selection=True, export_apply=True)
    dg = bpy.context.evaluated_depsgraph_get()
    print("TRIS", name, len(o.evaluated_get(dg).data.loop_triangles), "SLOTS", [m.name for m in me.materials])
    return o

def proof(name, center, dist, lights):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = 24
    sc.render.resolution_x = sc.render.resolution_y = 640
    w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (.03, .04, .07, 1)
    bpy.ops.mesh.primitive_plane_add(size=10); g = bpy.context.active_object
    gm = make_mat("ground", "stone", 99); g.data.materials.append(gm)
    bpy.ops.object.light_add(type="SUN", rotation=(math.radians(50), 0, math.radians(30)))
    s = bpy.context.active_object.data; s.energy = 1.6; s.color = (.6, .7, 1.0)
    for p in lights:
        bpy.ops.object.light_add(type="POINT", location=p); l = bpy.context.active_object.data
        l.energy = 60; l.color = (1, .6, .3)
    c = Vector(center); files = []
    for tag, yaw, pitch in (("iso", 45, 52), ("side", -35, 18)):
        d = Vector((math.cos(math.radians(pitch)) * math.sin(math.radians(yaw)), -math.cos(math.radians(pitch)) * math.cos(math.radians(yaw)), math.sin(math.radians(pitch))))
        bpy.ops.object.camera_add(location=c + d * dist); cam = bpy.context.active_object
        cam.rotation_mode = "QUATERNION"; cam.rotation_quaternion = (-d).to_track_quat("-Z", "Y")
        cam.data.lens = 50; sc.camera = cam
        sc.render.filepath = f"/tmp/roadkit/{name}_{tag}.png"; files.append(sc.render.filepath)
        bpy.ops.render.render(write_still=True)
    return files
