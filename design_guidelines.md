# Trip Evaluation Viewer - Design Guidelines

## Design Approach
**System-Based Approach** using principles from Linear and Notion for clean data presentation with Material Design influences for structured information display. This utility-focused application prioritizes clarity, scanability, and efficient data comprehension.

## Core Design Elements

### A. Color Palette

**Dark Mode Primary (Default):**
- Background: 220 15% 10%
- Surface: 220 12% 14%
- Surface Elevated: 220 10% 18%
- Primary Accent: 210 100% 60% (vibrant blue for CTAs)
- Text Primary: 0 0% 95%
- Text Secondary: 220 10% 65%
- Border: 220 10% 25%

**Rating Colors:**
- Excellent (9-10): 140 70% 55% (green)
- Good (7-8): 190 75% 50% (teal)
- Average (5-6): 45 90% 60% (amber)
- Poor (1-4): 0 75% 60% (red)
- No Rating: 220 10% 40% (muted gray)

### B. Typography
- **Font Family:** Inter via Google Fonts CDN
- **Headers:** Font weight 600-700, sizes from text-2xl to text-4xl
- **Body Text:** Font weight 400, text-base (16px)
- **Labels:** Font weight 500, text-sm uppercase tracking-wide
- **Data Values:** Font weight 600, text-lg for emphasis

### C. Layout System
**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Component padding: p-6 to p-8
- Section spacing: space-y-8 to space-y-12
- Grid gaps: gap-4 to gap-6
- Container max-width: max-w-7xl

### D. Component Library

**1. Search Interface**
- Clean, centered search bar with generous whitespace
- Input field: Large (h-14), rounded-lg, with subtle shadow
- "Procurar" button: Primary blue, h-14, px-8, rounded-lg
- Search container: max-w-2xl, centered with pt-12 to pt-16

**2. Results Header Card**
- Elevated surface card with rounded-xl borders
- Two-column layout: Cliente (left) and Destino (right)
- Large, bold text (text-xl to text-2xl) for values
- Subtle divider between columns

**3. Category Sections**
Four distinct sections with clear visual separation:
- Section headers: text-xl font-semibold with subtle underline accent (4px blue bar)
- Categories: Malha Aérea, Alimentação, Acomodação, Geral
- Each section in its own elevated card container

**4. Hotel Rating Cards**
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Each card: Rounded-lg, p-6, border with hover elevation
- Hotel name: text-lg font-semibold
- Star rating visualization: 5 stars (filled/unfilled based on rating out of 10)
- Numeric rating displayed prominently beside stars

**5. Passeios/Restaurantes Grid**
- Compact grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Smaller cards than hotels (p-4)
- Name on top, rating visualization below
- Progress bar style rating (horizontal bar, colored by rating tier)
- Show only items with values (hide empty entries)

**6. Question-Answer Display**
- Two-column responsive layout for general questions
- Question (label): text-sm text-secondary uppercase
- Answer (value): text-base font-medium
- Subtle separators between items
- Organized in clean list format with consistent spacing

**7. Visual Rating Indicators**
- Star ratings for hotels (☆☆☆☆☆ with filled/outline states)
- Progress bars for passeios/restaurantes (10% width per rating point)
- Color-coded by rating tier (excellent/good/average/poor)
- Numeric value always visible alongside visual indicator

**8. Loading & Empty States**
- Skeleton loaders: Animated pulse with rounded shapes matching final components
- Empty state: Centered icon with helpful message
- Error state: Alert banner with retry option

### E. Interaction Patterns
- **Hover States:** Subtle elevation increase (shadow-md to shadow-lg)
- **Transitions:** duration-200 for all interactive elements
- **Focus States:** Ring with primary color (ring-2 ring-primary)
- **Button States:** Slight scale transform (hover:scale-105) for primary CTA

### F. Responsive Behavior
- Mobile (base): Single column, stacked sections, compact spacing (p-4)
- Tablet (md:): Two-column grids where appropriate
- Desktop (lg:): Full multi-column layouts, generous spacing (p-8)
- Search bar maintains centered focus on all viewports

### G. Content Organization Strategy
**Vertical Flow:**
1. Search interface (hero area, minimal height)
2. Client/Destination header (if results exist)
3. Hotel evaluations (prominent, grid display)
4. Malha Aérea section (questions/answers)
5. Alimentação section (with restaurantes grid)
6. Acomodação section (detailed questions)
7. Geral section (overall evaluation questions)
8. Passeios section (attractions grid)

Each section clearly separated with consistent spacing (space-y-12)

### H. Data Visualization Principles
- **Hierarchy:** Hotels most prominent (largest cards), then category sections, then individual items
- **Scanability:** Use of icons (🏨 for hotels, 🍽️ for restaurants, 🎯 for attractions)
- **Color Coding:** Consistent rating color system across all components
- **Whitespace:** Generous padding prevents information overload
- **Grouping:** Related items grouped in cards with subtle borders

### I. No Images Required
This is a data-driven application without hero imagery. The visual interest comes from clean typography, organized information architecture, and color-coded ratings.