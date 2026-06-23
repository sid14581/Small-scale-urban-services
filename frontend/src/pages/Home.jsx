import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { BRANDING, CAROUSEL_IMAGES, CATEGORIES, GALLERY_IMAGES } from '../constants'

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
  const className = `category-card ${borderClass} flex flex-col items-center text-center gap-3 p-5`

  if (!user) {
    return (
      <Link to="/login" state={{ from: submitUrl }} className={className}>
        <img
          src={cat.image}
          alt={cat.label}
          className="w-full h-24 rounded-xl object-cover ring-2 ring-slate-200/80 dark:ring-slate-700"
        />
        <span className="text-sm font-semibold text-slate-800 dark:text-white">{cat.label}</span>
        <span className="text-xs text-primary font-medium">File complaint →</span>
      </Link>
    )
  }

  return (
    <Link to={submitUrl} className={className}>
      <img
        src={cat.image}
        alt={cat.label}
        className="w-full h-24 rounded-xl object-cover ring-2 ring-slate-200/80 dark:ring-slate-700"
      />
      <span className="text-sm font-semibold text-slate-800 dark:text-white">{cat.label}</span>
      <span className="text-xs text-primary font-medium">File complaint →</span>
    </Link>
  )
}

export default function Home() {
  const { user, isAdmin, isStaff, isCitizen } = useAuth()
  const [carouselIndex, setCarouselIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((i) => (i + 1) % CAROUSEL_IMAGES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const scrollToCategories = () => {
    document.getElementById('service-categories')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <section className="relative overflow-hidden rounded-3xl hero-gradient border border-surface-variant dark:border-slate-700 mb-12 shadow-card">
          <div className="grid md:grid-cols-[2fr_3fr] gap-0 items-stretch">
            <div className="p-6 md:p-8 flex flex-col justify-center text-center md:text-left">
              <span className="inline-flex self-center md:self-start items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary dark:text-primary-light mb-3">
                Civic Urban Services
              </span>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
                Report urban service issues
              </h1>
              <p className="text-muted text-base md:text-lg mb-6 max-w-sm mx-auto md:mx-0">
                Help improve your community. File complaints, track progress, and share feedback with city staff.
              </p>
              {user ? (
                isAdmin || isStaff ? (
                  <Link to="/staff" className="btn-primary text-base px-8 self-center md:self-start">
                    Staff Dashboard
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={scrollToCategories}
                    className="text-link text-base self-center md:self-start"
                  >
                    Choose a category below ↓
                  </button>
                )
              ) : (
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Link to="/register" className="btn-primary text-base px-8">Get Started</Link>
                  <Link to="/login" className="btn-outline text-base px-8">Login</Link>
                </div>
              )}
            </div>
            <div className="relative min-h-[14rem] md:min-h-[22rem] lg:min-h-[26rem] bg-surface-elevated dark:bg-slate-800">
              <img
                src={CAROUSEL_IMAGES[carouselIndex]}
                alt={`Urban services highlight ${carouselIndex + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent md:bg-gradient-to-l md:from-slate-900/30" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {CAROUSEL_IMAGES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => setCarouselIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === carouselIndex
                        ? 'bg-primary scale-125'
                        : 'bg-white/60 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="service-categories" className="mb-12 scroll-mt-24">
          <div className="text-center mb-8">
            <h2 className="page-header text-2xl md:text-3xl">Service Categories</h2>
            <p className="page-subtitle mx-auto">
              {user && isCitizen
                ? 'Tap a category to file your complaint.'
                : 'Choose a category when filing your complaint.'}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => (
              <CategoryCard key={cat.value} cat={cat} user={user} />
            ))}
          </div>
        </section>

        <section>
          <div className="text-center mb-8">
            <h2 className="page-header text-2xl md:text-3xl">Community Highlights</h2>
            <p className="page-subtitle mx-auto">Building smarter, more responsive cities together.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {GALLERY_IMAGES.map((src, i) => (
              <div key={src} className="rounded-2xl overflow-hidden panel-accent aspect-square shadow-card hover:shadow-card-hover transition-shadow">
                <img
                  src={src}
                  alt={`Community highlight ${i + 1}`}
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
