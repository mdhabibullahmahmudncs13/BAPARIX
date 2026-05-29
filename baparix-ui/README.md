# BAPARIX UI

AI-powered business intelligence and product sourcing platform for Bangladeshi entrepreneurs.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom Bengali typography
- **State Management**: Zustand for client state, React Query for server state
- **Internationalization**: next-intl (Bengali and English)
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts

## Project Structure

```
baparix-ui/
├── app/
│   ├── [locale]/           # Internationalized routes
│   │   ├── layout.tsx      # Locale-specific layout with providers
│   │   ├── page.tsx        # Home page
│   │   ├── dashboard/      # Dashboard module
│   │   └── providers.tsx   # React Query provider
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Root redirect
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # Base UI components
│   ├── features/           # Feature-specific components
│   ├── layouts/            # Layout components
│   └── shared/             # Shared components
├── lib/
│   ├── api/                # API client
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand stores
│   ├── utils/              # Utility functions
│   └── validations/        # Zod schemas
├── public/
│   └── locales/            # Translation files
│       ├── bn/             # Bengali translations
│       └── en/             # English translations
├── i18n.ts                 # Internationalization config
├── middleware.ts           # Next.js middleware for locale handling
└── tailwind.config.ts      # Tailwind configuration
```

## Features Implemented

### Task 1: Core Infrastructure ✅

- ✅ Next.js 14 with TypeScript and App Router
- ✅ Tailwind CSS with custom configuration
  - Color-blind friendly palette
  - Bengali typography support (Noto Sans Bengali)
  - English typography support (Inter)
  - Responsive breakpoints
  - Touch-friendly spacing (44px minimum)
- ✅ Core dependencies installed:
  - next-intl for internationalization
  - Zustand for state management
  - React Query for data fetching
  - React Hook Form for forms
  - Zod for validation
  - Recharts for data visualization
- ✅ Project structure with organized directories
- ✅ Internationalization configured:
  - Bengali (bn) and English (en) locales
  - ICU MessageFormat support
  - Locale-based routing (/en/*, /bn/*)
  - Automatic locale detection
  - Cookie-based locale persistence
- ✅ Root layout with:
  - Locale provider (NextIntlClientProvider)
  - React Query provider
  - Google Fonts optimization (Noto Sans Bengali, Inter)
  - Responsive font switching based on locale

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Development

The development server runs on [http://localhost:3000](http://localhost:3000).

- Visit `/` to be redirected to `/en` (default locale)
- Visit `/en` or `/bn` for English or Bengali versions
- Visit `/en/dashboard` or `/bn/dashboard` for the dashboard

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Internationalization

### Adding Translations

1. Add keys to `public/locales/en/common.json` (English)
2. Add corresponding keys to `public/locales/bn/common.json` (Bengali)
3. Use in components:

```tsx
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations();
  return <h1>{t('navigation.dashboard')}</h1>;
}
```

### Locale Switching

The middleware automatically handles locale detection and routing. Users can switch languages by navigating to `/en/*` or `/bn/*` routes.

## Styling

### Tailwind Configuration

Custom color palette (color-blind friendly):
- Primary: Blue shades
- Secondary: Orange shades
- Success: Green shades
- Warning: Yellow shades
- Error: Red shades

### Typography

- Bengali: Noto Sans Bengali (Google Fonts)
- English: Inter (Google Fonts)
- Automatic font switching based on locale
- Optimized line heights for Bengali readability

### Responsive Design

- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: 1024px - 1279px
- Wide: >= 1280px

Touch targets on mobile are minimum 44x44px for accessibility.

## Next Steps

- Implement authentication system (Task 2)
- Build core UI component library (Task 3)
- Add language toggle component (Task 4)
- Create responsive dashboard layout (Task 5)

## Requirements Addressed

- **Requirement 1.1**: UI displays all interface text in Bengali and English ✅
- **Requirement 1.2**: Language toggle switches text within 200ms (infrastructure ready)
- **Requirement 1.3**: Language preference persists across sessions (cookie-based) ✅
- **Requirement 2.1**: Mobile viewport layout support (< 768px) ✅
- **Requirement 2.2**: Desktop viewport layout support (>= 768px) ✅

## License

Proprietary - BAPARIX
