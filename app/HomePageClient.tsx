'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Fresh Professional Landing Page
 * Modern, attractive design with smooth interactions
 */
export default function HomePageClient() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let isCancelled = false
    async function checkAdminAuth() {
      try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store',
        })
        if (!isCancelled) {
          if (response.ok) {
            setIsAdmin(true)
          } else {
            setIsAdmin(false)
          }
        }
      } catch (error) {
        if (!isCancelled) {
          setIsAdmin(false)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }
    const timer = setTimeout(() => {
      checkAdminAuth()
    }, 100)
    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [])

  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (mounted && !isLoading) {
      if (isAdmin) {
        router.push('/admin')
      } else {
        router.push('/admin/login')
      }
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <nav className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900">Attendify</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/preview"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Attendance Form</span>
              </Link>
              <button
                onClick={handleAdminClick}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
                disabled={!mounted || isLoading}
              >
                {!mounted || isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{isAdmin ? 'Admin Dashboard' : 'Admin Login'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="text-center max-w-4xl mx-auto"
            style={{ 
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(1rem)',
              transition: 'opacity 0.6s ease, transform 0.6s ease'
            }}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4 leading-tight">
              PES Institute of Technology and Management
            </h1>
            <div className="w-16 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto mb-3 sm:mb-4"></div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-indigo-700 mb-8 sm:mb-10">
              Department of Computer Science and Design
            </h2>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/preview"
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Attendance Form</span>
              </Link>
              <button
                onClick={handleAdminClick}
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                disabled={!mounted || isLoading}
              >
                {!mounted || isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{isAdmin ? 'Admin Dashboard' : 'Admin Login'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Quick Access Cards */}
          <div className="max-w-6xl mx-auto mb-16 sm:mb-20">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Quick Access
              </h2>
              <p className="text-gray-600 text-lg">
                Choose your destination to get started
              </p>
            </div>

            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Attendance Form Card */}
              <Link
                href="/preview"
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden"
                style={{ 
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(1.5rem)',
                  transitionDelay: '200ms'
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full"></div>
                <div className="relative p-8 sm:p-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <svg className="w-5 h-5 text-blue-600 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    Attendance Form
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Create comprehensive day-wise attendance reports. Fill forms, preview documents, and generate professional print-ready reports.
                  </p>
                  <div className="flex items-center text-blue-600 font-semibold">
                    <span>Access Form</span>
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </Link>

              {/* Admin Dashboard Card */}
              <button
                onClick={handleAdminClick}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden text-left w-full"
                style={{ 
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(1.5rem)',
                  transitionDelay: '300ms'
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-full"></div>
                <div className="relative p-8 sm:p-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      {!mounted || isLoading ? (
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-5 h-5 text-indigo-600 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                    Admin Dashboard
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Comprehensive administrative panel for managing faculty, courses, semesters, and academic configurations.
                  </p>
                  <div className="flex items-center text-indigo-600 font-semibold">
                    {!mounted || isLoading ? (
                      <span>Checking access...</span>
                    ) : (
                      <>
                        <span>{isAdmin ? 'Open Dashboard' : 'Login to Admin'}</span>
                        <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div 
            className="max-w-6xl mx-auto"
            style={{ 
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(1rem)',
              transitionDelay: '400ms'
            }}
          >
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                System Features
              </h2>
              <p className="text-gray-600 text-lg">
                Everything you need for efficient attendance management
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  title: 'Intuitive Forms',
                  description: 'User-friendly interface designed for quick and accurate data entry',
                  bgClass: 'bg-blue-50 group-hover:bg-blue-100',
                },
                {
                  icon: (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  ),
                  title: 'Print Ready',
                  description: 'Generate professional A4 format documents optimized for printing',
                  bgClass: 'bg-green-50 group-hover:bg-green-100',
                },
                {
                  icon: (
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  ),
                  title: 'Cloud Database',
                  description: 'Secure cloud-based storage ensuring data safety and accessibility',
                  bgClass: 'bg-purple-50 group-hover:bg-purple-100',
                },
                {
                  icon: (
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ),
                  title: 'Real-time Reports',
                  description: 'Generate and view attendance reports instantly with accurate calculations',
                  bgClass: 'bg-orange-50 group-hover:bg-orange-100',
                },
                {
                  icon: (
                    <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ),
                  title: 'Secure Access',
                  description: 'Role-based authentication ensuring authorized access to sensitive data',
                  bgClass: 'bg-pink-50 group-hover:bg-pink-100',
                },
                {
                  icon: (
                    <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  title: 'Fast & Efficient',
                  description: 'Optimized performance for quick data processing and report generation',
                  bgClass: 'bg-teal-50 group-hover:bg-teal-100',
                },
              ].map((feature, index) => (
                <div
                  key={feature.title}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 group"
                  style={{ 
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateY(0)' : 'translateY(1rem)',
                    transitionDelay: `${500 + index * 50}ms`
                  }}
                >
                  <div className={`w-12 h-12 rounded-lg ${feature.bgClass} flex items-center justify-center mb-4 transition-colors`}>
                    {feature.icon}
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8 sm:py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="text-center"
            style={{ 
              opacity: mounted ? 1 : 0,
              transitionDelay: '600ms'
            }}
          >
            <p className="text-gray-600 text-sm sm:text-base mb-2">
              © 2025 PES Institute of Technology and Management, Shimoga
            </p>
            <p className="text-gray-500 text-sm">
              Department of Computer Science and Design
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
