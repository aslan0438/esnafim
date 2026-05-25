import { cn } from '../../lib/utils'

const variants = {
  default: 'bg-gray-100 text-gray-700 ring-gray-600/20',
  primary: 'bg-primary/10 text-primary ring-primary/20',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/20',
}

export function Badge({ children, variant = 'default', className, dot }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', {
            'bg-gray-500': variant === 'default',
            'bg-primary': variant === 'primary',
            'bg-emerald-500': variant === 'success',
            'bg-amber-500': variant === 'warning',
            'bg-red-500': variant === 'danger',
            'bg-sky-500': variant === 'info',
          })}
        />
      )}
      {children}
    </span>
  )
}
