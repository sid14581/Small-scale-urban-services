import { Link } from 'react-router-dom'
import { normalizeExternalUrl } from '../utils/url'

const STATUS_CLASS = {
  open: 'badge-open',
  in_progress: 'badge-in_progress',
  resolved: 'badge-resolved',
}

export default function ComplaintCard({
  complaint,
  staffView = false,
  selectable = false,
  selected = false,
  onSelect,
}) {
  const driveUrl = complaint.link ? normalizeExternalUrl(complaint.link) : ''

  return (
    <div className="card hover:shadow-card-hover hover:border-primary/30 transition-all duration-200 group">
      <div className="flex justify-between items-start mb-3 gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {selectable && (
            <input
              type="checkbox"
              className="mt-1 shrink-0 w-4 h-4 accent-primary rounded"
              checked={selected}
              onChange={(e) => onSelect?.(complaint.id, e.target.checked)}
              aria-label={`Select complaint ${complaint.reference_id}`}
            />
          )}
          <span className="text-link font-mono text-sm">{complaint.reference_id}</span>
        </div>
        <span className={STATUS_CLASS[complaint.status] || 'badge'}>{complaint.status_display}</span>
      </div>
      <h3 className="font-semibold text-lg text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-primary-light transition-colors">
        {complaint.complain}
      </h3>
      <p className="text-muted text-sm mt-1.5">
        {complaint.category_display} · {complaint.area}
      </p>
      {staffView && driveUrl && (
        <a
          href={driveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link text-xs underline block mt-2 truncate"
          title={complaint.link}
        >
          {complaint.link}
        </a>
      )}
      <p className="text-muted text-xs mt-3">
        {new Date(complaint.created_at).toLocaleDateString()}
      </p>
      {staffView && (
        <Link to={`/staff/complaints/${complaint.id}`} className="btn-primary text-xs mt-4 inline-flex min-h-0 py-2">
          View / Update
        </Link>
      )}
    </div>
  )
}
