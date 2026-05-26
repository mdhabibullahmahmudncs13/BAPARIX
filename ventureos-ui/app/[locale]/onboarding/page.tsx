'use client';

import { OnboardingWizard, OnboardingData } from '@/components/features/OnboardingWizard';

export default function OnboardingPage() {
  const handleComplete = async (data: OnboardingData) => {
    try {
      // Save onboarding data to user profile
      const response = await fetch('/api/profile/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save onboarding data');
      }
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  };

  return <OnboardingWizard onComplete={handleComplete} />;
}
