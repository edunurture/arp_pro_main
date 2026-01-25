import React, { useEffect, useMemo, useState } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CForm,
  CFormLabel,
  CFormSelect,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'

import { CKEditor } from '@ckeditor/ckeditor5-react'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'

import { ArpButton, ArpIconButton, ArpPagination } from '../../components/common'

const initialForm = {
  manualId: '',
  category: '',
}

const AMSExecutiveSummary = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const [form, setForm] = useState(initialForm)
  const [editorText, setEditorText] = useState('')

  const [showEditor, setShowEditor] = useState(false)
  const [showTable, setShowTable] = useState(false)

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'category', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const rows = useMemo(
    () => [
      { id: 1, category: 'Introductory Note', updatedOn: '2026-01-10', status: 'Completed' },
      { id: 2, category: 'SWOC', updatedOn: '2026-01-12', status: 'In Progress' },
    ],
    [],
  )

  const normalize = (v) =>
    String(v ?? '')
      .toLowerCase()
      .trim()

  const sortToggle = (key) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
    })
  }

  const sortIndicator = (key) => {
    if (sort.key !== key) return ''
    return sort.dir === 'asc' ? ' ▲' : ' ▼'
  }

  const filteredSorted = useMemo(() => {
    const q = normalize(search)
    let data = rows

    if (q) {
      data = rows.filter((r) => Object.values(r).map(normalize).join(' ').includes(q))
    }

    const { key, dir } = sort || {}
    if (!key) return data

    const sorted = [...data].sort((a, b) =>
      normalize(a?.[key]).localeCompare(normalize(b?.[key])),
    )

    return dir === 'asc' ? sorted : sorted.reverse()
  }, [rows, search, sort])

  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  const total = filteredSorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)

  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)

  const pageRows = useMemo(
    () => filteredSorted.slice(startIdx, endIdx),
    [filteredSorted, startIdx, endIdx],
  )

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const onAddNew = () => {
    setSelectedId(null)
    setIsEdit(true)
    setForm(initialForm)
    setEditorText('')
    setShowEditor(false)
    setShowTable(false)
  }

  const onView = () => {
    setShowTable(true)
    setShowEditor(false)
    setIsEdit(false)
  }

  const onSearchForm = () => {
    if (!form.manualId && !form.category) return
    setShowEditor(true)
    setShowTable(false)
  }

  const onResetForm = () => {
    setForm(initialForm)
    setShowEditor(false)
    setShowTable(false)
  }

  const onCancelForm = () => {
    setIsEdit(false)
    onResetForm()
  }

  const onSaveEditor = () => {
    setShowTable(true)
    setShowEditor(false)
    setIsEdit(false)
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>EXECUTIVE SUMMARY</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton label="View" icon="view" color="info" onClick={onView} />
            </div>
          </CCardHeader>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>Executive Summary</strong>
          </CCardHeader>

          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Choose Manual ID</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.manualId} onChange={onChange('manualId')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="Manual Id - 1">Manual Id - 1</option>
                    <option value="Manual Id - 2">Manual Id - 2</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Executive Summary Category</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.category} onChange={onChange('category')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="Introductory Note">Introductory Note</option>
                    <option value="Criterion Wise Summary">Criterion Wise Summary</option>
                    <option value="SWOC">SWOC</option>
                    <option value="Any Additional Information">Any Additional Information</option>
                    <option value="Overall Conclusive Explication">Overall Conclusive Explication</option>
                  </CFormSelect>
                </CCol>

                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Search" icon="search" color="info" onClick={onSearchForm} />
                  <ArpButton label="Reset" icon="reset" color="warning" onClick={onResetForm} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancelForm} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {showEditor && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>Executive Summary Editor</strong>
            </CCardHeader>

            <CCardBody>
              <CForm>
                <CRow className="g-3">
                  <CCol xs={12}>
                    <div className="border rounded p-2">
                      <CKEditor
                        editor={ClassicEditor}
                        data={editorText}
                        onChange={(event, editor) => {
                          const data = editor.getData()
                          setEditorText(data)
                        }}
                        config={{
                          toolbar: [
                            'heading',
                            '|',
                            'bold',
                            'italic',
                            'underline',
                            '|',
                            'bulletedList',
                            'numberedList',
                            '|',
                            'link',
                            'insertTable',
                            '|',
                            'undo',
                            'redo',
                          ],
                          table: {
                            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
                          },
                        }}
                      />
                    </div>
                  </CCol>

                  <CCol xs={12} className="d-flex justify-content-end gap-2">
                    <ArpButton label="Save" icon="save" color="success" onClick={onSaveEditor} />
                    <ArpButton label="Reset" icon="reset" color="warning" onClick={() => setEditorText('')} />
                    <ArpButton
                      label="Cancel"
                      icon="cancel"
                      color="secondary"
                      onClick={() => setShowEditor(false)}
                    />
                  </CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>
        )}

        {showTable && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Executive Summary Log</strong>

              <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ overflowX: 'auto' }}>
                <CInputGroup size="sm" style={{ width: 280, flex: '0 0 auto' }}>
                  <CInputGroupText>
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>
                  <CFormInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
                </CInputGroup>

                <CFormSelect
                  size="sm"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  style={{ width: 120, flex: '0 0 auto' }}
                  title="Rows per page"
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </CFormSelect>
              </div>
            </CCardHeader>

            <CCardBody>
              <div className="d-flex gap-2 align-items-center mb-2">
                <ArpIconButton icon="download" color="danger" title="Download" />
                <ArpIconButton icon="view" color="purple" title="View" disabled={!selectedId} />
                <ArpIconButton icon="edit" color="info" title="Edit" disabled={!selectedId} />
                <ArpIconButton icon="delete" color="danger" title="Delete" disabled={!selectedId} />
              </div>

              <CTable hover responsive align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 60 }}>Select</CTableHeaderCell>
                    <CTableHeaderCell onClick={() => sortToggle('category')}>
                      Category{sortIndicator('category')}
                    </CTableHeaderCell>
                    <CTableHeaderCell onClick={() => sortToggle('updatedOn')}>
                      Updated On{sortIndicator('updatedOn')}
                    </CTableHeaderCell>
                    <CTableHeaderCell onClick={() => sortToggle('status')}>
                      Status{sortIndicator('status')}
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {pageRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell className="text-center">
                        <input
                          type="radio"
                          name="esRow"
                          checked={selectedId === r.id}
                          onChange={() => setSelectedId(r.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{r.category}</CTableDataCell>
                      <CTableDataCell>{r.updatedOn}</CTableDataCell>
                      <CTableDataCell>{r.status}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              <ArpPagination
                page={safePage}
                totalPages={totalPages}
                onChange={setPage}
                size="sm"
                align="end"
                prevText="Previous"
                nextText="Next"
              />
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default AMSExecutiveSummary
