import { cn } from '../../lib/utils'

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant/30 bg-gradient-to-br from-surface-container-low/50 to-surface py-16 text-center',
        className
      )}
    >
      {Icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-surface-container to-surface shadow-sm ring-1 ring-outline-variant/10">
          <Icon className="h-8 w-8 text-outline" />
        </div>
      )}
      <p className="mt-5 text-base font-semibold text-on-surface">{title}</p>
      {description && <p className="mt-2 max-w-xs text-sm text-on-surface-variant leading-relaxed">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-primary-container transition-all active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
