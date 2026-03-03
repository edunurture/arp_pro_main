import React, { useState } from 'react'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'

export default function QuestionRichEditor({ value, onChange, height = 220, disabled = false }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div>
        <div className="small text-warning mb-1">
          Rich editor failed to initialize. Fallback text mode is active.
        </div>
        <textarea
          className="form-control"
          rows={8}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          style={{ minHeight: `${height}px` }}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="small text-muted mb-1">
        Rich editor mode active (formatting, table, image paste/insert). Use LaTeX field below for equations.
      </div>
      <CKEditor
        editor={ClassicEditor}
        disabled={disabled}
        data={value || ''}
        config={{
          toolbar: [
            'heading',
            '|',
            'bold',
            'italic',
            'link',
            'bulletedList',
            'numberedList',
            '|',
            'outdent',
            'indent',
            '|',
            'insertTable',
            'imageUpload',
            'blockQuote',
            'undo',
            'redo',
          ],
          table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
          },
        }}
        onReady={(editor) => {
          editor.editing.view.change((writer) => {
            writer.setStyle(
              'min-height',
              `${height}px`,
              editor.editing.view.document.getRoot(),
            )
          })
        }}
        onChange={(_, editor) => {
          const data = editor.getData()
          onChange?.(data)
        }}
        onError={() => {
          setFailed(true)
        }}
      />
    </div>
  )
}
