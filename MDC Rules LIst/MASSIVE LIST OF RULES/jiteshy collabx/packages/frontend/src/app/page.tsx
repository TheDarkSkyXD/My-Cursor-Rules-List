'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ValidationService } from '@collabx/shared';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    const sessionId = ValidationService.generateValidSessionId(12);
    router.push(`/${sessionId}`);
  }, [router]);
  
  return null;
}
