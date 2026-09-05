import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ComplaintCard from '../components/ComplaintCard'
import api from '../api/axios'
import { CATEGORIES } from '../constants'
import { getApiErrorMessage } from '../utils/apiError'

const STATUS_CLASS = {
  open: 'badge-open',
  in_progress: 'badge-in_progress',
  resolved: 'badge-resolved',
}

export default function ComplaintList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkStatus, setBulkStatus] = useState('in_progress')
  const [bulkError, setBulkError] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  const category = searchParams.get('category') || ''
  const status = searchParams.get('status') || ''
  const area = searchParams.get('area') || ''
  const search = searchParams.get('search') || ''

  const filterParams = () => {
    const params = {}
    if (category) params.category = category
    if (status) params.status = status
    if (area) params.area = area
    if (search) params.search = search
    return params
  }

  useEffect(() => {
    setPage(1)
    setSelectedIds(new Set())
  }, [category, status, area, search])

  const fetchComplaints = () => {
    setLoading(true)
    setError('')
    const params = { page, ...filterParams() }

    return api.get('/complaints/', { params })
      .then(({ data }) => {
        setComplaints(data.results || data)
        setTotalCount(data.count ?? (data.results || data).length)
        setHasNext(!!data.next)
        setHasPrev(!!data.previous)
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Failed to load complaints.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchComplaints()
  }, [category, status, area, search, page])

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  const toggleSelect = (id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(complaints.map((c) => c.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0) return
    setBulkError('')
    setBulkSaving(true)
    try {
      const { data } = await api.patch('/complaints/bulk-status/', {
        ids: [...selectedIds],
        status: bulkStatus,
      })
      if (data.failed?.length) {
        setBulkError(
          `Updated ${data.updated.length}; ${data.failed.length} failed (invalid status transition).`
        )
      }
      setSelectedIds(new Set())
      await fetchComplaints()
    } catch (err) {
      setBulkError(getApiErrorMessage(err, 'Bulk update failed.'))
    } finally {
      setBulkSaving(false)
    }
  }

  const handleExportCsv = async () => {
    setExporting(true)
    try {
      const { data } = await api.get('/complaints/export/', {
        params: filterParams(),
        responseType: 'blob',
      })
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = 'complaints.csv'
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(getApiErrorMessage(err, 'CSV export failed.'))
    } finally {
      setExporting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / 20))
  const allSelected = complaints.length > 0 && complaints.every((c) => selectedIds.has(c.id))

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <span className="staff-badge mb-2">Staff Portal</span>
            <h1 className="page-header">All Complaints</h1>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            className="btn-outline text-sm"
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
        <div className="mb-6 flex flex-wrap gap-3 p-4 rounded-2xl border border-surface-variant dark:border-slate-700 bg-white dark:bg-slate-900">
          <label className="sr-only" htmlFor="staff-search">Search</label>
          <input
            id="staff-search"
            className="input w-auto min-w-[12rem] flex-1"
            placeholder="Search description, area, address"
            value={search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
          <label className="sr-only" htmlFor="staff-category">Category</label>
          <select id="staff-category" className="input w-auto" value={category} onChange={(e) => updateFilter('category', e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <label className="sr-only" htmlFor="staff-status">Status</label>
          <select id="staff-status" className="input w-auto" value={status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <label className="sr-only" htmlFor="staff-area">Area</label>
          <input id="staff-area" className="input w-auto" placeholder="Filter by area" value={area}
            onChange={(e) => updateFilter('area', e.target.value)} />
        </div>
        {selectedIds.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 p-4 rounded-2xl border border-primary/30 bg-primary/5 dark:bg-teal-950/30">
            <span className="text-sm text-muted">{selectedIds.size} selected</span>
            <select className="input w-auto" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} aria-label="Bulk status">
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <button
              type="button"
              onClick={handleBulkUpdate}
              disabled={bulkSaving}
              className="btn-primary text-sm"
            >
              {bulkSaving ? 'Updating...' : 'Update Selected'}
            </button>
            <button type="button" onClick={() => setSelectedIds(new Set())} className="btn-outline text-sm">
              Clear
            </button>
            {bulkError && <p className="text-error text-sm w-full">{bulkError}</p>}
          </div>
        )}
        {loading && <p className="text-muted">Loading...</p>}
        {error && <p className="text-error text-sm mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20" role="alert">{error}</p>}
        {!loading && !error && (
          <>
            {/* Desktop denser table */}
            <div className="hidden md:block border border-surface-variant dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-muted/80 dark:bg-slate-800/80 text-muted">
                  <tr>
                    <th className="py-2.5 px-3 w-10">
                      <input
                        type="checkbox"
                        className="accent-primary w-4 h-4 rounded"
                        checked={allSelected}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        aria-label="Select all on this page"
                      />
                    </th>
                    <th className="py-2.5 px-3 font-medium">Reference</th>
                    <th className="py-2.5 px-3 font-medium">Issue</th>
                    <th className="py-2.5 px-3 font-medium">Category</th>
                    <th className="py-2.5 px-3 font-medium">Area</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                    <th className="py-2.5 px-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted">No complaints match your filters.</td>
                    </tr>
                  ) : (
                    complaints.map((c) => (
                      <tr
                        key={c.id}
                        className="border-t border-surface-variant/70 dark:border-slate-800 hover:bg-surface-muted/40 dark:hover:bg-slate-800/40 cursor-pointer"
                        onClick={() => navigate(`/staff/complaints/${c.id}`)}
                      >
                        <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="accent-primary w-4 h-4 rounded"
                            checked={selectedIds.has(c.id)}
                            onChange={(e) => toggleSelect(c.id, e.target.checked)}
                            aria-label={`Select ${c.reference_id}`}
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono text-primary dark:text-primary-light whitespace-nowrap">
                          {c.reference_id}
                        </td>
                        <td className="py-2.5 px-3 max-w-[16rem] truncate font-medium text-slate-900 dark:text-white">
                          {c.complain}
                        </td>
                        <td className="py-2.5 px-3 text-muted whitespace-nowrap">{c.category_display}</td>
                        <td className="py-2.5 px-3 text-muted whitespace-nowrap">{c.area}</td>
                        <td className="py-2.5 px-3">
                          <span className={STATUS_CLASS[c.status] || 'badge'}>{c.status_display}</span>
                        </td>
                        <td className="py-2.5 px-3 text-muted whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {complaints.length === 0 ? (
                <div className="border border-dashed border-surface-variant dark:border-slate-700 rounded-2xl py-12 text-center">
                  <p className="text-muted">No complaints match your filters.</p>
                </div>
              ) : (
                <>
                  <label className="flex items-center gap-2 mb-1 text-sm text-muted">
                    <input
                      type="checkbox"
                      className="accent-primary w-4 h-4 rounded"
                      checked={allSelected}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                    />
                    Select all on this page
                  </label>
                  {complaints.map((c) => (
                    <ComplaintCard
                      key={c.id}
                      complaint={c}
                      staffView
                      selectable
                      selected={selectedIds.has(c.id)}
                      onSelect={toggleSelect}
                    />
                  ))}
                </>
              )}
            </div>

            {totalCount > 0 && (
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-muted text-sm">
                  Page {page} of {totalPages} ({totalCount} total)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-outline text-sm disabled:opacity-40"
                    disabled={!hasPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn-primary text-sm disabled:opacity-40"
                    disabled={!hasNext}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
