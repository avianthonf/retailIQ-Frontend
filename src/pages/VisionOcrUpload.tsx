/**
 * src/pages/VisionOcrUpload.tsx
 * Oracle Document sections consumed: 3, 7, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { FileUploadDropzone } from '@/components/ui/FileUploadDropzone';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useUploadOcrMutation } from '@/hooks/vision';
import { uiStore } from '@/stores/uiStore';
import { normalizeApiError } from '@/utils/errors';

export default function VisionOcrUploadPage() {
  const navigate = useNavigate();
  const addToast = uiStore.getState().addToast;
  const mutation = useUploadOcrMutation();
  const [error, setError] = useState<string | null>(null);

  if (mutation.isError) {
    return <ErrorState error={normalizeApiError(mutation.error)} onRetry={() => void mutation.reset()} />;
  }

  return (
    <PageFrame title="OCR upload" subtitle="Upload an invoice image for extraction.">
      {mutation.isPending ? <SkeletonLoader variant="rect" height={240} /> : null}
      <FileUploadDropzone
        accept="image/png,image/jpg,image/jpeg"
        label="Invoice image"
        onFileSelected={async (file) => {
          setError(null);
          try {
            const result = await mutation.mutateAsync({ invoice_image: file });
            addToast({ title: 'OCR queued', message: `Job ${result.job_id}`, variant: 'info' });
            navigate(`/vision/ocr/${result.job_id}`, { replace: true });
          } catch (err) {
            setError(normalizeApiError(err).message);
          }
        }}
        disabled={mutation.isPending}
      />
      {error ? <div className="muted">{error}</div> : null}
    </PageFrame>
  );
}
