import React from 'react';
import { render, screen, within } from '@testing-library/react';
import {
  SocialSEORecommendations,
  Hashtag,
  SocialPlatform,
  PostingTime,
} from './SocialSEORecommendations';

const mockHashtags: Hashtag[] = [
  { tag: 'ResellBD', volume: 25000, trendDuration: '3 months' },
  { tag: 'ImportFromChina', volume: 18000, trendDuration: '6 months' },
  { tag: 'BangladeshBusiness', volume: 12000, trendDuration: '12 months' },
];

const mockPlatforms: SocialPlatform[] = [
  {
    name: 'Facebook',
    strategy: 'Focus on product showcase reels and community engagement',
    postingFrequency: '3x/week',
  },
  {
    name: 'Instagram',
    strategy: 'Visual product photography with Bengali captions',
    postingFrequency: '5x/week',
  },
  {
    name: 'TikTok',
    strategy: 'Short-form product unboxing and review videos',
    postingFrequency: '7x/week',
  },
];

const mockPostingTimes: PostingTime[] = [
  { platform: 'Facebook', day: 'Monday', time: '9:00 AM', engagement: 'high' },
  { platform: 'Facebook', day: 'Wednesday', time: '7:00 PM', engagement: 'high' },
  { platform: 'Instagram', day: 'Tuesday', time: '12:00 PM', engagement: 'medium' },
  { platform: 'TikTok', day: 'Friday', time: '6:00 PM', engagement: 'high' },
  { platform: 'TikTok', day: 'Saturday', time: '10:00 AM', engagement: 'low' },
];

describe('SocialSEORecommendations', () => {
  describe('Rendering', () => {
    it('should render the title', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should render all three sections', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      expect(screen.getByText('hashtagStrategy')).toBeInTheDocument();
      expect(screen.getByText('optimalPostingTimes')).toBeInTheDocument();
      expect(screen.getByText('platformStrategy')).toBeInTheDocument();
    });
  });

  describe('Hashtag Strategy', () => {
    it('should display hashtag table columns', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      expect(screen.getByText('columns.hashtag')).toBeInTheDocument();
      expect(screen.getByText('columns.volume')).toBeInTheDocument();
      expect(screen.getByText('columns.trendDuration')).toBeInTheDocument();
    });

    it('should display all hashtags with # prefix', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      expect(screen.getByText('#ResellBD')).toBeInTheDocument();
      expect(screen.getByText('#ImportFromChina')).toBeInTheDocument();
      expect(screen.getByText('#BangladeshBusiness')).toBeInTheDocument();
    });

    it('should display volume data for each hashtag', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      expect(screen.getByText('25,000')).toBeInTheDocument();
      expect(screen.getByText('18,000')).toBeInTheDocument();
      expect(screen.getByText('12,000')).toBeInTheDocument();
    });

    it('should display trend duration for each hashtag', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      expect(screen.getByText('3 months')).toBeInTheDocument();
      expect(screen.getByText('6 months')).toBeInTheDocument();
      expect(screen.getByText('12 months')).toBeInTheDocument();
    });

    it('should not render hashtag section when hashtags array is empty', () => {
      render(
        <SocialSEORecommendations
          hashtags={[]}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      expect(screen.queryByText('hashtagStrategy')).not.toBeInTheDocument();
    });
  });

  describe('Optimal Posting Times', () => {
    it('should display posting times table columns', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      expect(screen.getByText('columns.platform')).toBeInTheDocument();
      expect(screen.getByText('columns.day')).toBeInTheDocument();
      expect(screen.getByText('columns.time')).toBeInTheDocument();
      expect(screen.getByText('columns.engagement')).toBeInTheDocument();
    });

    it('should display all posting times', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
      expect(screen.getByText('7:00 PM')).toBeInTheDocument();
      expect(screen.getByText('12:00 PM')).toBeInTheDocument();
      expect(screen.getByText('6:00 PM')).toBeInTheDocument();
      expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    });

    it('should display engagement level badges', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      const highBadges = screen.getAllByText('engagement.high');
      const mediumBadges = screen.getAllByText('engagement.medium');
      const lowBadges = screen.getAllByText('engagement.low');
      expect(highBadges.length).toBe(3);
      expect(mediumBadges.length).toBe(1);
      expect(lowBadges.length).toBe(1);
    });

    it('should display platform names in posting times', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      // Posting times table has platform names in rows
      const postingTimesSection = screen.getByLabelText('postingTimesTableAriaLabel');
      const rows = within(postingTimesSection).getAllByRole('row');
      // Header + 5 data rows
      expect(rows.length).toBe(6);
    });

    it('should not render posting times section when postingTimes array is empty', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={[]}
          locale="en"
        />
      );
      expect(screen.queryByText('optimalPostingTimes')).not.toBeInTheDocument();
    });
  });

  describe('Platform Strategy', () => {
    it('should display all platform cards', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      // Platform names appear in both posting times table and platform cards
      // Verify by checking for the h4 headings in platform cards
      const headings = screen.getAllByRole('heading', { level: 4 });
      const platformNames = headings.map((h) => h.textContent);
      expect(platformNames).toContain('Facebook');
      expect(platformNames).toContain('Instagram');
      expect(platformNames).toContain('TikTok');
    });

    it('should display strategy text for each platform', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      expect(
        screen.getByText('Focus on product showcase reels and community engagement')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Visual product photography with Bengali captions')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Short-form product unboxing and review videos')
      ).toBeInTheDocument();
    });

    it('should display posting frequency badges', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      expect(screen.getByText('3x/week')).toBeInTheDocument();
      expect(screen.getByText('5x/week')).toBeInTheDocument();
      expect(screen.getByText('7x/week')).toBeInTheDocument();
    });

    it('should not render platform section when platforms array is empty', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={[]}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      expect(screen.queryByText('platformStrategy')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display no results message when all arrays are empty', () => {
      render(
        <SocialSEORecommendations
          hashtags={[]}
          platforms={[]}
          postingTimes={[]}
          locale="en"
        />
      );
      expect(screen.getByText('noResults')).toBeInTheDocument();
    });

    it('should not render any tables when all data is empty', () => {
      render(
        <SocialSEORecommendations
          hashtags={[]}
          platforms={[]}
          postingTimes={[]}
          locale="en"
        />
      );
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton when isLoading is true', () => {
      render(
        <SocialSEORecommendations
          hashtags={[]}
          platforms={[]}
          postingTimes={[]}
          locale="en"
          isLoading={true}
        />
      );
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have accessible loading label', () => {
      render(
        <SocialSEORecommendations
          hashtags={[]}
          platforms={[]}
          postingTimes={[]}
          locale="en"
          isLoading={true}
        />
      );
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'loading');
    });

    it('should not render tables when loading', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
          isLoading={true}
        />
      );
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have hashtag table with grid role and aria-label', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      const hashtagTable = screen.getByLabelText('hashtagTableAriaLabel');
      expect(hashtagTable).toHaveAttribute('role', 'grid');
    });

    it('should have posting times table with grid role and aria-label', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      const postingTable = screen.getByLabelText('postingTimesTableAriaLabel');
      expect(postingTable).toHaveAttribute('role', 'grid');
    });

    it('should have section headings with proper ids for aria-labelledby', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      expect(document.getElementById('hashtag-strategy-heading')).toBeInTheDocument();
      expect(document.getElementById('posting-times-heading')).toBeInTheDocument();
      expect(document.getElementById('platform-strategy-heading')).toBeInTheDocument();
    });

    it('should have column headers with scope col', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      const headers = screen.getAllByRole('columnheader');
      headers.forEach((header) => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });
  });

  describe('Locale Support', () => {
    it('should render with Bengali locale', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="bn"
        />
      );
      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should render with English locale', () => {
      render(
        <SocialSEORecommendations
          hashtags={mockHashtags}
          platforms={mockPlatforms}
          postingTimes={mockPostingTimes}
          locale="en"
        />
      );
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });
});
