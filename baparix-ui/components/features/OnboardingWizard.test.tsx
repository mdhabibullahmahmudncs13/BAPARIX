import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingWizard, OnboardingData } from './OnboardingWizard';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useTranslations
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'progress': 'Step {current} of {total}',
      'next': 'Next',
      'back': 'Back',
      'finish': 'Finish',
      'skip': 'Skip',
      'welcome.title': 'Welcome to VentureOS',
      'welcome.description': "We'll help you build and grow your business with AI-powered insights",
      'welcome.getStarted': 'Get Started',
      'businessType.title': 'What type of business are you running?',
      'businessType.reseller': 'Product Reseller/Importer',
      'businessType.resellerDesc': 'I source and resell products',
      'businessType.sme': 'SME Owner/Existing Business',
      'businessType.smeDesc': 'I have an established business',
      'businessType.required': 'Please select a business type',
      'location.title': 'Tell us about your business',
      'location.location': 'Your Location',
      'location.locationPlaceholder': 'e.g., Dhaka, Chittagong',
      'location.productIdea': 'Product Idea or Category',
      'location.productPlaceholder': 'e.g., Electronics, Fashion, Home Goods',
      'location.locationRequired': 'Location is required',
      'location.productRequired': 'Product idea is required',
      'investment.title': 'Business Resources',
      'investment.totalInvestment': 'Total Investment (BDT)',
      'investment.investmentPlaceholder': 'e.g., 500000',
      'investment.teamSize': 'Team Size',
      'investment.teamPlaceholder': 'Number of team members',
      'investment.investmentRequired': 'Investment amount is required',
      'investment.teamRequired': 'Team size is required',
      'warehouse.title': 'Operations Setup',
      'warehouse.warehouseCapacity': 'Warehouse Capacity (sq ft)',
      'warehouse.warehousePlaceholder': 'e.g., 1000',
      'warehouse.accountType': 'Account Type',
      'warehouse.domestic': 'Domestic Only',
      'warehouse.international': 'International Accounts',
      'warehouse.warehouseRequired': 'Warehouse capacity is required',
      'warehouse.accountRequired': 'Account type is required',
      'international.title': 'International Details',
      'international.targetCountries': 'Target Countries',
      'international.countriesPlaceholder': 'e.g., USA, UK, Canada',
      'international.currencies': 'Currencies',
      'international.currenciesPlaceholder': 'e.g., USD, GBP, EUR',
      'international.countriesRequired': 'Target countries are required',
      'international.currenciesRequired': 'Currencies are required',
      'summary.title': 'Review Your Information',
      'summary.businessType': 'Business Type',
      'summary.location': 'Location',
      'summary.productIdea': 'Product Idea',
      'summary.investment': 'Investment',
      'summary.teamSize': 'Team Size',
      'summary.warehouse': 'Warehouse',
      'summary.accountType': 'Account Type',
      'summary.targetCountries': 'Target Countries',
      'summary.currencies': 'Currencies',
      'summary.edit': 'Edit',
    };
    
    // Handle parameterized translations
    if (key === 'progress') {
      return (params: { current: number; total: number }) => 
        `Step ${params.current} of ${params.total}`;
    }
    
    return translations[key] || key;
  },
}));

describe('OnboardingWizard', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders welcome screen initially', () => {
    render(<OnboardingWizard />);
    expect(screen.getByText('Welcome to VentureOS')).toBeInTheDocument();
    expect(screen.getByText("We'll help you build and grow your business with AI-powered insights")).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('progresses to business type step when Get Started is clicked', () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText('Get Started'));
    expect(screen.getByText('What type of business are you running?')).toBeInTheDocument();
  });

  it('validates business type selection', () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Please select a business type')).toBeInTheDocument();
  });

  it('allows selecting reseller business type', () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText('Get Started'));
    
    const resellerRadio = screen.getByLabelText('Product Reseller/Importer');
    fireEvent.click(resellerRadio);
    
    expect(resellerRadio).toBeChecked();
  });

  it('allows selecting SME business type', () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText('Get Started'));
    
    const smeRadio = screen.getByLabelText('SME Owner/Existing Business');
    fireEvent.click(smeRadio);
    
    expect(smeRadio).toBeChecked();
  });

  it('progresses to location step after selecting business type', () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText('Get Started'));
    
    const resellerRadio = screen.getByLabelText('Product Reseller/Importer');
    fireEvent.click(resellerRadio);
    fireEvent.click(screen.getByText('Next'));
    
    expect(screen.getByText('Tell us about your business')).toBeInTheDocument();
  });

  it('validates location and product idea fields', () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.click(screen.getByLabelText('Product Reseller/Importer'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    
    expect(screen.getByText('Location is required')).toBeInTheDocument();
    expect(screen.getByText('Product idea is required')).toBeInTheDocument();
  });

  it('allows filling location and product idea', () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.click(screen.getByLabelText('Product Reseller/Importer'));
    fireEvent.click(screen.getByText('Next'));
    
    const locationInput = screen.getByPlaceholderText('e.g., Dhaka, Chittagong');
    const productInput = screen.getByPlaceholderText('e.g., Electronics, Fashion, Home Goods');
    
    fireEvent.change(locationInput, { target: { value: 'Dhaka' } });
    fireEvent.change(productInput, { target: { value: 'Electronics' } });
    
    expect(locationInput).toHaveValue('Dhaka');
    expect(productInput).toHaveValue('Electronics');
  });

  it('validates investment and team size fields', () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.click(screen.getByLabelText('Product Reseller/Importer'));
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g., Dhaka, Chittagong'), { target: { value: 'Dhaka' } });
    fireEvent.change(screen.getByPlaceholderText('e.g., Electronics, Fashion, Home Goods'), { target: { value: 'Electronics' } });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    
    expect(screen.getByText('Investment amount is required')).toBeInTheDocument();
    expect(screen.getByText('Team size is required')).toBeInTheDocument();
  });

  it('validates warehouse capacity and account type', () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.click(screen.getByLabelText('Product Reseller/Importer'));
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g., Dhaka, Chittagong'), { target: { value: 'Dhaka' } });
    fireEvent.change(screen.getByPlaceholderText('e.g., Electronics, Fashion, Home Goods'), { target: { value: 'Electronics' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g., 500000'), { target: { value: '500000' } });
    fireEvent.change(screen.getByPlaceholderText('Number of team members'), { target: { value: '5' } });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    
    expect(screen.getByText('Warehouse capacity is required')).toBeInTheDocument();
    expect(screen.getByText('Account type is required')).toBeInTheDocument();
  });

  it('skips international step when domestic is selected', () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.click(screen.getByLabelText('Product Reseller/Importer'));
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g., Dhaka, Chittagong'), { target: { value: 'Dhaka' } });
    fireEvent.change(screen.getByPlaceholderText('e.g., Electronics, Fashion, Home Goods'), { target: { value: 'Electronics' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g., 500000'), { target: { value: '500000' } });
    fireEvent.change(screen.getByPlaceholderText('Number of team members'), { target: { value: '5' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g., 1000'), { target: { value: '1000' } });
    fireEvent.click(screen.getByLabelText('Domestic Only'));
    fireEvent.click(screen.getByText('Next'));
    
    expect(screen.getByText('Review Your Information')).toBeInTheDocument();
  });

  it('shows international step when international is selected', () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.click(screen.getByLabelText('Product Reseller/Importer'));
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g., Dhaka, Chittagong'), { target: { value: 'Dhaka' } });
    fireEvent.change(screen.getByPlaceholderText('e.g., Electronics, Fashion, Home Goods'), { target: { value: 'Electronics' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g., 500000'), { target: { value: '500000' } });
    fireEvent.change(screen.getByPlaceholderText('Number of team members'), { target: { value: '5' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g., 1000'), { target: { value: '1000' } });
    fireEvent.click(screen.getByLabelText('International Accounts'));
    fireEvent.click(screen.getByText('Next'));
    
    expect(screen.getByText('International Details')).toBeInTheDocument();
  });

  it('validates international fields when international is selected', () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.click(screen.getByLabelText('Product Reseller/Importer'));
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g., Dhaka, Chittagong'), { target: { value: 'Dhaka' } });
    fireEvent.change(screen.getByPlaceholderText('e.g., Electronics, Fashion, Home Goods'), { target: { value: 'Electronics' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g., 500000'), { target: { value: '500000' } });
    fireEvent.change(screen.getByPlaceholderText('Number of team members'), { target: { value: '5' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g., 1000'), { target: { value: '1000' } });
    fireEvent.click(screen.getByLabelText('International Accounts'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    
    expect(screen.getByText('Target countries are required')).toBeInTheDocument();
    expect(screen.getByText('Currencies are required')).toBeInTheDocument();
  });

  it('displays summary with all entered data', () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.click(screen.getByLabelText('Product Reseller/Importer'));
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g., Dhaka, Chittagong'), { target: { value: 'Dhaka' } });
    fireEvent.change(screen.getByPlaceholderText('e.g., Electronics, Fashion, Home Goods'), { target: { value: 'Electronics' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g., 500000'), { target: { value: '500000' } });
    fireEvent.change(screen.getByPlaceholderText('Number of team members'), { target: { value: '5' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g., 1000'), { target: { value: '1000' } });
    fireEvent.click(screen.getByLabelText('Domestic Only'));
    fireEvent.click(screen.getByText('Next'));
    
    expect(screen.getByText('Dhaka')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('৳500000')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('1000 sq ft')).toBeInTheDocument();
  });

  it('calls onComplete and navigates when finish is clicked', async () => {
    const onComplete = jest.fn();
    render(<OnboardingWizard onComplete={onComplete} />);
    
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.click(screen.getByLabelText('Product Reseller/Importer'));
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g., Dhaka, Chittagong'), { target: { value: 'Dhaka' } });
    fireEvent.change(screen.getByPlaceholderText('e.g., Electronics, Fashion, Home Goods'), { target: { value: 'Electronics' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g., 500000'), { target: { value: '500000' } });
    fireEvent.change(screen.getByPlaceholderText('Number of team members'), { target: { value: '5' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g., 1000'), { target: { value: '1000' } });
    fireEvent.click(screen.getByLabelText('Domestic Only'));
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.click(screen.getByText('Finish'));
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith({
        businessType: 'reseller',
        location: 'Dhaka',
        productIdea: 'Electronics',
        totalInvestment: '500000',
        teamSize: '5',
        warehouseCapacity: '1000',
        accountType: 'domestic',
        targetCountries: '',
        currencies: '',
      });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('allows going back to previous steps', () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.click(screen.getByLabelText('Product Reseller/Importer'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Back'));
    
    expect(screen.getByText('What type of business are you running?')).toBeInTheDocument();
  });

  it('renders with initial data', () => {
    const initialData = {
      businessType: 'sme' as const,
      location: 'Chittagong',
      productIdea: 'Fashion',
    };
    
    render(<OnboardingWizard initialData={initialData} />);
    fireEvent.click(screen.getByText('Get Started'));
    
    expect(screen.getByLabelText('SME Owner/Existing Business')).toBeChecked();
    
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByDisplayValue('Chittagong')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Fashion')).toBeInTheDocument();
  });

  it('displays icons when low-literacy mode is enabled', () => {
    render(<OnboardingWizard lowLiteracyMode={true} />);
    
    // Welcome screen should have wave emoji
    expect(screen.getByText('👋')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Get Started'));
    
    // Business type screen should have building emoji
    expect(screen.getByText('🏢')).toBeInTheDocument();
  });

  it('does not display icons when low-literacy mode is disabled', () => {
    render(<OnboardingWizard lowLiteracyMode={false} />);
    
    // Welcome screen should not have wave emoji
    expect(screen.queryByText('👋')).not.toBeInTheDocument();
  });
});
