import { useCallback, useRef, useState } from "react"
import { getApiConfig } from "../../lib/api/config"
import { listingsService } from "../../lib/api/services/listings"

// Images are served by the same backend that handles uploads — in the modular
// monolith that's `apps/api`, the same origin as every other API call. Default to
// the API base URL; set VITE_LISTING_SERVICE_URL only to host images elsewhere
// (e.g. a CDN).
const IMAGE_BASE_URL = import.meta.env.VITE_LISTING_SERVICE_URL ?? getApiConfig().BASE_URL

/** Build a displayable URL for a server-side image path like /uploads/listings/xxx.webp */
export function listingImageUrl(serverPath: string): string {
  if (serverPath.startsWith("http")) return serverPath
  return `${IMAGE_BASE_URL}${serverPath}`
}

interface ImageUploaderProps {
  /** Array of server-side paths already saved (e.g. ["/uploads/listings/xxx.webp"]) */
  value: string[]
  /** Called with the new paths array whenever images are added or removed */
  onChange: (paths: string[]) => void
  /** Maximum number of photos allowed (default 20) */
  max?: number
  className?: string
}

interface PendingPreview {
  localUrl: string
  file: File
}

export function ImageUploader({ value, onChange, max = 20, className = "" }: ImageUploaderProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Local previews while uploading (blob URLs, discarded after server responds)
  const [pending, setPending] = useState<PendingPreview[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  // Always points at the latest value so async callbacks that resolve later
  // (an in-flight upload, a concurrent remove) don't operate on a stale snapshot
  // captured when the callback was created.
  const valueRef = useRef(value)
  valueRef.current = value

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      setError(null)

      const slots = max - valueRef.current.length
      if (slots <= 0) {
        setError(`Максимум ${max} фото`)
        return
      }

      const toUpload = Array.from(files).slice(0, slots)

      // Show local previews immediately
      const previews: PendingPreview[] = toUpload.map((file) => ({
        localUrl: URL.createObjectURL(file),
        file,
      }))
      setPending(previews)
      setUploading(true)

      try {
        const result = await listingsService.uploadImages(toUpload)
        // Re-read the latest value: the user may have removed photos while the
        // upload was in flight.
        onChange([...valueRef.current, ...result.images])
      } catch {
        setError("Ошибка при загрузке. Проверьте формат и размер файлов (макс. 10 МБ).")
      } finally {
        // Revoke blob URLs to free memory
        previews.forEach((p) => URL.revokeObjectURL(p.localUrl))
        setPending([])
        setUploading(false)
        if (inputRef.current) inputRef.current.value = ""
      }
    },
    [onChange, max],
  )

  const handleRemove = useCallback(
    async (imgPath: string) => {
      onChange(valueRef.current.filter((p) => p !== imgPath))
      try {
        await listingsService.deleteImage(imgPath)
      } catch (err) {
        // best-effort — the path is already dropped from the form; surface for debugging
        console.warn("Failed to delete image from server:", imgPath, err)
      }
    },
    [onChange],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const canAddMore = value.length + pending.length < max

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Drop zone — hide when limit reached */}
      {canAddMore && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Загрузить фотографии"
          className={[
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors select-none",
            dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 bg-white",
            uploading ? "opacity-60 pointer-events-none" : "",
          ].join(" ")}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Загрузка...</p>
            </div>
          ) : (
            <>
              <svg
                className="mx-auto mb-3 h-10 w-10 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm font-medium text-gray-700">Перетащите фото сюда или нажмите для выбора</p>
              <p className="mt-1 text-xs text-gray-400">
                JPG, PNG, WebP · до 10 МБ · максимум {max} фото · осталось{" "}
                {Math.max(0, max - value.length - pending.length)}
              </p>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Preview grid — uploaded + pending (local previews) */}
      {(value.length > 0 || pending.length > 0) && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {value.map((src, i) => (
            <div key={src} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={listingImageUrl(src)}
                alt={`Фото ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded leading-none">
                  Главное
                </span>
              )}
              <button
                type="button"
                title="Удалить фото"
                onClick={() => handleRemove(src)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs
                           flex items-center justify-center opacity-0 group-hover:opacity-100
                           transition-opacity hover:bg-black/80"
              >
                ✕
              </button>
            </div>
          ))}

          {/* Ghost tiles for photos being uploaded */}
          {pending.map((p, i) => (
            <div key={p.localUrl} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img src={p.localUrl} alt={`Загружается ${i + 1}`} className="w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          ))}
        </div>
      )}

      {(value.length > 0 || pending.length > 0) && (
        <p className="text-xs text-gray-400">
          {value.length}/{max} фото · Первое фото — главное в объявлении
        </p>
      )}
    </div>
  )
}
