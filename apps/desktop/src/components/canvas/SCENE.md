# GameScene — Architecture Reference

Physics playground used as the hero/home experience. Players move a character, pick up labelled cubes (Work, Reviews, Contact), and throw them into a basket to navigate.

---

## Component tree

```
GameScene (Canvas wrapper + DOM overlays)
└── GameWorld (R3F scene root — "use client")
    ├── Lighting (ambientLight, directionalLight, Environment)
    ├── fog + Starfield
    └── <group position={[0, -4, 0]}>      ← game group — all world coords are relative to this
        ├── AimLine                          ← visual only, outside Physics
        └── Physics (Rapier, gravity -GRAVITY, timeStep 1/60)
            ├── CuboidCollider (ground at y=-2.5)
            ├── CuboidCollider (ceiling at y=28)
            ├── CuboidCollider (front wall z=-3, back wall z=3)
            ├── Character (ref=characterRef, starts at x=-11)
            ├── PageCube × 3
            └── Basket (at x=12, y=4)
```

DOM overlays (outside Canvas, positioned absolute):
- `PowerBarOverlay` — charge bar, reads `uiState.power` via RAF loop
- `TutorialOverlay` — step-by-step hints, polls `uiState.holding` / `uiState.justThrew`
- `ScoreHint` — static "Score to scroll" label

---

## Module-level mutable state — DO NOT convert to React state

```ts
const uiState = { power: 0, charging: false, holding: false, justThrew: false };
export const thrownCubeIds = new Set<string>();
// gatedCubeIds — exported from Basket.tsx
```

These objects are mutated directly in `useFrame` and read by DOM overlay RAF loops **without React re-renders**. Converting them to `useState` would cause constant re-renders at 60fps and break the overlay animation loops.

`thrownCubeIds` — cubes the player has actively thrown. Basket only counts a cube as scored if its id is in this set. Prevents accidental scores from cubes that fall in naturally without being thrown.

`gatedCubeIds` — managed by Basket. Cubes that have already scored (prevents double-scoring on bounce).

`resetGameState()` is called on mount and unmount to clear stale data across navigations (Next.js App Router keeps module state alive between route changes).

---

## Coordinate system

The entire game lives inside `<group position={[0, -4, 0]}>`. All in-world positions are **local to this group**:

| Reference | World Y | Group-local Y |
|-----------|---------|---------------|
| Ground collider | -6.5 | -2.5 |
| Character start | -4 | 0 |
| Basket | 0 | 4 |
| Ceiling | 24 | 28 |

Camera is at `[0, -3, 28]` fov=40 in **world space** (outside the group). When converting mouse position to world coords via raycaster (`_aimPlane` at z=0 world), subtract 4 from the Y to get group-local Y:

```ts
const mouseLocalY = _aimWorldPos.y + 4; // +4 because group is at y=-4
```

---

## Aim & throw flow

1. Player picks up a cube with `E` → `heldCubeRef.current` is set, cube is teleported to hold position every frame.
2. Left-click (`mouseDown.current = true`) starts aiming (`isAiming = true`).
3. Every frame: raycaster intersects `_aimPlane` (z=0) → computes aim direction and power from distance.
4. Left-click release with `isAiming` active → applies `setLinvel` + `setAngvel` on the Rapier rigid body, adds cube id to `thrownCubeIds`.
5. Basket sensor detects collision → calls `onScore` → `onNavigate` fires after 800ms delay.

**Reusable vectors** — `_aimWorldPos`, `_aimDir`, `_raycaster`, `_aimPlane` are module-level to avoid allocations inside `useFrame`. Never reassign them — mutate in-place.

---

## PageCube data

```ts
const PAGE_CUBES: PageCubeData[] = [
  { id: "projects",     label: "Work",    href: "#projects",     color: "#ffdd00", size: 2.0 },
  { id: "contact",      label: "Contact", href: "#contact",      color: "#ff6600", size: 1.6 },
  { id: "testimonials", label: "Reviews", href: "#reviews",      color: "#ec4899", size: 1.3 },
];
```

Spawn positions are randomised at module load time (`generateSpawnPositions`) — tight cluster around `x=-2` with a small spread so cubes collide and pile up. Changing `CUBE_POSITIONS` without changing `PAGE_CUBES` length will cause an index mismatch.

---

## PowerBarOverlay — RAF pattern

The charge bar does **not** use React state. It reads `uiState` directly from a `requestAnimationFrame` loop and mutates DOM style directly. This is intentional — any React state here would cause 60fps re-renders during charging.

Do not add props or React state to `PowerBarOverlay`. If you need to change what it shows, mutate `uiState` from `useFrame`.

---

## TutorialOverlay — polling pattern

Uses React state for step progression (acceptable — low frequency updates). Polls `uiState.holding` and `uiState.justThrew` via `setInterval(100ms)` — not via `useFrame` because it's a DOM component outside the Canvas.

`uiState.justThrew` must be reset to `false` after reading it (see the `throw` trigger handler) or the tutorial will re-advance on every poll.

---

## Adding a new navigation cube

1. Add an entry to `PAGE_CUBES` in `src/data/game-cubes.ts`.
2. `generateSpawnPositions` auto-generates a spawn position — the cube count drives the array length.
3. No changes needed to `Basket` or scoring logic.
4. If the cube should navigate to a new route (not a hash anchor), change `href` and update `GameLayout.tsx` which handles `onNavigate`.

---

## Known limitations / gotchas

- **No side walls** — character wraps around (handled in `Character.tsx`).
- **Physics is paused** when `paused={true}` is passed — used during page-transition animations.
- **Module state persists** across hot-reload in dev — if cubes behave strangely, hard-refresh.
- `frameloop` is default ("always") — unlike the carousel, this scene renders every frame because physics requires continuous updates.
- `dpr={[1, 2]}` — adaptive DPR. On very high-DPI screens this can cause performance issues; cap at 1.5 if needed.

---

## Skills to consult when modifying

| Change | Skill |
|--------|-------|
| Physics behaviour, colliders, joints | `threejs-fundamentals`, `threejs-animation` |
| Raycasting, pointer interaction | `threejs-interaction` |
| R3F performance, useFrame patterns | `three-best-practices` |
| Character movement, animations | `threejs-animation` |
| Adding new visual effects or geometry | `threejs-fundamentals` |
| Shader / material changes | `threejs-shaders`, `threejs-textures` |
| GSAP page-transition integration | `gsap-react`, `gsap-scrolltrigger` |
