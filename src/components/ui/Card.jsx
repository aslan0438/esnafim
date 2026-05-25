import { cn } from '../../lib/utils'

export function Card({ children, className, hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-gray-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_1px_2px_-1px_rgb(0_0_0/0.04)]',
        hover && 'transition-all duration-200 hover:shadow-[0_10px_15px_-3px_rgb(0_0_0/0.05),0_4px_6px_-4px_rgb(0_0_0/0.05)] hover:-translate-y-0.5 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }) {
  return <div className={cn('mb-4 flex items-center justify-between', className)}>{children}</div>
}

export function CardTitle({ children, className }) {
  return <h3 className={cn('text-base font-semibold text-gray-900', className)}>{children}</h3>
}

export function CardDescription({ children, className }) {
  return <p className={cn('text-sm text-gray-500', className)}>{children}</p>
}

export function CardContent({ children, className }) {
  return <div className={cn('', className)}>{children}</div>
}
