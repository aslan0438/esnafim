import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function AuthButton({ children, loading, className, ...props }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
