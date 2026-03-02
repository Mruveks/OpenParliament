import { getGroupColor } from '../utils/helpers';

interface GroupBadgeProps {
  group: string;
  size?: 'sm' | 'md' | 'lg';
  showFull?: boolean;
  fullName?: string;
}

export default function GroupBadge({ group, size = 'sm', showFull, fullName }: GroupBadgeProps) {
  const sizeClass = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium text-white ${sizeClass}`}
      style={{ backgroundColor: getGroupColor(group) }}
    >
      {group}
      {showFull && fullName && (
        <span className="font-normal opacity-80">- {fullName}</span>
      )}
    </span>
  );
}
