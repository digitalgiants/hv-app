'use client'

import { useRef, useState } from 'react'

type UploadState =
  | { stage: 'idle' }
  | { stage: 'uploading'; filename: string }
  | { stage: 'done'; processed: number; errors: string[]; filename: string }
  | { stage: 'error'; message: string }

export function CsvUpload() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>({ stage: 'idle' })

  async function handleFile(file: File) {
    setState({ stage: 'uploading', filename: file.name })

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/import', { method: 'POST', body: form })
      const json = await res.json()

      if (!res.ok) {
        setState({ stage: 'error', message: json.error ?? 'Upload failed' })
        return
      }

      setState({
        stage: 'done',
        filename: file.name,
        processed: json.processed,
        errors: json.errors ?? [],
      })
    } catch {
      setState({ stage: 'error', message: 'Network error — please try again' })
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // reset so same file can be re-uploaded
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const isUploading = state.stage === 'uploading'

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => !isUploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
          ${isUploading
            ? 'border-sky-700 bg-sky-950/20 cursor-wait'
            : 'border-slate-700 hover:border-sky-600 hover:bg-slate-800/50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleChange}
          disabled={isUploading}
        />

        {state.stage === 'uploading' ? (
          <div className="space-y-1">
            <p className="text-sky-400 text-sm font-medium">Importing {state.filename}…</p>
            <div className="h-1 bg-slate-800 rounded overflow-hidden mt-2">
              <div className="h-full bg-sky-600 rounded animate-pulse w-2/3" />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-slate-300 text-sm font-medium">
              Drop a Brisnet CSV here, or click to browse
            </p>
            <p className="text-slate-600 text-xs">BRIS DRF format · .csv files only</p>
          </div>
        )}
      </div>

      {/* Result feedback */}
      {state.stage === 'done' && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          state.errors.length > 0 ? 'bg-yellow-950/40 border border-yellow-800' : 'bg-emerald-950/40 border border-emerald-800'
        }`}>
          <p className={state.errors.length > 0 ? 'text-yellow-300' : 'text-emerald-300'}>
            ✓ Imported {state.processed} {state.processed === 1 ? 'entry' : 'entries'} from {state.filename}
          </p>
          {state.errors.length > 0 && (
            <ul className="mt-2 text-yellow-500 text-xs space-y-0.5">
              {state.errors.slice(0, 5).map((e, i) => <li key={i}>• {e}</li>)}
              {state.errors.length > 5 && <li>…and {state.errors.length - 5} more</li>}
            </ul>
          )}
        </div>
      )}

      {state.stage === 'error' && (
        <div className="rounded-lg px-4 py-3 text-sm bg-red-950/40 border border-red-800">
          <p className="text-red-300">✗ {state.message}</p>
        </div>
      )}
    </div>
  )
}
