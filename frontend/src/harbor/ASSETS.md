# Tersane harbor assets

All harbor models and texture generators in this folder are original procedural source generated for this repository. They have no external model or texture runtime dependencies and are available under `LICENSE-assets.txt` (MIT). The reference images are composition references only: no logos, watermarks, image pixels, branded lettering or third-party models were copied.

`assets.jsx` builds the tapered blue/red cargo hull, deck, white bridge, railings, window rows, mast, gantry structure, wheeled bogies, hoist, hangars and operations building. Repeated rectangular fittings and cargo are instanced; the hull is shared indexed geometry. `materials.js` deterministically generates concrete grain, corrugated metal and ripple normals in the browser. It uses no random samples. Static metal/concrete/water roughness are different.

The only supplied font data is the locally installed Three.js `helvetiker_regular.typeface.json` (its notice is preserved locally in `LICENSE-font.txt`). Vite packages the font data; the application does not fetch a font from a CDN.

Coordinates and bounds are in `constants/dimensions.js` (`HARBOR_DIMENSIONS`). `layout.test.js` verifies 50 berth hulls are clear of land, piers and one another, UID slot stability, pending area placement, canceled transfers, bounded queues and Ready/Running/Unknown distinctions. It does not claim GPU or frame-rate measurements.

The world-first navigation uses permanent, selectable facilities from `WorldFacilities.jsx`. These are navigation affordances and remain present in an empty cluster; they never enter resource totals. The control tower, order hangar, calendar board, warehouse, configuration board, Secret safe, network station, lighthouse and identity office call `onOpenFacility` with a stable facility id. Gantry cranes call `scheduling`. Real Node radars select the same Node UID.

Every regular, init (including restartable init sidecars) and ephemeral container has its own picking instance and raw `containerName`. `interactions.test.js` covers this mapping and the 5 CSS pixel camera-drag selection threshold. `canvas.__harbor.projectTargets()` returns projected diagnostic anchors; it does not trigger selection. Browser acceptance tests can click those canvas coordinates through the ordinary Three.js raycaster. Container anchors are projected from the actual top face so adjacent boxes do not hide their targets.

Full viewport composition uses an approximately 39-degree elevation. Initial/snapshot state and the real resource store stay separate from visual transitions. Picking any object opens its panel without changing the camera; only explicit `focusRequest` or `focusFacilityRequest` actions move it. Outer gantry jibs now extend to local x=32, covering all deck columns.

The moving-fleet extension keeps these ship/gantry/hangar models unchanged. `Ocean.jsx` and `waterModel.js` add original analytic waves, procedural ripple normals and a bounded wake mesh, using the same asset license. No external bitmap/model/CDN is introduced. `fleet.js` uses exact arc-length rounded paths and swept vessel capsules. Cargo uses controlled world transforms and one UID picking instance; no non-uniform Object3D.attach reparenting is required.

## UI 2.0 reference finish — November 2026

`Kubeview_UI_2.0.png` is the user's visual target, not a background image or a
runtime texture. The new finish is still original procedural source. The cargo
hull uses a curved bow, layered chine, isolated flat deck cap and dark waterline;
its 72 × 16 metre bounds and local +Z bow axis are unchanged. The railings follow
the actual hull contour, and bridge glazing, wing decks, ladders and mooring
fittings use the existing shared instance batches. Container/Pod transforms and
picking identities have not been replaced by decorative loads.

Hangars have recessed service bays, pitched gables, gutter/eave details and
clerestory windows. Cranes retain their real moving trolley/hoist attachment
points; structural braces, access ladders and beam flanges clarify the load path.
Concrete grain and corrugated metal maps are reused for shallow bump detail.
There are still three locally generated surface textures; the additional
cladding material is shared and disposed with the scene palette. No per-frame
geometry construction, texture allocation, external model, logo or CDN was
introduced. These are visual/model changes, not a claim of measured performance
improvement. Browser visual and motion acceptance is recorded separately by the
UI 2.0 integration work.

### 11 Kasım takip düzeltmesi

Gövde/güverte/fittings ve gerçek yük ankrajları1m freeboard artışını ortak sabitten alır; yatay hull72×16 ve su hattı korunur. Köpük, yeni dış asset olmadan mevcut shader'da akış/gözenek ve yakın/uzak coverage ile üretilir; üç şerit144 üçgen, aynı tek draw/material. Su dokusu256² kalır; per-frame doku/geometri üretimi yoktur. Referans PNG renk/ölçek analizi için kullanıldı; ürün texture'ı olarak kopyalanmadı.
