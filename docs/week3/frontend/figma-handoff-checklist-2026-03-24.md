# F-FIGMA-1300 Handoff Checklist - 2026-03-24

Use this checklist when recreating the main page in Figma or preparing the file for handoff.

## 1. Source Of Truth
- [ ] Confirm the concept doc is [F-FIGMA-1300 Main Page Handoff Concept - 2026-03-24](./figma-main-page-concept-2026-03-24.md).
- [ ] Confirm the JSON spec is [main-page-figma-spec.json](./main-page-figma-spec.json).
- [ ] Confirm the preview HTML is [main-page-figma-preview.html](./main-page-figma-preview.html).
- [ ] Confirm the wireframe SVG is [main-page-wireframe-preview.svg](./main-page-wireframe-preview.svg).
- [ ] Keep the checklist aligned with the component inventory and section hierarchy in the JSON spec.

## 2. Layer Naming
- [ ] Top-level frames use `Main Page / Desktop` and `Main Page / Mobile`.
- [ ] Section groups use functional names such as `Global Header`, `Hero / Receipt Story`, `Trust Metrics Strip`, `Proof Flow`, `Capability Cards`, `Operations Snapshot`, `Wireframe QA`, and `Footer CTA`.
- [ ] Reusable component instances keep the component name and variant visible in the layer tree.
- [ ] Text layers use short visible labels, while longer supporting copy lives in sibling body text layers.
- [ ] Decorative background layers are clearly separated from content layers and do not receive semantic names that could confuse handoff.

## 3. Component Variants
- [ ] `TopNav` includes `desktop` and `mobile` variants.
- [ ] `PrimaryButton` includes `solid` and `ghost` variants.
- [ ] `MetricCard` includes `default`, `success`, and `warning` variants.
- [ ] `PipelineStep` includes `default` and `active` variants.
- [ ] `FeatureCard` includes `default` and `spotlight` variants.
- [ ] `ProofPanel` includes `desktop` and `mobileStack` variants.
- [ ] `WireframeFrame` includes `desktop` and `mobile` variants.
- [ ] `FooterCTA` includes `desktop` and `mobile` variants.
- [ ] Every variant exposes the same core structure so text swaps and state toggles do not break layout.

## 4. Auto-Layout Rules
- [ ] Use auto-layout for all content groups that contain text, buttons, cards, or chips.
- [ ] Keep an 8 px spacing system throughout the page.
- [ ] Align section headers to the same left edge on desktop and mobile.
- [ ] Use horizontal layout for desktop content groups that need side-by-side reading.
- [ ] Stack the hero, proof panel, and supporting cards vertically on mobile.
- [ ] Avoid absolute positioning except for decorative glows, background grids, and other non-content layers.
- [ ] Make card widths responsive with `fill container` or equivalent constraints.
- [ ] Use consistent internal padding values so cards feel like one system.

## 5. Export Rules
- [ ] Export the wireframe SVG as a lightweight review artifact.
- [ ] Export only the frames and assets that are needed for downstream implementation.
- [ ] Keep text editable in Figma; do not flatten live labels or body copy into outlines.
- [ ] Export icons and simple marks as SVG when vector fidelity matters.
- [ ] Export screenshots or PNGs only for handoff previews, not as the source of truth.
- [ ] Ensure exports use the same naming convention as the Figma layers so reviewers can map files back to the frame tree quickly.

## 6. Handoff QA
- [ ] Confirm the desktop frame reads as `Global Header -> Hero / Receipt Story -> Trust Metrics Strip -> Proof Flow -> Capability Cards -> Operations -> Footer CTA`.
- [ ] Confirm the mobile frame preserves the same order in a stacked layout.
- [ ] Confirm the proof panel and receipt status remain visually elevated above the supporting content.
- [ ] Confirm the main action button stays visually dominant in both desktop and mobile versions.
- [ ] Confirm reduced-motion behavior is noted in the design handoff.
- [ ] Confirm the JSON spec still parses cleanly after edits.
