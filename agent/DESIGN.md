# Design System Strategy: The Autonomous Interface

## 1. Overview & Creative North Star: "The Obsidian Architect"
This design system is not a standard dashboard; it is a high-fidelity command center for the agent-led economy. The Creative North Star, **"The Obsidian Architect,"** blends the brutalist utility of a desert terminal with the liquid precision of high-end blockchain explorers. 

To break the "template" look, we move away from symmetrical grids. We embrace **intentional asymmetry**: data-heavy terminal logs should feel "heavy" on one side, balanced by ethereal, glassmorphic "hologram" badges on the other. Layouts should feel like a HUD (Heads-Up Display) projected onto dark matter—layered, deep, and hyper-functional.

---

## 2. Colors & Tonal Depth
The palette is rooted in the void (`#0e0e0e`). We do not use "gray" to define space; we use light and shadow.

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** Physical separation is an antiquated concept. Boundaries must be defined through:
*   **Background Shifts:** A `surface-container-low` card sitting on a `surface` background.
*   **Tonal Transitions:** Using the `surface-variant` to create a "pocket" of depth.
*   **Glow Boundaries:** A 1px inner shadow using `primary` at 10% opacity to "etch" the edge of a container.

### Surface Hierarchy & Nesting
Treat the UI as a stack of obsidian glass.
*   **Base:** `surface` (#0e0e0e) - The infinite background.
*   **Level 1:** `surface-container-low` (#131313) - Large structural regions.
*   **Level 2:** `surface-container` (#1a1919) - Standard interactive cards.
*   **Level 3:** `surface-container-highest` (#262626) - Modals and floating tooltips.

### The "Glass & Gradient" Rule
For "Holographic" ERC-8004 badges, use `surface-bright` with a `backdrop-filter: blur(12px)`. Apply a linear gradient from `primary` (#8ff5ff) to `secondary` (#ac89ff) at 15% opacity to simulate light refracting through synthetic glass.

---

## 3. Typography: Technical Authority
We use a dual-font strategy to balance editorial elegance with machine-readable precision.

*   **Display & Headlines (`Space Grotesk`):** Used for "Brand Moments"—yield percentages, agent names, and section headers. The wide apertures and geometric construction feel futuristic and authoritative.
*   **Body & Data (`Inter` / `JetBrains Mono`):** All terminal logs and data tables must use `Inter` for readability, or `JetBrains Mono` for hash addresses and transaction IDs.
*   **Hierarchy as Identity:** Use `display-lg` for primary yield stats in `primary` (#8ff5ff). Use `label-sm` in `on-surface-variant` for metadata to create a "whisper" effect against the loud data.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are too "organic" for this system. We use **Atmospheric Light.**

*   **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-lowest` (#000000) well inside a `surface-container` card creates an "inset" terminal feel.
*   **Ambient Shadows:** For floating elements, use a shadow with a 40px blur, 0px offset, and 6% opacity of the `primary` color. This mimics the glow of a neon screen hitting a surface.
*   **The "Ghost Border" Fallback:** If a divider is essential for a data-rich table, use the `outline-variant` token at **15% opacity**. It should be felt, not seen.
*   **Neon Pulses:** For live activity, use the `tertiary` (#c5ffc9) token with a CSS keyframe animation `box-shadow: 0 0 8px #22C55E;` to create a "heartbeat" on the agent's status.

---

## 5. Components: The Terminal Primitives

### Buttons (The Kinetic Trigger)
*   **Primary:** `primary-container` background with `on-primary` text. No rounded corners (`rounded-none` or `sm`). Add a subtle `inner-glow` of white at 20% on the top edge.
*   **Secondary:** `surface-variant` background with a `primary` "Ghost Border."

### High-Fidelity Sliders
Used for risk parameters. The track should be `surface-container-highest`. The "thumb" is a sharp `primary` square with a 4px `primary` outer glow.

### Terminal-Style Logs
Use `surface-container-lowest` for the background. Text uses `body-sm` in `tertiary` (Mint Green) for "Success" entries and `primary` for "Standard" agent thoughts. **No dividers.** Use `1.5` (0.3rem) spacing between log lines.

### Data-Rich Tables (Basescan Aesthetic)
*   **Header:** `surface-container-low` with `label-md` uppercase text.
*   **Rows:** Subtle hover state using `surface-bright` at 5% opacity. 
*   **Cells:** Use `secondary` (#ac89ff) for on-chain addresses to make them distinct from financial data (`primary`).

### ERC-8004 Holographic Badges
A `xl` rounded card with a `1px` gradient border (Cyan to Purple). Use a mesh gradient background at 5% opacity to create a "shimmer" as the user scrolls.

---

## 6. Do’s and Don'ts

### Do
*   **Use Mono for Numbers:** Use technical fonts for all changing values to prevent "jumping" layouts.
*   **Embrace the Void:** Leave significant `24` (5.5rem) padding around major sections to let the "Deep Space" breathe.
*   **Layer your Glass:** Use `surface-container-high` for elements that need to feel closer to the user.

### Don’t
*   **No Pure Grays:** Never use `#333` or `#666`. Always use the tinted surface tokens to maintain the "Deep Space" temperature.
*   **No Rounded "Pills":** Unless it’s a status chip, avoid `rounded-full`. High-end technical tools use sharp (`sm` or `md`) corners to convey precision.
*   **No Heavy Borders:** If you find yourself adding a border, try an 8px vertical space or a background color shift first.