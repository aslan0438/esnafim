import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Modal({ isOpen, onClose, title, children, className, size = 'md' }) {
  const modalRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => {
        window.scrollTo(0, 0)
        if (modalRef.current) {
          modalRef.current.scrollTop = 0
        }
      }, 0)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className={cn(
          'bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6',
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-outline-variant/10 pb-4">
            <h3 id="modal-title" className="text-lg font-semibold text-on-surface">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Kapat"
              className="rounded-lg p-1.5 text-outline transition-all hover:bg-surface-container hover:text-on-surface hover:shadow-sm"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className={cn(title && 'mt-4')}>{children}</div>
      </div>
    </div>
  )
}
