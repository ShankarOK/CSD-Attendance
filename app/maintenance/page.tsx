'use client'

/**
 * Maintenance Mode Page
 * Displayed when MAINTENANCE_MODE=true
 */
export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-12 border border-gray-200">
          {/* Maintenance Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-12 h-12 text-yellow-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            🚧 Under Development
          </h1>

          {/* Message */}
          <p className="text-lg sm:text-xl text-gray-600 mb-6">
            We're currently performing maintenance and improvements to serve you better.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Expected downtime:</strong> We'll be back shortly. Thank you for your patience!
            </p>
          </div>

          {/* Institution Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              PES Institute of Technology and Management, Shimoga
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Department of Computer Science and Design
            </p>
          </div>

          {/* Refresh Button */}
          <div className="mt-8">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
