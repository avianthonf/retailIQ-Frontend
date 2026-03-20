/**
 * src/components/ui/FileUploadDropzone.tsx
 * Oracle Document sections consumed: 3, 7, 9, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
interface FileUploadDropzoneProps {
  accept: string;
  label: string;
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function FileUploadDropzone({ accept, label, onFileSelected, disabled }: FileUploadDropzoneProps) {
  return (
    <label className="card" style={{ display: 'grid', gap: '0.75rem', padding: '1.25rem' }}>
      <strong>{label}</strong>
      <span className="muted">Accepts {accept}</span>
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFileSelected(file);
          }
        }}
      />
    </label>
  );
}
