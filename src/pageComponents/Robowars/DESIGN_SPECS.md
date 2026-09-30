# Robowars Hero — Figma Design Specifications

This document records the exact design tokens, typography, layout geometry, and motion specifications extracted directly from the Figma design file via the Figma MCP server.

---

## 1. Source Metadata

* **Figma File Name**: `w1`
* **File Key**: `L9cB9cvVtlQKAg3pP9jEyp`
* **Node ID**: `62:193` (Frame: `Robowars`)
* **Base Frame Dimensions**: `1413px × 697px`
* **URL**: [Figma Selection Link](https://www.figma.com/design/L9cB9cvVtlQKAg3pP9jEyp/w1?node-id=62-193)

---

## 2. Typography Specifications

Extracted directly from the Figma text styles and AST variables:

| Element | Content | Font Family | Size (px) | Weight | Line Height | Text Align | Color Hex |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Top Badge** | `Robowars` | *Instrument Serif* | `18.06px` | `400` (Regular) | `23.48px` | Center | `#FFDFC4` (Peach Amber) |
| **Headline 1 (Left)** | `ROBO` | *Calm Serif* | `99.81px` | `400` (Regular) | `0.95em` (`94.82px`) | Right | `#FFFFFF` |
| **Headline 1 (Right)** | `WARS` | *Calm Serif* | `99.81px` | `400` (Regular) | `1.15em` (`114.78px`) | Left | `#FFFFFF` |
| **Headline 2 (Left)** | `FIGHT` | *Akira Expanded* | `70.00px` | `800` (Super Bold) | `1.15em` | Right | `#FFFFFF` |
| **Headline 2 (Right)** | `ON` | *Akira Expanded* | `70.00px` | `800` (Super Bold) | `1.15em` | Left | `#FFFFFF` |
| **Date Label** | `OCT 9,10` | *Alata* | `26.11px` | `400` (Regular) | `1.38em` (`36.03px`) | Center | `#FFFFFF` |
| **Prize Title** | `PRIZES WORTH INR` | *Lancaste Serif Demo* | `24.01px` | `250` (Light) | `1.0em` (`24.01px`) | Right | `#FFFFFF` |
| **Prize Value** | `8 LAKH` | *Alata* | `24.01px` | `700` (Bold) | `1.38em` | Right | `#EB9A58` (Orange Glow) |
| **Arena Title** | `16 x 16 FT. ARENA` | *Alata* | `24.01px` | `400` (Regular) | `1.38em` (`33.13px`) | Left | `#FFFFFF` |
| **Weight Class** | `8KG \ 15KG` | *Alata* | `24.01px` | `400` (Regular) | `1.38em` (`33.13px`) | Left | `#FFFFFF` |

---

## 3. Spatial Layout & Geometry

All coordinates are relative to the parent frame (`1413 × 697 px`):

### Elements Breakdown

```text
[FRAME] "Robowars" (1413x697)
 ├── [RECTANGLE] "right 1" (Left Mecha Fighter)
 │     x: -28px, y: -82px | width: 805px, height: 949.38px
 ├── [RECTANGLE] "Left 1" (Right Mecha Fighter)
 │     x: 535px, y: 0px   | width: 888px, height: 796.02px
 ├── [GROUP] #62:199 (Left Headline Stack)
 │     x: 409px, y: 203px | width: 286px, height: 183px
 ├── [TEXT] #62:201 (Right Headline Stack)
 │     x: 725px, y: 196px | width: 251px, height: 193px
 ├── [FRAME] #62:204 (Date Divider Lockup)
 │     x: 484px, y: 405px | width: 422px, height: 29.5px
 ├── [TEXT] #62:203 (Prizes Column)
 │     x: 464px, y: 480px | width: 207px, height: 66px
 └── [TEXT] #62:202 (Arena Specs Column)
       x: 721px, y: 480px | width: 373.36px, height: 66px
```

---

## 4. Color Palette & Tokens

* **Arena Void Background**: `#050507` to `#0A0A0E`
* **Pure Text / Highlights**: `#FFFFFF`
* **Badge Accent**: `#FFDFC4` (Warm cream peach)
* **Prize Gold Accent**: `#EB9A58` / `#E88A3C` (Warm amber)
* **Mecha Left Glow**: `rgba(255, 150, 0, 0.15)`
* **Mecha Right Shield Glow**: `rgba(120, 50, 255, 0.20)`

---

## 5. Asset Map

All project assets are saved in accordance with contributing rules under `public/images/Robowars/`:

* `robot-left.svg` — Left armored mecha fighter (Vector graphic)
* `robot-right.svg` — Right futuristic cyberpunk mecha with shield (Vector graphic)

---

## 6. Motion & Animation Specs (GSAP ScrollTrigger)

* **Trigger Container**: `#robowars-hero` (`containerRef`)
* **Scroll Range**:
  * `start: "top 85%"` (Begins animating as the top of the section enters the bottom 85% of viewport)
  * `end: "center 50%"` (Settles into final position as section reaches center of viewport)
  * `scrub: 1.2` (Smooth momentum scrubbing)
* **Left Robot Motion**:
  * Initial: `xPercent: -80`, `opacity: 0.1`, `scale: 0.9`
  * Final: `xPercent: 0`, `opacity: 1`, `scale: 1`
  * Easing: `power2.out`
* **Right Robot Motion**:
  * Initial: `xPercent: 80`, `opacity: 0.1`, `scale: 0.9`
  * Final: `xPercent: 0`, `opacity: 1`, `scale: 1`
  * Easing: `power2.out`
* **Center Content Motion**:
  * Initial: `scale: 0.92`, `opacity: 0.3`
  * Final: `scale: 1`, `opacity: 1`
  * Easing: `power1.out`
* **Lifecycle Cleanup**:
  * Controlled via `gsap.context()` with mandatory `ctx.revert()` in component unmount.
