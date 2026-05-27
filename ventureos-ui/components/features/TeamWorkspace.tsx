'use client';

import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AvatarWithStatus } from '@/components/ui/Avatar';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  UserGroupIcon,
  Squares2X2Icon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export type MemberRole = 'owner' | 'co-founder' | 'manager' | 'analyst' | 'guest';
export type ActivityStatus = 'online' | 'offline' | 'away';

export interface TeamMemberDisplay {
  userId: string;
  name: string;
  avatarUrl?: string;
  role: MemberRole;
  status: ActivityStatus;
  lastActive: Date;
  currentSection?: string;
}

export interface SharedDashboard {
  id: string;
  name: string;
  description?: string;
}

export interface TeamWorkspaceProps {
  locale: 'bn' | 'en';
  workspaceName?: string;
  workspaceDescription?: string;
  members?: TeamMemberDisplay[];
  sharedDashboards?: SharedDashboard[];
  isLoading?: boolean;
}

const ROLE_BADGE_VARIANTS: Record<MemberRole, { variant: 'primary' | 'success' | 'info' | 'warning' | 'default'; label: string }> = {
  owner: { variant: 'primary', label: 'Owner' },
  'co-founder': { variant: 'success', label: 'Co-founder' },
  manager: { variant: 'info', label: 'Manager' },
  analyst: { variant: 'warning', label: 'Analyst' },
  guest: { variant: 'default', label: 'Guest' },
};

function formatLastActive(date: Date, locale: 'bn' | 'en'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return locale === 'bn' ? 'এইমাত্র' : 'Just now';
  if (diffMinutes < 60) return locale === 'bn' ? `${diffMinutes} মিনিট আগে` : `${diffMinutes}m ago`;
  if (diffHours < 24) return locale === 'bn' ? `${diffHours} ঘণ্টা আগে` : `${diffHours}h ago`;
  return locale === 'bn' ? `${diffDays} দিন আগে` : `${diffDays}d ago`;
}

function TeamWorkspaceLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" data-testid="team-workspace-loading">
      {/* Main area skeleton */}
      <div className="lg:col-span-3 space-y-4">
        <LoadingSkeleton variant="text" width="40%" height="2rem" />
        <LoadingSkeleton variant="text" width="60%" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
        </div>
      </div>
      {/* Sidebar skeleton */}
      <div className="space-y-4">
        <LoadingSkeleton variant="text" width="50%" height="1.5rem" />
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </div>
    </div>
  );
}

function MemberListItem({ member, locale }: { member: TeamMemberDisplay; locale: 'bn' | 'en' }) {
  const roleConfig = ROLE_BADGE_VARIANTS[member.role];

  return (
    <li className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0">
      <AvatarWithStatus
        name={member.name}
        src={member.avatarUrl}
        size="sm"
        status={member.status}
        showStatus={true}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-900 truncate">
            {member.name}
          </span>
          <Badge variant={roleConfig.variant} size="sm">
            {roleConfig.label}
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {formatLastActive(member.lastActive, locale)}
        </p>
        {member.currentSection && (
          <div className="flex items-center gap-1 mt-1">
            <EyeIcon className="w-3 h-3 text-gray-400" aria-hidden="true" />
            <span className="text-xs text-gray-500" data-testid={`viewing-section-${member.userId}`}>
              {member.currentSection}
            </span>
          </div>
        )}
      </div>
    </li>
  );
}

export function TeamWorkspace({
  locale,
  workspaceName,
  workspaceDescription,
  members = [],
  sharedDashboards = [],
  isLoading = false,
}: TeamWorkspaceProps) {
  const t = useTranslations('teamWorkspace');

  if (isLoading) {
    return <TeamWorkspaceLoadingSkeleton />;
  }

  const hasMembers = members.length > 0;
  const hasDashboards = sharedDashboards.length > 0;
  const isEmpty = !hasMembers && !hasDashboards;

  if (isEmpty && !workspaceName) {
    return (
      <EmptyState
        title={t('emptyState.title')}
        description={t('emptyState.description')}
        icon={
          <UserGroupIcon className="w-16 h-16 text-gray-400" aria-hidden="true" />
        }
      />
    );
  }

  const onlineCount = members.filter((m) => m.status === 'online').length;

  return (
    <div className="space-y-6" data-testid="team-workspace">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {workspaceName || t('title')}
        </h2>
        {workspaceDescription && (
          <p className="text-sm text-gray-600 mt-1">{workspaceDescription}</p>
        )}
      </div>

      {/* Main grid: dashboard area + member sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main content area - shared dashboards */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Squares2X2Icon className="w-5 h-5 text-blue-600" aria-hidden="true" />
                {t('sections.sharedDashboards')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasDashboards ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="shared-dashboards-grid">
                  {sharedDashboards.map((dashboard) => (
                    <Card
                      key={dashboard.id}
                      hover
                      padding="sm"
                      className="cursor-pointer"
                    >
                      <h4 className="text-sm font-medium text-gray-900">
                        {dashboard.name}
                      </h4>
                      {dashboard.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {dashboard.description}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div
                  className="h-48 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
                  data-testid="dashboards-empty-slot"
                >
                  <div className="text-center">
                    <Squares2X2Icon className="w-12 h-12 text-gray-400 mx-auto mb-2" aria-hidden="true" />
                    <p className="text-gray-600">{t('placeholders.noDashboards')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - team members */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                  {t('sections.teamMembers')}
                </span>
                {hasMembers && (
                  <span data-testid="online-count">
                    <Badge variant="success" size="sm">
                      {onlineCount} {t('online')}
                    </Badge>
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasMembers ? (
                <ul className="divide-y-0" aria-label={t('sections.teamMembers')} data-testid="member-list">
                  {members.map((member) => (
                    <MemberListItem
                      key={member.userId}
                      member={member}
                      locale={locale}
                    />
                  ))}
                </ul>
              ) : (
                <div className="py-6 text-center" data-testid="members-empty">
                  <UserGroupIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm text-gray-500">{t('placeholders.noMembers')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
