"use client"

import { Bookmark, Loader2, Upload } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface BrowserImportFormProps {
  onSuccess: () => void
}

type ImportState = "idle" | "importing" | "done"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB，需与 API 保持一致

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function BrowserImportForm({ onSuccess }: BrowserImportFormProps) {
  const t = useT()
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [state, setState] = useState<ImportState>("idle")
  const inputRef = useRef<HTMLInputElement>(null)

  const acceptFile = useCallback(
    (picked: File | null | undefined) => {
      if (!picked) {
        return
      }
      if (picked.size > MAX_FILE_SIZE) {
        toast.error(t.ingest.browserTooLarge)
        return
      }
      setFile(picked)
    },
    [t.ingest.browserTooLarge]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      acceptFile(e.dataTransfer.files[0])
    },
    [acceptFile]
  )

  const handleSubmit = useCallback(async () => {
    if (!file) {
      return
    }
    setState("importing")
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/import/bookmarks", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || t.ingestDialog.importFailed)
        setState("idle")
        return
      }
      toast.success(
        t.ingest.browserResult
          .replace("{imported}", String(data.imported))
          .replace("{duplicates}", String(data.duplicates))
          .replace("{foldersCreated}", String(data.foldersCreated))
      )
      setFile(null)
      setState("done")
      onSuccess()
    } catch {
      toast.error(t.ingestDialog.networkError)
      setState("idle")
    }
  }, [file, onSuccess, t])

  const busy = state === "importing"

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label>{t.ingest.tabBrowser}</Label>
        <div
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
          onClick={() => inputRef.current?.click()}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDrop={handleDrop}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          role="button"
          tabIndex={0}
        >
          <input
            accept=".html,.htm"
            className="sr-only"
            onChange={(e) => acceptFile(e.target.files?.[0])}
            ref={inputRef}
            type="file"
          />
          {file ? (
            <>
              <Bookmark className="size-8 text-primary" />
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="size-8 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{t.ingest.browserDragHint}</p>
                <p className="mt-1 text-muted-foreground text-xs">{t.ingest.browserSupported}</p>
              </div>
            </>
          )}
        </div>
      </div>

      <Button className="w-full" disabled={!file || busy} onClick={handleSubmit}>
        {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
        {busy ? t.ingest.browserImporting : t.ingest.browserSubmit}
      </Button>
    </div>
  )
}
