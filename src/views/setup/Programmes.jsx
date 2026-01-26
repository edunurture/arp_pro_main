import React, { useMemo, useRef, useState } from 'react'
import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

/**
 * Programmes.jsx (ARP Updated)
 * - Keeps ALL form fields as-is (legacy bootstrap layout preserved)
 * - Programmes Details migrated to ArpDataTable (Search + Page Size + Sorting + Pagination + Selection)
 */
export default function Programmes() {
  const uploadRef = useRef(null)

  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(() => {
    const years = []
    for (let y = 2000; y <= currentYear; y++) years.push(String(y))
    return years
  }, [currentYear])

  const intakeOptions = useMemo(() => {
    const list = []
    for (let i = 1; i <= 240; i++) list.push(String(i))
    return list
  }, [])

  const creditOptions = useMemo(() => {
    const list = []
    for (let i = 1; i <= 15; i++) list.push(String(i))
    return list
  }, [])

  const [isFormEnabled, setIsFormEnabled] = useState(false)

  const [form, setForm] = useState({
    programme_code: '',
    programme_name: '',
    offering_mode: '',
    branch_of_study: '',
    graduation_category: '',
    year_of_intro: '',
    sanction_intake: '',
    affiliation_status: '',
    accreditation_status: '',
    parent_department: '',
    programme_status: '',
    total_semesters: '',
    total_credits: '',
    total_max_marks: '',
  })

  const onAddNew = () => setIsFormEnabled(true)

  const onCancel = () => {
    setIsFormEnabled(false)
    setForm({
      programme_code: '',
      programme_name: '',
      offering_mode: '',
      branch_of_study: '',
      graduation_category: '',
      year_of_intro: '',
      sanction_intake: '',
      affiliation_status: '',
      accreditation_status: '',
      parent_department: '',
      programme_status: '',
      total_semesters: '',
      total_credits: '',
      total_max_marks: '',
    })
  }

  const onChange = (e) => {
    const { id, value } = e.target

    // total_max_marks: numeric only, max 4 digits
    if (id === 'total_max_marks') {
      const numbersOnly = (value || '').replace(/\D/g, '')
      const clipped = numbersOnly.slice(0, 4)
      setForm((prev) => ({ ...prev, [id]: clipped }))
      return
    }

    setForm((prev) => ({ ...prev, [id]: value }))
  }

  const onSave = (e) => {
    e.preventDefault()
    console.log('Saved Programme:', form)
    alert('Saved successfully (demo).')
    setIsFormEnabled(false)
  }

  // Upload / Download
  const onUploadClick = () => uploadRef.current?.click()

  const onFileSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    alert(`You selected: ${file.name}`)
    e.target.value = ''
  }

  const onDownloadTemplate = () => {
    const a = document.createElement('a')
    a.href = '/assets/templates/ARP_T02_Programme_Template.xlsx'
    a.download = 'ARP_T02_Programme_Template.xlsx'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  /* =========================
     TABLE: ArpDataTable (Search + Page Size + Sort + Pagination)
  ========================== */
  const [selectedId, setSelectedId] = useState('MCA')
  const loading = false

  // Demo rows (replace with API later)
  const rows = useMemo(
    () => [
      {
        id: 'MCA',
        departmentCode: 'MCA',
        departmentName: 'Master of Computer Applications',
        year: '2016',
        nba: 'Yes',
        objectives: 'XXX - XXX',
        vision: 'XXX - XXX',
        mission: 'XXX - XXX',
        goal: 'XXX - XXX',
      },
      {
        id: 'MCOM',
        departmentCode: 'M.Com',
        departmentName: 'Master of Commerce',
        year: '2016',
        nba: 'No',
        objectives: 'XXX - XXX',
        vision: 'XXX - XXX',
        mission: 'XXX - XXX',
        goal: 'XXX - XXX',
      },
    ],
    [],
  )

  const columns = useMemo(
    () => [
      { key: 'departmentCode', label: 'Department Code', sortable: true, width: 170 },
      { key: 'departmentName', label: 'Department Name', sortable: true },
      { key: 'year', label: 'Year', sortable: true, width: 100, align: 'center', sortType: 'number' },
      { key: 'nba', label: 'NBA', sortable: true, width: 100, align: 'center' },
      { key: 'objectives', label: 'Objectives', sortable: true },
      { key: 'vision', label: 'Vision', sortable: true },
      { key: 'mission', label: 'Mission', sortable: true },
      { key: 'goal', label: 'Goal', sortable: true },
    ],
    [],
  )

  const onView = () => {
    if (!selectedId) return
    alert(`View: ${selectedId}`)
  }

  const onEdit = () => {
    if (!selectedId) return
    alert(`Edit: ${selectedId} (demo - enabling form)`)
    setIsFormEnabled(true)
  }

  const onDelete = () => {
    if (!selectedId) return
    alert(`Delete: ${selectedId}`)
  }

  const tableActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View" onClick={onView} disabled={!selectedId} />
      <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEdit} disabled={!selectedId} />
      <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDelete} disabled={!selectedId} />
    </div>
  )

  return (
    <div className="pcoded-content">
      <div className="pcoded-inner-content">
        <div className="main-body">
          <div className="page-wrapper">
            <div className="row">
              <div className="col-sm-12">
                {/* ===================== Programme Configuration ===================== */}
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <div className="card-header-left">
                      <h5 className="mb-0">Programme Configuration</h5>
                    </div>

                    {/* buttons aligned right */}
                    <div className="d-flex gap-2">
                      <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
                      <ArpButton label="Upload" icon="upload" color="info" onClick={onUploadClick} />
                      <ArpButton
                        label="Download Template"
                        icon="download"
                        color="danger"
                        onClick={onDownloadTemplate}
                      />
                      <input
                        ref={uploadRef}
                        id="uploadInput"
                        style={{ display: 'none' }}
                        type="file"
                        onChange={onFileSelected}
                      />
                    </div>
                  </div>

                  <div className="card-block">
                    <div className="card-body">
                      <form onSubmit={onSave}>
                        {/* Row 1 */}
                        <div className="row mb-3">
                          <label className="col-md-3 col-form-label">Programme Code</label>
                          <div className="col-md-3">
                            <input
                              id="programme_code"
                              className="form-control"
                              disabled={!isFormEnabled}
                              value={form.programme_code}
                              onChange={onChange}
                              type="text"
                            />
                          </div>

                          <label className="col-md-3 col-form-label">Programme Name</label>
                          <div className="col-md-3">
                            <input
                              id="programme_name"
                              className="form-control"
                              disabled={!isFormEnabled}
                              value={form.programme_name}
                              onChange={onChange}
                              type="text"
                            />
                          </div>
                        </div>

                        {/* Row 2 */}
                        <div className="row mb-3">
                          <label className="col-md-3 col-form-label">Offering Mode</label>
                          <div className="col-md-3">
                            <select
                              id="offering_mode"
                              className="form-control"
                              disabled={!isFormEnabled}
                              value={form.offering_mode}
                              onChange={onChange}
                            >
                              <option value="">Select Offering Mode</option>
                              <option>Full-Time Regular</option>
                              <option>Part-Time Regular</option>
                              <option>Distance Mode</option>
                              <option>Online Mode</option>
                            </select>
                          </div>

                          <label className="col-md-3 col-form-label">Branch of Study</label>
                          <div className="col-md-3">
                            <input
                              id="branch_of_study"
                              className="form-control"
                              disabled={!isFormEnabled}
                              value={form.branch_of_study}
                              onChange={onChange}
                              type="text"
                            />
                          </div>
                        </div>

                        {/* Row 3 */}
                        <div className="row mb-3">
                          <label className="col-md-3 col-form-label">Graduation Category</label>
                          <div className="col-md-3">
                            <select
                              id="graduation_category"
                              className="form-control"
                              disabled={!isFormEnabled}
                              value={form.graduation_category}
                              onChange={onChange}
                            >
                              <option value="">Select Graduation Category</option>
                              <option>UG</option>
                              <option>PG</option>
                              <option>Ph.D.</option>
                              <option>PGDCA</option>
                              <option>UG - Diploma</option>
                              <option>PG - Diploma</option>
                            </select>
                          </div>

                          <label className="col-md-3 col-form-label">Year of Introduction</label>
                          <div className="col-md-3">
                            <select
                              id="year_of_intro"
                              className="form-control"
                              disabled={!isFormEnabled}
                              value={form.year_of_intro}
                              onChange={onChange}
                            >
                              <option value="">Select Year</option>
                              {yearOptions.map((y) => (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Row 4 */}
                        <div className="row mb-3">
                          <label className="col-md-3 col-form-label">Sanction Intake</label>
                          <div className="col-md-3">
                            <select
                              id="sanction_intake"
                              className="form-control"
                              disabled={!isFormEnabled}
                              value={form.sanction_intake}
                              onChange={onChange}
                            >
                              <option value="">Select Intake</option>
                              {intakeOptions.map((i) => (
                                <option key={i} value={i}>
                                  {i}
                                </option>
                              ))}
                            </select>
                          </div>

                          <label className="col-md-3 col-form-label">Affiliation Status</label>
                          <div className="col-md-3">
                            <select
                              id="affiliation_status"
                              className="form-control"
                              disabled={!isFormEnabled}
                              value={form.affiliation_status}
                              onChange={onChange}
                            >
                              <option value="">Select Affiliation Status</option>
                              <option>Temporary</option>
                              <option>Permanent</option>
                            </select>
                          </div>
                        </div>

                        {/* Row 5 */}
                        <div className="row mb-3">
                          <label className="col-md-3 col-form-label">Accreditation Status</label>
                          <div className="col-md-3">
                            <select
                              id="accreditation_status"
                              className="form-control"
                              disabled={!isFormEnabled}
                              value={form.accreditation_status}
                              onChange={onChange}
                            >
                              <option value="">Select Accreditation Status</option>
                              <option>Yes</option>
                              <option>No</option>
                            </select>
                          </div>

                          <label className="col-md-3 col-form-label">Parent Department</label>
                          <div className="col-md-3">
                            <select
                              id="parent_department"
                              className="form-control"
                              disabled={!isFormEnabled}
                              value={form.parent_department}
                              onChange={onChange}
                            >
                              <option value="">Select Parent Department</option>
                              <option>Computer Science</option>
                              <option>Commerce</option>
                              <option>Management</option>
                              <option>Science and Humanities</option>
                            </select>
                          </div>
                        </div>

                        {/* Row 6 */}
                        <div className="row mb-3">
                          <label className="col-md-3 col-form-label">Programme Status</label>
                          <div className="col-md-3">
                            <select
                              id="programme_status"
                              className="form-control"
                              disabled={!isFormEnabled}
                              value={form.programme_status}
                              onChange={onChange}
                            >
                              <option value="">Select Programme Status</option>
                              <option>Alive</option>
                              <option>Not Alive</option>
                            </select>
                          </div>

                          <label className="col-md-3 col-form-label">Total Number of Semesters</label>
                          <div className="col-md-3">
                            <select
                              id="total_semesters"
                              className="form-control"
                              disabled={!isFormEnabled}
                              value={form.total_semesters}
                              onChange={onChange}
                            >
                              <option value="">Select Semesters</option>
                              {Array.from({ length: 8 }).map((_, idx) => {
                                const v = String(idx + 1)
                                return (
                                  <option key={v} value={v}>
                                    {v}
                                  </option>
                                )
                              })}
                            </select>
                          </div>
                        </div>

                        {/* Row 7 */}
                        <div className="row mb-3">
                          <label className="col-md-3 col-form-label">Total Credits</label>
                          <div className="col-md-3">
                            <select
                              id="total_credits"
                              className="form-control"
                              disabled={!isFormEnabled}
                              value={form.total_credits}
                              onChange={onChange}
                            >
                              <option value="">Select Credits</option>
                              {creditOptions.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>

                          <label className="col-md-3 col-form-label">Total Max. Marks</label>
                          <div className="col-md-3">
                            <input
                              id="total_max_marks"
                              className="form-control"
                              disabled={!isFormEnabled}
                              value={form.total_max_marks}
                              onChange={onChange}
                              inputMode="numeric"
                              type="text"
                              placeholder="Numbers only (max 4 digits)"
                            />
                          </div>
                        </div>

                        {/* Buttons row */}
                        <div className="row mb-4">
                          <div className="col-md-12 d-flex justify-content-end gap-2">
                            <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isFormEnabled} />
                            <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>

                {/* ===================== Programmes Details (ArpDataTable) ===================== */}
                <div className="mt-3">
                  <ArpDataTable
                    title="Programmes Details"
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    headerActions={tableActions}
                    selection={{
                      type: 'radio',
                      selected: selectedId,
                      onChange: (id) => setSelectedId(id),
                      key: 'id',
                      headerLabel: 'Select',
                      width: 60,
                      name: 'programmeRow',
                    }}
                    pageSizeOptions={[5, 10, 20, 50]}
                    defaultPageSize={10}
                    searchable
                    searchPlaceholder="Search..."
                    rowKey="id"
                  />
                </div>
                {/* ===================== End ===================== */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
