# Visual Standards

## Production Workflow

**HTML first, PPTX second.** Always build visuals in HTML for design control, then convert to PowerPoint. Never go straight to PPTX.

### Why HTML First?
- Full control over typography, spacing, alignment
- Pixel-perfect rendering across screens
- Easier to iterate on layout without PowerPoint limitations
- Export to PPTX preserves design intent better than building in PPTX from scratch

### Conversion Flow
1. Design in HTML/CSS
2. Review and approve layout
3. Convert to PPTX (manual or automated)
4. QA the PPTX output for text overflow and alignment

## Slide Design Principles

### Text
- No text overflow — ever. If it doesn't fit, rewrite shorter.
- Maximum 6 bullet points per slide
- Maximum 8-10 words per bullet
- Headlines: 5-8 words ideal
- Body text: minimum 14pt in presentations

### Layout
- One idea per slide
- Key stat or proof point should be the visual anchor (largest element)
- White space is a feature, not wasted space
- Consistent margins and alignment across all slides

### Data Visualization
- Lead with the headline insight, not the chart
- Every chart needs a "so what?" caption
- Use comparisons that are immediately scannable (before/after, us/them)
- Bar charts over pie charts for comparisons
- Avoid 3D effects

## Deliverable Standards by Type

### Pitch Decks
- 12-15 slides maximum for initial pitch
- Follow messaging hierarchy in slide order
- Title slide -> Speed hook -> Cost business case -> Compliance dissolves trade-off -> Performance proof -> Relevant case study -> CTA
- Presenter notes with talk track

### One-Pagers
- Single page (front only, or front/back if needed)
- Scannable in 30 seconds
- Hero stat at the top
- 3-4 supporting proof points
- Single clear CTA
- Vertical-specific when possible

### Battle Cards
- Two-sided: Persado vs. [Competitor Type]
- Left side: competitor's model and weaknesses
- Right side: Persado's advantage with proof points
- Quick-reference objection responses at the bottom
- Designed for salespeople to reference during calls

### Email Templates
- Mobile-first design
- Single-column layout
- CTA above the fold
- Subject line under 50 characters
- Preview text/preheader optimized

## File Naming Convention

```
[deliverable-type]-[audience-or-vertical]-[version]-[date].[ext]

Examples:
pitch-deck-cards-v3-2026-02.html
one-pager-create-mortgage-v1-2026-01.html
battle-card-vs-agencies-v2-2026-02.html
outreach-email-retail-banking-v1-2026-01.md
```
