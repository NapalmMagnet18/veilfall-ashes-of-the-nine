# Ashen Abbey bench: extends art/roadkit/common.py with ashlar/char/bronze textures, booleans, metaball wax,
# alpha soot decals, per-material UV tiling and a real-floor proof (the model's foundation runs 3 m under the floor).
import sys; sys.path.insert(0, "art/roadkit")
from common import *
from common import reset, hexc, fnoise, lerp3, prim, xform, jitter, tube, link, bake

OUT = "/workspace/abbey"; os.makedirs(OUT, exist_ok=True)
FOUND = 3.0  # foundation depth below the walk floor

def _img(name, arr, data=False):
    n = arr.shape[0]; img = bpy.data.images.new(name, n, n)
    if data: img.colorspace_settings.name = "Non-Color"
    px = np.ones((n, n, 4), np.float32); px[..., :arr.shape[2]] = arr
    img.pixels.foreach_set(px.ravel()); img.pack(); return img

def _wire(name, col, h, rough, metal, ns, alpha=None, emit=None, emit_s=0):
    m = bpy.data.materials.new(name); m.use_nodes = True; m.use_backface_culling = False
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    if alpha is not None:
        rgba = np.concatenate([col, alpha[..., None]], -1); t = nt.nodes.new("ShaderNodeTexImage"); t.image = _img(name + "_albedo", rgba)
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"]); nt.links.new(t.outputs["Alpha"], b.inputs["Alpha"])
        try: m.surface_render_method = "BLENDED"
        except Exception: m.blend_method = "BLEND"
    else:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = _img(name + "_albedo", col)
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    gx = np.roll(h, -1, 1) - np.roll(h, 1, 1); gy = np.roll(h, -1, 0) - np.roll(h, 1, 0)
    nv = np.stack([-gx * ns, -gy * ns, np.ones_like(h)], -1); nv /= np.linalg.norm(nv, axis=-1, keepdims=True)
    t2 = nt.nodes.new("ShaderNodeTexImage"); t2.image = _img(name + "_normal", nv * .5 + .5, True)
    nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = 1.0
    nt.links.new(t2.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    if isinstance(rough, np.ndarray):
        t3 = nt.nodes.new("ShaderNodeTexImage"); t3.image = _img(name + "_rough", np.repeat(rough[..., None], 3, -1), True)
        sep = nt.nodes.new("ShaderNodeSeparateColor"); nt.links.new(t3.outputs["Color"], sep.inputs[0])
        nt.links.new(sep.outputs[1], b.inputs["Roughness"])  # glTF reads roughness from G
    else: b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit is not None:
        b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = emit_s
    return m

def ashlar(n=1024, seed=1, courses=4, dark="#1a1c24", light="#5a5b63"):
    rng = np.random.default_rng(seed); ch = n // courses
    h = np.zeros((n, n), np.float32); tone = np.zeros((n, n), np.float32)
    cols = np.arange(n)
    for c in range(courses):
        js = np.sort(rng.integers(0, n, rng.integers(2, 4)))  # joints, wrap-around
        d = np.min(np.abs(((cols[:, None] - js[None, :]) + n // 2) % n - n // 2), 1).astype(np.float32)
        rows = np.arange(ch); dy = np.minimum(rows, ch - 1 - rows).astype(np.float32)
        e = np.minimum(d[None, :], dy[:, None])
        seg = np.searchsorted(js, cols) % len(js)
        bt = rng.uniform(-.18, .18, len(js))[seg]
        h[c * ch:(c + 1) * ch] = np.clip(e / 14, 0, 1) ** .6
        tone[c * ch:(c + 1) * ch] = bt[None, :]
    g1 = fnoise(n, 1.8, seed + 2); g2 = fnoise(n, 1.0, seed + 3); chip = fnoise(n, 1.4, seed + 4)
    h = h * (1 - .5 * (chip > .72)) ; hh = h * .6 + g1 * .3 + g2 * .1
    base = .45 + tone + (g1 - .5) * .5 + (g2 - .5) * .2
    col = lerp3(hexc(dark), hexc(light), base * (.35 + .65 * np.clip(h * 1.5, 0, 1)))
    moss = np.clip((fnoise(n, 2.2, seed + 5) - .7) * 4, 0, 1) * (1 - h * .5)
    col = lerp3(col, hexc("#252b22"), moss * .5)
    wet = fnoise(n, 1.3, seed + 6, aniso=8)  # vertical rain streaks: darker and glossier
    col = col * (1 - .25 * np.clip((wet - .55) * 3, 0, 1))[..., None]
    rough = np.clip(.78 - .45 * np.clip((wet - .45) * 2.5, 0, 1) + (1 - h) * .15, .25, 1)
    return col.astype(np.float32), hh.astype(np.float32), rough.astype(np.float32)

def char_tex(n=512, seed=7):
    a = fnoise(n, 1.3, seed, aniso=10); c1 = np.abs(fnoise(n, 1.5, seed + 1) - .5) < .02; c2 = np.abs(fnoise(n, 1.7, seed + 2) - .5) < .015
    cr = (c1 | c2).astype(np.float32); h = .7 * a + .3 * fnoise(n, 2, seed + 3) - cr * .6
    col = lerp3(hexc("#090808"), hexc("#2b221c"), h * .8) ; col = lerp3(col, hexc("#3a1a0e"), cr * .5)
    return col, h

def bronze_tex(n=512, seed=9):
    a = fnoise(n, 1.8, seed); b = fnoise(n, 1.1, seed + 1); v = np.clip((fnoise(n, 2.0, seed + 2) - .45) * 3, 0, 1)
    col = lerp3(hexc("#5a4224"), hexc("#c49c63"), .6 * a + .4 * b); col = lerp3(col, hexc("#3f7a68"), v * .85)
    rough = np.clip(.35 + v * .5, 0, 1); return col, .6 * a + .4 * b, rough, v

def soot_alpha(n=512, seed=21):
    u = np.linspace(0, 1, n)[None, :]; v = np.linspace(0, 1, n)[:, None]  # v up (Blender image rows go bottom→top)
    s = fnoise(n, 1.2, seed, aniso=14); w = .5 - .38 * v  # plume narrows upward
    side = np.clip(1 - np.abs(u - .5 + (s - .5) * .25) / w, 0, 1) ** 1.3
    a = side * np.clip(1 - v, 0, 1) ** 1.1 * (.55 + .7 * s) * np.clip(v * 12, 0, 1)
    col = lerp3(hexc("#060506"), hexc("#17130f"), s * .6)
    return col, np.clip(a, 0, .95).astype(np.float32)

def materials(extra_seed=0):
    M = {}
    c, h, r = ashlar(1024, 3 + extra_seed); M["stone"] = _wire("stone", c, h, r, 0, 5)
    c, h, r = ashlar(512, 8 + extra_seed, 4, "#0c0c10", "#26252a"); M["sooted"] = _wire("sooted", c, h, r, 0, 4)
    c, h = char_tex(); M["char"] = _wire("char", c, h, .92, 0, 4)
    from common import tex
    for k, kind, rr, mt in (("iron", "iron", .55, .7), ("slate", "stone", .5, 0), ("ivy", "wood", .9, 0)):
        c, h = tex(kind, 31 + len(M), 512); 
        if k == "slate": c = c * .55
        if k == "ivy": c = lerp3(c, hexc("#2a2622"), .5)
        M[k] = _wire(k, c, h, rr, mt, 3)
    a = fnoise(512, 1.6, 41); b = fnoise(512, 1.0, 42)
    M["wax"] = _wire("wax", lerp3(hexc("#a8977a"), hexc("#e7d9b8"), .55 * a + .45 * b), .5 * a + .5 * b, .38, 0, 1.2)
    M["waxamber"] = _wire("waxamber", lerp3(hexc("#7a4a1c"), hexc("#d9a860"), .6 * a + .4 * fnoise(512, 2, 43)), a, .32, 0, 1.2)
    c, h, r, v = bronze_tex(); M["bronze"] = _wire("bronze", c, h, r, .65, 2)
    z = np.zeros((16, 16, 3), np.float32); hz = np.zeros((16, 16), np.float32)
    M["glow"] = _wire("glow", z + hexc("#ffb060"), hz, .5, 0, 0, emit=(1.0, .55, .18), emit_s=12)
    M["teal"] = _wire("teal", z + hexc("#6db8c0"), hz, .1, 0, 0, emit=(.43, .72, .75), emit_s=5)
    c, a = soot_alpha(); M["sootdecal"] = _wire("sootdecal", c, np.zeros(a.shape, np.float32), .95, 0, 0, alpha=a)
    return M

TILE = {"stone": 2.4, "sooted": 2.4, "slate": 1.5, "char": 1.2, "iron": .8, "ivy": .6, "wax": 1.0, "waxamber": 1.0, "bronze": 1.2}
KEEP_UV = {"sootdecal"}

# ---------- geometry ----------
def prism_xz(poly, y0, y1, mat, name="prism"):
    """a front-elevation polygon (x, z) pushed through depth y0..y1"""
    bm = bmesh.new(); vs = [bm.verts.new((x, y0, z)) for x, z in poly]; f = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, verts=[e for e in r["geom"] if isinstance(e, bmesh.types.BMVert)], vec=(0, y1 - y0, 0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); return link(me, name, mat)

def prism_yz(poly, x0, x1, mat, name="prism"):
    """a side profile (y, z) pushed across x0..x1"""
    bm = bmesh.new(); vs = [bm.verts.new((x0, y, z)) for y, z in poly]; f = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, verts=[e for e in r["geom"] if isinstance(e, bmesh.types.BMVert)], vec=(x1 - x0, 0, 0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); return link(me, name, mat)

def arch_curve(w, hs, k=1.0, n=12):
    """pointed two-centred arch from right springing (w, hs) over the apex to (-w, hs)"""
    r = 2 * w * k; cx = w - r; top = math.acos((0 - cx) / r)
    right = [(cx + r * math.cos(t), hs + r * math.sin(t)) for t in np.linspace(0, top, n)]
    left = [(-x, z) for x, z in reversed(right[:-1])]
    return right + left

def arch_poly(w, z0, hs, k=1.0, n=12):
    return [(-w, z0), (w, z0)] + arch_curve(w, hs, k, n) + []

def apex(w, hs, k=1.0):
    r = 2 * w * k; return hs + math.sqrt(r * r - (r - w) ** 2)

def boolean(target, cutters, transfer=False):
    for i, c in enumerate(cutters):
        m = target.modifiers.new(f"b{i}", "BOOLEAN"); m.operation = "DIFFERENCE"; m.object = c
        for s in ("EXACT", "MANIFOLD", "FLOAT"):
            try: m.solver = s; break
            except Exception: pass
        if transfer:
            try: m.material_mode = "TRANSFER"
            except Exception: pass
    bpy.ops.object.select_all(action="DESELECT"); bpy.context.view_layer.objects.active = target; target.select_set(True)
    for m in list(target.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)
    for c in cutters: bpy.data.objects.remove(c, do_unlink=True)
    return target

def join(objs, name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join()
    o = bpy.context.active_object; o.name = name; return o

def metawax(elems, mat, res=.14, ratio=.35, name="wax"):
    """elems: (type, (x,y,z), radius, (sx,sy,sz)) → one frozen-wax mesh"""
    mb = bpy.data.metaballs.new(name); mb.resolution = res; mb.render_resolution = res; mb.threshold = .6
    ob = bpy.data.objects.new(name + "_mb", mb); bpy.context.scene.collection.objects.link(ob)
    for t, co, r, sz in elems:
        e = mb.elements.new(type=t); e.co = co; e.radius = r; e.stiffness = 2.0
        if t == "ELLIPSOID": e.size_x, e.size_y, e.size_z = sz
        if t == "CAPSULE": e.size_x = sz[0]; e.rotation = sz[1] if len(sz) > 1 else (1, 0, 0, 0)
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg)); bpy.data.objects.remove(ob, do_unlink=True)
    o = link(me, name, mat)
    if ratio < 1:
        d = o.modifiers.new("dec", "DECIMATE"); d.ratio = ratio
        bpy.ops.object.select_all(action="DESELECT"); bpy.context.view_layer.objects.active = o; o.select_set(True)
        bpy.ops.object.modifier_apply(modifier="dec")
    return o

def decal(cx, z0, w, h, y, mat, lean=0.0, name="soot"):
    """a soot plume quad standing at depth y, base centre (cx, z0); UVs 0..1 kept through finish"""
    bm = bmesh.new()
    vs = [bm.verts.new((cx - w / 2, y, z0)), bm.verts.new((cx + w / 2, y, z0)), bm.verts.new((cx + w / 2 + lean, y, z0 + h)), bm.verts.new((cx - w / 2 + lean, y, z0 + h))]
    f = bm.faces.new(vs); uvl = bm.loops.layers.uv.new("UVMap")
    for lp, uv in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))): lp[uvl].uv = uv
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); return link(me, name, mat)

def rubble(M, n, box, seed, size=(.2, .6), mat="stone"):
    R = random.Random(seed); out = []
    for i in range(n):
        s = R.uniform(*size); p = (R.uniform(box[0], box[1]), R.uniform(box[2], box[3]), box[4] + s * .3)
        o = prim("ico", M[mat], loc=p, subdivisions=1, radius=s)
        xform(o, Matrix.Translation(p) @ Matrix.Rotation(R.uniform(0, 6), 4, "Z") @ Matrix.Diagonal((1, R.uniform(.6, 1.2), R.uniform(.45, .8), 1)) @ Matrix.Translation(-Vector(p)))
        jitter(o, s * .25, 2.5, seed + i); out.append(o)
    return out

def drip(M, top, length, r, out_dir, seed, mat="wax", wall=None):
    """a frozen wax run from top downward, hugging a wall: wall(z) → offset along out_dir of the face"""
    R = random.Random(seed); pts = []; rads = []; n = max(4, int(length / .35))
    x0 = Vector(top)
    for i in range(n + 1):
        t = i / n; z = x0.z - t * length
        p = Vector((x0.x, x0.y, z)) + Vector((mnoise.noise(Vector((seed, t * 3, 0))) * .15, mnoise.noise(Vector((t * 3, seed, 1))) * .15, 0)) * Vector((abs(out_dir[1]), abs(out_dir[0]), 0))
        if wall: p = wall(p)
        pts.append(p); rads.append(r * (1.25 - .7 * t) * (1 + .3 * math.sin(t * 17 + seed)))
    o = tube(pts, rads, 6, M[mat], True, "drip")
    prim("sph", M[mat], loc=pts[-1] + Vector((0, 0, -r * .2)), segments=6, ring_count=4, radius=r * 1.2)
    return o

def finish(name, post=None):
    objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    for o in objs:
        if "UVMap" not in o.data.uv_layers: o.data.uv_layers.new(name="UVMap")
    o = join(objs, name); me = o.data
    me.transform(Matrix.Translation((0, 0, FOUND)))  # foundation bottom at 0: the walk floor sits FOUND above the origin
    uv = me.uv_layers["UVMap"]
    for p in me.polygons:
        mn = me.materials[p.material_index].name if me.materials else ""
        if mn in KEEP_UV: continue
        tile = TILE.get(mn, 1.0); n = p.normal; ax = max(range(3), key=lambda i: abs(n[i]))
        for li in p.loop_indices:
            c = me.vertices[me.loops[li].vertex_index].co
            u, v = ((c.y, c.z), (c.x, c.z), (c.x, c.y))[ax]
            uv.data[li].uv = (u / tile, v / tile)
    if post: post(me)
    bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
    try: bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
    except Exception:
        for p in me.polygons: p.use_smooth = True
    bpy.ops.export_scene.gltf(filepath=f"{OUT}/{name}.glb", export_format="GLB", use_selection=True, export_apply=True)
    dg = bpy.context.evaluated_depsgraph_get()
    zs = [v.co.z for v in me.vertices]; xs = [v.co.x for v in me.vertices]; ys = [v.co.y for v in me.vertices]
    print("TRIS", name, len(o.evaluated_get(dg).data.loop_triangles), "SLOTS", [m.name for m in me.materials],
          "BOUNDS x", round(min(xs), 2), round(max(xs), 2), "y", round(min(ys), 2), round(max(ys), 2), "z", round(max(zs), 2))
    return o

def proof(name, center, dist, lights, views=(("iso", 45, 50), ("front", 0, 12), ("top", 45, 75))):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = 20
    sc.render.resolution_x = sc.render.resolution_y = 640
    w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (.035, .045, .08, 1)
    bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 0, FOUND)); g = bpy.context.active_object
    gm = bpy.data.materials.new("ground"); gm.use_nodes = True; gm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (.03, .03, .035, 1)
    g.data.materials.append(gm)
    bpy.ops.object.light_add(type="SUN", rotation=(math.radians(55), 0, math.radians(200))); s = bpy.context.active_object.data; s.energy = 1.2; s.color = (.55, .68, 1.0)
    for p in lights:
        bpy.ops.object.light_add(type="POINT", location=(p[0], p[1], p[2] + FOUND)); l = bpy.context.active_object.data; l.energy = p[3] if len(p) > 3 else 800; l.color = (1, .55, .25)
    c = Vector((center[0], center[1], center[2] + FOUND)); files = []
    for tag, yaw, pitch in views:
        d = Vector((math.cos(math.radians(pitch)) * math.sin(math.radians(yaw)), -math.cos(math.radians(pitch)) * math.cos(math.radians(yaw)), math.sin(math.radians(pitch))))
        bpy.ops.object.camera_add(location=c + d * dist); cam = bpy.context.active_object
        cam.rotation_mode = "QUATERNION"; cam.rotation_quaternion = (-d).to_track_quat("-Z", "Y"); cam.data.lens = 40; sc.camera = cam
        sc.render.filepath = f"/tmp/abbey/{name}_{tag}.png"; files.append(sc.render.filepath)
        bpy.ops.render.render(write_still=True)
    return files
