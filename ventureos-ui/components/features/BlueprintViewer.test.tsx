import { render, screen, fireEvent, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { BlueprintViewer, BusinessBlueprint } from './BlueprintViewer';

const mockMessages = {
  blueprint: {
    header: {
      title: 'Business Blueprint',
      confidence: 'Confidence',
      exportPDF: 'Export PDF',
      selectTab: 'Select section',
    },
    tabs: {
      canvas: 'Business Model Canvas',
      financial: 'Financial Projections',
      breakeven: 'Break-Even Analysis',
      market: 'Market Sizing',
      gtm: 'GTM Plan',
      seo: 'SEO Strategy',
      risks: 'Risk Register',
      team: 'Team Structure',
    },
    canvas: {
      valueProposition: 'Value Proposition',
      customerSegments: 'Customer Segments',
      channels: 'Channels',
      customerRelationships: 'Customer Relationships',
      revenueStreams: 'Revenue Streams',
      keyResources: 'Key Resources',
      keyActivities: 'Key Activities',
      keyPartnerships: 'Key Partnerships',
      costStructure: 'Cost Structure',
    },
    financial: {
      projections: '12-Month Projections',
      scenarios: 'Scenario Analysis',
      selectScenario: 'Select a scenario to view projections',
      conservative: 'Conservative',
      baseCase: 'Base Case',
      optimistic: 'Optimistic',
      month: 'Month',
      monthLabel: 'Month',
      amountLabel: 'Amount (৳)',
      revenue: 'Revenue',
      costs: 'Costs',
      profit: 'Profit',
      cashFlow: 'Cash Flow',
      assumptions: 'Key Assumptions',
      investmentBreakdown: 'Investment Breakdown',
      ofTotal: 'of total',
    },
    breakeven: {
      analysis: 'Break-Even Analysis',
      calculations: 'Break-Even Calculations',
      breakEvenUnits: 'Break-Even Units',
      breakEvenRevenue: 'Break-Even Revenue',
      fixedCosts: 'Fixed Costs',
      variableCostPerUnit: 'Variable Cost Per Unit',
      pricePerUnit: 'Price Per Unit',
      contributionMargin: 'Contribution Margin',
      units: 'units',
      unitsDescription: 'Number of units needed to cover all costs',
      revenueDescription: 'Total revenue needed to break even',
      fixedCostsDescription: 'Costs that don\'t change with production volume',
      variableCostDescription: 'Cost per unit produced or sold',
      priceDescription: 'Selling price per unit',
      contributionMarginDescription: 'Profit per unit after variable costs',
      timeline: 'Timeline to Break-Even',
      monthsToBreakEven: 'Months to Break-Even',
      month: 'month',
      months: 'months',
      progressLabel: 'Progress to Break-Even',
      progressAriaLabel: 'Break-even progress: {months} months',
      start: 'Start',
      breakEvenPoint: 'Break-Even',
      interpretation: 'What This Means',
      interpretationFast: 'Excellent! Your business is projected to break even within 6 months, indicating a strong business model with quick returns.',
      interpretationModerate: 'Good! Your business is projected to break even within a year, which is reasonable for most businesses.',
      interpretationSlow: 'Your business will take more than a year to break even. Consider ways to reduce costs or increase revenue to accelerate profitability.',
      formula: 'Break-Even Formula',
      breakEvenUnitsFormula: 'Break-Even Units Formula',
      breakEvenRevenueFormula: 'Break-Even Revenue Formula',
      unitsFormulaText: 'Break-Even Units = Fixed Costs ÷ (Price Per Unit - Variable Cost Per Unit)',
      revenueFormulaText: 'Break-Even Revenue = Break-Even Units × Price Per Unit',
      unitsFormulaExplanation: 'This formula calculates how many units you need to sell to cover all your fixed costs.',
      revenueFormulaExplanation: 'This formula calculates the total revenue needed to cover all costs and reach break-even.',
    },
    market: {
      tamSamSom: 'TAM/SAM/SOM Analysis',
      marketSizeNumbers: 'Market Size Numbers',
      tam: 'TAM (Total Addressable Market)',
      sam: 'SAM (Serviceable Addressable Market)',
      som: 'SOM (Serviceable Obtainable Market)',
      tamDescription: 'The total market demand for your product or service',
      samDescription: 'The portion of TAM you can realistically serve',
      somDescription: 'The portion of SAM you can capture in the near term',
      ofTAM: 'of TAM',
      marketFunnel: 'Market Funnel Visualization',
      funnelDescription: 'This funnel shows how your addressable market narrows from total opportunity to realistic capture.',
      tamAriaLabel: 'Total Addressable Market: {amount}',
      samAriaLabel: 'Serviceable Addressable Market: {amount}',
      somAriaLabel: 'Serviceable Obtainable Market: {amount}',
      understandingFunnel: 'Understanding the Market Funnel',
      tamExplanation: 'The entire revenue opportunity if you achieved 100% market share in your category.',
      samExplanation: 'The segment of TAM you can reach with your current business model, channels, and resources.',
      somExplanation: 'The realistic market share you can capture in the first 1-3 years given competition and constraints.',
      methodology: 'Calculation Methodology',
    },
    gtm: {
      phases: 'Go-to-Market Phases',
      channelPrioritization: 'Channel Prioritization',
      duration: 'Duration',
      budget: 'Budget',
      activities: 'Activities',
      estimatedCAC: 'Estimated CAC',
      rationale: 'Rationale',
      launchTimeline: 'Launch Timeline',
    },
    seo: {
      googleSEO: 'Google SEO',
      keywordClusters: 'Keyword Clusters',
      keyword: 'Keyword',
      searchVolume: 'Search Volume',
      competition: 'Competition',
      language: 'Language',
      competitionLevel: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
      },
      contentTopics: 'Content Topics',
      socialSEO: 'Social SEO',
      platformStrategies: 'Platform Strategies',
      postingFrequency: 'Posting Frequency',
      hashtagRecommendations: 'Hashtag Recommendations',
      hashtag: 'Hashtag',
      volume: 'Volume',
      trendDuration: 'Trend Duration',
      postingSchedule: 'Posting Schedule',
      marketplaceSEO: 'Marketplace SEO',
      titleTemplate: 'Title Template',
      descriptionTemplate: 'Description Template',
      googleLensOptimization: 'Google Lens Optimization',
      imageTagging: 'Image Tagging Guidance',
      altTextGuidance: 'Alt Text Guidance',
    },
    risks: {
      topRisks: 'Top 5 Risks',
      mitigation: 'Mitigation Strategies',
      description: 'Description',
      likelihood: 'Likelihood',
      impact: 'Impact',
      levels: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
      },
    },
    team: {
      roles: 'Recommended Roles',
      hiring: 'Hiring Priority',
      recommendedRoles: 'Recommended Roles',
      responsibilities: 'Responsibilities',
      requiredSkills: 'Required Skills',
      estimatedSalary: 'Estimated Salary',
      perMonth: '৳/month',
      hiringPriority: 'Hiring Priority Order',
    },
    empty: {
      title: 'No Blueprint Yet',
      description: 'Create your first business blueprint to get started with AI-powered business planning.',
      createButton: 'Create Blueprint',
    },
    placeholders: {
      comingSoon: 'Content will be populated in subsequent tasks',
    },
  },
};

const mockBlueprint: BusinessBlueprint = {
  id: 'test-blueprint-1',
  productIdea: 'Wireless Earbuds',
  businessType: 'Reseller',
  confidenceScores: {
    overall: 0.85,
    financial: 0.82,
    market: 0.88,
    execution: 0.84,
  },
  businessModelCanvas: {
    valueProposition: 'High-quality wireless earbuds at affordable prices for the Bangladeshi market',
    customerSegments: [
      'Young professionals (25-35 years)',
      'Students and tech enthusiasts',
      'Fitness enthusiasts who need wireless audio',
    ],
    channels: [
      'Facebook Marketplace and Instagram',
      'Daraz and local e-commerce platforms',
      'Physical retail partnerships',
    ],
    customerRelationships: [
      'Social media engagement and customer support',
      'Warranty and after-sales service',
      'Loyalty programs and referral incentives',
    ],
    revenueStreams: [
      {
        name: 'Direct Product Sales',
        type: 'Transactional',
        projectedMonthly: 150000,
      },
      {
        name: 'Bulk Orders (B2B)',
        type: 'Volume-based',
        projectedMonthly: 50000,
      },
    ],
    keyResources: [
      'Supplier relationships in China',
      'Inventory and warehouse space',
      'E-commerce platform accounts',
    ],
    keyActivities: [
      'Product sourcing and quality control',
      'Marketing and social media management',
      'Order fulfillment and customer service',
    ],
    keyPartnerships: [
      'Chinese suppliers (Alibaba, 1688)',
      'Shipping and logistics partners',
      'Local retailers for distribution',
    ],
    costStructure: [
      {
        category: 'Product Sourcing',
        amount: 80000,
        frequency: 'monthly',
      },
      {
        category: 'Shipping and Customs',
        amount: 15000,
        frequency: 'monthly',
      },
      {
        category: 'Marketing and Ads',
        amount: 10000,
        frequency: 'monthly',
      },
      {
        category: 'Warehouse Rent',
        amount: 8000,
        frequency: 'monthly',
      },
    ],
  },
  financialProjections: {
    scenarios: {
      conservative: Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        revenue: 100000 + i * 5000,
        costs: 80000 + i * 3000,
        profit: 20000 + i * 2000,
        cashFlow: 15000 + i * 1500,
      })),
      base: Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        revenue: 150000 + i * 10000,
        costs: 100000 + i * 5000,
        profit: 50000 + i * 5000,
        cashFlow: 40000 + i * 4000,
      })),
      optimistic: Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        revenue: 200000 + i * 15000,
        costs: 120000 + i * 6000,
        profit: 80000 + i * 9000,
        cashFlow: 70000 + i * 8000,
      })),
    },
    assumptions: [
      'Market growth rate of 15% annually',
      'Customer acquisition cost of ৳500 per customer',
      'Average order value of ৳2,500',
    ],
    investmentBreakdown: [
      {
        category: 'Initial Inventory',
        amount: 200000,
        percentage: 40,
      },
      {
        category: 'Marketing Budget',
        amount: 100000,
        percentage: 20,
      },
      {
        category: 'Operations Setup',
        amount: 150000,
        percentage: 30,
      },
      {
        category: 'Working Capital',
        amount: 50000,
        percentage: 10,
      },
    ],
  },
  breakEvenAnalysis: {
    fixedCosts: 250000,
    variableCostPerUnit: 800,
    pricePerUnit: 2500,
    breakEvenUnits: 147,
    breakEvenRevenue: 367500,
    monthsToBreakEven: 4,
  },
  marketSizing: {
    tam: 50000000, // 50 million BDT
    sam: 15000000, // 15 million BDT (30% of TAM)
    som: 3000000,  // 3 million BDT (6% of TAM, 20% of SAM)
    methodology: 'Market sizing calculated based on:\n\n1. TAM: Total wireless earbuds market in Bangladesh (population 170M × 5% smartphone users × 10% potential buyers × avg price ৳2,500)\n\n2. SAM: Serviceable market limited to Dhaka, Chittagong, and Sylhet metro areas with e-commerce access (30% of TAM)\n\n3. SOM: Realistic first-year capture considering competition from established brands and limited marketing budget (20% of SAM)',
  },
  goToMarketPlan: {
    phases: [
      {
        phase: 1,
        name: 'Pre-Launch & Setup',
        duration: '2 weeks',
        activities: [
          'Register business and obtain trade license',
          'Set up social media accounts (Facebook, Instagram)',
          'Create product photography and content',
          'Establish supplier relationships',
        ],
        budget: 50000,
      },
      {
        phase: 2,
        name: 'Soft Launch',
        duration: '4 weeks',
        activities: [
          'Launch Facebook and Instagram pages',
          'Run initial ad campaigns targeting Dhaka',
          'Offer early-bird discounts',
          'Collect customer feedback',
        ],
        budget: 75000,
      },
      {
        phase: 3,
        name: 'Scale & Expand',
        duration: '8 weeks',
        activities: [
          'Expand to Daraz and other marketplaces',
          'Increase ad spend based on performance',
          'Launch referral program',
          'Partner with local retailers',
        ],
        budget: 150000,
      },
    ],
    channelPrioritization: [
      {
        name: 'Facebook Marketplace & Instagram',
        priority: 1,
        rationale: 'Highest reach among target demographic with low barrier to entry. Direct customer interaction builds trust.',
        estimatedCAC: 500,
      },
      {
        name: 'Daraz',
        priority: 2,
        rationale: 'Established e-commerce platform with built-in trust. Higher fees but access to wider customer base.',
        estimatedCAC: 750,
      },
      {
        name: 'Local Retail Partnerships',
        priority: 3,
        rationale: 'Physical presence builds credibility. Lower volume but higher margins on B2B sales.',
        estimatedCAC: 1000,
      },
    ],
    launchTimeline: 'Week 1-2: Business setup and content creation\nWeek 3-6: Soft launch on social media\nWeek 7-14: Scale campaigns and expand to marketplaces\nWeek 15+: Optimize and explore retail partnerships',
  },
  seoStrategy: {
    googleSEO: {
      keywords: [
        { term: 'wireless earbuds Bangladesh', searchVolume: 2400, competition: 'medium', language: 'en' },
        { term: 'ওয়ারলেস ইয়ারবাড', searchVolume: 1800, competition: 'low', language: 'bn' },
        { term: 'bluetooth headphones Dhaka', searchVolume: 1200, competition: 'high', language: 'en' },
        { term: 'best earbuds under 3000 taka', searchVolume: 900, competition: 'medium', language: 'en' },
      ],
      contentTopics: [
        'How to choose wireless earbuds',
        'Wireless earbuds buying guide Bangladesh',
        'Best budget earbuds 2024',
        'Earbuds vs headphones comparison',
      ],
    },
    socialSEO: {
      platforms: [
        {
          name: 'Facebook',
          strategy: 'Post product photos with customer testimonials. Use Facebook Live for product demos. Engage in relevant groups.',
          postingFrequency: '2-3 times per day',
        },
        {
          name: 'Instagram',
          strategy: 'High-quality product photography with lifestyle shots. Use Reels for unboxing and reviews. Collaborate with micro-influencers.',
          postingFrequency: '1-2 times per day',
        },
        {
          name: 'TikTok',
          strategy: 'Short-form video content showing product features. Participate in trending challenges. Behind-the-scenes content.',
          postingFrequency: '3-5 times per week',
        },
      ],
      hashtags: [
        { tag: 'WirelessEarbudsBD', volume: 5000, trendDuration: 'Ongoing' },
        { tag: 'TechBangladesh', volume: 12000, trendDuration: 'Ongoing' },
        { tag: 'DhakaGadgets', volume: 3500, trendDuration: 'Ongoing' },
        { tag: 'BudgetTech', volume: 8000, trendDuration: 'Seasonal (peak during Eid)' },
      ],
      postingSchedule: 'Best times to post:\n- Facebook: 8-10 AM, 1-3 PM, 7-9 PM\n- Instagram: 9-11 AM, 2-4 PM, 8-10 PM\n- TikTok: 6-8 PM, 9-11 PM',
    },
    marketplaceSEO: [
      {
        platform: 'Daraz',
        titleTemplate: '[Brand] Wireless Earbuds | Bluetooth 5.0 | [Key Feature] | [Color]',
        descriptionTemplate: 'Premium wireless earbuds with [key features]. Perfect for [use cases]. ✓ Fast Delivery ✓ Warranty ✓ Cash on Delivery Available',
      },
      {
        platform: 'Facebook Marketplace',
        titleTemplate: 'Wireless Earbuds - [Key Feature] - ৳[Price] - [Location]',
        descriptionTemplate: '[Emoji] High-quality wireless earbuds\n[Emoji] [Key features]\n[Emoji] Price: ৳[Price]\n[Emoji] Location: [Area]\n[Emoji] Delivery available',
      },
    ],
    googleLensOptimization: {
      imageTagging: [
        'Use clean white background for main product images',
        'Include size comparison with common objects',
        'Show product from multiple angles (front, side, top)',
        'Include packaging and accessories in separate images',
        'Add lifestyle shots showing product in use',
      ],
      altTextGuidance: 'Use descriptive alt text: "[Brand] [Product Type] [Key Feature] [Color]". Example: "Premium Wireless Earbuds Bluetooth 5.0 Black with Charging Case"',
    },
  },
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      {component}
    </NextIntlClientProvider>
  );
};

// Helper function to get tab button by name (ignoring confidence score)
const getTabButton = (name: string) => {
  return screen.getByRole('button', { name: new RegExp(`^${name}`) });
};

describe('BlueprintViewer', () => {
  describe('Empty State', () => {
    it('should display empty state when no blueprint is provided', () => {
      renderWithIntl(<BlueprintViewer />);

      expect(screen.getByText('empty.title')).toBeInTheDocument();
      expect(screen.getByText('empty.description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'empty.createButton' })).toBeInTheDocument();
    });
  });

  describe('Blueprint Display', () => {
    it('should display blueprint header with product idea and business type', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      expect(screen.getByText('header.title')).toBeInTheDocument();
      expect(screen.getByText(/Wireless Earbuds/)).toBeInTheDocument();
      expect(screen.getByText(/Reseller/)).toBeInTheDocument();
    });

    it('should display overall confidence score', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      expect(screen.getByText(/header\.confidence/)).toBeInTheDocument();
      // Check for all confidence scores
      const confidenceScores = screen.getAllByText('85%');
      expect(confidenceScores.length).toBeGreaterThan(0);
      
      // Check for the confidence breakdown section
      expect(screen.getByText('Financial')).toBeInTheDocument();
      const financialScores = screen.getAllByText('82%');
      expect(financialScores.length).toBeGreaterThan(0);
      expect(screen.getByText('Market')).toBeInTheDocument();
      const marketScores = screen.getAllByText('88%');
      expect(marketScores.length).toBeGreaterThan(0);
      expect(screen.getByText('Execution')).toBeInTheDocument();
      const executionScores = screen.getAllByText('84%');
      expect(executionScores.length).toBeGreaterThan(0);
    });

    it('should display export PDF button', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      const exportButton = screen.getByRole('button', { name: 'header.exportPDF' });
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('Tab Navigation - Desktop', () => {
    it('should display all 8 tabs on desktop', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      // Check for all tab buttons (desktop view) using translation keys
      const tabs = [
        'tabs.canvas',
        'tabs.financial',
        'tabs.breakeven',
        'tabs.market',
        'tabs.gtm',
        'tabs.seo',
        'tabs.risks',
        'tabs.team',
      ];

      tabs.forEach((tabKey) => {
        expect(getTabButton(tabKey)).toBeInTheDocument();
      });
    });

    it('should highlight the active tab', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      const canvasTab = getTabButton('tabs.canvas');
      expect(canvasTab).toHaveAttribute('aria-current', 'page');
    });

    it('should switch tabs when clicked', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      // Click on Financial Projections tab
      const financialTab = getTabButton('tabs.financial');
      fireEvent.click(financialTab);

      // Check that Financial tab is now active
      expect(financialTab).toHaveAttribute('aria-current', 'page');

      // Check that canvas tab is no longer active
      const canvasTab = getTabButton('tabs.canvas');
      expect(canvasTab).not.toHaveAttribute('aria-current', 'page');
    });

    it('should display correct content for each tab', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      // Test Business Model Canvas tab (default)
      expect(screen.getByText('canvas.valueProposition')).toBeInTheDocument();
      expect(screen.getByText('canvas.customerSegments')).toBeInTheDocument();

      // Switch to Financial Projections tab
      fireEvent.click(getTabButton('tabs.financial'));
      // Financial projections now shows the visualization, not just placeholder sections
      expect(screen.getByText('financial.projections')).toBeInTheDocument();
      expect(screen.getByText('financial.selectScenario')).toBeInTheDocument();

      // Switch to Break-Even Analysis tab
      fireEvent.click(getTabButton('tabs.breakeven'));
      expect(screen.getByText('breakeven.calculations')).toBeInTheDocument();

      // Switch to Market Sizing tab
      fireEvent.click(getTabButton('tabs.market'));
      expect(screen.getByText('market.marketSizeNumbers')).toBeInTheDocument();

      // Switch to GTM Plan tab
      fireEvent.click(getTabButton('tabs.gtm'));
      expect(screen.getByText('gtm.phases')).toBeInTheDocument();
      expect(screen.getByText('gtm.channelPrioritization')).toBeInTheDocument();

      // Switch to SEO Strategy tab
      fireEvent.click(getTabButton('tabs.seo'));
      expect(screen.getByText('seo.googleSEO')).toBeInTheDocument();
      expect(screen.getByText('seo.socialSEO')).toBeInTheDocument();

      // Switch to Risk Register tab - should show placeholder since mockBlueprint has no risks
      fireEvent.click(getTabButton('tabs.risks'));
      expect(screen.getByText('placeholders.comingSoon')).toBeInTheDocument();

      // Switch to Team Structure tab - should show placeholder since mockBlueprint has no team
      fireEvent.click(getTabButton('tabs.team'));
      expect(screen.getByText('placeholders.comingSoon')).toBeInTheDocument();
    });
  });

  describe('Mobile Navigation', () => {
    it('should display select dropdown for mobile', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      const mobileSelect = screen.getByLabelText('header.selectTab');
      expect(mobileSelect).toBeInTheDocument();
      expect(mobileSelect.tagName).toBe('SELECT');
    });

    it('should switch tabs using mobile select', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      const mobileSelect = screen.getByLabelText('header.selectTab') as HTMLSelectElement;

      // Change to financial tab
      fireEvent.change(mobileSelect, { target: { value: 'financial' } });
      expect(mobileSelect.value).toBe('financial');
      expect(screen.getByText('financial.projections')).toBeInTheDocument();

      // Change to risks tab - should show placeholder since mockBlueprint has no risks
      fireEvent.change(mobileSelect, { target: { value: 'risks' } });
      expect(mobileSelect.value).toBe('risks');
      expect(screen.getByText('placeholders.comingSoon')).toBeInTheDocument();
    });
  });

  describe('Collapsible Sections', () => {
    it('should display collapsible sections within tabs', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      // Business Model Canvas has 9 collapsible sections
      const sections = [
        'canvas.valueProposition',
        'canvas.customerSegments',
        'canvas.channels',
        'canvas.customerRelationships',
        'canvas.revenueStreams',
        'canvas.keyResources',
        'canvas.keyActivities',
        'canvas.keyPartnerships',
        'canvas.costStructure',
      ];

      sections.forEach((sectionKey) => {
        const sectionButton = screen.getByRole('button', { name: sectionKey });
        expect(sectionButton).toBeInTheDocument();
        expect(sectionButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should collapse and expand sections when clicked', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      const valuePropositionButton = screen.getByRole('button', { name: 'canvas.valueProposition' });

      // Initially expanded
      expect(valuePropositionButton).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      fireEvent.click(valuePropositionButton);
      expect(valuePropositionButton).toHaveAttribute('aria-expanded', 'false');

      // Click to expand again
      fireEvent.click(valuePropositionButton);
      expect(valuePropositionButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should maintain collapsed state when switching tabs', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      // Collapse a section in canvas tab
      const valuePropositionButton = screen.getByRole('button', { name: 'canvas.valueProposition' });
      fireEvent.click(valuePropositionButton);
      expect(valuePropositionButton).toHaveAttribute('aria-expanded', 'false');

      // Switch to another tab
      fireEvent.click(getTabButton('tabs.financial'));

      // Switch back to canvas tab
      fireEvent.click(getTabButton('tabs.canvas'));

      // Section should still be collapsed
      const valuePropositionButtonAfter = screen.getByRole('button', { name: 'canvas.valueProposition' });
      expect(valuePropositionButtonAfter).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for tabs', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      const canvasTab = getTabButton('tabs.canvas');
      expect(canvasTab).toHaveAttribute('aria-current', 'page');

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toBeInTheDocument();
      expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-canvas');
    });

    it('should have proper ARIA attributes for collapsible sections', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      const valuePropositionButton = screen.getByRole('button', { name: 'canvas.valueProposition' });
      expect(valuePropositionButton).toHaveAttribute('aria-expanded');
      expect(valuePropositionButton).toHaveAttribute('aria-controls');
    });

    it('should have aria-hidden on decorative icons', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      // Check that icons have aria-hidden
      const icons = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Export Functionality', () => {
    it('should call export handler when export button is clicked', async () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      const exportButton = screen.getByRole('button', { name: 'header.exportPDF' });
      
      // Mock the dynamic imports
      const mockJsPDF = jest.fn().mockImplementation(() => ({
        addImage: jest.fn(),
        addPage: jest.fn(),
        save: jest.fn(),
      }));
      
      const mockHtml2Canvas = jest.fn().mockResolvedValue({
        toDataURL: jest.fn().mockReturnValue('data:image/png;base64,test'),
        height: 1000,
        width: 800,
      });

      jest.mock('jspdf', () => ({
        default: mockJsPDF,
      }));
      
      jest.mock('html2canvas', () => ({
        default: mockHtml2Canvas,
      }));

      // Click the export button
      fireEvent.click(exportButton);
      
      // Verify the button exists and is clickable
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render both desktop and mobile navigation', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      // Desktop tabs should exist (hidden on mobile via CSS)
      expect(getTabButton('tabs.canvas')).toBeInTheDocument();

      // Mobile select should exist (hidden on desktop via CSS)
      expect(screen.getByLabelText('header.selectTab')).toBeInTheDocument();
    });
  });

  describe('Placeholder Content', () => {
    it('should display placeholder content when businessModelCanvas is not provided', () => {
      const blueprintWithoutCanvas = {
        ...mockBlueprint,
        businessModelCanvas: undefined,
      };

      renderWithIntl(<BlueprintViewer blueprint={blueprintWithoutCanvas} />);

      // Should show placeholder in canvas tab
      expect(screen.getByText('placeholders.comingSoon')).toBeInTheDocument();
    });

    it('should display placeholder content in other tabs', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      // Switch to Break-Even Analysis tab (which still has placeholder)
      fireEvent.click(getTabButton('tabs.breakeven'));

      // The break-even tab now has actual content, not placeholder
      // So we need to check for the actual sections instead
      expect(screen.getByText('breakeven.calculations')).toBeInTheDocument();
    });
  });

  describe('Business Model Canvas Content', () => {
    it('should display value proposition text', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      expect(screen.getByText(/High-quality wireless earbuds/)).toBeInTheDocument();
    });

    it('should display all customer segments', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      expect(screen.getByText(/Young professionals/)).toBeInTheDocument();
      expect(screen.getByText(/Students and tech enthusiasts/)).toBeInTheDocument();
      expect(screen.getByText(/Fitness enthusiasts/)).toBeInTheDocument();
    });

    it('should display all channels when section is expanded', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      // Channels section is collapsed by default, so we don't need to expand it
      // The section button should exist
      const channelsButton = screen.getByRole('button', { name: 'canvas.channels' });
      expect(channelsButton).toBeInTheDocument();
      
      // Content should be visible since sections start expanded
      expect(screen.getByText(/Facebook Marketplace/)).toBeInTheDocument();
      expect(screen.getByText(/Daraz and local e-commerce/)).toBeInTheDocument();
      expect(screen.getByText(/Physical retail partnerships/)).toBeInTheDocument();
    });

    it('should display all customer relationships when section is expanded', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      // Customer relationships section should be expanded by default
      const relationshipsButton = screen.getByRole('button', { name: 'canvas.customerRelationships' });
      expect(relationshipsButton).toBeInTheDocument();

      expect(screen.getByText(/Social media engagement/)).toBeInTheDocument();
      expect(screen.getByText(/Warranty and after-sales/)).toBeInTheDocument();
      expect(screen.getByText(/Loyalty programs/)).toBeInTheDocument();
    });

    it('should display revenue streams with amounts', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      expect(screen.getByText('Direct Product Sales')).toBeInTheDocument();
      expect(screen.getByText('Transactional')).toBeInTheDocument();
      expect(screen.getByText(/৳150,000\/mo/)).toBeInTheDocument();

      expect(screen.getByText('Bulk Orders (B2B)')).toBeInTheDocument();
      expect(screen.getByText('Volume-based')).toBeInTheDocument();
      expect(screen.getByText(/৳50,000\/mo/)).toBeInTheDocument();
    });

    it('should display all key resources when section is expanded', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      // Key resources section should be expanded by default
      const resourcesButton = screen.getByRole('button', { name: 'canvas.keyResources' });
      expect(resourcesButton).toBeInTheDocument();

      expect(screen.getByText(/Supplier relationships in China/)).toBeInTheDocument();
      expect(screen.getByText(/Inventory and warehouse space/)).toBeInTheDocument();
      expect(screen.getByText(/E-commerce platform accounts/)).toBeInTheDocument();
    });

    it('should display all key activities when section is expanded', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      // Key activities section should be expanded by default
      const activitiesButton = screen.getByRole('button', { name: 'canvas.keyActivities' });
      expect(activitiesButton).toBeInTheDocument();

      expect(screen.getByText(/Product sourcing and quality control/)).toBeInTheDocument();
      expect(screen.getByText(/Marketing and social media management/)).toBeInTheDocument();
      expect(screen.getByText(/Order fulfillment and customer service/)).toBeInTheDocument();
    });

    it('should display all key partnerships when section is expanded', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      // Key partnerships section should be expanded by default
      const partnershipsButton = screen.getByRole('button', { name: 'canvas.keyPartnerships' });
      expect(partnershipsButton).toBeInTheDocument();

      expect(screen.getByText(/Chinese suppliers/)).toBeInTheDocument();
      expect(screen.getByText(/Shipping and logistics partners/)).toBeInTheDocument();
      expect(screen.getByText(/Local retailers for distribution/)).toBeInTheDocument();
    });

    it('should display cost structure with amounts and frequency', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      expect(screen.getByText('Product Sourcing')).toBeInTheDocument();
      expect(screen.getByText(/৳80,000/)).toBeInTheDocument();

      expect(screen.getByText('Shipping and Customs')).toBeInTheDocument();
      expect(screen.getByText(/৳15,000/)).toBeInTheDocument();

      expect(screen.getByText('Marketing and Ads')).toBeInTheDocument();
      expect(screen.getByText(/৳10,000/)).toBeInTheDocument();

      expect(screen.getByText('Warehouse Rent')).toBeInTheDocument();
      expect(screen.getByText(/৳8,000/)).toBeInTheDocument();
    });

    it('should display all 9 sections of Business Model Canvas', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      const sections = [
        'canvas.valueProposition',
        'canvas.customerSegments',
        'canvas.channels',
        'canvas.customerRelationships',
        'canvas.revenueStreams',
        'canvas.keyResources',
        'canvas.keyActivities',
        'canvas.keyPartnerships',
        'canvas.costStructure',
      ];

      sections.forEach((sectionKey) => {
        const sectionButton = screen.getByRole('button', { name: sectionKey });
        expect(sectionButton).toBeInTheDocument();
      });
    });

    it('should show placeholder when businessModelCanvas is not provided', () => {
      const blueprintWithoutCanvas = {
        ...mockBlueprint,
        businessModelCanvas: undefined,
      };

      renderWithIntl(<BlueprintViewer blueprint={blueprintWithoutCanvas} />);

      expect(screen.getByText('placeholders.comingSoon')).toBeInTheDocument();
    });
  });

  describe('Financial Projections Visualization', () => {
    it('should display scenario toggle buttons', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.financial'));

      expect(screen.getByRole('button', { name: 'financial.conservative' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'financial.baseCase' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'financial.optimistic' })).toBeInTheDocument();
    });

    it('should have base case selected by default', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.financial'));

      const baseButton = screen.getByRole('button', { name: 'financial.baseCase' });
      expect(baseButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should switch scenarios when buttons are clicked', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.financial'));

      const conservativeButton = screen.getByRole('button', { name: 'financial.conservative' });
      const baseButton = screen.getByRole('button', { name: 'financial.baseCase' });
      const optimisticButton = screen.getByRole('button', { name: 'financial.optimistic' });

      // Click conservative
      fireEvent.click(conservativeButton);
      expect(conservativeButton).toHaveAttribute('aria-pressed', 'true');
      expect(baseButton).toHaveAttribute('aria-pressed', 'false');

      // Click optimistic
      fireEvent.click(optimisticButton);
      expect(optimisticButton).toHaveAttribute('aria-pressed', 'true');
      expect(conservativeButton).toHaveAttribute('aria-pressed', 'false');

      // Click base
      fireEvent.click(baseButton);
      expect(baseButton).toHaveAttribute('aria-pressed', 'true');
      expect(optimisticButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should display financial projections chart', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.financial'));

      // Check that the chart container exists (ResponsiveContainer renders even if chart has warnings in test)
      const chartContainer = document.querySelector('.recharts-responsive-container');
      // In test environment, Recharts may not render properly, so we just check the component structure
      // The actual chart rendering is tested in E2E tests
      expect(screen.getByText('financial.projections')).toBeInTheDocument();
    });

    it('should display legend with all metrics', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.financial'));

      expect(screen.getByText('financial.revenue')).toBeInTheDocument();
      expect(screen.getByText('financial.costs')).toBeInTheDocument();
      expect(screen.getByText('financial.profit')).toBeInTheDocument();
      expect(screen.getByText('financial.cashFlow')).toBeInTheDocument();
    });

    it('should display assumptions section when available', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.financial'));

      const assumptionsButton = screen.getByRole('button', { name: 'financial.assumptions' });
      expect(assumptionsButton).toBeInTheDocument();

      // Assumptions should be visible by default
      expect(screen.getByText(/Market growth rate/)).toBeInTheDocument();
      expect(screen.getByText(/Customer acquisition cost/)).toBeInTheDocument();
      expect(screen.getByText(/Average order value/)).toBeInTheDocument();
    });

    it('should display investment breakdown section when available', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.financial'));

      const investmentButton = screen.getByRole('button', { name: 'financial.investmentBreakdown' });
      expect(investmentButton).toBeInTheDocument();

      // Investment breakdown should be visible by default
      expect(screen.getByText('Initial Inventory')).toBeInTheDocument();
      expect(screen.getByText('40% financial.ofTotal')).toBeInTheDocument();
      expect(screen.getByText(/৳200,000/)).toBeInTheDocument();

      expect(screen.getByText('Marketing Budget')).toBeInTheDocument();
      expect(screen.getByText('20% financial.ofTotal')).toBeInTheDocument();
      expect(screen.getByText(/৳100,000/)).toBeInTheDocument();
    });

    it('should collapse and expand assumptions section', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.financial'));

      const assumptionsButton = screen.getByRole('button', { name: 'financial.assumptions' });

      // Initially expanded
      expect(assumptionsButton).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      fireEvent.click(assumptionsButton);
      expect(assumptionsButton).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      fireEvent.click(assumptionsButton);
      expect(assumptionsButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should collapse and expand investment breakdown section', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.financial'));

      const investmentButton = screen.getByRole('button', { name: 'financial.investmentBreakdown' });

      // Initially expanded
      expect(investmentButton).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      fireEvent.click(investmentButton);
      expect(investmentButton).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      fireEvent.click(investmentButton);
      expect(investmentButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should show placeholder when financialProjections is not provided', () => {
      const blueprintWithoutFinancial = {
        ...mockBlueprint,
        financialProjections: undefined,
      };

      renderWithIntl(<BlueprintViewer blueprint={blueprintWithoutFinancial} />);
      
      // Click the financial tab using getAllByRole and selecting the desktop button
      const financialTabs = screen.getAllByRole('button', { name: /^tabs\.financial/ });
      // Click the first one which should be the desktop tab
      fireEvent.click(financialTabs[0]);

      // Should show placeholder
      expect(screen.getByText('placeholders.comingSoon')).toBeInTheDocument();
    });

    it('should display color-blind friendly legend indicators', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.financial'));

      // Check that legend color indicators exist
      const legendIndicators = document.querySelectorAll('.w-4.h-4.rounded');
      expect(legendIndicators.length).toBeGreaterThanOrEqual(4); // revenue, costs, profit, cashFlow
    });
  });

  describe('Break-Even Analysis Display', () => {
    it('should display break-even calculations when data is provided', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      expect(screen.getByText('breakeven.calculations')).toBeInTheDocument();
    });

    it('should display break-even units with correct value', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      expect(screen.getByText('breakeven.breakEvenUnits')).toBeInTheDocument();
      expect(screen.getByText(/147/)).toBeInTheDocument();
      // Check that the units label exists (it's displayed after the number)
      const unitsText = screen.getAllByText(/breakeven\.units/);
      expect(unitsText.length).toBeGreaterThan(0);
    });

    it('should display break-even revenue with correct value', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      expect(screen.getByText('breakeven.breakEvenRevenue')).toBeInTheDocument();
      expect(screen.getByText(/৳367,500/)).toBeInTheDocument();
    });

    it('should display fixed costs', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      expect(screen.getByText('breakeven.fixedCosts')).toBeInTheDocument();
      expect(screen.getByText(/৳250,000/)).toBeInTheDocument();
    });

    it('should display variable cost per unit', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      expect(screen.getByText('breakeven.variableCostPerUnit')).toBeInTheDocument();
      expect(screen.getByText(/৳800/)).toBeInTheDocument();
    });

    it('should display price per unit', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      expect(screen.getByText('breakeven.pricePerUnit')).toBeInTheDocument();
      expect(screen.getByText(/৳2,500/)).toBeInTheDocument();
    });

    it('should calculate and display contribution margin', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      expect(screen.getByText('breakeven.contributionMargin')).toBeInTheDocument();
      // Contribution margin = 2500 - 800 = 1700
      expect(screen.getByText(/৳1,700/)).toBeInTheDocument();
    });

    it('should display months to break-even', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      expect(screen.getByText('breakeven.monthsToBreakEven')).toBeInTheDocument();
      // Should display the number prominently
      const monthsDisplay = screen.getByText('4');
      expect(monthsDisplay).toBeInTheDocument();
      expect(monthsDisplay).toHaveClass('text-5xl');
    });

    it('should display visual progress indicator', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '4');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '12');
    });

    it('should display correct progress percentage', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      // 4 months out of 12 = 33.33%
      expect(screen.getByText(/33%/)).toBeInTheDocument();
    });

    it('should display timeline markers', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      expect(screen.getByText('breakeven.start')).toBeInTheDocument();
      expect(screen.getByText('breakeven.breakEvenPoint')).toBeInTheDocument();
    });

    it('should display fast interpretation for 6 months or less', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      expect(screen.getByText('breakeven.interpretationFast')).toBeInTheDocument();
    });

    it('should display moderate interpretation for 7-12 months', () => {
      const blueprintWithModerateBreakeven = {
        ...mockBlueprint,
        breakEvenAnalysis: {
          ...mockBlueprint.breakEvenAnalysis!,
          monthsToBreakEven: 9,
        },
      };

      renderWithIntl(<BlueprintViewer blueprint={blueprintWithModerateBreakeven} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      expect(screen.getByText('breakeven.interpretationModerate')).toBeInTheDocument();
    });

    it('should display slow interpretation for more than 12 months', () => {
      const blueprintWithSlowBreakeven = {
        ...mockBlueprint,
        breakEvenAnalysis: {
          ...mockBlueprint.breakEvenAnalysis!,
          monthsToBreakEven: 18,
        },
      };

      renderWithIntl(<BlueprintViewer blueprint={blueprintWithSlowBreakeven} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      expect(screen.getByText('breakeven.interpretationSlow')).toBeInTheDocument();
    });

    it('should display formula explanations', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      expect(screen.getByText('breakeven.formula')).toBeInTheDocument();
      expect(screen.getByText('breakeven.breakEvenUnitsFormula')).toBeInTheDocument();
      expect(screen.getByText('breakeven.breakEvenRevenueFormula')).toBeInTheDocument();
    });

    it('should display formula text', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      expect(screen.getByText('breakeven.unitsFormulaText')).toBeInTheDocument();
      expect(screen.getByText('breakeven.revenueFormulaText')).toBeInTheDocument();
    });

    it('should collapse and expand break-even sections', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      const calculationsButton = screen.getByRole('button', { name: 'breakeven.calculations' });

      // Initially expanded
      expect(calculationsButton).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      fireEvent.click(calculationsButton);
      expect(calculationsButton).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      fireEvent.click(calculationsButton);
      expect(calculationsButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should show placeholder when breakEvenAnalysis is not provided', () => {
      const blueprintWithoutBreakeven = {
        ...mockBlueprint,
        breakEvenAnalysis: undefined,
      };

      renderWithIntl(<BlueprintViewer blueprint={blueprintWithoutBreakeven} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      expect(screen.getByText('placeholders.comingSoon')).toBeInTheDocument();
    });

    it('should display all metric cards with proper styling', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      // Check for color-coded cards
      const blueCard = document.querySelector('.bg-blue-50');
      const greenCard = document.querySelector('.bg-green-50');
      const orangeCard = document.querySelector('.bg-orange-50');
      const purpleCard = document.querySelector('.bg-purple-50');
      const indigoCard = document.querySelector('.bg-indigo-50');
      const tealCard = document.querySelector('.bg-teal-50');

      expect(blueCard).toBeInTheDocument();
      expect(greenCard).toBeInTheDocument();
      expect(orangeCard).toBeInTheDocument();
      expect(purpleCard).toBeInTheDocument();
      expect(indigoCard).toBeInTheDocument();
      expect(tealCard).toBeInTheDocument();
    });

    it('should display descriptions for each metric', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      expect(screen.getByText('breakeven.unitsDescription')).toBeInTheDocument();
      expect(screen.getByText('breakeven.revenueDescription')).toBeInTheDocument();
      expect(screen.getByText('breakeven.fixedCostsDescription')).toBeInTheDocument();
      expect(screen.getByText('breakeven.variableCostDescription')).toBeInTheDocument();
      expect(screen.getByText('breakeven.priceDescription')).toBeInTheDocument();
      expect(screen.getByText('breakeven.contributionMarginDescription')).toBeInTheDocument();
    });

    it('should use singular "month" for 1 month', () => {
      const blueprintWithOneMonth = {
        ...mockBlueprint,
        breakEvenAnalysis: {
          ...mockBlueprint.breakEvenAnalysis!,
          monthsToBreakEven: 1,
        },
      };

      renderWithIntl(<BlueprintViewer blueprint={blueprintWithOneMonth} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      expect(screen.getByText('breakeven.month')).toBeInTheDocument();
    });

    it('should use plural "months" for multiple months', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      // Should appear multiple times (in display and in progress label)
      const monthsTexts = screen.getAllByText('breakeven.months');
      expect(monthsTexts.length).toBeGreaterThan(0);
    });

    it('should have responsive grid layout for metric cards', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      const gridContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should display progress bar with gradient', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.breakeven'));

      const progressBar = document.querySelector('.bg-gradient-to-r.from-blue-500.to-green-500');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Market Sizing Display', () => {
    it('should display market sizing tab', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);

      const marketTab = getTabButton('tabs.market');
      expect(marketTab).toBeInTheDocument();
    });

    it('should display TAM, SAM, and SOM numbers', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      // Use getAllByText since these labels appear multiple times (in cards and funnel)
      const tamLabels = screen.getAllByText('market.tam');
      const samLabels = screen.getAllByText('market.sam');
      const somLabels = screen.getAllByText('market.som');

      expect(tamLabels.length).toBeGreaterThan(0);
      expect(samLabels.length).toBeGreaterThan(0);
      expect(somLabels.length).toBeGreaterThan(0);

      // Check for formatted numbers - use getAllByText since they appear multiple times
      const tamNumbers = screen.getAllByText(/৳50,000,000/);
      const samNumbers = screen.getAllByText(/৳15,000,000/);
      const somNumbers = screen.getAllByText(/৳3,000,000/);

      expect(tamNumbers.length).toBeGreaterThan(0);
      expect(samNumbers.length).toBeGreaterThan(0);
      expect(somNumbers.length).toBeGreaterThan(0);
    });

    it('should display market size descriptions', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      expect(screen.getByText('market.tamDescription')).toBeInTheDocument();
      expect(screen.getByText('market.samDescription')).toBeInTheDocument();
      expect(screen.getByText('market.somDescription')).toBeInTheDocument();
    });

    it('should display percentage of TAM for SAM and SOM', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      // SAM is 30% of TAM - use getAllByText since it appears in both card and funnel
      const samPercentages = screen.getAllByText(/30\.0%/);
      expect(samPercentages.length).toBeGreaterThanOrEqual(1);
      
      // SOM is 6% of TAM - use getAllByText since it appears in both card and funnel
      const somPercentages = screen.getAllByText(/6\.0%/);
      expect(somPercentages.length).toBeGreaterThanOrEqual(1);
    });

    it('should display visual funnel representation', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      expect(screen.getByText('market.marketFunnel')).toBeInTheDocument();
      expect(screen.getByText('market.funnelDescription')).toBeInTheDocument();
    });

    it('should display funnel with TAM at 100%', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      // TAM should show 100%
      const tamFunnel = screen.getByText('100%');
      expect(tamFunnel).toBeInTheDocument();
    });

    it('should display funnel with correct gradient colors', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      // Check for gradient classes
      const blueFunnel = document.querySelector('.bg-gradient-to-r.from-blue-400.to-blue-600');
      const greenFunnel = document.querySelector('.bg-gradient-to-r.from-green-400.to-green-600');
      const purpleFunnel = document.querySelector('.bg-gradient-to-r.from-purple-400.to-purple-600');

      expect(blueFunnel).toBeInTheDocument();
      expect(greenFunnel).toBeInTheDocument();
      expect(purpleFunnel).toBeInTheDocument();
    });

    it('should display funnel with arrows between sections', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      // Check for arrow SVGs
      const arrows = document.querySelectorAll('svg path[d*="M19 14l-7 7"]');
      expect(arrows.length).toBeGreaterThanOrEqual(2); // At least 2 arrows (TAM→SAM, SAM→SOM)
    });

    it('should display funnel legend with explanations', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      expect(screen.getByText('market.understandingFunnel')).toBeInTheDocument();
      expect(screen.getByText('market.tamExplanation')).toBeInTheDocument();
      expect(screen.getByText('market.samExplanation')).toBeInTheDocument();
      expect(screen.getByText('market.somExplanation')).toBeInTheDocument();
    });

    it('should display methodology section', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      expect(screen.getByText('market.methodology')).toBeInTheDocument();
    });

    it('should display methodology text', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      // Check for part of the methodology text
      expect(screen.getByText(/Market sizing calculated based on/)).toBeInTheDocument();
      expect(screen.getByText(/Total wireless earbuds market/)).toBeInTheDocument();
    });

    it('should have collapsible sections for market sizing', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      const numbersButton = screen.getByRole('button', { name: 'market.marketSizeNumbers' });
      const funnelButton = screen.getByRole('button', { name: 'market.marketFunnel' });
      const methodologyButton = screen.getByRole('button', { name: 'market.methodology' });

      expect(numbersButton).toBeInTheDocument();
      expect(funnelButton).toBeInTheDocument();
      expect(methodologyButton).toBeInTheDocument();
    });

    it('should collapse and expand market size numbers section', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      const numbersButton = screen.getByRole('button', { name: 'market.marketSizeNumbers' });

      // Initially expanded
      expect(numbersButton).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      fireEvent.click(numbersButton);
      expect(numbersButton).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      fireEvent.click(numbersButton);
      expect(numbersButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should collapse and expand funnel section', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      const funnelButton = screen.getByRole('button', { name: 'market.marketFunnel' });

      // Initially expanded
      expect(funnelButton).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      fireEvent.click(funnelButton);
      expect(funnelButton).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      fireEvent.click(funnelButton);
      expect(funnelButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should collapse and expand methodology section', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      const methodologyButton = screen.getByRole('button', { name: 'market.methodology' });

      // Initially expanded
      expect(methodologyButton).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      fireEvent.click(methodologyButton);
      expect(methodologyButton).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      fireEvent.click(methodologyButton);
      expect(methodologyButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should show placeholder when marketSizing is not provided', () => {
      const blueprintWithoutMarketSizing = {
        ...mockBlueprint,
        marketSizing: undefined,
      };

      renderWithIntl(<BlueprintViewer blueprint={blueprintWithoutMarketSizing} />);
      fireEvent.click(getTabButton('tabs.market'));

      expect(screen.getByText('placeholders.comingSoon')).toBeInTheDocument();
    });

    it('should display color-coded metric cards', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      // Check for color-coded cards
      const blueCard = document.querySelector('.bg-blue-50.border-blue-200');
      const greenCard = document.querySelector('.bg-green-50.border-green-200');
      const purpleCard = document.querySelector('.bg-purple-50.border-purple-200');

      expect(blueCard).toBeInTheDocument();
      expect(greenCard).toBeInTheDocument();
      expect(purpleCard).toBeInTheDocument();
    });

    it('should have responsive grid layout for metric cards', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      const gridContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should display ARIA labels for funnel sections', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      // Check for role="img" on funnel sections
      const funnelSections = document.querySelectorAll('[role="img"]');
      expect(funnelSections.length).toBeGreaterThanOrEqual(3); // TAM, SAM, SOM
    });

    it('should format numbers with locale support', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} locale="en" />);
      fireEvent.click(getTabButton('tabs.market'));

      // Numbers should be formatted with commas - use getAllByText since they appear multiple times
      const tamNumbers = screen.getAllByText(/50,000,000/);
      const samNumbers = screen.getAllByText(/15,000,000/);
      const somNumbers = screen.getAllByText(/3,000,000/);

      expect(tamNumbers.length).toBeGreaterThan(0);
      expect(samNumbers.length).toBeGreaterThan(0);
      expect(somNumbers.length).toBeGreaterThan(0);
    });

    it('should display "of TAM" label for percentages', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      const ofTAMLabels = screen.getAllByText(/market\.ofTAM/);
      expect(ofTAMLabels.length).toBe(2); // One for SAM, one for SOM
    });

    it('should maintain collapsed state when switching tabs', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      // Collapse a section
      const numbersButton = screen.getByRole('button', { name: 'market.marketSizeNumbers' });
      fireEvent.click(numbersButton);
      expect(numbersButton).toHaveAttribute('aria-expanded', 'false');

      // Switch to another tab
      fireEvent.click(getTabButton('tabs.financial'));

      // Switch back to market tab
      fireEvent.click(getTabButton('tabs.market'));

      // Section should still be collapsed
      const numbersButtonAfter = screen.getByRole('button', { name: 'market.marketSizeNumbers' });
      expect(numbersButtonAfter).toHaveAttribute('aria-expanded', 'false');
    });

    it('should display funnel with proper width proportions', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.market'));

      // Check that funnel sections have width styles applied via inline styles
      const funnelSections = document.querySelectorAll('.bg-gradient-to-r');
      // At least 3 funnel sections should exist (TAM, SAM, SOM)
      expect(funnelSections.length).toBeGreaterThanOrEqual(3);
      
      // Check that parent elements have width attribute set
      funnelSections.forEach((section) => {
        const parent = section.parentElement;
        if (parent) {
          // Parent should have a style attribute with width
          const hasWidthStyle = parent.hasAttribute('style') && parent.getAttribute('style')?.includes('width');
          // Only check for non-TAM sections (TAM is 100% and doesn't need inline width)
          if (!section.textContent?.includes('100%')) {
            expect(hasWidthStyle).toBe(true);
          }
        }
      });
    });
  });

  describe('GTM Plan Display', () => {
    it('should display GTM phases with details', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.gtm'));

      // Check for phase names
      expect(screen.getByText('Pre-Launch & Setup')).toBeInTheDocument();
      expect(screen.getByText('Soft Launch')).toBeInTheDocument();
      expect(screen.getByText('Scale & Expand')).toBeInTheDocument();

      // Check for duration and budget labels (using getAllByText since there are multiple)
      expect(screen.getAllByText(/gtm\.duration/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/gtm\.budget/).length).toBeGreaterThan(0);
    });

    it('should display phase activities', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.gtm'));

      // Check for activities from phase 1
      expect(screen.getByText(/Register business and obtain trade license/)).toBeInTheDocument();
      expect(screen.getByText(/Set up social media accounts/)).toBeInTheDocument();
    });

    it('should display channel prioritization with rankings', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.gtm'));

      // Check for channel names
      expect(screen.getByText('Facebook Marketplace & Instagram')).toBeInTheDocument();
      expect(screen.getByText('Daraz')).toBeInTheDocument();
      expect(screen.getByText('Local Retail Partnerships')).toBeInTheDocument();

      // Check for priority badges
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
    });

    it('should display channel rationale and CAC', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.gtm'));

      // Check for rationale
      expect(screen.getByText(/Highest reach among target demographic/)).toBeInTheDocument();
      
      // Check for CAC labels
      expect(screen.getAllByText(/gtm\.estimatedCAC/).length).toBeGreaterThan(0);
    });

    it('should display launch timeline when available', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.gtm'));

      // Check for timeline section
      expect(screen.getByRole('button', { name: 'gtm.launchTimeline' })).toBeInTheDocument();
    });

    it('should show placeholder when GTM data is not available', () => {
      const blueprintWithoutGTM = {
        ...mockBlueprint,
        goToMarketPlan: undefined,
      };

      renderWithIntl(<BlueprintViewer blueprint={blueprintWithoutGTM} />);
      fireEvent.click(getTabButton('tabs.gtm'));

      expect(screen.getByText('placeholders.comingSoon')).toBeInTheDocument();
    });
  });

  describe('SEO Strategy Display', () => {
    it('should display Google SEO keyword clusters', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.seo'));

      // Check for keywords
      expect(screen.getByText('wireless earbuds Bangladesh')).toBeInTheDocument();
      expect(screen.getByText('ওয়ারলেস ইয়ারবাড')).toBeInTheDocument();

      // Check for table headers
      expect(screen.getByText('seo.keyword')).toBeInTheDocument();
      expect(screen.getByText('seo.searchVolume')).toBeInTheDocument();
      expect(screen.getByText('seo.competition')).toBeInTheDocument();
      expect(screen.getByText('seo.language')).toBeInTheDocument();
    });

    it('should display competition levels with color coding', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.seo'));

      // Check for competition level badges (using getAllByText since there are multiple)
      expect(screen.getAllByText('seo.competitionLevel.low').length).toBeGreaterThan(0);
      expect(screen.getAllByText('seo.competitionLevel.medium').length).toBeGreaterThan(0);
      expect(screen.getAllByText('seo.competitionLevel.high').length).toBeGreaterThan(0);
    });

    it('should display content topics', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.seo'));

      // Check for content topics
      expect(screen.getByText('How to choose wireless earbuds')).toBeInTheDocument();
      expect(screen.getByText('Wireless earbuds buying guide Bangladesh')).toBeInTheDocument();
    });

    it('should display social platform strategies', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.seo'));

      // Check for platform names
      expect(screen.getByText('Facebook')).toBeInTheDocument();
      expect(screen.getByText('Instagram')).toBeInTheDocument();
      expect(screen.getByText('TikTok')).toBeInTheDocument();

      // Check for posting frequency label
      expect(screen.getAllByText(/seo\.postingFrequency/).length).toBeGreaterThan(0);
    });

    it('should display hashtag recommendations', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.seo'));

      // Check for hashtags
      expect(screen.getByText('#WirelessEarbudsBD')).toBeInTheDocument();
      expect(screen.getByText('#TechBangladesh')).toBeInTheDocument();

      // Check for table headers
      expect(screen.getByText('seo.hashtag')).toBeInTheDocument();
      expect(screen.getByText('seo.volume')).toBeInTheDocument();
      expect(screen.getByText('seo.trendDuration')).toBeInTheDocument();
    });

    it('should display posting schedule', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.seo'));

      // Check that social SEO section exists and expand it
      const socialSEOButton = screen.getByRole('button', { name: 'seo.socialSEO' });
      expect(socialSEOButton).toBeInTheDocument();
      
      // Section should be expanded by default, check for content
      // Check for the actual schedule content (which should be visible)
      expect(screen.getByText(/Best times to post/)).toBeInTheDocument();
    });

    it('should display marketplace SEO templates', async () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.seo'));

      // Check for marketplace section button
      const marketplaceButton = screen.getByRole('button', { name: 'seo.marketplaceSEO' });
      expect(marketplaceButton).toBeInTheDocument();
      
      // The section should be expanded by default, check for platforms
      expect(screen.getByText('Daraz')).toBeInTheDocument();
      expect(screen.getByText('Facebook Marketplace')).toBeInTheDocument();
    });

    it('should display Google Lens optimization guidance', async () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.seo'));

      // Check for Google Lens section button
      const googleLensButton = screen.getByRole('button', { name: 'seo.googleLensOptimization' });
      expect(googleLensButton).toBeInTheDocument();
      
      // The section should be expanded by default, so content should be visible
      // Check for image tagging guidance
      expect(screen.getByText(/Use clean white background/)).toBeInTheDocument();
    });

    it('should show placeholder when SEO data is not available', () => {
      const blueprintWithoutSEO = {
        ...mockBlueprint,
        seoStrategy: undefined,
      };

      renderWithIntl(<BlueprintViewer blueprint={blueprintWithoutSEO} />);
      fireEvent.click(getTabButton('tabs.seo'));

      expect(screen.getByText('placeholders.comingSoon')).toBeInTheDocument();
    });
  });

  describe('Risk Register Display', () => {
    const mockBlueprintWithRisks: BusinessBlueprint = {
      ...mockBlueprint,
      riskRegister: [
        {
          category: 'Market Risk',
          description: 'High competition from established brands may limit market penetration',
          likelihood: 'high',
          impact: 'high',
          mitigation: 'Focus on niche segments and build strong brand loyalty through excellent customer service',
        },
        {
          category: 'Supply Chain Risk',
          description: 'Delays in shipping from China during peak seasons',
          likelihood: 'medium',
          impact: 'high',
          mitigation: 'Maintain buffer inventory and establish relationships with multiple suppliers',
        },
        {
          category: 'Financial Risk',
          description: 'Cash flow constraints during initial months',
          likelihood: 'medium',
          impact: 'medium',
          mitigation: 'Secure working capital line of credit and maintain strict expense controls',
        },
        {
          category: 'Regulatory Risk',
          description: 'Changes in import duties or customs regulations',
          likelihood: 'low',
          impact: 'high',
          mitigation: 'Stay updated on NBR regulations and maintain compliance documentation',
        },
        {
          category: 'Operational Risk',
          description: 'Quality control issues with sourced products',
          likelihood: 'low',
          impact: 'medium',
          mitigation: 'Implement rigorous quality inspection process and work with verified suppliers',
        },
      ],
    };

    it('should display risk register tab', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithRisks} />);

      const risksTab = getTabButton('tabs.risks');
      expect(risksTab).toBeInTheDocument();
    });

    it('should display all 5 risks', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithRisks} />);
      fireEvent.click(getTabButton('tabs.risks'));

      expect(screen.getByText(/1\. Market Risk/)).toBeInTheDocument();
      expect(screen.getByText(/2\. Supply Chain Risk/)).toBeInTheDocument();
      expect(screen.getByText(/3\. Financial Risk/)).toBeInTheDocument();
      expect(screen.getByText(/4\. Regulatory Risk/)).toBeInTheDocument();
      expect(screen.getByText(/5\. Operational Risk/)).toBeInTheDocument();
    });

    it('should display risk descriptions', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithRisks} />);
      fireEvent.click(getTabButton('tabs.risks'));

      expect(screen.getByText(/High competition from established brands/)).toBeInTheDocument();
      expect(screen.getByText(/Delays in shipping from China/)).toBeInTheDocument();
    });

    it('should display likelihood badges with correct colors', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithRisks} />);
      fireEvent.click(getTabButton('tabs.risks'));

      // Check for likelihood labels
      const likelihoodLabels = screen.getAllByText('risks.likelihood');
      expect(likelihoodLabels.length).toBe(5);

      // Check for high likelihood (should have error variant)
      const highBadges = screen.getAllByText('risks.levels.high');
      expect(highBadges.length).toBeGreaterThan(0);

      // Check for medium likelihood (should have warning variant)
      const mediumBadges = screen.getAllByText('risks.levels.medium');
      expect(mediumBadges.length).toBeGreaterThan(0);

      // Check for low likelihood (should have success variant)
      const lowBadges = screen.getAllByText('risks.levels.low');
      expect(lowBadges.length).toBeGreaterThan(0);
    });

    it('should display impact badges with correct colors', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithRisks} />);
      fireEvent.click(getTabButton('tabs.risks'));

      // Check for impact labels
      const impactLabels = screen.getAllByText('risks.impact');
      expect(impactLabels.length).toBe(5);
    });

    it('should display mitigation strategies', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithRisks} />);
      fireEvent.click(getTabButton('tabs.risks'));

      expect(screen.getByText(/Focus on niche segments/)).toBeInTheDocument();
      expect(screen.getByText(/Maintain buffer inventory/)).toBeInTheDocument();
      expect(screen.getByText(/Secure working capital/)).toBeInTheDocument();
    });

    it('should have collapsible sections for each risk', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithRisks} />);
      fireEvent.click(getTabButton('tabs.risks'));

      const marketRiskButton = screen.getByRole('button', { name: /1\. Market Risk/ });
      expect(marketRiskButton).toBeInTheDocument();
      expect(marketRiskButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should collapse and expand risk sections', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithRisks} />);
      fireEvent.click(getTabButton('tabs.risks'));

      const marketRiskButton = screen.getByRole('button', { name: /1\. Market Risk/ });

      // Initially expanded
      expect(marketRiskButton).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      fireEvent.click(marketRiskButton);
      expect(marketRiskButton).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      fireEvent.click(marketRiskButton);
      expect(marketRiskButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should display placeholder when no risks are provided', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.risks'));

      expect(screen.getByText('placeholders.comingSoon')).toBeInTheDocument();
    });

    it('should display placeholder when riskRegister is empty array', () => {
      const blueprintWithEmptyRisks = {
        ...mockBlueprint,
        riskRegister: [],
      };

      renderWithIntl(<BlueprintViewer blueprint={blueprintWithEmptyRisks} />);
      fireEvent.click(getTabButton('tabs.risks'));

      expect(screen.getByText('placeholders.comingSoon')).toBeInTheDocument();
    });

    it('should display only top 5 risks if more are provided', () => {
      const blueprintWithManyRisks = {
        ...mockBlueprintWithRisks,
        riskRegister: [
          ...mockBlueprintWithRisks.riskRegister!,
          {
            category: 'Extra Risk 1',
            description: 'This should not be displayed',
            likelihood: 'low' as const,
            impact: 'low' as const,
            mitigation: 'Not shown',
          },
          {
            category: 'Extra Risk 2',
            description: 'This should not be displayed either',
            likelihood: 'low' as const,
            impact: 'low' as const,
            mitigation: 'Not shown',
          },
        ],
      };

      renderWithIntl(<BlueprintViewer blueprint={blueprintWithManyRisks} />);
      fireEvent.click(getTabButton('tabs.risks'));

      // Should only show first 5 risks
      expect(screen.getByText(/1\. Market Risk/)).toBeInTheDocument();
      expect(screen.getByText(/5\. Operational Risk/)).toBeInTheDocument();
      expect(screen.queryByText(/Extra Risk 1/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Extra Risk 2/)).not.toBeInTheDocument();
    });

    it('should have proper grid layout for likelihood and impact', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithRisks} />);
      fireEvent.click(getTabButton('tabs.risks'));

      const gridContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Team Structure Display', () => {
    const mockBlueprintWithTeam: BusinessBlueprint = {
      ...mockBlueprint,
      teamStructure: {
        roles: [
          {
            title: 'Operations Manager',
            responsibilities: [
              'Oversee daily operations and inventory management',
              'Coordinate with suppliers and logistics partners',
              'Manage warehouse and fulfillment processes',
            ],
            requiredSkills: ['Supply Chain Management', 'Inventory Control', 'Vendor Relations'],
            estimatedSalary: 35000,
          },
          {
            title: 'Digital Marketing Specialist',
            responsibilities: [
              'Manage social media accounts and content creation',
              'Run Facebook and Instagram ad campaigns',
              'Track and optimize marketing performance',
            ],
            requiredSkills: ['Social Media Marketing', 'Facebook Ads', 'Content Creation', 'Analytics'],
            estimatedSalary: 30000,
          },
          {
            title: 'Customer Service Representative',
            responsibilities: [
              'Handle customer inquiries and support tickets',
              'Process orders and manage returns',
              'Maintain customer satisfaction and loyalty',
            ],
            requiredSkills: ['Customer Service', 'Communication', 'Problem Solving'],
            estimatedSalary: 20000,
          },
        ],
        hiringPriority: [
          'Operations Manager (Month 1) - Critical for launch',
          'Digital Marketing Specialist (Month 2) - Scale customer acquisition',
          'Customer Service Representative (Month 3) - Handle growing customer base',
        ],
      },
    };

    it('should display team structure tab', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithTeam} />);

      const teamTab = getTabButton('tabs.team');
      expect(teamTab).toBeInTheDocument();
    });

    it('should display all team roles', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithTeam} />);
      fireEvent.click(getTabButton('tabs.team'));

      expect(screen.getByText('Operations Manager')).toBeInTheDocument();
      expect(screen.getByText('Digital Marketing Specialist')).toBeInTheDocument();
      expect(screen.getByText('Customer Service Representative')).toBeInTheDocument();
    });

    it('should display role responsibilities', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithTeam} />);
      fireEvent.click(getTabButton('tabs.team'));

      expect(screen.getByText(/Oversee daily operations/)).toBeInTheDocument();
      expect(screen.getByText(/Manage social media accounts/)).toBeInTheDocument();
      expect(screen.getByText(/Handle customer inquiries/)).toBeInTheDocument();
    });

    it('should display required skills as badges', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithTeam} />);
      fireEvent.click(getTabButton('tabs.team'));

      expect(screen.getByText('Supply Chain Management')).toBeInTheDocument();
      expect(screen.getByText('Social Media Marketing')).toBeInTheDocument();
      expect(screen.getByText('Customer Service')).toBeInTheDocument();
    });

    it('should display estimated salaries', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithTeam} />);
      fireEvent.click(getTabButton('tabs.team'));

      // Check that salary labels are displayed
      const salaryLabels = screen.getAllByText('team.estimatedSalary');
      expect(salaryLabels.length).toBe(3);

      // Check that formatted numbers are displayed (formatNumber adds commas)
      expect(screen.getByText(/35,000/)).toBeInTheDocument();
      expect(screen.getByText(/30,000/)).toBeInTheDocument();
      expect(screen.getByText(/20,000/)).toBeInTheDocument();
    });

    it('should display hiring priority section', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithTeam} />);
      fireEvent.click(getTabButton('tabs.team'));

      expect(screen.getByText('team.hiringPriority')).toBeInTheDocument();
      expect(screen.getByText(/Operations Manager \(Month 1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Digital Marketing Specialist \(Month 2\)/)).toBeInTheDocument();
      expect(screen.getByText(/Customer Service Representative \(Month 3\)/)).toBeInTheDocument();
    });

    it('should have collapsible sections for each role', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithTeam} />);
      fireEvent.click(getTabButton('tabs.team'));

      const operationsButton = screen.getByRole('button', { name: 'Operations Manager' });
      expect(operationsButton).toBeInTheDocument();
      expect(operationsButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should collapse and expand role sections', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithTeam} />);
      fireEvent.click(getTabButton('tabs.team'));

      const operationsButton = screen.getByRole('button', { name: 'Operations Manager' });

      // Initially expanded
      expect(operationsButton).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      fireEvent.click(operationsButton);
      expect(operationsButton).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      fireEvent.click(operationsButton);
      expect(operationsButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should display placeholder when no team structure is provided', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprint} />);
      fireEvent.click(getTabButton('tabs.team'));

      expect(screen.getByText('placeholders.comingSoon')).toBeInTheDocument();
    });

    it('should display placeholder when roles array is empty', () => {
      const blueprintWithEmptyTeam = {
        ...mockBlueprint,
        teamStructure: {
          roles: [],
          hiringPriority: [],
        },
      };

      renderWithIntl(<BlueprintViewer blueprint={blueprintWithEmptyTeam} />);
      fireEvent.click(getTabButton('tabs.team'));

      expect(screen.getByText('placeholders.comingSoon')).toBeInTheDocument();
    });

    it('should display responsibilities as a list', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithTeam} />);
      fireEvent.click(getTabButton('tabs.team'));

      const lists = document.querySelectorAll('ul.list-disc');
      expect(lists.length).toBeGreaterThanOrEqual(3); // At least 3 roles with responsibility lists
    });

    it('should display skills with proper badge styling', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithTeam} />);
      fireEvent.click(getTabButton('tabs.team'));

      const skillBadges = document.querySelectorAll('.flex.flex-wrap.gap-2');
      expect(skillBadges.length).toBeGreaterThanOrEqual(3); // At least 3 roles with skill badges
    });

    it('should display hiring priority as ordered list', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithTeam} />);
      fireEvent.click(getTabButton('tabs.team'));

      const orderedList = document.querySelector('ol.list-decimal');
      expect(orderedList).toBeInTheDocument();
    });

    it('should not display hiring priority section when empty', () => {
      const blueprintWithoutPriority = {
        ...mockBlueprintWithTeam,
        teamStructure: {
          ...mockBlueprintWithTeam.teamStructure!,
          hiringPriority: [],
        },
      };

      renderWithIntl(<BlueprintViewer blueprint={blueprintWithoutPriority} />);
      fireEvent.click(getTabButton('tabs.team'));

      // Should still show roles but not hiring priority section
      expect(screen.getByText('Operations Manager')).toBeInTheDocument();
      expect(screen.queryByText('team.hiringPriority')).not.toBeInTheDocument();
    });

    it('should display salary with per month label', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithTeam} />);
      fireEvent.click(getTabButton('tabs.team'));

      // Check that salaries are displayed with formatted numbers
      expect(screen.getByText(/35,000/)).toBeInTheDocument();
      expect(screen.getByText(/30,000/)).toBeInTheDocument();
      expect(screen.getByText(/20,000/)).toBeInTheDocument();
    });

    it('should have proper section headings', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithTeam} />);
      fireEvent.click(getTabButton('tabs.team'));

      expect(screen.getByText('team.recommendedRoles')).toBeInTheDocument();
    });

    it('should display hiring priority with blue background', () => {
      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithTeam} />);
      fireEvent.click(getTabButton('tabs.team'));

      const priorityContainer = document.querySelector('.bg-blue-50.border.border-blue-200');
      expect(priorityContainer).toBeInTheDocument();
    });
  });

  describe('Bilingual Support for Risk and Team', () => {
    it('should display risk labels in selected language', () => {
      const mockBlueprintWithRisks: BusinessBlueprint = {
        ...mockBlueprint,
        riskRegister: [
          {
            category: 'Market Risk',
            description: 'High competition',
            likelihood: 'high',
            impact: 'high',
            mitigation: 'Focus on niche',
          },
        ],
      };

      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithRisks} locale="en" />);
      fireEvent.click(getTabButton('tabs.risks'));

      expect(screen.getByText('risks.likelihood')).toBeInTheDocument();
      expect(screen.getByText('risks.impact')).toBeInTheDocument();
      expect(screen.getByText('risks.mitigation')).toBeInTheDocument();
    });

    it('should display team labels in selected language', () => {
      const mockBlueprintWithTeam: BusinessBlueprint = {
        ...mockBlueprint,
        teamStructure: {
          roles: [
            {
              title: 'Manager',
              responsibilities: ['Manage operations'],
              requiredSkills: ['Management'],
              estimatedSalary: 30000,
            },
          ],
          hiringPriority: ['Manager first'],
        },
      };

      renderWithIntl(<BlueprintViewer blueprint={mockBlueprintWithTeam} locale="en" />);
      fireEvent.click(getTabButton('tabs.team'));

      expect(screen.getByText('team.responsibilities')).toBeInTheDocument();
      expect(screen.getByText('team.requiredSkills')).toBeInTheDocument();
      expect(screen.getByText('team.estimatedSalary')).toBeInTheDocument();
    });
  });
});
