# HERO — Physics Playground Architecture

The hero section is a 2.5D physics playground built with React Three Fiber + @react-three/rapier.
Players move an astronaut character, pick up labelled cubes (Work, Contact, Reviews), and throw
them into a basketball hoop to navigate the portfolio.

---

## File Map

| File | Role |
|------|------|
| `GameScene.tsx` | Canvas wrapper, DOM overlays, all game logic in `GameWorld` |
| `Character.tsx` | Physics body + animated model, exposes `CharacterHandle` |
| `PageCube.tsx` | Individual navigation cube with physics + glow |
| `Basket.tsx` | Hoop with sensor, confetti, score callback |
| `AimLine.tsx` | Trajectory-prediction dots (Euler integration) |
| `constants.ts` | Single source of truth for all shared physics constants |

---

## Coordinate System

The entire game lives inside `<group position={[0, -4, 0]}>` inside the R3F scene.
`rb.translation()` from Rapier returns **world coordinates**.
All positions you set on `<RigidBody>` and `<Collider>` are **group-local**.

```
World Y = Group-local Y − 4
Group-local Y = World Y + 4
```

| Object | Group-local Y | World Y |
|--------|---------------|---------|
| Ground collider centre | −2.5 | −6.5 |
| Ground top | −2.0 | −6.0 |
| Character spawn | 0 | −4.0 |
| Basket | 4 | 0.0 |
| Ceiling | 28 | 24.0 |

Camera sits at world `[0, −3, 28]`, fov=40. It is **outside** the group.

---

## Character Physics — Auto-Calibration

### MODEL_Y_OFFSET formula

The visual model group is synced to the physics body every frame:
```ts
model.position.set(pos.x, pos.y + modelYOffset, pos.z)
```

`pos` is the RigidBody translation in **world space**.
`model.position` is in **world space** (model group is parented to the R3F scene root, not the game group).

For the model's feet to sit at `rb.world.y`:
```
model.world.y + bbox.min.y = rb.world.y
(rb.world.y + modelYOffset) + bbox.min.y = rb.world.y
modelYOffset = −bbox.min.y

But rb is inside <group y=−4>, so rb.world.y = rb.group.y − 4.
The model is NOT inside the group, so no group offset applies to it.
Net formula: modelYOffset = GROUP_Y_OFFSET − bbox.min.y   (GROUP_Y_OFFSET = 4.0)
```

**Examples:**
- Origin at feet: `bbox.min.y = 0` → `modelYOffset = 4.0` (same as old hardcoded value)
- Origin at centre of 3-unit model: `bbox.min.y = −1.5` → `modelYOffset = 5.5`
- Origin 0.3 below feet: `bbox.min.y = −0.3` → `modelYOffset = 4.3`

This is computed automatically in `Character.tsx` via `THREE.Box3.setFromObject(clone)` inside
`useMemo`. No manual tuning needed after a model swap.

### Hold height formula

When a cube is held above the character, its Y position (world) is:

```ts
holdY = charPos.y + char.getModelHeight() + LARGEST_CUBE_HALF + HOLD_MARGIN
```

- `charPos.y` — RigidBody world Y
- `char.getModelHeight()` — `bbox.max.y − bbox.min.y` (auto-calibrated)
- `LARGEST_CUBE_HALF` — `Math.max(...PAGE_CUBES.map(c => c.size)) / 2` (derived from data, currently 1.0)
- `HOLD_MARGIN = 0.5` — gap between cube bottom and model head top (tune in `constants.ts`)

Guarantees:
1. Cube bottom always clears model head regardless of model height
2. Cube always clears CapsuleCollider top (capsule top ≤ modelHeight, and cube bottom = modelHeight + HOLD_MARGIN)

### AimLine origin invariant

```ts
aimState.originY = holdY + 4;  // world → group-local
```

The `+4` is the exact inverse of `<group y=−4>`. AimLine lives inside the group and expects
group-local coordinates. **Do not change this `+4`.** When `holdY` changes (because the model
changed), `originY` auto-adjusts without touching AimLine.

Same conversion applies to the mouse raycaster:
```ts
const mouseLocalY = _aimWorldPos.y + 4;
```

---

## CapsuleCollider

```tsx
<CapsuleCollider args={[0.4, 0.35]} position={[0, 0.75, 0]} />
```

- `halfHeight = 0.4` → cylinder segment is 0.8 units tall
- `radius = 0.35` → hemisphere caps
- Total height: `2 × 0.4 + 2 × 0.35 = 1.5 units`
- Bottom: `rb.y + 0.0` | Top: `rb.y + 1.5`

This does **NOT** auto-calibrate. It is intentionally narrower than the model silhouette to prevent
corner-snagging on cube edges. Adjust only if the character visually clips through the ground or
floats above it. When adjusting:
- Keep `position.y = halfHeight + radius` to keep the bottom at `rb.y + 0.0`
- Make it narrower rather than wider

---

## Swapping the 3D Character Model

1. **Replace the GLB** at `/public/3d_models/astronaut/character.glb`
   (or update `MODEL_PATH` in `Character.tsx`)

2. **Read the dev console** — in development mode, Character logs on mount:
   ```
   [Character] Model calibration
     modelHeight  : 3.420
     modelYOffset : 4.000
     Head clears capsule by: 1.920 units
   ```
   `modelYOffset` and hold height adapt automatically.

3. **Check animation names** — update `ANIM_NAMES` in `Character.tsx` if the new model uses
   different track names. Missing animations fail silently (no crash).

4. **Tune `HOLD_MARGIN`** in `constants.ts` if the cube looks too high or too close to the head.
   Default is `0.5` units.

5. **Inspect colliders** — in dev mode, `<Physics debug>` shows wireframes. Verify the capsule
   wireframe is inside the model torso (not floating above or clipping through the ground).

6. **Hide accessories** — add new mesh names to the `traverse` block in `Character.tsx`:
   ```ts
   if (child.name === "Pistol") child.visible = false;  // existing
   if (child.name === "NewProp") child.visible = false;  // add as needed
   ```

7. **No changes needed to**: `Basket.tsx`, `AimLine.tsx`, `PageCube.tsx`, `constants.ts`

---

## Invariants — Must Always Hold

| Invariant | Location | Why |
|-----------|----------|-----|
| `aimState.originY = holdY + 4` | `GameScene.tsx` | Converts world → group-local for AimLine |
| `mouseLocalY = _aimWorldPos.y + 4` | `GameScene.tsx` | Same world→group-local for mouse |
| `GROUP_Y_OFFSET = 4.0` | `Character.tsx` | Must equal `abs(<group y>)` = 4 |
| `WRAP_X` same value in Character + PageCube | `constants.ts` | Both import from constants — no drift |
| `Physics timeStep = PHYSICS_DT = 1/60` | GameScene + constants | AimLine Euler integration assumes this dt |
| `Physics gravity = [0, -GRAVITY, 0]` | GameScene + constants | AimLine trajectory assumes this gravity |
| `RigidBody linearDamping = CUBE_LINEAR_DAMPING` | PageCube + constants | AimLine damping factor assumes this |

---

## Physics Constants Reference

All constants live in `constants.ts`.

| Constant | Value | What breaks if changed |
|----------|-------|----------------------|
| `GRAVITY` | 20 | AimLine trajectory diverges from actual path |
| `PHYSICS_DT` | 1/60 | AimLine dots drift from actual path |
| `CUBE_LINEAR_DAMPING` | 0.05 | AimLine dots drift; also changes throw distance |
| `CUBE_ANGULAR_DAMPING` | 1.0 | Visual spin changes; trajectory unaffected |
| `MIN_FORCE` / `MAX_FORCE` | 5 / 25 | Power bar calibration changes |
| `MIN_AIM_DIST` / `MAX_AIM_DIST` | 2 / 15 | Near/far shot feel changes |
| `HOLD_MARGIN` | 0.5 | Cube clips head (lower) or floats too high (higher) |
| `WRAP_X` | 18.5 | Character and cubes wrap at different points → visual inconsistency |

**GRAVITY, PHYSICS_DT, and CUBE_LINEAR_DAMPING are tightly coupled to AimLine.**
If you change any of these, update the Euler integration in `AimLine.tsx` to match.

---

## PageCube Sizes

```ts
{ id: "projects",     size: 2.0 }  // Work — largest
{ id: "contact",      size: 1.6 }  // Contact
{ id: "testimonials", size: 1.3 }  // Reviews — smallest
```

`LARGEST_CUBE_HALF` in `GameScene.tsx` is derived automatically:
```ts
const LARGEST_CUBE_HALF = Math.max(...PAGE_CUBES.map((c) => c.size)) / 2;
```

Adding a cube larger than 2.0 automatically increases hold height clearance. No manual update needed.

---

## Dev Tools

In `process.env.NODE_ENV === 'development'`:

- **Physics wireframes** — enabled via `<Physics debug>` in `GameScene.tsx`. Shows all Rapier
  colliders (capsule, cubes, basket rim/backboard, walls, ground) as coloured wireframes.
  Invaluable for verifying collider alignment after a model swap.

- **Calibration log** — `[Character] Model calibration` printed once on mount in browser console.
  Shows `modelHeight`, `modelYOffset`, and capsule clearance.

Both are dead-code-eliminated by Next.js in production builds (`process.env.NODE_ENV` is replaced
with `"production"` at build time).

---

## Known Limitations

- **No side walls** — character and cubes wrap at `±WRAP_X`. Both read from `constants.ts`.
- **Module state persists across hot-reload** — `thrownCubeIds`, `gatedCubeIds`, `uiState` are
  module-level. On strange behaviour in dev, hard-refresh (Cmd+Shift+R).
- **Bounding box at rest pose** — `Box3.setFromObject` measures the model in its default bind pose,
  not during animations. For characters with extreme idle animations, `HOLD_MARGIN` covers this.
- **`dpr={[1, 2]}`** — adaptive DPR. Cap at 1.5 (`dpr={[1, 1.5]}`) if GPU is struggling on
  high-DPI displays.
- **frameloop="always"** — the game canvas renders every frame while visible. It pauses when the
  hero section scrolls out of view via the IntersectionObserver in `page.tsx`.
