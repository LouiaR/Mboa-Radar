"use client";
import dynamic from 'next/dynamic';

const PlanRoutePageClient = dynamic(() => import('./PlanRoutePageClient'), { ssr: false });

export default function Page() {
  return <PlanRoutePageClient />;
}
