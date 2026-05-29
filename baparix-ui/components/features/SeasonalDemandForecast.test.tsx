import { render, screen } from '@testing-library/react';
import { SeasonalDemandForecast, SeasonalForecast } from './SeasonalDemandForecast';

// Override the global next-intl mock with a translation-aware version
jest.mock('next-intl', () => ({
  useTranslations: () => {
    const translations: Record<string, string> = {
      'title': 'Seasonal Demand Forecasts',
      'timeframe': 'Timeframe',
      'confidenceScore': 'Confidence Score',
      'keyProducts': 'Key Products',
      'peakMonths': 'Peak Months',
      'demandLevels.high': 'High Demand',
      'demandLevels.medium': 'Medium Demand',
      'demandLevels.low': 'Low Demand',
      'seasons.eid.name': 'Eid Season',
      'seasons.eid.description': 'High demand for clothing, gifts, home decor, and jewelry during Eid celebrations',
      'seasons.winter.name': 'Winter Season',
      'seasons.winter.description': 'Increased demand for warm clothing, blankets, and heating accessories',
      'seasons.school.name': 'School Season',
      'seasons.school.description': 'High demand for school uniforms, bags, stationery, and shoes during back-to-school period',
      'seasons.monsoon.name': 'Monsoon Season',
      'seasons.monsoon.description': 'Trending waterproof items, umbrellas, rain gear, and protective accessories',
      'products.clothing': 'Clothing',
      'products.gifts': 'Gifts',
      'products.homeDecor': 'Home Decor',
      'products.jewelry': 'Jewelry',
      'products.jackets': 'Jackets',
      'products.sweaters': 'Sweaters',
      'products.blankets': 'Blankets',
      'products.heaters': 'Heaters',
      'products.uniforms': 'Uniforms',
      'products.bags': 'Bags',
      'products.stationery': 'Stationery',
      'products.shoes': 'Shoes',
      'products.raincoats': 'Raincoats',
      'products.umbrellas': 'Umbrellas',
      'products.waterproofBags': 'Waterproof Bags',
      'products.boots': 'Boots',
    };
    return (key: string) => translations[key] || key;
  },
  useLocale: () => 'en',
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockForecasts: SeasonalForecast[] = [
  {
    id: '1',
    season: 'eid',
    demandLevel: 'high',
    confidenceScore: 92,
    timeframe: 'Mar-Apr 2024',
    keyProducts: ['clothing', 'gifts', 'homeDecor', 'jewelry'],
    demandIndicators: ['searchVolume', 'socialMentions', 'historicalData'],
    peakMonths: ['March', 'April'],
  },
  {
    id: '2',
    season: 'winter',
    demandLevel: 'medium',
    confidenceScore: 85,
    timeframe: 'Dec 2024 - Jan 2025',
    keyProducts: ['jackets', 'sweaters', 'blankets', 'heaters'],
    demandIndicators: ['temperature', 'historicalSales', 'searchTrends'],
    peakMonths: ['December', 'January'],
  },
];

const renderComponent = (component: React.ReactElement) => {
  return render(component);
};

describe('SeasonalDemandForecast', () => {
  describe('Default View', () => {
    it('renders all seasonal forecasts with default data', () => {
      renderComponent(<SeasonalDemandForecast />);

      expect(screen.getByText('Eid Season')).toBeInTheDocument();
      expect(screen.getByText('Winter Season')).toBeInTheDocument();
      expect(screen.getByText('School Season')).toBeInTheDocument();
      expect(screen.getByText('Monsoon Season')).toBeInTheDocument();
    });

    it('displays demand levels correctly', () => {
      renderComponent(<SeasonalDemandForecast forecasts={mockForecasts} />);

      expect(screen.getByText('High Demand')).toBeInTheDocument();
      expect(screen.getByText('Medium Demand')).toBeInTheDocument();
    });

    it('displays confidence scores', () => {
      renderComponent(<SeasonalDemandForecast forecasts={mockForecasts} />);

      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('displays timeframes', () => {
      renderComponent(<SeasonalDemandForecast forecasts={mockForecasts} />);

      expect(screen.getByText('Mar-Apr 2024')).toBeInTheDocument();
      expect(screen.getByText('Dec 2024 - Jan 2025')).toBeInTheDocument();
    });

    it('displays key products as badges', () => {
      renderComponent(<SeasonalDemandForecast forecasts={mockForecasts} />);

      expect(screen.getByText('Clothing')).toBeInTheDocument();
      expect(screen.getByText('Gifts')).toBeInTheDocument();
      expect(screen.getByText('Home Decor')).toBeInTheDocument();
      expect(screen.getByText('Jewelry')).toBeInTheDocument();
      expect(screen.getByText('Jackets')).toBeInTheDocument();
      expect(screen.getByText('Sweaters')).toBeInTheDocument();
    });

    it('displays peak months', () => {
      renderComponent(<SeasonalDemandForecast forecasts={mockForecasts} />);

      expect(screen.getByText('March, April')).toBeInTheDocument();
      expect(screen.getByText('December, January')).toBeInTheDocument();
    });

    it('displays seasonal descriptions', () => {
      renderComponent(<SeasonalDemandForecast forecasts={mockForecasts} />);

      expect(
        screen.getByText(/High demand for clothing, gifts, home decor, and jewelry/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Increased demand for warm clothing, blankets/)
      ).toBeInTheDocument();
    });
  });

  describe('Compact View', () => {
    it('renders compact layout when compact prop is true', () => {
      renderComponent(<SeasonalDemandForecast forecasts={mockForecasts} compact={true} />);

      expect(screen.getByText('Eid Season')).toBeInTheDocument();
      expect(screen.getByText('Winter Season')).toBeInTheDocument();
    });

    it('displays demand levels in compact view', () => {
      renderComponent(<SeasonalDemandForecast forecasts={mockForecasts} compact={true} />);

      expect(screen.getByText('High Demand')).toBeInTheDocument();
      expect(screen.getByText('Medium Demand')).toBeInTheDocument();
    });

    it('does not display confidence scores in compact view', () => {
      renderComponent(<SeasonalDemandForecast forecasts={mockForecasts} compact={true} />);

      expect(screen.queryByText('Confidence Score')).not.toBeInTheDocument();
      expect(screen.queryByText('92%')).not.toBeInTheDocument();
    });

    it('does not display key products in compact view', () => {
      renderComponent(<SeasonalDemandForecast forecasts={mockForecasts} compact={true} />);

      expect(screen.queryByText('Key Products')).not.toBeInTheDocument();
    });
  });

  describe('Visual Indicators', () => {
    it('applies correct color scheme for each season', () => {
      const { container } = renderComponent(
        <SeasonalDemandForecast forecasts={mockForecasts} />
      );

      const eidCard = container.querySelector('.bg-purple-50');
      const winterCard = container.querySelector('.bg-blue-50');

      expect(eidCard).toBeInTheDocument();
      expect(winterCard).toBeInTheDocument();
    });

    it('renders confidence score progress bars', () => {
      renderComponent(<SeasonalDemandForecast forecasts={mockForecasts} />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(2);

      expect(progressBars[0]).toHaveAttribute('aria-valuenow', '92');
      expect(progressBars[1]).toHaveAttribute('aria-valuenow', '85');
    });

    it('applies correct color to confidence score bars based on score', () => {
      const lowConfidenceForecast: SeasonalForecast = {
        id: '3',
        season: 'monsoon',
        demandLevel: 'low',
        confidenceScore: 55,
        timeframe: 'Jun-Sep 2024',
        keyProducts: ['raincoats'],
        demandIndicators: ['weatherForecast'],
        peakMonths: ['June'],
      };

      const { container } = renderComponent(
        <SeasonalDemandForecast forecasts={[lowConfidenceForecast]} />
      );

      const progressBar = container.querySelector('.bg-orange-500');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA hidden attributes for decorative icons', () => {
      const { container } = renderComponent(<SeasonalDemandForecast forecasts={mockForecasts} />);

      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('has proper ARIA attributes for progress bars', () => {
      renderComponent(<SeasonalDemandForecast forecasts={mockForecasts} />);

      const progressBars = screen.getAllByRole('progressbar');
      progressBars.forEach((bar) => {
        expect(bar).toHaveAttribute('aria-valuenow');
        expect(bar).toHaveAttribute('aria-valuemin', '0');
        expect(bar).toHaveAttribute('aria-valuemax', '100');
        expect(bar).toHaveAttribute('aria-label');
      });
    });

    it('provides descriptive labels for confidence scores', () => {
      renderComponent(<SeasonalDemandForecast forecasts={mockForecasts} />);

      expect(screen.getByLabelText(/Confidence Score: 92%/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confidence Score: 85%/)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders nothing when forecasts array is empty', () => {
      const { container } = renderComponent(<SeasonalDemandForecast forecasts={[]} />);

      expect(container.innerHTML).toBe('');
    });
  });

  describe('Demand Level Variations', () => {
    it('renders low demand level correctly', () => {
      const lowDemandForecast: SeasonalForecast = {
        id: '1',
        season: 'monsoon',
        demandLevel: 'low',
        confidenceScore: 70,
        timeframe: 'Jun-Sep 2024',
        keyProducts: ['raincoats'],
        demandIndicators: ['weatherForecast'],
        peakMonths: ['June'],
      };

      renderComponent(<SeasonalDemandForecast forecasts={[lowDemandForecast]} />);

      expect(screen.getByText('Low Demand')).toBeInTheDocument();
    });

    it('applies correct badge variant for each demand level', () => {
      const allLevelForecasts: SeasonalForecast[] = [
        {
          id: '1',
          season: 'eid',
          demandLevel: 'high',
          confidenceScore: 90,
          timeframe: 'Mar-Apr 2024',
          keyProducts: ['clothing'],
          demandIndicators: ['searchVolume'],
          peakMonths: ['March'],
        },
        {
          id: '2',
          season: 'winter',
          demandLevel: 'medium',
          confidenceScore: 80,
          timeframe: 'Dec 2024',
          keyProducts: ['jackets'],
          demandIndicators: ['temperature'],
          peakMonths: ['December'],
        },
        {
          id: '3',
          season: 'monsoon',
          demandLevel: 'low',
          confidenceScore: 70,
          timeframe: 'Jun 2024',
          keyProducts: ['raincoats'],
          demandIndicators: ['weatherForecast'],
          peakMonths: ['June'],
        },
      ];

      renderComponent(<SeasonalDemandForecast forecasts={allLevelForecasts} />);

      expect(screen.getByText('High Demand')).toBeInTheDocument();
      expect(screen.getByText('Medium Demand')).toBeInTheDocument();
      expect(screen.getByText('Low Demand')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('uses grid layout for default view', () => {
      const { container } = renderComponent(
        <SeasonalDemandForecast forecasts={mockForecasts} />
      );

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2');
    });

    it('uses vertical stack layout for compact view', () => {
      const { container } = renderComponent(
        <SeasonalDemandForecast forecasts={mockForecasts} compact={true} />
      );

      const stackContainer = container.querySelector('.space-y-3');
      expect(stackContainer).toBeInTheDocument();
    });
  });
});
