'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Radio } from '@/components/ui/Radio';
import { Card } from '@/components/ui/Card';

export type BusinessType = 'reseller' | 'sme' | null;
export type AccountType = 'domestic' | 'international' | null;

export interface OnboardingData {
  businessType: BusinessType;
  location: string;
  productIdea: string;
  totalInvestment: string;
  teamSize: string;
  warehouseCapacity: string;
  accountType: AccountType;
  targetCountries?: string;
  currencies?: string;
}

interface OnboardingWizardProps {
  onComplete?: (data: OnboardingData) => void;
  initialData?: Partial<OnboardingData>;
  lowLiteracyMode?: boolean;
}

export function OnboardingWizard({ onComplete, initialData, lowLiteracyMode = false }: OnboardingWizardProps) {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<OnboardingData>({
    businessType: initialData?.businessType || null,
    location: initialData?.location || '',
    productIdea: initialData?.productIdea || '',
    totalInvestment: initialData?.totalInvestment || '',
    teamSize: initialData?.teamSize || '',
    warehouseCapacity: initialData?.warehouseCapacity || '',
    accountType: initialData?.accountType || null,
    targetCountries: initialData?.targetCountries || '',
    currencies: initialData?.currencies || '',
  });

  const totalSteps = formData.accountType === 'international' ? 7 : 6;

  // Voice prompt placeholder - in production, this would trigger audio playback
  const playVoicePrompt = (text: string) => {
    if (lowLiteracyMode) {
      console.log('Voice prompt:', text);
      // TODO: Integrate with text-to-speech API
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Business Type
        if (!formData.businessType) {
          newErrors.businessType = t('businessType.required');
        }
        break;
      case 2: // Location
        if (!formData.location.trim()) {
          newErrors.location = t('location.locationRequired');
        }
        if (!formData.productIdea.trim()) {
          newErrors.productIdea = t('location.productRequired');
        }
        break;
      case 3: // Investment
        if (!formData.totalInvestment.trim()) {
          newErrors.totalInvestment = t('investment.investmentRequired');
        }
        if (!formData.teamSize.trim()) {
          newErrors.teamSize = t('investment.teamRequired');
        }
        break;
      case 4: // Warehouse
        if (!formData.warehouseCapacity.trim()) {
          newErrors.warehouseCapacity = t('warehouse.warehouseRequired');
        }
        if (!formData.accountType) {
          newErrors.accountType = t('warehouse.accountRequired');
        }
        break;
      case 5: // International (conditional)
        if (formData.accountType === 'international') {
          if (!formData.targetCountries?.trim()) {
            newErrors.targetCountries = t('international.countriesRequired');
          }
          if (!formData.currencies?.trim()) {
            newErrors.currencies = t('international.currenciesRequired');
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 4 && formData.accountType === 'domestic') {
        setCurrentStep(6); // Skip international step
      } else if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 6 && formData.accountType === 'domestic') {
      setCurrentStep(4); // Skip international step when going back
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    try {
      if (onComplete) {
        await onComplete(formData);
      }
      
      // Route based on business type
      // Mode_A (reseller) and Mode_B (SME) both route to dashboard for now
      // Future: Could route to different dashboard variants
      const dashboardPath = '/dashboard';
      router.push(dashboardPath);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Show error to user
      setErrors({ submit: t('error.submitFailed') });
    }
  };

  const updateFormData = (field: keyof OnboardingData, value: string | BusinessType | AccountType) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="text-center space-y-6">
            {lowLiteracyMode && (
              <div className="text-6xl mb-4">👋</div>
            )}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">{t('welcome.title')}</h1>
              <p className="text-lg text-gray-600">{t('welcome.description')}</p>
            </div>
            <Button 
              onClick={() => {
                playVoicePrompt(t('businessType.title'));
                setCurrentStep(1);
              }} 
              size="lg"
            >
              {lowLiteracyMode && <span className="mr-2">▶️</span>}
              {t('welcome.getStarted')}
            </Button>
          </div>
        );

      case 1: // Business Type
        return (
          <div className="space-y-6">
            {lowLiteracyMode && (
              <div className="text-center text-5xl mb-4">🏢</div>
            )}
            <h2 className="text-2xl font-bold text-gray-900">{t('businessType.title')}</h2>
            <div className="space-y-4">
              <Card
                className={`p-4 cursor-pointer transition-all ${
                  formData.businessType === 'reseller'
                    ? 'border-blue-500 bg-blue-50'
                    : 'hover:border-gray-400'
                }`}
                onClick={() => updateFormData('businessType', 'reseller')}
              >
                <div className="flex items-start">
                  {lowLiteracyMode && <span className="text-2xl mr-3">📦</span>}
                  <div className="flex-1">
                    <Radio
                      name="businessType"
                      value="reseller"
                      checked={formData.businessType === 'reseller'}
                      onChange={() => updateFormData('businessType', 'reseller')}
                      label={t('businessType.reseller')}
                    />
                    <p className="ml-6 text-sm text-gray-600">{t('businessType.resellerDesc')}</p>
                  </div>
                </div>
              </Card>
              <Card
                className={`p-4 cursor-pointer transition-all ${
                  formData.businessType === 'sme'
                    ? 'border-blue-500 bg-blue-50'
                    : 'hover:border-gray-400'
                }`}
                onClick={() => updateFormData('businessType', 'sme')}
              >
                <div className="flex items-start">
                  {lowLiteracyMode && <span className="text-2xl mr-3">🏭</span>}
                  <div className="flex-1">
                    <Radio
                      name="businessType"
                      value="sme"
                      checked={formData.businessType === 'sme'}
                      onChange={() => updateFormData('businessType', 'sme')}
                      label={t('businessType.sme')}
                    />
                    <p className="ml-6 text-sm text-gray-600">{t('businessType.smeDesc')}</p>
                  </div>
                </div>
              </Card>
            </div>
            {errors.businessType && (
              <p className="text-sm text-red-600">{errors.businessType}</p>
            )}
          </div>
        );

      case 2: // Location
        return (
          <div className="space-y-6">
            {lowLiteracyMode && (
              <div className="text-center text-5xl mb-4">📍</div>
            )}
            <h2 className="text-2xl font-bold text-gray-900">{t('location.title')}</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                {lowLiteracyMode && <span className="text-2xl mt-6">🌍</span>}
                <div className="flex-1">
                  <Input
                    label={t('location.location')}
                    placeholder={t('location.locationPlaceholder')}
                    value={formData.location}
                    onChange={(e) => updateFormData('location', e.target.value)}
                    error={errors.location}
                    required
                  />
                </div>
              </div>
              <div className="flex items-start gap-2">
                {lowLiteracyMode && <span className="text-2xl mt-6">💡</span>}
                <div className="flex-1">
                  <Input
                    label={t('location.productIdea')}
                    placeholder={t('location.productPlaceholder')}
                    value={formData.productIdea}
                    onChange={(e) => updateFormData('productIdea', e.target.value)}
                    error={errors.productIdea}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Investment
        return (
          <div className="space-y-6">
            {lowLiteracyMode && (
              <div className="text-center text-5xl mb-4">💰</div>
            )}
            <h2 className="text-2xl font-bold text-gray-900">{t('investment.title')}</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                {lowLiteracyMode && <span className="text-2xl mt-6">💵</span>}
                <div className="flex-1">
                  <Input
                    label={t('investment.totalInvestment')}
                    type="number"
                    placeholder={t('investment.investmentPlaceholder')}
                    value={formData.totalInvestment}
                    onChange={(e) => updateFormData('totalInvestment', e.target.value)}
                    error={errors.totalInvestment}
                    required
                  />
                </div>
              </div>
              <div className="flex items-start gap-2">
                {lowLiteracyMode && <span className="text-2xl mt-6">👥</span>}
                <div className="flex-1">
                  <Input
                    label={t('investment.teamSize')}
                    type="number"
                    placeholder={t('investment.teamPlaceholder')}
                    value={formData.teamSize}
                    onChange={(e) => updateFormData('teamSize', e.target.value)}
                    error={errors.teamSize}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // Warehouse
        return (
          <div className="space-y-6">
            {lowLiteracyMode && (
              <div className="text-center text-5xl mb-4">🏪</div>
            )}
            <h2 className="text-2xl font-bold text-gray-900">{t('warehouse.title')}</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                {lowLiteracyMode && <span className="text-2xl mt-6">📦</span>}
                <div className="flex-1">
                  <Input
                    label={t('warehouse.warehouseCapacity')}
                    type="number"
                    placeholder={t('warehouse.warehousePlaceholder')}
                    value={formData.warehouseCapacity}
                    onChange={(e) => updateFormData('warehouseCapacity', e.target.value)}
                    error={errors.warehouseCapacity}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {lowLiteracyMode && <span className="mr-2">🌐</span>}
                  {t('warehouse.accountType')} <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <Radio
                    name="accountType"
                    value="domestic"
                    checked={formData.accountType === 'domestic'}
                    onChange={() => updateFormData('accountType', 'domestic')}
                    label={
                      <span>
                        {lowLiteracyMode && <span className="mr-2">🏠</span>}
                        {t('warehouse.domestic')}
                      </span>
                    }
                  />
                  <Radio
                    name="accountType"
                    value="international"
                    checked={formData.accountType === 'international'}
                    onChange={() => updateFormData('accountType', 'international')}
                    label={
                      <span>
                        {lowLiteracyMode && <span className="mr-2">✈️</span>}
                        {t('warehouse.international')}
                      </span>
                    }
                  />
                </div>
                {errors.accountType && (
                  <p className="text-sm text-red-600">{errors.accountType}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 5: // International (conditional)
        return (
          <div className="space-y-6">
            {lowLiteracyMode && (
              <div className="text-center text-5xl mb-4">🌍</div>
            )}
            <h2 className="text-2xl font-bold text-gray-900">{t('international.title')}</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                {lowLiteracyMode && <span className="text-2xl mt-6">🗺️</span>}
                <div className="flex-1">
                  <Input
                    label={t('international.targetCountries')}
                    placeholder={t('international.countriesPlaceholder')}
                    value={formData.targetCountries || ''}
                    onChange={(e) => updateFormData('targetCountries', e.target.value)}
                    error={errors.targetCountries}
                    required
                  />
                </div>
              </div>
              <div className="flex items-start gap-2">
                {lowLiteracyMode && <span className="text-2xl mt-6">💱</span>}
                <div className="flex-1">
                  <Input
                    label={t('international.currencies')}
                    placeholder={t('international.currenciesPlaceholder')}
                    value={formData.currencies || ''}
                    onChange={(e) => updateFormData('currencies', e.target.value)}
                    error={errors.currencies}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 6: // Summary
        return (
          <div className="space-y-6">
            {lowLiteracyMode && (
              <div className="text-center text-5xl mb-4">✅</div>
            )}
            <h2 className="text-2xl font-bold text-gray-900">{t('summary.title')}</h2>
            <Card className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    {lowLiteracyMode && <span>🏢</span>}
                    {t('summary.businessType')}
                  </p>
                  <p className="font-medium">
                    {formData.businessType === 'reseller'
                      ? t('businessType.reseller')
                      : t('businessType.sme')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    {lowLiteracyMode && <span>📍</span>}
                    {t('summary.location')}
                  </p>
                  <p className="font-medium">{formData.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    {lowLiteracyMode && <span>💡</span>}
                    {t('summary.productIdea')}
                  </p>
                  <p className="font-medium">{formData.productIdea}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    {lowLiteracyMode && <span>💰</span>}
                    {t('summary.investment')}
                  </p>
                  <p className="font-medium">৳{formData.totalInvestment}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    {lowLiteracyMode && <span>👥</span>}
                    {t('summary.teamSize')}
                  </p>
                  <p className="font-medium">{formData.teamSize}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    {lowLiteracyMode && <span>🏪</span>}
                    {t('summary.warehouse')}
                  </p>
                  <p className="font-medium">{formData.warehouseCapacity} sq ft</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    {lowLiteracyMode && <span>🌐</span>}
                    {t('summary.accountType')}
                  </p>
                  <p className="font-medium">
                    {formData.accountType === 'domestic'
                      ? t('warehouse.domestic')
                      : t('warehouse.international')}
                  </p>
                </div>
                {formData.accountType === 'international' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        {lowLiteracyMode && <span>🗺️</span>}
                        {t('summary.targetCountries')}
                      </p>
                      <p className="font-medium">{formData.targetCountries}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        {lowLiteracyMode && <span>💱</span>}
                        {t('summary.currencies')}
                      </p>
                      <p className="font-medium">{formData.currencies}</p>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="p-8">
          {currentStep > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-600">
                  {t('progress', { current: currentStep, total: totalSteps })}
                </p>
                <p className="text-sm font-medium text-blue-600">
                  {Math.round((currentStep / totalSteps) * 100)}%
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}

          {renderStep()}

          {errors.submit && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {currentStep > 0 && (
            <div className="flex justify-between mt-8">
              <Button
                variant="secondary"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                {t('back')}
              </Button>
              {currentStep < totalSteps ? (
                <Button onClick={handleNext}>
                  {t('next')}
                </Button>
              ) : (
                <Button onClick={handleFinish}>
                  {t('finish')}
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
