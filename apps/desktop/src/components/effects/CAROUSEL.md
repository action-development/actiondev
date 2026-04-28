# Carousel3D — Architecture Reference

Scroll-driven 3D card carousel. Cards are arranged in a cylindrical layout around the Y axis. Scrolling the page rotates the cylinder and shifts it vertically. Rendered with `frameloop="demand"` — only re-renders when explicitly told to.

---

## Component tree

```
Carousel3D (div wrapper + Canvas)
├── ScrollInvalidator          ← listens to window scroll, calls invalidate()
└── CarouselScene              ← positions group, reads scrollRef each frame
    └── Card3D × N             ← one per project, lazy loads its texture
```

---

## The scrollRef contract — critical

`scrollRef: React.RefObject<ScrollState>` is a **mutable ref** owned by the parent (`Projects` section). It is mutated on every scroll event **without React re-renders**.

```ts
interface ScrollState { rotation: number; y: number; }
```

- `rotation` — degrees, drives `group.rotation.y` (negated: `-degToRad(rotation)`)
- `y` — pixels, drives `group.position.y` directly

**Never replace `scrollRef.current` with a new object.** The carousel reads `.current.rotation` and `.current.rotation` every frame — swapping the reference breaks the connection.

**Never convert `scrollRef` to useState.** The whole point is zero React renders on scroll. Mutations are picked up by the `useFrame` loop directly.

---

## frameloop="demand" + invalidate() pattern

The Canvas is set to `frameloop="demand"` — it renders only when `invalidate()` is called. Without explicit invalidation, the canvas goes idle and saves GPU.

Invalidation is triggered by:
1. `ScrollInvalidator` — rAF-debounced, fires on `window scroll`
2. `CarouselScene.useFrame` — decrements `settleFrames` counter for N frames after scroll stops
3. `Card3D.useFrame` — calls `invalidate()` while image/hover opacity is still animating
4. `Card3D` — calls `invalidate()` after texture is loaded
5. `Card3D` — calls `invalidate()` every frame while a video texture is playing

If the carousel appears frozen, check that `invalidate()` is being called. If it renders every frame unexpectedly, find which path is keeping `settleFrames > 0` or which opacity hasn't converged.

---

## Card layout math

```
ANGLE_STEP = 75°     — degrees between cards
RADIUS     = 450     — cylinder radius (Three.js units)
Y_STEP     = 280     — vertical offset between cards
CAM_Z      = 1100    — camera Z distance

card[i].position = [sin(i * ANGLE_STEP) * RADIUS, -(i * Y_STEP), cos(i * ANGLE_STEP) * RADIUS]
card[i].rotation.y = i * ANGLE_STEP (radians)
```

The **group** rotates/translates in `CarouselScene.useFrame` — individual cards never move. Do not animate individual card positions.

---

## Card face visibility — hysteresis

A card is "facing" the camera when its angle relative to the camera plane is within `FACING_THRESHOLD` degrees. To prevent flicker at the boundary, reveal and hide use separate thresholds:

```ts
FACING_THRESHOLD = acos(RADIUS / CAM_Z) * (180/π)  ≈ 65.8°
REVEAL_THRESHOLD = FACING_THRESHOLD - 8             ≈ 57.8°
HIDE_THRESHOLD   = FACING_THRESHOLD + 8             ≈ 73.8°
```

A card image fades in when `absFacing < REVEAL_THRESHOLD` and fades out when `absFacing > HIDE_THRESHOLD`. Never reduce `HYSTERESIS` below 5 — you will get visible flicker.

Cards behind the cylinder (`abs > HARD_CULL_DEG = 170°`) are hidden entirely (`visible = false`) — no geometry is processed.

---

## Texture lazy loading

Textures are **not loaded on mount**. `loadTexture()` is called the first time a card becomes visible (`!textureLoaded.current`). This prevents loading all project images at page load.

Load path:
1. If `project.video` → create `<video>` element, `THREE.VideoTexture`
2. Else if `createImageBitmap` available → `ImageBitmapLoader` (off-main-thread decode)
3. Fallback → `TextureLoader`

`cancelledRef` prevents applying a texture after the card unmounts. Always check this pattern when adding new async operations inside `Card3D`.

---

## Material disposal

Every `Card3D` instance owns its own materials (created with `useMemo`). They are disposed in a `useEffect` cleanup:

```ts
imageMat.dispose();
darkMat.dispose();
cardBaseMat.dispose();
borderMat.dispose();
overlayMat.map?.dispose();
overlayMat.dispose();
```

**Shared geometry** (`sharedPlaneGeo`, `sharedImgGeo`, `sharedEdgesGeo`, `sharedHitAreaMat`) is module-level and never disposed — it is reused across all cards.

If you add a new material to `Card3D`, add it to the cleanup effect. If you add a new shared geometry/material at module level, it never needs disposal.

---

## Hover interaction

- `onPointerEnter` / `onPointerLeave` on the hit area mesh set `hoveredRef.current`
- Hover overlay fades in/out via `hoverOpacity` lerp in `useFrame`
- Fires `card-bg-preview` custom event on `window` — parent listens to change the section background
- `document.body.style.cursor = "pointer"` is set directly — no React state
- Pointer events are **disabled** during scroll via a `setTimeout` debounce in `Carousel3D` — this prevents accidental hover activations while the user is scrolling

---

## Overlay text texture

Category + title are pre-rendered to a `THREE.CanvasTexture` via `createOverlayTexture()` — no troika/drei `Text` component. This avoids the SDF font loading overhead.

The canvas uses `dpr=1` (not `window.devicePixelRatio`) to keep texture size small. If text looks blurry on retina, change `const dpr = 1` to `window.devicePixelRatio`, but profile the texture memory cost first.

---

## Pointer events debounce

```ts
const POINTER_EVENTS_DEBOUNCE_MS = 150
```

On scroll, the container's `pointerEvents` is set to `"none"` and restored after 150ms of inactivity. This prevents the Three.js raycaster from firing hover events while the user is actively scrolling. Do not remove this — on mobile/trackpad it causes constant card flickering.

---

## Adding a new project card

Only `src/data/projects.ts` needs updating. `Projects.tsx` passes the array to `Carousel3D`, which maps over it. No changes to carousel internals.

The carousel auto-sizes — adding more cards extends the cylinder vertically. The parent `Projects` section controls scroll height based on project count.

---

## Known limitations / gotchas

- **No SSR** — `Carousel3D` must be loaded with `dynamic({ ssr: false })` because it uses `document.createElement` at module level (canvas textures).
- **`dpr={1}` is intentional** — the carousel spans the full viewport. DPR=2 doubles GPU memory for all card textures.
- **`antialias: false`** — also intentional for performance. The slight aliasing is masked by the dark background.
- **Video textures require `needsUpdate = true` every frame** — already handled in `useFrame`. If you add a new video anywhere, follow the same pattern.
- **`flat` prop on Canvas** — disables tone mapping. Required for correct colour reproduction of card images. Do not remove.

---

## Skills to consult when modifying

| Change | Skill |
|--------|-------|
| Geometry, materials, textures | `threejs-fundamentals`, `threejs-textures` |
| Performance, frameloop, disposal | `three-best-practices` |
| Raycasting, pointer events | `threejs-interaction` |
| Shader effects on cards | `threejs-shaders` |
| Scroll-driven animation | `gsap-scrolltrigger` |
| R3F Canvas config, useFrame | `three-best-practices` |
