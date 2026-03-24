# F-FIGMA-1400 Handoff Checklist - 2026-03-24

Use this checklist when recreating the main page in Figma or preparing the file for handoff.

## 1. Source Of Truth
- [ ] Confirm the concept doc is [F-FIGMA-1400 Main Page Handoff Concept - 2026-03-24](./figma-main-page-concept-2026-03-24.md).
- [ ] Confirm the JSON spec is [main-page-figma-spec.json](./main-page-figma-spec.json).
- [ ] Confirm the preview HTML is [main-page-figma-preview.html](./main-page-figma-preview.html).
- [ ] Confirm the wireframe SVG is [main-page-wireframe-preview.svg](./main-page-wireframe-preview.svg).
- [ ] Keep the checklist aligned with the component inventory and section hierarchy in the JSON spec.

## 2. Build Run
- [ ] `F-FIGMA-1400` is confirmed across the concept doc, JSON spec, and checklist before layout work begins.
- [ ] The component inventory, breakpoint table, and section order are read together and any naming deltas are resolved up front.
- [ ] `node -e "JSON.parse(require('fs').readFileSync('docs/week3/frontend/main-page-figma-spec.json', 'utf8'))"` completes without errors after every spec edit.
- [ ] The build is ready to hand off only when the checklist, JSON `handoff.qaSignOff`, and layer naming all agree.

## 3. Execution Order
- [ ] Lock the source of truth first: open the concept doc and JSON spec together, confirm `F-FIGMA-1400`, and note any naming deltas before drawing.
- [ ] Set the frame sizes, column grids, margins, and section spacing from the JSON spec before placing content.
- [ ] Build reusable components first: `TopNav`, `PrimaryButton`, `MetricCard`, `PipelineStep`, `FeatureCard`, `ProofPanel`, `WireframeFrame`, and `FooterCTA`.
- [ ] Assemble the desktop frame in order: `Global Header`, `Hero / Receipt Story`, `Trust Metrics Strip`, `Proof Flow`, `Capability Cards`, `Operations Snapshot`, `Wireframe QA`, `Footer CTA`.
- [ ] Mirror the same section order on mobile, stacking the proof panel directly after the hero CTA row.
- [ ] Apply motion, reduced-motion notes, and export treatment only after layout, text, and variants are locked.
- [ ] Freeze editable text as text layers and avoid outlining labels or metadata copy.

## 4. Layer Naming
- [ ] Top-level frames use `Main Page / Desktop` and `Main Page / Mobile`.
- [ ] Section groups use functional names such as `Global Header`, `Hero / Receipt Story`, `Trust Metrics Strip`, `Proof Flow`, `Capability Cards`, `Operations Snapshot`, `Wireframe QA`, and `Footer CTA`.
- [ ] Reusable component instances keep the component name and variant visible in the layer tree.
- [ ] Text layers use short visible labels, while longer supporting copy lives in sibling body text layers.
- [ ] Decorative background layers are clearly separated from content layers and do not receive semantic names that could confuse handoff.

## 5. Component Variants
- [ ] `TopNav` includes `desktop` and `mobile` variants.
- [ ] `PrimaryButton` includes `solid` and `ghost` variants.
- [ ] `MetricCard` includes `default`, `success`, and `warning` variants.
- [ ] `PipelineStep` includes `default` and `active` variants.
- [ ] `FeatureCard` includes `default` and `spotlight` variants.
- [ ] `ProofPanel` includes `desktop` and `mobileStack` variants.
- [ ] `WireframeFrame` includes `desktop` and `mobile` variants.
- [ ] `FooterCTA` includes `desktop` and `mobile` variants.
- [ ] Every variant exposes the same core structure so text swaps and state toggles do not break layout.

## 6. Auto-Layout Rules
- [ ] Use auto-layout for all content groups that contain text, buttons, cards, or chips.
- [ ] Keep an 8 px spacing system throughout the page.
- [ ] Align section headers to the same left edge on desktop and mobile.
- [ ] Use horizontal layout for desktop content groups that need side-by-side reading.
- [ ] Stack the hero, proof panel, and supporting cards vertically on mobile.
- [ ] Avoid absolute positioning except for decorative glows, background grids, and other non-content layers.
- [ ] Make card widths responsive with `fill container` or equivalent constraints.
- [ ] Use consistent internal padding values so cards feel like one system.

## 7. Export Rules
- [ ] Export the wireframe SVG as a lightweight review artifact.
- [ ] Export only the frames and assets that are needed for downstream implementation.
- [ ] Keep text editable in Figma; do not flatten live labels or body copy into outlines.
- [ ] Export icons and simple marks as SVG when vector fidelity matters.
- [ ] Export screenshots or PNGs only for handoff previews, not as the source of truth.
- [ ] Ensure exports use the same naming convention as the Figma layers so reviewers can map files back to the frame tree quickly.

## 8. QA Sign-Off
- [ ] Confirm the desktop frame reads as `Global Header -> Hero / Receipt Story -> Trust Metrics Strip -> Proof Flow -> Capability Cards -> Operations Snapshot -> Wireframe QA -> Footer CTA`.
- [ ] Confirm the mobile frame preserves the same order in a stacked layout.
- [ ] Confirm the proof panel and receipt status remain visually elevated above the supporting content.
- [ ] Confirm the main action button stays visually dominant in both desktop and mobile versions.
- [ ] Confirm reduced-motion behavior is noted in the design handoff.
- [ ] Confirm the JSON spec still parses cleanly after edits.

## 9. Consistency Validation
- [ ] Confirm the title, concept doc, and JSON id all use `F-FIGMA-1400`.
- [ ] Confirm the section names match exactly across the concept doc, JSON, checklist, and handoff notes.
- [ ] Confirm the reusable component names and variant labels are identical between the concept doc and JSON spec.
- [ ] Confirm the final handoff package still points reviewers to the editable Figma layers, not flattened exports.
