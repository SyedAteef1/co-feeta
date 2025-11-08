'use client';

import { Suspense } from 'react';
import { GitHubIntegration } from '@/components/integrations/GitHubIntegration';

export default function GitHubSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GitHubIntegration />
    </Suspense>
  );
}
