import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { BRANDING, CAROUSEL_IMAGES, CATEGORIES, GALLERY_IMAGES } from '../constants'

export default function Home() {
  const { user, isAdmin, isStaff } = useAuth()
  const [carouselIndex, setCarouselIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((i) => (i + 1) % CAROUSEL_IMAGES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <section className="relative overflow-hidden rounded-2xl panel-accent mb-12">
          <div className="grid md:grid-cols-2 gap-0 items-center">
            <div className="p-8 md:p-12 text-center md:text-left">
              <img
                src={BRANDING.hero}
                alt="Smart city"
                className="w-16 h-16 mx-auto md:mx-0 mb-4 rounded-lg object-cover opacity-90"
              />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Smart City Management System
              </h1>
              <p className="text-muted text-lg mb-8">
                Report urban service issues and help improve your community.
              </p>
              {user ? (
                isAdmin ? (
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <Link to="/staff" className="btn-primary text-lg px-8 py-3">
                      Staff Dashboard
                    </Link>
                    <Link to="/complaints" className="btn-outline text-lg px-8 py-3">
                      File a Complaint
                    </Link>
                  </div>
                ) : (
                  <Link
                    to={isStaff ? '/staff' : '/complaints'}
                    className="btn-primary text-lg px-8 py-3"
                  >
                    {isStaff ? 'Go to Staff Dashboard' : 'File a Complaint'}
                  </Link>
                )
              ) : (
                <div className="flex gap-4 justify-center md:justify-start">
                  <Link to="/register" className="btn-primary text-lg px-8 py-3">Get Started</Link>
                  <Link to="/login" className="btn-outline text-lg px-8 py-3">Login</Link>
                </div>
              )}
            </div>
            <div className="relative h-56 md:h-80 bg-slate-900">
              <img
                src={CAROUSEL_IMAGES[carouselIndex]}
                alt={`Urban services highlight ${carouselIndex + 1}`}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {CAROUSEL_IMAGES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => setCarouselIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i === carouselIndex
                        ? 'bg-indigo-400'
                        : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">Service Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => (
              <div key={cat.value} className="card flex flex-col items-center text-center gap-3">
                <img src={cat.image} alt={cat.label} className="w-full h-24 rounded-lg object-cover" />
                <span className="text-sm font-medium">{cat.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-center mb-6">Community Highlights</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {GALLERY_IMAGES.map((src, i) => (
              <div key={src} className="rounded-xl overflow-hidden panel-accent aspect-square">
                <img
                  src={src}
                  alt={`Community highlight ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
