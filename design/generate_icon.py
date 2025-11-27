import os

# Configuration
CANVAS_SIZE = 1024
# macOS icons are typically ~824px within the 1024px box to allow for drop shadows and optical sizing.
# This fixes the "icon too big in Dock" issue.
ICON_SIZE = 824
PADDING = (CANVAS_SIZE - ICON_SIZE) / 2
CORNER_RADIUS = 185  # Standard macOS squircle radius for this size
RUST_COLOR = "#B7410E"  # Rust brand color
GLASS_BLUE = "#E6F4F1"

svg_content = f"""<svg width="{CANVAS_SIZE}" height="{CANVAS_SIZE}" viewBox="0 0 {CANVAS_SIZE} {CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Base Background Gradient (Soft Metallic/White) -->
    <linearGradient id="baseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#E5E5E5"/>
    </linearGradient>

    <!-- Liquid Glass Gradient for the Lens -->
    <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="white" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="{GLASS_BLUE}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#B0C4DE" stop-opacity="0.2"/>
    </linearGradient>

    <!-- Rust Gradient for the Claw -->
    <linearGradient id="rustGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E65C2C"/> <!-- Lighter Rust -->
      <stop offset="100%" stop-color="{RUST_COLOR}"/> <!-- Darker Rust -->
    </linearGradient>

    <!-- Drop Shadow for the main icon shape -->
    <filter id="iconShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="12"/>
      <feOffset dx="0" dy="8" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.25"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Inner Glow for Glass Effect -->
    <filter id="glassGlow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur"/>
      <feComposite in="blur" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"/>
      <feFlood flood-color="white" flood-opacity="0.8"/>
      <feComposite in2="shadowDiff" operator="in"/>
      <feComposite in2="SourceGraphic" operator="over"/>
    </filter>
  </defs>

  <!-- 1. The Base Squircle (The "Plate") -->
  <g filter="url(#iconShadow)">
    <rect x="{PADDING}" y="{PADDING}" width="{ICON_SIZE}" height="{ICON_SIZE}" rx="{CORNER_RADIUS}" ry="{CORNER_RADIUS}" fill="url(#baseGradient)"/>
  </g>

  <!-- 2. The Abstract Composition Container -->
  <g transform="translate({CANVAS_SIZE/2}, {CANVAS_SIZE/2})">

    <!-- The Claw (Abstracted as a heavy, protective curve) -->
    <!-- Rotated to look like it's holding the lens -->
    <path d="M -150 100 A 200 200 0 1 1 150 100"
          fill="none"
          stroke="url(#rustGradient)"
          stroke-width="60"
          stroke-linecap="round"
          transform="rotate(135)"/>

    <!-- The Lens (Liquid Glass Sphere) -->
    <circle cx="0" cy="0" r="140" fill="url(#glassGradient)" filter="url(#glassGlow)"/>

    <!-- Lens Rim (Thin, elegant) -->
    <circle cx="0" cy="0" r="140" fill="none" stroke="{RUST_COLOR}" stroke-width="4" opacity="0.3"/>

    <!-- Refraction/Highlight on Lens -->
    <path d="M -80 -80 Q -40 -120 40 -100" stroke="white" stroke-width="12" stroke-linecap="round" opacity="0.9" fill="none"/>

    <!-- The "Seek" Element (Magnifying handle implied or abstract lines) -->
    <!-- Let's add a handle sticking out to reinforce "Magnifying Glass" -->
    <path d="M 100 100 L 180 180" stroke="url(#rustGradient)" stroke-width="40" stroke-linecap="round" />

  </g>

  <!-- 3. Overall Glossy Overlay for the Icon Shape (The "Liquid Glass" finish) -->
  <!-- This sits on top of everything to unify it -->
  <rect x="{PADDING}" y="{PADDING}" width="{ICON_SIZE}" height="{ICON_SIZE}" rx="{CORNER_RADIUS}" ry="{CORNER_RADIUS}" fill="url(#glassGradient)" style="mix-blend-mode: overlay; pointer-events:none;" opacity="0.3"/>

</svg>
"""

with open("design/app-icon.svg", "w") as f:
    f.write(svg_content)

print("SVG generated at design/app-icon.svg")
