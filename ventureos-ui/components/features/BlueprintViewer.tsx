'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartPieIcon,
  RocketLaunchIcon,
  MegaphoneIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { formatNumber } from '@/lib/utils/formatNumber';

export interface RevenueStream {
  name: string;
  type: string;
  projectedMonthly: number;
}

export interface CostItem {
  category: string;
  amount: number;
  frequency: 'one-time' | 'monthly' | 'annual';
}

export interface MonthlyProjection {
  month: number;
  revenue: number;
  costs: number;
  profit: number;
  cashFlow: number;
}

export interface InvestmentItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface GTMPhase {
  phase: number;
  name: string;
  duration: string;
  activities: string[];
  budget: number;
}

export interface Channel {
  name: string;
  priority: number;
  rationale: string;
  estimatedCAC: number;
}

export interface Keyword {
  term: string;
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
  language: 'bn' | 'en';
}

export interface SocialPlatform {
  name: string;
  strategy: string;
  postingFrequency: string;
}

export interface Hashtag {
  tag: string;
  volume: number;
  trendDuration: string;
}

export interface MarketplaceSEO {
  platform: string;
  titleTemplate: string;
  descriptionTemplate: string;
}

export interface Risk {
  category: string;
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface TeamRole {
  title: string;
  responsibilities: string[];
  requiredSkills: string[];
  estimatedSalary: number;
}

export interface BusinessBlueprint {
  id: string;
  productIdea: string;
  businessType: string;
  confidenceScores: {
    overall: number;
    financial: number;
    market: number;
    execution: number;
  };
  businessModelCanvas?: {
    valueProposition: string;
    customerSegments: string[];
    channels: string[];
    customerRelationships: string[];
    revenueStreams: RevenueStream[];
    keyResources: string[];
    keyActivities: string[];
    keyPartnerships: string[];
    costStructure: CostItem[];
  };
  financialProjections?: {
    scenarios: {
      conservative: MonthlyProjection[];
      base: MonthlyProjection[];
      optimistic: MonthlyProjection[];
    };
    assumptions: string[];
    investmentBreakdown: InvestmentItem[];
  };
  breakEvenAnalysis?: {
    fixedCosts: number;
    variableCostPerUnit: number;
    pricePerUnit: number;
    breakEvenUnits: number;
    breakEvenRevenue: number;
    monthsToBreakEven: number;
  };
  marketSizing?: {
    tam: number;
    sam: number;
    som: number;
    methodology: string;
  };
  goToMarketPlan?: {
    phases: GTMPhase[];
    channelPrioritization: Channel[];
    launchTimeline: string;
  };
  seoStrategy?: {
    googleSEO: {
      keywords: Keyword[];
      contentTopics: string[];
    };
    socialSEO: {
      platforms: SocialPlatform[];
      hashtags: Hashtag[];
      postingSchedule: string;
    };
    marketplaceSEO: MarketplaceSEO[];
    googleLensOptimization: {
      imageTagging: string[];
      altTextGuidance: string;
    };
  };
  riskRegister?: Risk[];
  teamStructure?: {
    roles: TeamRole[];
    hiringPriority: string[];
  };
}

interface BlueprintViewerProps {
  blueprint?: BusinessBlueprint;
  locale?: 'bn' | 'en';
}

type TabId =
  | 'canvas'
  | 'financial'
  | 'breakeven'
  | 'market'
  | 'gtm'
  | 'seo'
  | 'risks'
  | 'team';

interface Tab {
  id: TabId;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export function BlueprintViewer({ blueprint, locale = 'en' }: BlueprintViewerProps) {
  const t = useTranslations('blueprint');
  const [activeTab, setActiveTab] = useState<TabId>('canvas');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [selectedScenario, setSelectedScenario] = useState<'conservative' | 'base' | 'optimistic'>('base');

  const tabs: Tab[] = [
    {
      id: 'canvas',
      labelKey: 'tabs.canvas',
      icon: DocumentTextIcon,
      color: 'blue',
    },
    {
      id: 'financial',
      labelKey: 'tabs.financial',
      icon: ChartBarIcon,
      color: 'green',
    },
    {
      id: 'breakeven',
      labelKey: 'tabs.breakeven',
      icon: CurrencyDollarIcon,
      color: 'purple',
    },
    {
      id: 'market',
      labelKey: 'tabs.market',
      icon: ChartPieIcon,
      color: 'orange',
    },
    {
      id: 'gtm',
      labelKey: 'tabs.gtm',
      icon: RocketLaunchIcon,
      color: 'indigo',
    },
    {
      id: 'seo',
      labelKey: 'tabs.seo',
      icon: MegaphoneIcon,
      color: 'pink',
    },
    {
      id: 'risks',
      labelKey: 'tabs.risks',
      icon: ExclamationTriangleIcon,
      color: 'red',
    },
    {
      id: 'team',
      labelKey: 'tabs.team',
      icon: UsersIcon,
      color: 'teal',
    },
  ];

  // Helper function to get confidence score for a section
  const getSectionConfidence = (sectionId: string): number | null => {
    if (!blueprint?.confidenceScores) return null;
    
    switch (sectionId) {
      case 'canvas':
      case 'financial':
      case 'breakeven':
        return blueprint.confidenceScores.financial;
      case 'market':
      case 'gtm':
      case 'seo':
        return blueprint.confidenceScores.market;
      case 'risks':
      case 'team':
        return blueprint.confidenceScores.execution;
      default:
        return null;
    }
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const isSectionCollapsed = (sectionId: string) => {
    return collapsedSections.has(sectionId);
  };

  const handleExportPDF = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      // Get the blueprint content element
      const element = document.getElementById('blueprint-content');
      if (!element) {
        console.error('Blueprint content element not found');
        return;
      }

      // Show loading state (you could add a loading indicator here)
      const startTime = Date.now();

      // Create canvas from HTML
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add image to PDF (handle multiple pages if needed)
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save PDF
      const fileName = `blueprint-${blueprint?.productIdea?.replace(/\s+/g, '-').toLowerCase() || 'export'}-${Date.now()}.pdf`;
      pdf.save(fileName);

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      console.log(`PDF generated in ${duration.toFixed(2)} seconds`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'canvas':
        return renderBusinessModelCanvas();
      case 'financial':
        return renderFinancialProjections();
      case 'breakeven':
        return renderBreakEvenAnalysis();
      case 'market':
        return renderMarketSizing();
      case 'gtm':
        return renderGTMPlan();
      case 'seo':
        return renderSEOStrategy();
      case 'risks':
        return renderRiskRegister();
      case 'team':
        return renderTeamStructure();
      default:
        return null;
    }
  };

  const renderBusinessModelCanvas = () => {
    const canvas = blueprint?.businessModelCanvas;

    if (!canvas) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">{t('placeholders.comingSoon')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Value Proposition */}
        <CollapsibleSection
          id="canvas-value-proposition"
          title={t('canvas.valueProposition')}
          isCollapsed={isSectionCollapsed('canvas-value-proposition')}
          onToggle={() => toggleSection('canvas-value-proposition')}
        >
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{canvas.valueProposition}</p>
          </div>
        </CollapsibleSection>

        {/* Customer Segments */}
        <CollapsibleSection
          id="canvas-customer-segments"
          title={t('canvas.customerSegments')}
          isCollapsed={isSectionCollapsed('canvas-customer-segments')}
          onToggle={() => toggleSection('canvas-customer-segments')}
        >
          <ul className="space-y-2">
            {canvas.customerSegments.map((segment, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">{segment}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>

        {/* Channels */}
        <CollapsibleSection
          id="canvas-channels"
          title={t('canvas.channels')}
          isCollapsed={isSectionCollapsed('canvas-channels')}
          onToggle={() => toggleSection('canvas-channels')}
        >
          <ul className="space-y-2">
            {canvas.channels.map((channel, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">{channel}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>

        {/* Customer Relationships */}
        <CollapsibleSection
          id="canvas-customer-relationships"
          title={t('canvas.customerRelationships')}
          isCollapsed={isSectionCollapsed('canvas-customer-relationships')}
          onToggle={() => toggleSection('canvas-customer-relationships')}
        >
          <ul className="space-y-2">
            {canvas.customerRelationships.map((relationship, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">{relationship}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>

        {/* Revenue Streams */}
        <CollapsibleSection
          id="canvas-revenue-streams"
          title={t('canvas.revenueStreams')}
          isCollapsed={isSectionCollapsed('canvas-revenue-streams')}
          onToggle={() => toggleSection('canvas-revenue-streams')}
        >
          <div className="space-y-3">
            {canvas.revenueStreams.map((stream, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{stream.name}</h4>
                  <p className="text-sm text-gray-600">{stream.type}</p>
                </div>
                <div className="mt-2 sm:mt-0 text-right">
                  <p className="text-lg font-semibold text-green-700">
                    ৳{stream.projectedMonthly.toLocaleString()}/mo
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Key Resources */}
        <CollapsibleSection
          id="canvas-key-resources"
          title={t('canvas.keyResources')}
          isCollapsed={isSectionCollapsed('canvas-key-resources')}
          onToggle={() => toggleSection('canvas-key-resources')}
        >
          <ul className="space-y-2">
            {canvas.keyResources.map((resource, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">{resource}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>

        {/* Key Activities */}
        <CollapsibleSection
          id="canvas-key-activities"
          title={t('canvas.keyActivities')}
          isCollapsed={isSectionCollapsed('canvas-key-activities')}
          onToggle={() => toggleSection('canvas-key-activities')}
        >
          <ul className="space-y-2">
            {canvas.keyActivities.map((activity, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">{activity}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>

        {/* Key Partnerships */}
        <CollapsibleSection
          id="canvas-key-partnerships"
          title={t('canvas.keyPartnerships')}
          isCollapsed={isSectionCollapsed('canvas-key-partnerships')}
          onToggle={() => toggleSection('canvas-key-partnerships')}
        >
          <ul className="space-y-2">
            {canvas.keyPartnerships.map((partnership, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">{partnership}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>

        {/* Cost Structure */}
        <CollapsibleSection
          id="canvas-cost-structure"
          title={t('canvas.costStructure')}
          isCollapsed={isSectionCollapsed('canvas-cost-structure')}
          onToggle={() => toggleSection('canvas-cost-structure')}
        >
          <div className="space-y-3">
            {canvas.costStructure.map((cost, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-red-50 rounded-lg border border-red-200"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{cost.category}</h4>
                  <p className="text-sm text-gray-600 capitalize">{cost.frequency}</p>
                </div>
                <div className="mt-2 sm:mt-0 text-right">
                  <p className="text-lg font-semibold text-red-700">
                    ৳{cost.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>
    );
  };

  const renderFinancialProjections = () => {
    const projections = blueprint?.financialProjections;

    if (!projections) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">{t('placeholders.comingSoon')}</p>
        </div>
      );
    }

    // Color-blind friendly palette
    const COLORS = {
      revenue: '#2563eb', // Blue
      costs: '#ea580c', // Orange
      profit: '#16a34a', // Green
      cashFlow: '#9333ea', // Purple
    };

    const scenarioData = projections.scenarios[selectedScenario];

    // Custom tooltip component
    const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="font-semibold text-gray-900 mb-2">
              {t('financial.month')} {label}
            </p>
            {payload.map((entry, index) => (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {t(`financial.${entry.dataKey}`)}: ৳{formatNumber(entry.value as number, locale)}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    return (
      <div className="space-y-6">
        {/* Scenario Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t('financial.projections')}</h3>
            <p className="text-sm text-gray-600 mt-1">{t('financial.selectScenario')}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedScenario('conservative')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedScenario === 'conservative'
                  ? 'bg-orange-100 text-orange-700 border-2 border-orange-500'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
              aria-pressed={selectedScenario === 'conservative'}
            >
              {t('financial.conservative')}
            </button>
            <button
              onClick={() => setSelectedScenario('base')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedScenario === 'base'
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
              aria-pressed={selectedScenario === 'base'}
            >
              {t('financial.baseCase')}
            </button>
            <button
              onClick={() => setSelectedScenario('optimistic')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedScenario === 'optimistic'
                  ? 'bg-green-100 text-green-700 border-2 border-green-500'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
              aria-pressed={selectedScenario === 'optimistic'}
            >
              {t('financial.optimistic')}
            </button>
          </div>
        </div>

        {/* Line Chart */}
        <div className="w-full h-96 bg-white rounded-lg p-4 border border-gray-200">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={scenarioData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                label={{ value: t('financial.monthLabel'), position: 'insideBottom', offset: -5 }}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                label={{ value: t('financial.amountLabel'), angle: -90, position: 'insideLeft' }}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `৳${formatNumber(value, locale)}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d1d5db', strokeWidth: 1 }} />
              <Legend
                wrapperStyle={{ fontSize: '14px' }}
                formatter={(value) => t(`financial.${value}`)}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={COLORS.revenue}
                strokeWidth={2}
                dot={{ fill: COLORS.revenue, r: 4 }}
                activeDot={{ r: 6 }}
                name="revenue"
              />
              <Line
                type="monotone"
                dataKey="costs"
                stroke={COLORS.costs}
                strokeWidth={2}
                dot={{ fill: COLORS.costs, r: 4 }}
                activeDot={{ r: 6 }}
                name="costs"
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke={COLORS.profit}
                strokeWidth={2}
                dot={{ fill: COLORS.profit, r: 4 }}
                activeDot={{ r: 6 }}
                name="profit"
              />
              <Line
                type="monotone"
                dataKey="cashFlow"
                stroke={COLORS.cashFlow}
                strokeWidth={2}
                dot={{ fill: COLORS.cashFlow, r: 4 }}
                activeDot={{ r: 6 }}
                name="cashFlow"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend explanation */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS.revenue }}
              aria-hidden="true"
            />
            <span>{t('financial.revenue')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS.costs }}
              aria-hidden="true"
            />
            <span>{t('financial.costs')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS.profit }}
              aria-hidden="true"
            />
            <span>{t('financial.profit')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS.cashFlow }}
              aria-hidden="true"
            />
            <span>{t('financial.cashFlow')}</span>
          </div>
        </div>

        {/* Assumptions */}
        {projections.assumptions && projections.assumptions.length > 0 && (
          <CollapsibleSection
            id="financial-assumptions"
            title={t('financial.assumptions')}
            isCollapsed={isSectionCollapsed('financial-assumptions')}
            onToggle={() => toggleSection('financial-assumptions')}
          >
            <ul className="space-y-2">
              {projections.assumptions.map((assumption, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-gray-700">{assumption}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* Investment Breakdown */}
        {projections.investmentBreakdown && projections.investmentBreakdown.length > 0 && (
          <CollapsibleSection
            id="financial-investment"
            title={t('financial.investmentBreakdown')}
            isCollapsed={isSectionCollapsed('financial-investment')}
            onToggle={() => toggleSection('financial-investment')}
          >
            <div className="space-y-3">
              {projections.investmentBreakdown.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.category}</h4>
                    <p className="text-sm text-gray-600">{item.percentage}% {t('financial.ofTotal')}</p>
                  </div>
                  <div className="mt-2 sm:mt-0 text-right">
                    <p className="text-lg font-semibold text-blue-700">
                      ৳{formatNumber(item.amount, locale)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    );
  };

  const renderBreakEvenAnalysis = () => {
    const breakEven = blueprint?.breakEvenAnalysis;

    if (!breakEven) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">{t('placeholders.comingSoon')}</p>
        </div>
      );
    }

    // Calculate progress percentage (assuming 12 months as max)
    const maxMonths = 12;
    const progressPercentage = Math.min((breakEven.monthsToBreakEven / maxMonths) * 100, 100);

    return (
      <div className="space-y-6">
        {/* Break-Even Calculations */}
        <CollapsibleSection
          id="breakeven-calculations"
          title={t('breakeven.calculations')}
          isCollapsed={isSectionCollapsed('breakeven-calculations')}
          onToggle={() => toggleSection('breakeven-calculations')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Break-Even Units */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-gray-600 mb-1">
                {t('breakeven.breakEvenUnits')}
              </h4>
              <p className="text-2xl font-bold text-blue-700">
                {formatNumber(breakEven.breakEvenUnits, locale)} {t('breakeven.units')}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {t('breakeven.unitsDescription')}
              </p>
            </div>

            {/* Break-Even Revenue */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="text-sm font-medium text-gray-600 mb-1">
                {t('breakeven.breakEvenRevenue')}
              </h4>
              <p className="text-2xl font-bold text-green-700">
                ৳{formatNumber(breakEven.breakEvenRevenue, locale)}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {t('breakeven.revenueDescription')}
              </p>
            </div>

            {/* Fixed Costs */}
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="text-sm font-medium text-gray-600 mb-1">
                {t('breakeven.fixedCosts')}
              </h4>
              <p className="text-2xl font-bold text-orange-700">
                ৳{formatNumber(breakEven.fixedCosts, locale)}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {t('breakeven.fixedCostsDescription')}
              </p>
            </div>

            {/* Variable Cost Per Unit */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="text-sm font-medium text-gray-600 mb-1">
                {t('breakeven.variableCostPerUnit')}
              </h4>
              <p className="text-2xl font-bold text-purple-700">
                ৳{formatNumber(breakEven.variableCostPerUnit, locale)}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {t('breakeven.variableCostDescription')}
              </p>
            </div>

            {/* Price Per Unit */}
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h4 className="text-sm font-medium text-gray-600 mb-1">
                {t('breakeven.pricePerUnit')}
              </h4>
              <p className="text-2xl font-bold text-indigo-700">
                ৳{formatNumber(breakEven.pricePerUnit, locale)}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {t('breakeven.priceDescription')}
              </p>
            </div>

            {/* Contribution Margin */}
            <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
              <h4 className="text-sm font-medium text-gray-600 mb-1">
                {t('breakeven.contributionMargin')}
              </h4>
              <p className="text-2xl font-bold text-teal-700">
                ৳{formatNumber(breakEven.pricePerUnit - breakEven.variableCostPerUnit, locale)}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {t('breakeven.contributionMarginDescription')}
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Months to Break-Even */}
        <CollapsibleSection
          id="breakeven-timeline"
          title={t('breakeven.timeline')}
          isCollapsed={isSectionCollapsed('breakeven-timeline')}
          onToggle={() => toggleSection('breakeven-timeline')}
        >
          <div className="space-y-4">
            {/* Months Display */}
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                {t('breakeven.monthsToBreakEven')}
              </h4>
              <p className="text-5xl font-bold text-blue-700 mb-2">
                {breakEven.monthsToBreakEven}
              </p>
              <p className="text-lg text-gray-700">
                {breakEven.monthsToBreakEven === 1 ? t('breakeven.month') : t('breakeven.months')}
              </p>
            </div>

            {/* Visual Progress Indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{t('breakeven.progressLabel')}</span>
                <span className="font-semibold text-gray-900">
                  {breakEven.monthsToBreakEven} / {maxMonths} {t('breakeven.months')}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div 
                className="w-full h-8 bg-gray-200 rounded-full overflow-hidden relative"
                role="progressbar"
                aria-valuenow={breakEven.monthsToBreakEven}
                aria-valuemin={0}
                aria-valuemax={maxMonths}
                aria-label={t('breakeven.progressAriaLabel', { months: breakEven.monthsToBreakEven })}
              >
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out flex items-center justify-end pr-3"
                  style={{ width: `${progressPercentage}%` }}
                >
                  {progressPercentage > 15 && (
                    <span className="text-white font-semibold text-sm">
                      {Math.round(progressPercentage)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Timeline Markers */}
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{t('breakeven.start')}</span>
                <span>{t('breakeven.breakEvenPoint')}</span>
                <span>{maxMonths} {t('breakeven.months')}</span>
              </div>
            </div>

            {/* Interpretation */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <svg 
                  className="w-5 h-5 text-blue-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                {t('breakeven.interpretation')}
              </h5>
              <p className="text-sm text-gray-700">
                {breakEven.monthsToBreakEven <= 6
                  ? t('breakeven.interpretationFast')
                  : breakEven.monthsToBreakEven <= 12
                  ? t('breakeven.interpretationModerate')
                  : t('breakeven.interpretationSlow')}
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Formula Explanation */}
        <CollapsibleSection
          id="breakeven-formula"
          title={t('breakeven.formula')}
          isCollapsed={isSectionCollapsed('breakeven-formula')}
          onToggle={() => toggleSection('breakeven-formula')}
        >
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h5 className="font-semibold text-gray-900 mb-2">
                {t('breakeven.breakEvenUnitsFormula')}
              </h5>
              <div className="font-mono text-sm bg-white p-3 rounded border border-gray-300">
                {t('breakeven.unitsFormulaText')}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {t('breakeven.unitsFormulaExplanation')}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h5 className="font-semibold text-gray-900 mb-2">
                {t('breakeven.breakEvenRevenueFormula')}
              </h5>
              <div className="font-mono text-sm bg-white p-3 rounded border border-gray-300">
                {t('breakeven.revenueFormulaText')}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {t('breakeven.revenueFormulaExplanation')}
              </p>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    );
  };

  const renderMarketSizing = () => {
    const marketSizing = blueprint?.marketSizing;

    if (!marketSizing) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">{t('placeholders.comingSoon')}</p>
        </div>
      );
    }

    // Calculate percentages for funnel visualization
    const tamValue = marketSizing.tam;
    const samPercentage = (marketSizing.sam / tamValue) * 100;
    const somPercentage = (marketSizing.som / tamValue) * 100;

    return (
      <div className="space-y-6">
        {/* Market Size Numbers */}
        <CollapsibleSection
          id="market-size-numbers"
          title={t('market.marketSizeNumbers')}
          isCollapsed={isSectionCollapsed('market-size-numbers')}
          onToggle={() => toggleSection('market-size-numbers')}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* TAM */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-gray-600 mb-1">
                {t('market.tam')}
              </h4>
              <p className="text-2xl font-bold text-blue-700">
                ৳{formatNumber(marketSizing.tam, locale)}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {t('market.tamDescription')}
              </p>
            </div>

            {/* SAM */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="text-sm font-medium text-gray-600 mb-1">
                {t('market.sam')}
              </h4>
              <p className="text-2xl font-bold text-green-700">
                ৳{formatNumber(marketSizing.sam, locale)}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {t('market.samDescription')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {samPercentage.toFixed(1)}% {t('market.ofTAM')}
              </p>
            </div>

            {/* SOM */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="text-sm font-medium text-gray-600 mb-1">
                {t('market.som')}
              </h4>
              <p className="text-2xl font-bold text-purple-700">
                ৳{formatNumber(marketSizing.som, locale)}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {t('market.somDescription')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {somPercentage.toFixed(1)}% {t('market.ofTAM')}
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Visual Funnel */}
        <CollapsibleSection
          id="market-funnel"
          title={t('market.marketFunnel')}
          isCollapsed={isSectionCollapsed('market-funnel')}
          onToggle={() => toggleSection('market-funnel')}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              {t('market.funnelDescription')}
            </p>

            {/* Funnel Visualization */}
            <div className="flex flex-col items-center space-y-2">
              {/* TAM - Widest */}
              <div className="w-full max-w-2xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{t('market.tam')}</span>
                  <span className="text-sm text-gray-600">৳{formatNumber(marketSizing.tam, locale)}</span>
                </div>
                <div 
                  className="h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-t-lg flex items-center justify-center text-white font-semibold shadow-md"
                  role="img"
                  aria-label={t('market.tamAriaLabel', { amount: formatNumber(marketSizing.tam, locale) })}
                >
                  100%
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <svg 
                  className="w-6 h-6 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                  />
                </svg>
              </div>

              {/* SAM - Medium */}
              <div className="w-full max-w-2xl" style={{ width: `${samPercentage}%`, minWidth: '60%' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{t('market.sam')}</span>
                  <span className="text-sm text-gray-600">৳{formatNumber(marketSizing.sam, locale)}</span>
                </div>
                <div 
                  className="h-16 bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white font-semibold shadow-md"
                  role="img"
                  aria-label={t('market.samAriaLabel', { amount: formatNumber(marketSizing.sam, locale) })}
                >
                  {samPercentage.toFixed(1)}%
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <svg 
                  className="w-6 h-6 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                  />
                </svg>
              </div>

              {/* SOM - Narrowest */}
              <div className="w-full max-w-2xl" style={{ width: `${somPercentage}%`, minWidth: '40%' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{t('market.som')}</span>
                  <span className="text-sm text-gray-600">৳{formatNumber(marketSizing.som, locale)}</span>
                </div>
                <div 
                  className="h-16 bg-gradient-to-r from-purple-400 to-purple-600 rounded-b-lg flex items-center justify-center text-white font-semibold shadow-md"
                  role="img"
                  aria-label={t('market.somAriaLabel', { amount: formatNumber(marketSizing.som, locale) })}
                >
                  {somPercentage.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Funnel Legend */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg 
                  className="w-5 h-5 text-blue-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                {t('market.understandingFunnel')}
              </h5>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong className="text-blue-700">{t('market.tam')}:</strong> {t('market.tamExplanation')}
                </p>
                <p>
                  <strong className="text-green-700">{t('market.sam')}:</strong> {t('market.samExplanation')}
                </p>
                <p>
                  <strong className="text-purple-700">{t('market.som')}:</strong> {t('market.somExplanation')}
                </p>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Methodology */}
        <CollapsibleSection
          id="market-methodology"
          title={t('market.methodology')}
          isCollapsed={isSectionCollapsed('market-methodology')}
          onToggle={() => toggleSection('market-methodology')}
        >
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{marketSizing.methodology}</p>
          </div>
        </CollapsibleSection>
      </div>
    );
  };

  const renderGTMPlan = () => {
    const gtmPlan = blueprint?.goToMarketPlan;

    if (!gtmPlan) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">{t('placeholders.comingSoon')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* GTM Phases */}
        <CollapsibleSection
          id="gtm-phases"
          title={t('gtm.phases')}
          isCollapsed={isSectionCollapsed('gtm-phases')}
          onToggle={() => toggleSection('gtm-phases')}
        >
          <div className="space-y-4">
            {gtmPlan.phases.map((phase, index) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm">
                        {phase.phase}
                      </span>
                      <h4 className="text-lg font-semibold text-gray-900">{phase.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t('gtm.duration')}: {phase.duration}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{t('gtm.budget')}</p>
                    <p className="text-lg font-bold text-indigo-700">
                      ৳{formatNumber(phase.budget, locale)}
                    </p>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">
                    {t('gtm.activities')}:
                  </h5>
                  <ul className="space-y-1">
                    {phase.activities.map((activity, actIndex) => (
                      <li key={actIndex} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-indigo-600 mt-1">•</span>
                        <span>{activity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Channel Prioritization */}
        <CollapsibleSection
          id="gtm-channels"
          title={t('gtm.channelPrioritization')}
          isCollapsed={isSectionCollapsed('gtm-channels')}
          onToggle={() => toggleSection('gtm-channels')}
        >
          <div className="space-y-3">
            {gtmPlan.channelPrioritization
              .sort((a, b) => a.priority - b.priority)
              .map((channel, index) => (
                <div
                  key={index}
                  className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${
                          channel.priority === 1
                            ? 'bg-green-600'
                            : channel.priority === 2
                            ? 'bg-blue-600'
                            : channel.priority === 3
                            ? 'bg-orange-600'
                            : 'bg-gray-600'
                        }`}
                      >
                        #{channel.priority}
                      </span>
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">{channel.name}</h4>
                        <p className="text-sm text-gray-600">
                          {t('gtm.estimatedCAC')}: ৳{formatNumber(channel.estimatedCAC, locale)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-sm text-gray-700">
                      <strong className="text-gray-900">{t('gtm.rationale')}:</strong>{' '}
                      {channel.rationale}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CollapsibleSection>

        {/* Launch Timeline */}
        {gtmPlan.launchTimeline && (
          <CollapsibleSection
            id="gtm-timeline"
            title={t('gtm.launchTimeline')}
            isCollapsed={isSectionCollapsed('gtm-timeline')}
            onToggle={() => toggleSection('gtm-timeline')}
          >
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-gray-700 whitespace-pre-wrap">{gtmPlan.launchTimeline}</p>
            </div>
          </CollapsibleSection>
        )}
      </div>
    );
  };

  const renderSEOStrategy = () => {
    const seoStrategy = blueprint?.seoStrategy;

    if (!seoStrategy) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">{t('placeholders.comingSoon')}</p>
        </div>
      );
    }

    // Helper function to get competition badge color
    const getCompetitionColor = (competition: 'low' | 'medium' | 'high') => {
      switch (competition) {
        case 'low':
          return 'bg-green-100 text-green-700 border-green-300';
        case 'medium':
          return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        case 'high':
          return 'bg-red-100 text-red-700 border-red-300';
      }
    };

    return (
      <div className="space-y-6">
        {/* Google SEO */}
        <CollapsibleSection
          id="seo-google"
          title={t('seo.googleSEO')}
          isCollapsed={isSectionCollapsed('seo-google')}
          onToggle={() => toggleSection('seo-google')}
        >
          <div className="space-y-4">
            {/* Keyword Clusters */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                {t('seo.keywordClusters')}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        {t('seo.keyword')}
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        {t('seo.searchVolume')}
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        {t('seo.competition')}
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        {t('seo.language')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {seoStrategy.googleSEO.keywords.map((keyword, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{keyword.term}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatNumber(keyword.searchVolume, locale)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getCompetitionColor(
                              keyword.competition
                            )}`}
                          >
                            {t(`seo.competitionLevel.${keyword.competition}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {keyword.language === 'bn' ? 'বাংলা' : 'English'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Content Topics */}
            {seoStrategy.googleSEO.contentTopics &&
              seoStrategy.googleSEO.contentTopics.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    {t('seo.contentTopics')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {seoStrategy.googleSEO.contentTopics.map((topic, index) => (
                      <span
                        key={index}
                        className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </CollapsibleSection>

        {/* Social SEO */}
        <CollapsibleSection
          id="seo-social"
          title={t('seo.socialSEO')}
          isCollapsed={isSectionCollapsed('seo-social')}
          onToggle={() => toggleSection('seo-social')}
        >
          <div className="space-y-4">
            {/* Platform Strategies */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                {t('seo.platformStrategies')}
              </h4>
              <div className="space-y-3">
                {seoStrategy.socialSEO.platforms.map((platform, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900">{platform.name}</h5>
                      <span className="text-sm text-gray-600">
                        {t('seo.postingFrequency')}: {platform.postingFrequency}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{platform.strategy}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hashtag Recommendations */}
            {seoStrategy.socialSEO.hashtags && seoStrategy.socialSEO.hashtags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  {t('seo.hashtagRecommendations')}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          {t('seo.hashtag')}
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          {t('seo.volume')}
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          {t('seo.trendDuration')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {seoStrategy.socialSEO.hashtags.map((hashtag, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">#{hashtag.tag}</td>
                          <td className="px-4 py-3 text-gray-700">
                            {formatNumber(hashtag.volume, locale)}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{hashtag.trendDuration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Posting Schedule */}
            {seoStrategy.socialSEO.postingSchedule && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  {t('seo.postingSchedule')}
                </h4>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {seoStrategy.socialSEO.postingSchedule}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Marketplace SEO */}
        {seoStrategy.marketplaceSEO && seoStrategy.marketplaceSEO.length > 0 && (
          <CollapsibleSection
            id="seo-marketplace"
            title={t('seo.marketplaceSEO')}
            isCollapsed={isSectionCollapsed('seo-marketplace')}
            onToggle={() => toggleSection('seo-marketplace')}
          >
            <div className="space-y-4">
              {seoStrategy.marketplaceSEO.map((marketplace, index) => (
                <div
                  key={index}
                  className="p-4 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">{marketplace.platform}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        {t('seo.titleTemplate')}:
                      </label>
                      <div className="p-2 bg-white rounded border border-gray-300 font-mono text-sm text-gray-800">
                        {marketplace.titleTemplate}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        {t('seo.descriptionTemplate')}:
                      </label>
                      <div className="p-2 bg-white rounded border border-gray-300 font-mono text-sm text-gray-800">
                        {marketplace.descriptionTemplate}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Google Lens Optimization */}
        <CollapsibleSection
          id="seo-google-lens"
          title={t('seo.googleLensOptimization')}
          isCollapsed={isSectionCollapsed('seo-google-lens')}
          onToggle={() => toggleSection('seo-google-lens')}
        >
          <div className="space-y-4">
            {/* Image Tagging */}
            {seoStrategy.googleLensOptimization.imageTagging &&
              seoStrategy.googleLensOptimization.imageTagging.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    {t('seo.imageTagging')}
                  </h4>
                  <ul className="space-y-2">
                    {seoStrategy.googleLensOptimization.imageTagging.map((tag, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-purple-600 mt-1">•</span>
                        <span>{tag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Alt Text Guidance */}
            {seoStrategy.googleLensOptimization.altTextGuidance && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  {t('seo.altTextGuidance')}
                </h4>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {seoStrategy.googleLensOptimization.altTextGuidance}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      </div>
    );
  };

  const renderRiskRegister = () => {
    const risks = blueprint?.riskRegister || [];

    if (risks.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">{t('placeholders.comingSoon')}</p>
        </div>
      );
    }

    const getLikelihoodColor = (likelihood: 'low' | 'medium' | 'high') => {
      switch (likelihood) {
        case 'low':
          return 'success';
        case 'medium':
          return 'warning';
        case 'high':
          return 'error';
        default:
          return 'default';
      }
    };

    const getImpactColor = (impact: 'low' | 'medium' | 'high') => {
      switch (impact) {
        case 'low':
          return 'success';
        case 'medium':
          return 'warning';
        case 'high':
          return 'error';
        default:
          return 'default';
      }
    };

    return (
      <div className="space-y-4">
        {risks.slice(0, 5).map((risk, index) => (
          <CollapsibleSection
            key={`risk-${index}`}
            id={`risk-${index}`}
            title={`${index + 1}. ${risk.category}`}
            isCollapsed={isSectionCollapsed(`risk-${index}`)}
            onToggle={() => toggleSection(`risk-${index}`)}
          >
            <div className="space-y-4">
              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  {t('risks.description')}
                </h4>
                <p className="text-gray-600">{risk.description}</p>
              </div>

              {/* Likelihood and Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    {t('risks.likelihood')}
                  </h4>
                  <Badge variant={getLikelihoodColor(risk.likelihood)}>
                    {t(`risks.levels.${risk.likelihood}`)}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    {t('risks.impact')}
                  </h4>
                  <Badge variant={getImpactColor(risk.impact)}>
                    {t(`risks.levels.${risk.impact}`)}
                  </Badge>
                </div>
              </div>

              {/* Mitigation Strategy */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  {t('risks.mitigation')}
                </h4>
                <p className="text-gray-600">{risk.mitigation}</p>
              </div>
            </div>
          </CollapsibleSection>
        ))}
      </div>
    );
  };

  const renderTeamStructure = () => {
    const teamStructure = blueprint?.teamStructure;

    if (!teamStructure || teamStructure.roles.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">{t('placeholders.comingSoon')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Roles */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('team.recommendedRoles')}</h3>
          {teamStructure.roles.map((role, index) => (
            <CollapsibleSection
              key={`role-${index}`}
              id={`role-${index}`}
              title={role.title}
              isCollapsed={isSectionCollapsed(`role-${index}`)}
              onToggle={() => toggleSection(`role-${index}`)}
            >
              <div className="space-y-4">
                {/* Responsibilities */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    {t('team.responsibilities')}
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {role.responsibilities.map((responsibility, idx) => (
                      <li key={idx} className="text-gray-600">
                        {responsibility}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Required Skills */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    {t('team.requiredSkills')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {role.requiredSkills.map((skill, idx) => (
                      <Badge key={idx} variant="default">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Estimated Salary */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    {t('team.estimatedSalary')}
                  </h4>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatNumber(role.estimatedSalary, locale)} {t('team.perMonth')}
                  </p>
                </div>
              </div>
            </CollapsibleSection>
          ))}
        </div>

        {/* Hiring Priority */}
        {teamStructure.hiringPriority && teamStructure.hiringPriority.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {t('team.hiringPriority')}
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ol className="list-decimal list-inside space-y-2">
                {teamStructure.hiringPriority.map((priority, index) => (
                  <li key={index} className="text-gray-700">
                    {priority}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    );
  };

  // If no blueprint data, show empty state
  if (!blueprint) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto" aria-hidden="true" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t('empty.title')}</h3>
            <p className="text-gray-600 mt-2">{t('empty.description')}</p>
          </div>
          <Button>{t('empty.createButton')}</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6" id="blueprint-content">
      {/* Header with confidence scores and export */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('header.title')}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {blueprint.productIdea} • {blueprint.businessType}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{t('header.confidence')}:</span>
                <Badge variant="success">
                  {Math.round(blueprint.confidenceScores.overall * 100)}%
                </Badge>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportPDF}
                className="flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" aria-hidden="true" />
                {t('header.exportPDF')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confidence Scores Breakdown */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Financial</p>
              <Badge variant={blueprint.confidenceScores.financial >= 0.7 ? 'success' : blueprint.confidenceScores.financial >= 0.5 ? 'warning' : 'error'}>
                {Math.round(blueprint.confidenceScores.financial * 100)}%
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Market</p>
              <Badge variant={blueprint.confidenceScores.market >= 0.7 ? 'success' : blueprint.confidenceScores.market >= 0.5 ? 'warning' : 'error'}>
                {Math.round(blueprint.confidenceScores.market * 100)}%
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Execution</p>
              <Badge variant={blueprint.confidenceScores.execution >= 0.7 ? 'success' : blueprint.confidenceScores.execution >= 0.5 ? 'warning' : 'error'}>
                {Math.round(blueprint.confidenceScores.execution * 100)}%
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Overall</p>
              <Badge variant={blueprint.confidenceScores.overall >= 0.7 ? 'success' : blueprint.confidenceScores.overall >= 0.5 ? 'warning' : 'error'}>
                {Math.round(blueprint.confidenceScores.overall * 100)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Navigation - Desktop */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const confidence = getSectionConfidence(tab.id);
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                      border-b-2 transition-colors
                      ${
                        isActive
                          ? `border-${tab.color}-600 text-${tab.color}-600`
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <span>{t(tab.labelKey)}</span>
                    {confidence !== null && (
                      <Badge 
                        variant={confidence >= 0.7 ? 'success' : confidence >= 0.5 ? 'warning' : 'error'}
                        className="ml-1 text-xs"
                      >
                        {Math.round(confidence * 100)}%
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Accordion Navigation */}
      <div className="md:hidden">
        <Card>
          <CardContent className="p-2">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabId)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={t('header.selectTab')}
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {t(tab.labelKey)}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      </div>

      {/* Tab Content */}
      <Card>
        <CardContent className="p-6">
          <div
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="animate-fadeIn"
          >
            {renderTabContent()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Collapsible Section Component
interface CollapsibleSectionProps {
  id: string;
  title: string;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({
  id,
  title,
  isCollapsed,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        aria-expanded={!isCollapsed}
        aria-controls={`section-${id}`}
      >
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {isCollapsed ? (
          <ChevronDownIcon className="w-5 h-5 text-gray-600" aria-hidden="true" />
        ) : (
          <ChevronUpIcon className="w-5 h-5 text-gray-600" aria-hidden="true" />
        )}
      </button>
      {!isCollapsed && (
        <div id={`section-${id}`} className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}
