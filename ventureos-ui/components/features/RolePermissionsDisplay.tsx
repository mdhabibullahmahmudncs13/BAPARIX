'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import {
  ALL_ROLES,
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS,
  type MemberRole,
  type Permission,
} from '@/lib/utils/permissions';
import {
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';

export interface RolePermissionsDisplayProps {
  locale: 'bn' | 'en';
}

const ROLE_BADGE_VARIANTS: Record<MemberRole, 'primary' | 'success' | 'info' | 'warning' | 'default'> = {
  owner: 'primary',
  'co-founder': 'success',
  manager: 'info',
  analyst: 'warning',
  guest: 'default',
};

const ROLE_LABELS: Record<MemberRole, { en: string; bn: string }> = {
  owner: { en: 'Owner', bn: 'মালিক' },
  'co-founder': { en: 'Co-founder', bn: 'সহ-প্রতিষ্ঠাতা' },
  manager: { en: 'Manager', bn: 'ম্যানেজার' },
  analyst: { en: 'Analyst', bn: 'বিশ্লেষক' },
  guest: { en: 'Guest', bn: 'অতিথি' },
};

const PERMISSION_LABELS: Record<Permission, { en: string; bn: string }> = {
  viewFinancials: { en: 'View Financials', bn: 'আর্থিক তথ্য দেখুন' },
  editFinancials: { en: 'Edit Financials', bn: 'আর্থিক তথ্য সম্পাদনা' },
  viewBlueprints: { en: 'View Blueprints', bn: 'ব্লুপ্রিন্ট দেখুন' },
  editBlueprints: { en: 'Edit Blueprints', bn: 'ব্লুপ্রিন্ট সম্পাদনা' },
  manageTeam: { en: 'Manage Team', bn: 'টিম পরিচালনা' },
  exportData: { en: 'Export Data', bn: 'ডেটা রপ্তানি' },
};

export function RolePermissionsDisplay({ locale }: RolePermissionsDisplayProps) {
  const t = useTranslations('teamWorkspace');

  return (
    <div className="overflow-x-auto" data-testid="role-permissions-display">
      <table
        className="w-full border-collapse text-sm"
        aria-label={locale === 'bn' ? 'ভূমিকা অনুমতি ম্যাট্রিক্স' : 'Role permissions matrix'}
      >
        <thead>
          <tr className="border-b border-gray-200">
            <th
              scope="col"
              className="text-left py-3 px-4 font-semibold text-gray-700"
            >
              {locale === 'bn' ? 'অনুমতি' : 'Permission'}
            </th>
            {ALL_ROLES.map((role) => (
              <th
                key={role}
                scope="col"
                className="text-center py-3 px-3"
              >
                <Badge variant={ROLE_BADGE_VARIANTS[role]} size="sm">
                  {ROLE_LABELS[role][locale]}
                </Badge>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ALL_PERMISSIONS.map((permission) => (
            <tr
              key={permission}
              className="border-b border-gray-100 hover:bg-gray-50"
            >
              <td className="py-3 px-4 font-medium text-gray-800">
                {PERMISSION_LABELS[permission][locale]}
              </td>
              {ALL_ROLES.map((role) => {
                const allowed = ROLE_PERMISSIONS[role][permission];
                return (
                  <td
                    key={`${role}-${permission}`}
                    className="text-center py-3 px-3"
                  >
                    {allowed ? (
                      <CheckCircleIcon
                        className="w-5 h-5 text-green-600 inline-block"
                        aria-label={`${ROLE_LABELS[role][locale]} ${locale === 'bn' ? 'অনুমোদিত' : 'allowed'}`}
                      />
                    ) : (
                      <XCircleIcon
                        className="w-5 h-5 text-red-400 inline-block"
                        aria-label={`${ROLE_LABELS[role][locale]} ${locale === 'bn' ? 'অননুমোদিত' : 'denied'}`}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
