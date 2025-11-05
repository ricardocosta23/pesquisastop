# Trip Evaluation Viewer

## Overview
A modern web application for searching and visualizing trip evaluation data from Monday.com. The app allows users to search for trip evaluations by ID and displays comprehensive feedback including hotels, restaurants, attractions (passeios), and detailed questionnaire responses organized by category.

## Recent Changes
- **2025-11-05**: Author citations in comments
  - Added author attribution to long-text comments for Guias and Corporativo evaluations
  - Guias comments display author from text_mksdvk9t column
  - Corporativo comments display author from text_mkswbqbp column
  - Citations rendered in italic format as "— Author Name"
  - Supports both single-item and aggregated (main pesquisa) comment views
  - Updated LongTextComment schema to include optional author field

- **2025-11-04**: Database-driven search implementation
  - **BREAKING CHANGE**: Search now queries PostgreSQL database directly instead of Monday.com API
  - Added `/api/evaluation/:searchId` endpoint to fetch trip evaluations from database JSONB column
  - Added `/api/rating-distribution/:searchId` endpoint for chart data aggregation
  - Implemented database search methods to query by 'numero de negocio' and 'tipo' in JSONB
  - Webhook endpoints automatically populate database with Monday.com item data
  - All column values stored in JSONB format for flexible querying
  - Significantly improved search performance by eliminating external API calls

- **2025-11-04**: Webhook endpoints for Monday.com integration
  - Added `/api/webhook/create` to sync created/updated items from Monday.com to database
  - Added `/api/webhook/delete` to remove deleted items from database
  - Automatic column metadata fetching and storage on first webhook
  - All webhook endpoints handle Monday.com challenge responses correctly
  
- **2025-01-22**: Initial implementation
  - Created complete schema for trip evaluations with TypeScript interfaces
  - Built beautiful, modern frontend with all components following design guidelines
  - Implemented search interface, rating visualizations, and category sections
  - Added loading states, error handling, and responsive design
  - Integrated Monday.com GraphQL API with column metadata fetching
  - Fixed question parsing to use actual column titles instead of IDs
  - Implemented keyword-based categorization for questions (Malha Aérea, Alimentação, Acomodação, Geral)
  - Connected frontend to backend with React Query for seamless data fetching

## Project Architecture

### Frontend Stack
- **React** with TypeScript
- **Wouter** for routing
- **TanStack Query** for data fetching
- **Tailwind CSS** + **Shadcn UI** for styling
- **Lucide React** for icons

### Backend Stack
- **Express.js** server
- **PostgreSQL database** with Drizzle ORM for data persistence
- **Monday.com GraphQL API** integration for webhook sync
- **JSONB column storage** for flexible Monday.com column data
- **Database-driven search** for fast evaluation lookups

### Key Features
1. **Search Interface**: Numeric input with "Procurar" button to search Monday.com board by ID
2. **Client/Destination Header**: Displays cliente and destino in elegant two-column layout
3. **Hotel Ratings**: Up to 4 hotels with names and 5-star rating visualization
4. **Category Sections**: Organized by Malha Aérea, Alimentação, Acomodação, and Geral
5. **Passeios Grid**: Up to 10 attractions with names and progress bar ratings
6. **Restaurantes Grid**: Up to 10 restaurants with names and progress bar ratings
7. **Beautiful UI**: Color-coded ratings (excellent=green, good=teal, average=amber, poor=red)

## Monday.com Integration

### Board Details
- **Target Board ID**: 18246552547 (main evaluation board)
- **Source Board ID**: 9242892489 (raw data board)
- **Search Column**: text_mkrkqj1g (numero de negocio)
- **Type Column**: color_mksvhn92 (tipo: Guias, Convidados, Corporativo, etc.)

### Column Mappings
- **Cliente**: text_mkrjdnry
- **Destino**: text_mkrb17ct
- **Hotel 1**: name=text_mkrjf13y, rating=numeric_mkrjpfxv
- **Hotel 2**: name=text_mkrjk4yg, rating=numeric_mkrjg1ar
- **Hotel 3**: name=text_mkwbhmb8, rating=numeric_mkwbs9zj
- **Hotel 4**: name=text_mkwb72y5, rating=numeric_mkwbspwv
- **Passeios 1-10**: Names and "Nota Passeio" columns for ratings
- **Restaurantes 1-10**: Names and "Nota Restaurante" columns for ratings

### Environment Variables
- `MONDAY_API_KEY`: Monday.com API token for authentication

## Webhook Endpoints

### `/api/library` (POST)
Receives webhooks from Monday.com and populates the in-memory LIBRARY:
- Extracts `pulseId` (item ID) from webhook payload
- Queries Monday.com for `color_mksvhn92` (tipo) and `text_mkrkqj1g` (numero de negocio)
- Stores item in LIBRARY keyed by tipo → numero de negocio → item details
- Handles Monday.com challenge responses

### `/api/comentarios` (POST)
Syncs comments from source board to target board as subitems:
- Queries board 9242892489 for all items with comments
- Matches items with LIBRARY using tipo + numero de negocio
- Creates subitems on target board (18246552547) with comment data
- Maps source columns to target columns:
  - `long_text_mksvbj9b` (Comentarios Passeio) → `long_text_mkx0r69j`
  - `long_text_mkrjwfwx` (Comentarios convidado) → `long_text_mkxcjf65`
  - `long_text_mkrjd4z0` (Sugestão Destino) → `long_text_mkxcfjns`
  - `long_text_mksdfcf4` (Comentarios Guias) → `long_text_mkxcn9wd`
  - `long_text_mksw2m76` (Comentarios Corporativo) → `long_text_mkxc9vxg`
- Subitem name uses `text_mksdvk9t` or falls back to `tipo`

### `/api/syncitems` (POST)
Syncs all items from source board to target board:
- Queries board 9242892489 for all items
- Checks if each combination of tipo + numero de negocio exists on board 18246552547
- Creates new items only if combination doesn't exist (prevents duplicates)
- Maps all text columns 1:1 (name, color_mksvhn92, text_mkrkqj1g, text_mkrjdnry, text_mkrb17ct, hotel names, etc.)

## File Structure
```
client/
  src/
    components/
      SearchBar.tsx - Search input and button
      ClientDestinationHeader.tsx - Cliente/Destino display
      HotelCard.tsx - Individual hotel with star rating
      StarRating.tsx - 5-star rating visualization
      NamedRatingCard.tsx - Generic rating card for passeios/restaurantes
      RatingProgressBar.tsx - Horizontal progress bar rating
      CategorySection.tsx - Question/answer section display
      EvaluationResults.tsx - Main results container
      LoadingSkeleton.tsx - Loading state animation
      EmptyState.tsx - Empty search state
      ErrorState.tsx - Error display with retry
    pages/
      Home.tsx - Main search and results page
shared/
  schema.ts - TypeScript interfaces for trip evaluations
server/
  routes.ts - API endpoints for Monday.com integration and webhooks
  monday.ts - Monday.com GraphQL queries and mutations
  library.ts - In-memory LIBRARY storage implementation
  storage.ts - Storage interface (not used for this app)
```

## Design System
- **Primary Color**: Blue (#0ea5e9) for CTAs and accents
- **Rating Colors**: Green (9-10), Teal (7-8), Amber (5-6), Red (1-4)
- **Typography**: Inter font family
- **Spacing**: Consistent 4/6/8/12 scale
- **Components**: Shadcn UI with hover elevations and smooth transitions
