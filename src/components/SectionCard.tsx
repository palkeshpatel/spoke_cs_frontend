import { Pencil } from 'lucide-react';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
  className?: string;
  headerActions?: React.ReactNode;
}

export default function SectionCard({ title, children, onEdit, className = '', headerActions }: SectionCardProps) {
  return (
    <div className={`bg-card rounded-xl card-shadow p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-2">
          {headerActions}
          {onEdit && (
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
