import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Bir şeyler ters gitti</h2>
            <p className="mt-2 text-sm text-gray-500">
              Uygulamada beklenmedik bir hata oluştu. Lütfen sayfayı yenileyin veya tekrar deneyin.
            </p>
            {this.state.error?.message && (
              <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-gray-50 p-3 text-left text-xs text-gray-600">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Sayfayı Yenile
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
