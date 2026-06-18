import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { CATEGORIES } from '../constants'

export default function ComplaintHub() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">File a Complaint</h1>
        <p className="text-muted mb-8">Select a category to submit your complaint.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              to={`/complaints/new/${cat.value}`}
              className={`card ${cat.color} hover:scale-105 transition-transform flex flex-col items-center text-center gap-3`}
            >
              <img
                src={cat.image}
                alt={cat.label}
                className="w-20 h-20 object-contain drop-shadow-md"
              />
              <div>
                <h3 className="font-semibold text-lg">{cat.label}</h3>
                <p className="text-sm opacity-80 mt-1">Submit complaint →</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
