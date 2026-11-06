import { useRef, useState } from 'react';
import { Camera, Upload, Loader2, ImagePlus, AlertCircle } from 'lucide-react';

const MAX_FILE_SIZE = 12 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export default function CameraCapture({ onImageCaptured, isLoading, error }) {
  const [preview, setPreview] = useState(null);
  const [fileError, setFileError] = useState('');
  const cameraInput = useRef(null);
  const galleryInput = useRef(null);

  const handleFileChange = (event) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    setFileError('');
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Please select a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError('This image is larger than 12 MB. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setFileError('The image could not be read. Please select it again.');
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setFileError('The selected image could not be processed.');
        return;
      }
      setPreview(reader.result);
      onImageCaptured(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="max-w-md mx-auto my-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm" aria-label="Add a bill">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Add a bill</h2>
          <p className="mt-1 text-xs text-gray-500">Take a clear photo or choose an image</p>
        </div>
        <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600"><ImagePlus className="h-5 w-5" /></div>
      </div>

      <div className="relative mb-4 flex h-64 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
        {preview ? (
          <img src={preview} alt="Selected bill preview" className="h-full w-full object-contain" />
        ) : (
          <div className="px-5 text-center">
            <Camera className="mx-auto mb-2 h-11 w-11 text-indigo-500" />
            <p className="text-sm font-medium text-gray-700">Snap a bill or pick from gallery</p>
            <p className="mt-1 text-xs text-gray-400">JPG, PNG or WEBP · Up to 12 MB</p>
          </div>
        )}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 text-indigo-700" role="status" aria-live="polite">
            <Loader2 className="mb-2 h-8 w-8 animate-spin" />
            <span className="text-sm font-semibold">Analyzing your bill…</span>
            <span className="mt-1 text-xs text-gray-500">This may take a few seconds</span>
          </div>
        )}
      </div>

      {(fileError || error) && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{fileError || error}</span>
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => cameraInput.current?.click()} disabled={isLoading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          Take Photo
        </button>
        <button type="button" onClick={() => galleryInput.current?.click()} disabled={isLoading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60">
          <Upload className="h-5 w-5" /> Gallery
        </button>
      </div>
      <input ref={cameraInput} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment" className="hidden" onChange={handleFileChange} disabled={isLoading} />
      <input ref={galleryInput} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden" onChange={handleFileChange} disabled={isLoading} />
    </section>
  );
}
