import React from 'react';
import { render, screen } from '@testing-library/react';
import { MarketplaceSEOTemplates, MarketplaceSEOTemplate } from './MarketplaceSEOTemplates';

const mockTemplates: MarketplaceSEOTemplate[] = [
  {
    platform: 'Daraz',
    titleTemplate: '[Brand] [Product Name] - [Key Feature] | [Category] for [Target Audience]',
    descriptionTemplate:
      'Shop [Product Name] from [Brand]. Features: [Feature 1], [Feature 2]. Perfect for [Use Case]. Free delivery in Dhaka.',
  },
  {
    platform: 'Shajgoj',
    titleTemplate: '[Brand] [Product Type] - [Skin Type] | [Key Ingredient]',
    descriptionTemplate:
      'Discover [Product Name] by [Brand]. Enriched with [Ingredient]. Ideal for [Skin Type] skin. Get glowing results in [Timeframe].',
  },
];

describe('MarketplaceSEOTemplates', () => {
  describe('Rendering', () => {
    it('should render the main title', () => {
      render(
        <MarketplaceSEOTemplates templates={mockTemplates} locale="en" />
      );
      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should render both Daraz and Shajgoj platform sections', () => {
      render(
        <MarketplaceSEOTemplates templates={mockTemplates} locale="en" />
      );
      expect(screen.getByText('Daraz')).toBeInTheDocument();
      expect(screen.getByText('Shajgoj')).toBeInTheDocument();
    });

    it('should render platform badges', () => {
      render(
        <MarketplaceSEOTemplates templates={mockTemplates} locale="en" />
      );
      const badges = screen.getAllByText('platformBadge');
      expect(badges).toHaveLength(2);
    });
  });

  describe('Title Template Optimization', () => {
    it('should display title template heading for each platform', () => {
      render(
        <MarketplaceSEOTemplates templates={mockTemplates} locale="en" />
      );
      const headings = screen.getAllByText('titleTemplate.heading');
      expect(headings).toHaveLength(2);
    });

    it('should display the title template content', () => {
      render(
        <MarketplaceSEOTemplates templates={mockTemplates} locale="en" />
      );
      expect(
        screen.getByText(mockTemplates[0].titleTemplate)
      ).toBeInTheDocument();
      expect(
        screen.getByText(mockTemplates[1].titleTemplate)
      ).toBeInTheDocument();
    });

    it('should display character count guidance for both platforms', () => {
      render(
        <MarketplaceSEOTemplates templates={mockTemplates} locale="en" />
      );
      const charCountElements = screen.getAllByText('titleTemplate.charCount');
      expect(charCountElements).toHaveLength(2);
    });
  });

  describe('Description Template Optimization', () => {
    it('should display description template heading for each platform', () => {
      render(
        <MarketplaceSEOTemplates templates={mockTemplates} locale="en" />
      );
      const headings = screen.getAllByText('descriptionTemplate.heading');
      expect(headings).toHaveLength(2);
    });

    it('should display the description template content', () => {
      render(
        <MarketplaceSEOTemplates templates={mockTemplates} locale="en" />
      );
      expect(
        screen.getByText(mockTemplates[0].descriptionTemplate)
      ).toBeInTheDocument();
      expect(
        screen.getByText(mockTemplates[1].descriptionTemplate)
      ).toBeInTheDocument();
    });

    it('should display keyword placement tips for Daraz', () => {
      render(
        <MarketplaceSEOTemplates templates={[mockTemplates[0]]} locale="en" />
      );
      expect(screen.getByText('keywordTips.daraz')).toBeInTheDocument();
    });

    it('should display keyword placement tips for Shajgoj', () => {
      render(
        <MarketplaceSEOTemplates templates={[mockTemplates[1]]} locale="en" />
      );
      expect(screen.getByText('keywordTips.shajgoj')).toBeInTheDocument();
    });
  });

  describe('Platform Best Practices', () => {
    it('should display best practices heading for each platform', () => {
      render(
        <MarketplaceSEOTemplates templates={mockTemplates} locale="en" />
      );
      const headings = screen.getAllByText('bestPractices.heading');
      expect(headings).toHaveLength(2);
    });

    it('should display Daraz best practices', () => {
      render(
        <MarketplaceSEOTemplates templates={[mockTemplates[0]]} locale="en" />
      );
      expect(screen.getByText('bestPractices.daraz.keywordsFront')).toBeInTheDocument();
      expect(screen.getByText('bestPractices.daraz.titleLength')).toBeInTheDocument();
      expect(screen.getByText('bestPractices.daraz.bulletPoints')).toBeInTheDocument();
      expect(screen.getByText('bestPractices.daraz.banglaKeywords')).toBeInTheDocument();
    });

    it('should display Shajgoj best practices', () => {
      render(
        <MarketplaceSEOTemplates templates={[mockTemplates[1]]} locale="en" />
      );
      expect(screen.getByText('bestPractices.shajgoj.beautyTerms')).toBeInTheDocument();
      expect(screen.getByText('bestPractices.shajgoj.ingredients')).toBeInTheDocument();
      expect(screen.getByText('bestPractices.shajgoj.skinType')).toBeInTheDocument();
      expect(screen.getByText('bestPractices.shajgoj.benefitsFirst')).toBeInTheDocument();
    });

    it('should display priority badges for best practices', () => {
      render(
        <MarketplaceSEOTemplates templates={[mockTemplates[0]]} locale="en" />
      );
      const highBadges = screen.getAllByText('priority.high');
      const mediumBadges = screen.getAllByText('priority.medium');
      expect(highBadges).toHaveLength(2);
      expect(mediumBadges).toHaveLength(2);
    });

    it('should render best practices as a list with aria-label', () => {
      render(
        <MarketplaceSEOTemplates templates={[mockTemplates[0]]} locale="en" />
      );
      const list = screen.getByRole('list', {
        name: 'bestPractices.listAriaLabel',
      });
      expect(list).toBeInTheDocument();
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(4);
    });
  });

  describe('Empty State', () => {
    it('should display no templates message when templates array is empty', () => {
      render(
        <MarketplaceSEOTemplates templates={[]} locale="en" />
      );
      expect(screen.getByText('noTemplates')).toBeInTheDocument();
    });

    it('should not render platform sections when in empty state', () => {
      render(
        <MarketplaceSEOTemplates templates={[]} locale="en" />
      );
      expect(screen.queryByText('Daraz')).not.toBeInTheDocument();
      expect(screen.queryByText('Shajgoj')).not.toBeInTheDocument();
      expect(screen.queryByText('titleTemplate.heading')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton when isLoading is true', () => {
      render(
        <MarketplaceSEOTemplates templates={[]} locale="en" isLoading={true} />
      );
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have accessible loading label', () => {
      render(
        <MarketplaceSEOTemplates templates={[]} locale="en" isLoading={true} />
      );
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'loading');
    });

    it('should not render content sections when loading', () => {
      render(
        <MarketplaceSEOTemplates
          templates={mockTemplates}
          locale="en"
          isLoading={true}
        />
      );
      expect(screen.queryByText('Daraz')).not.toBeInTheDocument();
      expect(screen.queryByText('Shajgoj')).not.toBeInTheDocument();
      expect(screen.queryByText('titleTemplate.heading')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have section headings with proper ids for aria-labelledby', () => {
      render(
        <MarketplaceSEOTemplates templates={mockTemplates} locale="en" />
      );
      expect(document.getElementById('platform-heading-daraz')).toBeInTheDocument();
      expect(document.getElementById('platform-heading-shajgoj')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(
        <MarketplaceSEOTemplates templates={mockTemplates} locale="en" />
      );
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('title');

      const h3s = screen.getAllByRole('heading', { level: 3 });
      expect(h3s).toHaveLength(2);
    });

    it('should use semantic section elements for each platform', () => {
      const { container } = render(
        <MarketplaceSEOTemplates templates={mockTemplates} locale="en" />
      );
      const sections = container.querySelectorAll('section[aria-labelledby]');
      expect(sections).toHaveLength(2);
    });
  });

  describe('Locale Support', () => {
    it('should render with Bengali locale', () => {
      render(
        <MarketplaceSEOTemplates templates={mockTemplates} locale="bn" />
      );
      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should render with English locale', () => {
      render(
        <MarketplaceSEOTemplates templates={mockTemplates} locale="en" />
      );
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  describe('Unknown Platform', () => {
    it('should render template without best practices for unknown platform', () => {
      const unknownTemplate: MarketplaceSEOTemplate[] = [
        {
          platform: 'UnknownPlatform',
          titleTemplate: '[Product] - [Feature]',
          descriptionTemplate: 'Buy [Product] now.',
        },
      ];
      render(
        <MarketplaceSEOTemplates templates={unknownTemplate} locale="en" />
      );
      expect(screen.getByText('UnknownPlatform')).toBeInTheDocument();
      expect(screen.getByText('[Product] - [Feature]')).toBeInTheDocument();
      expect(screen.queryByText('bestPractices.heading')).not.toBeInTheDocument();
    });
  });
});
