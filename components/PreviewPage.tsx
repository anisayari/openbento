import React, { useEffect, useMemo, useState } from 'react';
import type { SavedBento } from '../types';
import { generatePreviewSrcDoc } from '../services/exportService';
import { getBento, getOrCreateActiveBento, setActiveBentoId } from '../services/storageService';

const PreviewPage: React.FC = () => {
  const [bento, setBento] = useState<SavedBento | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get('id')?.trim();
    const requested = requestedId ? getBento(requestedId) : null;

    const resolved = requested || getOrCreateActiveBento();
    if (requested) setActiveBentoId(requested.id);
    setBento(resolved);
  }, []);

  const srcDoc = useMemo(() => {
    if (!bento) return '';
    return generatePreviewSrcDoc(bento.data, { siteId: bento.id });
  }, [bento]);

  return (
    <div className="min-h-screen bg-gray-100">
      <iframe title="Preview" srcDoc={srcDoc} className="w-full h-screen border-0" />
    </div>
  );
};

export default PreviewPage;

