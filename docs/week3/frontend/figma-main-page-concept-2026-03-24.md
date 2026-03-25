# F-FIGMA-1400 Main Page Handoff Concept - 2026-03-24

## 1. Concept Summary
- Product context: Agentbanking trust and proof workspace, now being prepared for Figma build and handoff.
- Design thesis: make verification feel calm, premium, and operationally credible.
- Visual direction: dark editorial dashboard with luminous proof accents.
- Primary user: product, ops, and compliance teams who need to understand what was verified, when it happened, and where evidence lives.
- Core promise: every agent action can be traced to a receipt, a verification status, and a reproducible evidence trail.
- Handoff goal: make the page easy to recreate in Figma with clear names, component variants, execution order, and export-safe structure.

## 2. IA Section Structure
1. Global header
- Brand lockup
- Primary nav: Product, Proof Flow, Evidence, Docs
- Utility action: Sign in
- Primary CTA: Start verification

2. Hero
- Kicker line with trust statement
- H1 with the main value proposition
- Supporting paragraph
- Primary and secondary CTA buttons
- Three trust badges
- Right-side proof card with receipt and status summary

3. Proof strip
- Short credibility line
- Partner or system badges
- Small status chips for signer, timestamp, and transparency modes

4. Proof flow
- Four-step pipeline from request to receipt
- Step 1: Policy gate
- Step 2: Evidence capture
- Step 3: Verification run
- Step 4: Signed receipt

5. Capability cards
- Receipts and digests
- Offline verification
- Audit-ready exports

6. Operations Snapshot
- Health, latency, and failure-mode snapshot
- Delivery and monitoring notes
- Recovery and fallback behavior

7. Footer CTA
- Final call to action
- Documentation link
- Contact or demo request link

8. Handoff checklist
- Layer naming and section hierarchy
- Component variants and state coverage
- Auto-layout and spacing rules
- Export and QA rules

## 3. Layout Grid and Breakpoints
| Breakpoint | Frame | Columns | Margin | Gutter | Content Width | Notes |
|---|---:|---:|---:|---:|---:|---|
| Desktop | 1440 x 3200 | 12 | 88 | 24 | 1264 | Main composition, two-column hero |
| Tablet | 1024 x 3360 | 8 | 32 | 20 | 960 | Hero stacks, cards collapse to two columns |
| Mobile | 375 x 3560 | 4 | 20 | 16 | 335 | Single-column, sticky CTA optional |

### Grid rules
- Use an 8 px spacing system.
- Keep the hero text column at 52 to 56 percent of the content width on desktop.
- Use consistent section spacing of 96 px on desktop, 64 px on tablet, and 48 px on mobile.
- Align all section headings to the same left edge to preserve a clear editorial rhythm.
- Keep the right-side proof card pinned to the top of the hero so the visual story reads as a live system, not a generic marketing mock.

## 4. Typography Tokens
| Token | Value | Use |
|---|---|---|
| `font.display` | `Fraunces, Georgia, serif` | H1 and featured numbers |
| `font.heading` | `Space Grotesk, Avenir Next, system-ui, sans-serif` | H2 and H3 |
| `font.body` | `Manrope, Inter, system-ui, sans-serif` | Paragraphs and labels |
| `font.mono` | `IBM Plex Mono, SFMono-Regular, Menlo, monospace` | IDs, timestamps, hashes |

| Type Scale | Size / Line Height | Weight | Use |
|---|---:|---:|---|
| Display XL | 64 / 68 | 700 | Hero headline |
| Display L | 44 / 48 | 700 | Section lead |
| Heading M | 28 / 34 | 600 | Card headings |
| Body L | 18 / 30 | 400 | Hero copy |
| Body M | 16 / 26 | 400 | Supporting copy |
| Label | 12 / 16 | 600 | Kicker and chips |
| Mono | 13 / 20 | 500 | Receipt metadata |

## 5. Color Tokens
| Token | Hex | Use |
|---|---|---|
| `color.bg.canvas` | `#07111F` | Page background |
| `color.bg.surface` | `#0E1A2C` | Cards and panels |
| `color.bg.surfaceElevated` | `#14253E` | Strong callout blocks |
| `color.line.default` | `#28415F` | Borders and separators |
| `color.text.primary` | `#F4F8FF` | Main text |
| `color.text.secondary` | `#A7B8CE` | Supporting copy |
| `color.text.muted` | `#6E839C` | Metadata |
| `color.accent.primary` | `#63EAD7` | Primary accent |
| `color.accent.secondary` | `#F5B94C` | Highlight and warning |
| `color.accent.rose` | `#FF7A94` | Risk / alert |
| `color.accent.success` | `#8AF0A8` | Pass / healthy |
| `color.accent.link` | `#9BC4FF` | Link and focus states |

### Background treatment
- Main canvas uses layered radial glows and a subtle grid texture.
- Hero cards use translucent surfaces with a soft inner border.
- Accent colors should be used sparingly to guide attention, not to decorate every surface.

## 6. Component Tokens
| Token | Value |
|---|---:|
| `radius.sm` | 12 |
| `radius.md` | 16 |
| `radius.lg` | 24 |
| `radius.xl` | 32 |
| `space.1` | 4 |
| `space.2` | 8 |
| `space.3` | 12 |
| `space.4` | 16 |
| `space.5` | 20 |
| `space.6` | 24 |
| `space.8` | 32 |
| `space.10` | 40 |
| `space.12` | 48 |
| `space.16` | 64 |
| `space.20` | 80 |
| `shadow.card` | `0 24px 60px rgba(0, 0, 0, 0.28)` |
| `shadow.float` | `0 18px 40px rgba(25, 72, 110, 0.18)` |

### Component inventory
- `TopNav`
- `PrimaryButton`
- `SecondaryButton`
- `PillChip`
- `MetricCard`
- `PipelineStep`
- `FeatureCard`
- `ProofPanel`
- `WireframeFrame`
- `FooterCTA`

## 7. Interaction and Motion
### Motion rules
- Page load: stagger the hero text, proof card, and section cards with 80 to 120 ms offsets.
- Hover: raise cards by 4 px and brighten the border on hover.
- CTA: use a subtle shimmer on primary buttons, not a loud bounce.
- Pipeline steps: on hover, increase emphasis on the current step and dim the others slightly.
- Focus: visible focus ring in accent blue with a 2 px offset.

### Motion tokens
| Token | Value |
|---|---:|
| `motion.fast` | 120 ms |
| `motion.base` | 180 ms |
| `motion.slow` | 280 ms |
| `motion.stagger` | 90 ms |
| `easing.standard` | `cubic-bezier(0.22, 1, 0.36, 1)` |

### Reduced motion
- Respect `prefers-reduced-motion`.
- Remove floating glows and staggered entrance animation when reduced motion is enabled.

## 8. Desktop Wireframe
```text
[Top Nav -------------------------------------------------------------]
[Hero copy -----------------------------------][Proof panel ---------]
[CTA row + trust badges ----------------------][Status + receipt -----]
[Trust strip ---------------------------------------------------------]
[Proof flow: 1 | 2 | 3 | 4 -----------------------------------------]
[Capability cards: Receipts | Offline verify | Export ----------------]
[Operations Snapshot -------------------------------------------------]
[Footer CTA ----------------------------------------------------------]
```

### Desktop composition notes
- Hero uses a 2-column split with the proof panel taking the visual right side.
- The proof strip is narrow and should sit between the hero and the deeper content.
- Capability cards should align in a 3-up row so the reader can scan them quickly.
- The operations snapshot acts like a dashboard snapshot and should feel denser than the marketing cards.

## 9. Mobile Wireframe
```text
[Top Nav]
[Hero headline]
[Hero copy]
[Primary CTA]
[Secondary CTA]
[Trust badges]
[Proof panel]
[Trust strip]
[Proof flow step 1]
[Proof flow step 2]
[Proof flow step 3]
[Proof flow step 4]
[Capability card 1]
[Capability card 2]
[Capability card 3]
[Operations Snapshot]
[Footer CTA]
```

### Mobile composition notes
- Keep the headline to three to four lines maximum.
- Convert the proof flow into stacked cards with short titles and one-line descriptions.
- Use full-width buttons and avoid side-by-side CTAs on screens below 480 px.
- The proof panel should sit directly below the CTA row so the trust story remains immediate.

## 10. Figma Build Guidance
1. Confirm the source of truth first by checking this concept doc and the JSON spec side by side, and verify `F-FIGMA-1400` before starting layout.
2. Create two top-level frames named `Main Page / Desktop` and `Main Page / Mobile`.
3. Apply the grid, spacing, and breakpoint tokens before placing any content.
4. Build the reusable components first: `TopNav`, `PrimaryButton`, `MetricCard`, `PipelineStep`, `FeatureCard`, `ProofPanel`, `WireframeFrame`, and `FooterCTA`.
5. Assemble the desktop frame in the documented order: header, hero, trust strip, proof flow, capability cards, operations snapshot, wireframe QA, and footer CTA.
6. Mirror the same section order on mobile, stacking the proof panel directly under the hero CTA row and preserving the same reading order.
7. Use auto-layout for every content group except background decoration layers, and keep the 8 px spacing rhythm intact.
8. Validate names, variants, and section order against the JSON spec before exporting any previews or handoff assets.
9. Keep live text editable, then verify reduced-motion notes and export naming before sign-off.

### Hand-off naming pattern
- `Frame / Section / Subsection` for top-level structure.
- `Component / Variant` for reusable parts.
- `State / Role / Metric` for chip, badge, and KPI labels.
- Keep visible labels short, but preserve longer descriptive notes in secondary text or component descriptions.

## 11. Handoff to Code Mapping
| Component | Implementation Priority | Why it ships this early |
|---|---|---|
| `TopNav` | P0 | Locks the primary navigation, brand, and above-the-fold CTA pattern. |
| `PrimaryButton` | P0 | Reused across hero, top bar, and footer conversion points. |
| `ProofPanel` | P0 | Carries the trust story and receipt preview that anchor the page. |
| `MetricCard` | P1 | Powers the trust strip and keeps KPI surfaces consistent. |
| `PipelineStep` | P1 | Supports the proof flow and establishes the core narrative order. |
| `FeatureCard` | P2 | Fills out the capability section once the core proof surfaces are in place. |
| `WireframeFrame` | P2 | Provides the QA view for implementation parity and responsive checks. |
| `FooterCTA` | P3 | Final conversion block that can ship after the primary trust surfaces land. |

- Build P0 components first so the page can be handed to code with the main interaction and trust surfaces already stable.
- Use P1 components to complete the page narrative before polishing the supporting cards and QA frames.
- Treat P2 and P3 items as implementation follow-through once the core flow is validated.

## 12. QA Sign-Off Criteria
- [ ] Desktop and mobile frames use the exact section names listed in the JSON spec.
- [ ] All documented component variants are present and used where expected.
- [ ] The proof panel, CTA, and trust strip remain visually clear at both breakpoints.
- [ ] The wireframe QA section confirms responsive parity without introducing overlap or clipping.
- [ ] Reduced-motion behavior is explicitly documented in the handoff notes.
- [ ] The JSON spec still parses cleanly after the final edit pass.

## 13. Acceptance Checklist
- [x] IA sections defined
- [x] Layout grid and breakpoints defined
- [x] Typographic tokens defined
- [x] Color and component tokens defined
- [x] Interaction and motion rules defined
- [x] Desktop and mobile wireframes defined
- [x] Figma import fallback ready
- [x] Handoff checklist defined
- [x] Layer naming and variant rules documented
- [x] Export rules documented
