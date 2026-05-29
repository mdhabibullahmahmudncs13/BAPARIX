# Market Sizing (TAM/SAM/SOM) Display Implementation

## Overview

This document describes the implementation of Task 10.5: Market Sizing (TAM/SAM/SOM) display for the Business Blueprint Viewer component.

## Implementation Summary

### Components Modified

1. **BlueprintViewer.tsx**
   - Added `renderMarketSizing()` function to display market sizing data
   - Implemented three collapsible sections:
     - Market Size Numbers (TAM, SAM, SOM cards)
     - Market Funnel Visualization (visual funnel representation)
     - Calculation Methodology (explanation of how numbers were calculated)

### Features Implemented

#### 1. Market Size Numbers Display
- **TAM (Total Addressable Market)**: Blue card showing total market opportunity
- **SAM (Serviceable Addressable Market)**: Green card showing serviceable portion
- **SOM (Serviceable Obtainable Market)**: Purple card showing realistic capture

Each card displays:
- Formatted currency amount (৳ symbol with locale-aware number formatting)
- Description of what the metric represents
- Percentage of TAM (for SAM and SOM)

#### 2. Visual Funnel Representation
- Three-tier funnel showing TAM → SAM → SOM progression
- Color-coded gradient bars:
  - TAM: Blue gradient (100% width)
  - SAM: Green gradient (proportional width based on % of TAM)
  - SOM: Purple gradient (proportional width based on % of TAM)
- Arrows between sections to show progression
- Percentage labels on each funnel section
- Responsive design with minimum widths for readability

#### 3. Funnel Legend
- Information icon with explanatory text
- Detailed explanations for each metric:
  - TAM: Entire revenue opportunity at 100% market share
  - SAM: Segment reachable with current business model
  - SOM: Realistic market share in first 1-3 years

#### 4. Methodology Section
- Displays the calculation methodology text
- Supports multi-line text with proper formatting
- Collapsible for better organization

### Accessibility Features

1. **ARIA Labels**
   - Funnel sections have `role="img"` with descriptive `aria-label`
   - Collapsible sections have proper `aria-expanded` and `aria-controls` attributes
   - Icons have `aria-hidden="true"` to hide decorative elements from screen readers

2. **Keyboard Navigation**
   - All interactive elements (collapsible section buttons) are keyboard accessible
   - Proper focus management

3. **Visual Accessibility**
   - Color-blind friendly palette (blue, green, purple)
   - High contrast text on colored backgrounds
   - Clear visual hierarchy

### Responsive Design

1. **Mobile (<768px)**
   - Single-column layout for metric cards
   - Funnel maintains proportions with minimum widths
   - Touch-friendly collapsible sections

2. **Desktop (>=768px)**
   - Three-column grid for metric cards
   - Wider funnel visualization
   - Side-by-side layout where appropriate

### Internationalization

All text is fully bilingual (Bengali/English) using next-intl:

**English Translations:**
- market.tam: "TAM (Total Addressable Market)"
- market.sam: "SAM (Serviceable Addressable Market)"
- market.som: "SOM (Serviceable Obtainable Market)"
- market.tamDescription: "The total market demand for your product or service"
- market.samDescription: "The portion of TAM you can realistically serve"
- market.somDescription: "The portion of SAM you can capture in the near term"
- market.ofTAM: "of TAM"
- market.marketFunnel: "Market Funnel Visualization"
- market.funnelDescription: "This funnel shows how your addressable market narrows from total opportunity to realistic capture."
- market.understandingFunnel: "Understanding the Market Funnel"
- market.tamExplanation: "The entire revenue opportunity if you achieved 100% market share in your category."
- market.samExplanation: "The segment of TAM you can reach with your current business model, channels, and resources."
- market.somExplanation: "The realistic market share you can capture in the first 1-3 years given competition and constraints."
- market.methodology: "Calculation Methodology"

**Bengali Translations:**
- Corresponding Bengali translations provided in `bn/common.json`

### Data Model

```typescript
interface MarketSizing {
  tam: number;        // Total Addressable Market in BDT
  sam: number;        // Serviceable Addressable Market in BDT
  som: number;        // Serviceable Obtainable Market in BDT
  methodology: string; // Explanation of calculation methodology
}
```

### Testing

Comprehensive test coverage added to `BlueprintViewer.test.tsx`:

1. **Display Tests**
   - Verifies TAM, SAM, SOM numbers are displayed
   - Checks formatted currency display
   - Validates percentage calculations
   - Confirms descriptions are shown

2. **Funnel Visualization Tests**
   - Verifies funnel structure (TAM → SAM → SOM)
   - Checks gradient colors
   - Validates arrows between sections
   - Confirms 100% display for TAM
   - Tests proportional widths

3. **Collapsible Section Tests**
   - Tests expand/collapse functionality
   - Verifies state persistence across tab switches
   - Checks ARIA attributes

4. **Accessibility Tests**
   - Validates ARIA labels on funnel sections
   - Checks role attributes
   - Verifies color-coded cards

5. **Responsive Design Tests**
   - Tests grid layout responsiveness
   - Validates mobile and desktop layouts

6. **Internationalization Tests**
   - Tests locale-aware number formatting
   - Validates bilingual text display

7. **Edge Cases**
   - Tests placeholder display when data is missing
   - Validates proper handling of undefined marketSizing

**Test Results:** All 89 tests passing ✅

### Files Modified

1. `ventureos-ui/components/features/BlueprintViewer.tsx`
   - Added `renderMarketSizing()` function
   - Integrated market sizing display into tab content

2. `ventureos-ui/public/locales/en/common.json`
   - Added market sizing translation keys

3. `ventureos-ui/public/locales/bn/common.json`
   - Added Bengali translations for market sizing

4. `ventureos-ui/components/features/BlueprintViewer.test.tsx`
   - Added mock market sizing data
   - Added 25+ new test cases for market sizing functionality

### Usage Example

```typescript
const blueprint: BusinessBlueprint = {
  // ... other blueprint data
  marketSizing: {
    tam: 50000000,  // ৳50 million
    sam: 15000000,  // ৳15 million (30% of TAM)
    som: 3000000,   // ৳3 million (6% of TAM)
    methodology: 'Market sizing calculated based on:\n\n1. TAM: Total wireless earbuds market in Bangladesh...\n\n2. SAM: Serviceable market limited to metro areas...\n\n3. SOM: Realistic first-year capture...'
  }
};

<BlueprintViewer blueprint={blueprint} locale="en" />
```

### Design Decisions

1. **Funnel Visualization**: Chose a vertical funnel layout for better mobile responsiveness and clearer visual hierarchy

2. **Color Scheme**: Used blue (TAM), green (SAM), purple (SOM) for color-blind friendliness and visual distinction

3. **Collapsible Sections**: Made all sections collapsible to allow users to focus on specific information

4. **Percentage Display**: Show both absolute values and percentages to provide context

5. **Methodology Section**: Separate section for methodology to keep the main display clean while providing detailed explanation

### Requirements Satisfied

✅ **Requirement 6.4**: Display TAM/SAM/SOM market sizing analysis
- Market size numbers displayed with methodology
- Visual funnel representation showing TAM → SAM → SOM
- Collapsible sections for organization
- Bilingual support (Bengali/English)
- Responsive design (mobile and desktop)
- Accessibility compliant (WCAG 2.1 AA)
- Comprehensive test coverage

### Future Enhancements

Potential improvements for future iterations:

1. **Interactive Funnel**: Allow users to adjust assumptions and see real-time updates
2. **Comparison View**: Compare market sizing across different product ideas
3. **Export**: Add ability to export market sizing data as image or PDF
4. **Historical Data**: Show how market sizing estimates change over time
5. **Confidence Intervals**: Display confidence ranges for each metric
6. **Market Segmentation**: Break down SAM/SOM by customer segments or regions

## Conclusion

The market sizing display has been successfully implemented with full functionality, comprehensive testing, and adherence to all design requirements. The implementation provides users with clear, accessible, and visually appealing market sizing information to support their business planning decisions.
