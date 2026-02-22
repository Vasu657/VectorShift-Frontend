// draggableNode.js — Color-aware draggable node tile with dark mode
const COLOR_MAP = {
  indigo: 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-600 group-hover:text-white',
  purple: 'bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 group-hover:bg-purple-600 dark:group-hover:bg-purple-600 group-hover:text-white',
  green: 'bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-300 group-hover:bg-green-600 dark:group-hover:bg-green-600 group-hover:text-white',
  amber: 'bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 group-hover:bg-amber-600 dark:group-hover:bg-amber-600 group-hover:text-white',
  rose: 'bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 group-hover:bg-rose-600 dark:group-hover:bg-rose-600 group-hover:text-white',
  cyan: 'bg-cyan-50 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-300 group-hover:bg-cyan-600 dark:group-hover:bg-cyan-600 group-hover:text-white',
};

export const DraggableNode = ({ type, label, icon: Icon, color = 'indigo' }) => {
  const iconCls = COLOR_MAP[color] || COLOR_MAP.indigo;

  const onDragStart = (event, nodeType) => {
    event.target.style.cursor = 'grabbing';
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="draggable-node flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 transition-all duration-200 cursor-grab active:cursor-grabbing group"
      onDragStart={(e) => onDragStart(e, type)}
      onDragEnd={(e) => (e.target.style.cursor = 'grab')}
      draggable
      role="button"
      tabIndex={0}
      aria-label={`Add ${label} node`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Keyboard users can use Ctrl+K command palette instead
        }
      }}
    >
      <div className={`flex items-center justify-center p-2 rounded-lg transition-colors duration-200 ${iconCls}`}>
        {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
      </div>
      <span className="font-medium text-slate-700 dark:text-slate-200 text-sm tracking-wide group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-200">
        {label}
      </span>
    </div>
  );
};