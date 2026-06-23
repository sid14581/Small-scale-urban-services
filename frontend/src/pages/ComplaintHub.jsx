import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { CATEGORIES } from '../constants'

export default function ComplaintHub() {
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-10 text-center md:text-left">
          <h1 className="page-header">File a Complaint</h1>
          <p className="page-subtitle">Select a category to submit your complaint.</p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              to={`/complaints/new/${cat.value}`}
              className={`category-card ${cat.color} flex flex-col items-center text-center gap-4 p-6`}
            >
              <img
                src={cat.image}
                alt={cat.label}
                className="w-20 h-20 object-cover rounded-xl ring-2 ring-slate-200 dark:ring-slate-600"
              />
              <div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{cat.label}</h3>
                <p className="text-sm text-primary mt-1 font-medium">Submit complaint →</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
