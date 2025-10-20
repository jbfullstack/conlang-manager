// Keep this a Server Component
import React from 'react';
import DashboardClient from './DashboardClient';

// Prevent pre-render/SSG so Next doesn't try to evaluate client hooks at build time
export const dynamic = 'force-dynamic'; // or: export const revalidate = 0;

export default async function Page() {
  // Do any server-only work here if needed
  return <DashboardClient />;
}
