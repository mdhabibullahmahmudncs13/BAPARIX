/**
 * @jest-environment node
 */
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock fetch
global.fetch = jest.fn();

describe('POST /api/profile/onboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
  });

  const createRequest = (body: any, headers: Record<string, string> = {}) => {
    return new NextRequest('http://localhost:3000/api/profile/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });
  };

  it('returns 401 if no authorization header', async () => {
    const request = createRequest({});

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 if required fields are missing', async () => {
    const request = createRequest(
      { businessType: 'reseller' },
      { 'Authorization': 'Bearer token' }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  it('returns 400 if international account is missing required fields', async () => {
    const request = createRequest(
      {
        businessType: 'reseller',
        location: 'Dhaka',
        productIdea: 'Electronics',
        totalInvestment: '500000',
        teamSize: '5',
        warehouseCapacity: '1000',
        accountType: 'international',
      },
      { 'Authorization': 'Bearer token' }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Target countries and currencies are required for international accounts');
  });

  it('successfully saves onboarding data for domestic account', async () => {
    const mockUser = {
      id: 'user-123',
      businessType: 'reseller',
      location: 'Dhaka',
      onboardingCompleted: true,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    const request = createRequest(
      {
        businessType: 'reseller',
        location: 'Dhaka',
        productIdea: 'Electronics',
        totalInvestment: '500000',
        teamSize: '5',
        warehouseCapacity: '1000',
        accountType: 'domestic',
      },
      { 'Authorization': 'Bearer token' }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Onboarding completed successfully');
    expect(data.data).toEqual(mockUser);
  });

  it('successfully saves onboarding data for international account', async () => {
    const mockUser = {
      id: 'user-123',
      businessType: 'sme',
      location: 'Chittagong',
      accountType: 'international',
      targetCountries: 'USA, UK',
      currencies: 'USD, GBP',
      onboardingCompleted: true,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    const request = createRequest(
      {
        businessType: 'sme',
        location: 'Chittagong',
        productIdea: 'Fashion',
        totalInvestment: '1000000',
        teamSize: '10',
        warehouseCapacity: '2000',
        accountType: 'international',
        targetCountries: 'USA, UK',
        currencies: 'USD, GBP',
      },
      { 'Authorization': 'Bearer token' }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockUser);
  });

  it('handles backend API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Database error' }),
    });

    const request = createRequest(
      {
        businessType: 'reseller',
        location: 'Dhaka',
        productIdea: 'Electronics',
        totalInvestment: '500000',
        teamSize: '5',
        warehouseCapacity: '1000',
        accountType: 'domestic',
      },
      { 'Authorization': 'Bearer token' }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Database error');
  });

  it('handles unexpected errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const request = createRequest(
      {
        businessType: 'reseller',
        location: 'Dhaka',
        productIdea: 'Electronics',
        totalInvestment: '500000',
        teamSize: '5',
        warehouseCapacity: '1000',
        accountType: 'domestic',
      },
      { 'Authorization': 'Bearer token' }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
