import { InboxIcon } from 'lucide-react';

/**
 * EmptyState — shown when a list has no items.
 * Accepts a custom icon, title, description, and optional action button.
 */
const EmptyState = ({
  icon: Icon = InboxIcon,
  title = 'Nothing here yet',
  description = '',
  action = null,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-500" />
      </div>
      <h3 className="text-slate-300 font-semibold text-base mb-1">{title}</h3>
      {description && (
        <p className="text-slate-500 text-sm max-w-xs mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
