"use client";
import dynamic from 'next/dynamic';

const ReportPageClient = dynamic(() => import('./ReportPageClient'), { ssr: false });

export default function Page() {
  return <ReportPageClient />;
}
