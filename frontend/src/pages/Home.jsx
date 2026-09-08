import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { BRANDING, CATEGORIES, GALLERY_IMAGES } from '../constants'

const CATEGORY_BORDER = {
  air_pollution: 'category-air',
  electricity: 'category-electricity',
  road: 'category-road',
  sewage: 'category-sewage',
  waste: 'category-waste',
  others: 'category-others',
}

function CategoryCard({ cat, user }) {
  const submitUrl = `/complaints/new/${cat.value}`
  const borderClass = CATEGORY_BORDER[cat.value] || ''
  const className = `category-card ${borderClass} flex flex-col text-left gap-3 p-5 h-full`

  const body = (
    <>
      <img
        src={cat.image}
        alt=""
        className="w-full h-28 rounded-xl object-cover ring-2 ring-slate-200/80 dark:ring-slate-700"
      />
      <div className="flex flex-col gap-1 flex-1">
        <span className="text-base font-semibold text-slate-800 dark:text-white">{cat.label}</span>
        <span className="text-sm text-muted leading-snug">{cat.blurb}</span>
      </div>
      <span className="text-sm text-primary font-semibold mt-auto">Report issue →</span>
    </>
  )

  if (!user) {
    return (
      <Link to="/login" state={{ from: submitUrl }} className={className}>
        {body}
      </Link>
    )
  }

  return (
    <Link to={submitUrl} className={className}>
      {body}
    </Link>
  )
}

export default function Home() {
  const { user, isAdmin, isStaff, isCitizen } = useAuth()

  const scrollToCategories = () => {
    document.getElementById('service-categories')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Navbar />
      {/* Full-bleed civic hero — Home Variant A + mobile task-first */}
      <section className="relative min-h-[min(78vh,40rem)] flex items-end md:items-center overflow-hidden">
        <img src={BRANDING.hero} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-slate-950/25" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-12 md:py-20">
          <p className="text-primary-light font-bold text-sm uppercase tracking-[0.2em] mb-3">
            SCMS · Smart City Management
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-white max-w-xl leading-[1.1] mb-4">
            Report urban service issues
          </h1>
          <p className="text-slate-200 text-base md:text-lg max-w-lg mb-8">
            File infrastructure and utility problems with city staff — fast, transparent, and
            trackable.
          </p>
          {user ? (
            isAdmin ? (
              <Link to="/admin-portal" className="btn-primary text-base px-8">
                Admin Portal
              </Link>
            ) : isStaff ? (
              <Link to="/staff" className="btn-primary text-base px-8">
                Staff Dashboard
              </Link>
            ) : (
              <button
                type="button"
                onClick={scrollToCategories}
                className="btn-primary text-base px-8"
              >
                Report now
              </button>
            )
          ) : (
            <div className="flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary text-base px-8">
                Get started
              </Link>
              <Link
                to="/login"
                className="btn border-2 border-white/40 text-white hover:bg-white/10 text-base px-8 min-h-[44px]"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <section id="service-categories" className="mb-14 scroll-mt-24">
          <div className="mb-8 max-w-2xl">
            <h2 className="page-header text-2xl md:text-3xl">How can we help today?</h2>
            <p className="page-subtitle">
              {user && isCitizen
                ? 'Select a category to file your report. Specialized teams handle each service area.'
                : 'Select a category to start a report. Guests will sign in first, then return here.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => (
              <CategoryCard key={cat.value} cat={cat} user={user} />
            ))}
          </div>
        </section>

        {/* Below-fold community imagery — not competing with hero */}
        <section aria-labelledby="community-heading">
          <div className="mb-6 max-w-2xl">
            <h2 id="community-heading" className="page-header text-2xl md:text-3xl">
              Our city in focus
            </h2>
            <p className="page-subtitle">Shared spaces we maintain together.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {GALLERY_IMAGES.map((src, i) => (
              <div key={src} className="rounded-2xl overflow-hidden aspect-square shadow-card">
                <img
                  src={src}
                  alt={`City highlight ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
