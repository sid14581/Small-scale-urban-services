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
    <div className="card hover:border-indigo-500 transition-colors">
      <div className="flex justify-between items-start mb-2 gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {selectable && (
            <input
              type="checkbox"
              className="mt-1 shrink-0"
              checked={selected}
              onChange={(e) => onSelect?.(complaint.id, e.target.checked)}
            />
          )}
          <span className="text-link font-mono text-sm">{complaint.reference_id}</span>
        </div>
        <span className={STATUS_CLASS[complaint.status] || 'badge'}>{complaint.status_display}</span>
      </div>
      <h3 className="font-semibold text-lg">{complaint.complain}</h3>
      <p className="text-muted text-sm mt-1">{complaint.category_display} · {complaint.area}</p>
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
      <p className="text-muted text-xs mt-2">{new Date(complaint.created_at).toLocaleDateString()}</p>
      {staffView && (
        <Link to={`/staff/complaints/${complaint.id}`} className="btn-primary text-xs mt-3 inline-block">
          View / Update
        </Link>
      )}
    </div>
  )
}
