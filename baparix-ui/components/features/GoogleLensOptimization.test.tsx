import React from 'react';
import { render, screen } from '@testing-library/react';
import { GoogleLensOptimization } from './GoogleLensOptimization';

const mockImageTagging = [
  'product-name-color-material',
  'brand-category-style',
  'use-case-target-audience',
  'size-dimensions-weight',
];

const mockAltTextGuidance =
  'Write descriptive alt text that includes product name, color, material, and key features. Keep it under 125 characters for optimal SEO.';

describe('GoogleLensOptimization', () => {
  describe('Rendering', () => {
    it('should render the title', () => {
      render(
        <GoogleLensOptimization
          imageTagging={mockImageTagging}
          altTextGuidance={mockAltTextGuidance}
          locale="en"
        />
      );
      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should render all three sections when data is provided', () => {
      render(
        <GoogleLensOptimization
          imageTagging={mockImageTagging}
          altTextGuidance={mockAltTextGuidance}
          locale="en"
        />
      );
      expect(screen.getByText('imageTagging.title')).toBeInTheDocument();
      expect(screen.getByText('altText.title')).toBeInTheDocument();
      expect(screen.getByText('bestPractices.title')).toBeInTheDocument();
    });
  });

  describe('Image Tagging Guidance', () => {
    it('should display all image tags', () => {
      render(
        <GoogleLensOptimization
          imageTagging={mockImageTagging}
          altTextGuidance={mockAltTextGuidance}
          locale="en"
        />
      );
      expect(screen.getByText('product-name-color-material')).toBeInTheDocument();
      expect(screen.getByText('brand-category-style')).toBeInTheDocument();
      expect(screen.getByText('use-case-target-audience')).toBeInTheDocument();
      expect(screen.getByText('size-dimensions-weight')).toBeInTheDocument();
    });

    it('should display image tagging description', () => {
      render(
        <GoogleLensOptimization
          imageTagging={mockImageTagging}
          altTextGuidance={mockAltTextGuidance}
          locale="en"
        />
      );
      expect(screen.getByText('imageTagging.description')).toBeInTheDocument();
    });

    it('should render tags as a list with aria-label', () => {
      render(
        <GoogleLensOptimization
          imageTagging={mockImageTagging}
          altTextGuidance={mockAltTextGuidance}
          locale="en"
        />
      );
      const list = screen.getByRole('list', { name: 'imageTagging.listAriaLabel' });
      expect(list).toBeInTheDocument();
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(4);
    });

    it('should not render image tagging section when imageTagging is empty', () => {
      render(
        <GoogleLensOptimization
          imageTagging={[]}
          altTextGuidance={mockAltTextGuidance}
          locale="en"
        />
      );
      expect(screen.queryByText('imageTagging.title')).not.toBeInTheDocument();
    });
  });

  describe('Alt Text Recommendations', () => {
    it('should display alt text guidance content', () => {
      render(
        <GoogleLensOptimization
          imageTagging={mockImageTagging}
          altTextGuidance={mockAltTextGuidance}
          locale="en"
        />
      );
      expect(screen.getByText(mockAltTextGuidance)).toBeInTheDocument();
    });

    it('should display example section with good and bad examples', () => {
      render(
        <GoogleLensOptimization
          imageTagging={mockImageTagging}
          altTextGuidance={mockAltTextGuidance}
          locale="en"
        />
      );
      expect(screen.getByText('altText.exampleTitle')).toBeInTheDocument();
      expect(screen.getByText('altText.goodExample')).toBeInTheDocument();
      expect(screen.getByText('altText.badExample')).toBeInTheDocument();
      expect(screen.getByText('altText.goodExampleText')).toBeInTheDocument();
      expect(screen.getByText('altText.badExampleText')).toBeInTheDocument();
    });

    it('should not render alt text section when altTextGuidance is empty', () => {
      render(
        <GoogleLensOptimization
          imageTagging={mockImageTagging}
          altTextGuidance=""
          locale="en"
        />
      );
      expect(screen.queryByText('altText.title')).not.toBeInTheDocument();
    });
  });

  describe('Best Practices', () => {
    it('should display all best practice items', () => {
      render(
        <GoogleLensOptimization
          imageTagging={mockImageTagging}
          altTextGuidance={mockAltTextGuidance}
          locale="en"
        />
      );
      expect(screen.getByText('bestPractices.highResolution.title')).toBeInTheDocument();
      expect(screen.getByText('bestPractices.cleanBackground.title')).toBeInTheDocument();
      expect(screen.getByText('bestPractices.multipleAngles.title')).toBeInTheDocument();
      expect(screen.getByText('bestPractices.descriptiveFilename.title')).toBeInTheDocument();
      expect(screen.getByText('bestPractices.structuredData.title')).toBeInTheDocument();
    });

    it('should display descriptions for best practices', () => {
      render(
        <GoogleLensOptimization
          imageTagging={mockImageTagging}
          altTextGuidance={mockAltTextGuidance}
          locale="en"
        />
      );
      expect(screen.getByText('bestPractices.highResolution.description')).toBeInTheDocument();
      expect(screen.getByText('bestPractices.cleanBackground.description')).toBeInTheDocument();
      expect(screen.getByText('bestPractices.multipleAngles.description')).toBeInTheDocument();
      expect(screen.getByText('bestPractices.descriptiveFilename.description')).toBeInTheDocument();
      expect(screen.getByText('bestPractices.structuredData.description')).toBeInTheDocument();
    });

    it('should display priority badges for each practice', () => {
      render(
        <GoogleLensOptimization
          imageTagging={mockImageTagging}
          altTextGuidance={mockAltTextGuidance}
          locale="en"
        />
      );
      const highBadges = screen.getAllByText('priority.high');
      const mediumBadges = screen.getAllByText('priority.medium');
      const lowBadges = screen.getAllByText('priority.low');
      expect(highBadges).toHaveLength(2);
      expect(mediumBadges).toHaveLength(2);
      expect(lowBadges).toHaveLength(1);
    });

    it('should always render best practices section even with empty data', () => {
      render(
        <GoogleLensOptimization
          imageTagging={[]}
          altTextGuidance={mockAltTextGuidance}
          locale="en"
        />
      );
      expect(screen.getByText('bestPractices.title')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display no results message when imageTagging is empty and altTextGuidance is empty', () => {
      render(
        <GoogleLensOptimization
          imageTagging={[]}
          altTextGuidance=""
          locale="en"
        />
      );
      expect(screen.getByText('noResults')).toBeInTheDocument();
    });

    it('should not render any sections when in empty state', () => {
      render(
        <GoogleLensOptimization
          imageTagging={[]}
          altTextGuidance=""
          locale="en"
        />
      );
      expect(screen.queryByText('imageTagging.title')).not.toBeInTheDocument();
      expect(screen.queryByText('altText.title')).not.toBeInTheDocument();
      expect(screen.queryByText('bestPractices.title')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton when isLoading is true', () => {
      render(
        <GoogleLensOptimization
          imageTagging={[]}
          altTextGuidance=""
          locale="en"
          isLoading={true}
        />
      );
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have accessible loading label', () => {
      render(
        <GoogleLensOptimization
          imageTagging={[]}
          altTextGuidance=""
          locale="en"
          isLoading={true}
        />
      );
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'loading');
    });

    it('should not render content sections when loading', () => {
      render(
        <GoogleLensOptimization
          imageTagging={mockImageTagging}
          altTextGuidance={mockAltTextGuidance}
          locale="en"
          isLoading={true}
        />
      );
      expect(screen.queryByText('imageTagging.title')).not.toBeInTheDocument();
      expect(screen.queryByText('altText.title')).not.toBeInTheDocument();
      expect(screen.queryByText('bestPractices.title')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have section headings with proper ids for aria-labelledby', () => {
      render(
        <GoogleLensOptimization
          imageTagging={mockImageTagging}
          altTextGuidance={mockAltTextGuidance}
          locale="en"
        />
      );
      expect(document.getElementById('image-tagging-heading')).toBeInTheDocument();
      expect(document.getElementById('alt-text-heading')).toBeInTheDocument();
      expect(document.getElementById('best-practices-heading')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(
        <GoogleLensOptimization
          imageTagging={mockImageTagging}
          altTextGuidance={mockAltTextGuidance}
          locale="en"
        />
      );
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('title');

      const h3s = screen.getAllByRole('heading', { level: 3 });
      expect(h3s.length).toBe(3);
    });

    it('should have decorative bullet points hidden from screen readers', () => {
      const { container } = render(
        <GoogleLensOptimization
          imageTagging={mockImageTagging}
          altTextGuidance={mockAltTextGuidance}
          locale="en"
        />
      );
      const bullets = container.querySelectorAll('[aria-hidden="true"]');
      expect(bullets.length).toBeGreaterThan(0);
    });
  });

  describe('Locale Support', () => {
    it('should render with Bengali locale', () => {
      render(
        <GoogleLensOptimization
          imageTagging={mockImageTagging}
          altTextGuidance={mockAltTextGuidance}
          locale="bn"
        />
      );
      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should render with English locale', () => {
      render(
        <GoogleLensOptimization
          imageTagging={mockImageTagging}
          altTextGuidance={mockAltTextGuidance}
          locale="en"
        />
      );
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });
});
