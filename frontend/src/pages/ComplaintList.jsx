import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ComplaintCard from '../components/ComplaintCard'
import api from '../api/axios'
import { CATEGORIES } from '../constants'
import { getApiErrorMessage } from '../utils/apiError'

export default function ComplaintList() {
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
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
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
        <div className="card mb-6 flex flex-wrap gap-3">
          <input
            className="input w-auto min-w-[12rem] flex-1"
            placeholder="Search description, area, address"
            value={search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
          <select className="input w-auto" value={category} onChange={(e) => updateFilter('category', e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className="input w-auto" value={status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <input className="input w-auto" placeholder="Filter by area" value={area}
            onChange={(e) => updateFilter('area', e.target.value)} />
        </div>
        {selectedIds.size > 0 && (
          <div className="card mb-4 flex flex-wrap items-center gap-3 border-primary/30">
            <span className="text-sm text-muted">{selectedIds.size} selected</span>
            <select className="input w-auto" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
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
        {error && <p className="text-error text-sm mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">{error}</p>}
        {!loading && !error && (
          <>
            {complaints.length > 0 && (
              <label className="flex items-center gap-2 mb-3 text-sm text-muted">
                <input
                  type="checkbox"
                  className="accent-primary w-4 h-4 rounded"
                  checked={allSelected}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
                Select all on this page
              </label>
            )}
            <div className="grid gap-4">
              {complaints.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-muted">No complaints match your filters.</p>
                </div>
              ) : (
                complaints.map((c) => (
                  <ComplaintCard
                    key={c.id}
                    complaint={c}
                    staffView
                    selectable
                    selected={selectedIds.has(c.id)}
                    onSelect={toggleSelect}
                  />
                ))
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
