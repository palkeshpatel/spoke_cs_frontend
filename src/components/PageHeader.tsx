import { ArrowLeft, Pencil, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  actions?: React.ReactNode;
  middleContent?: React.ReactNode;
  /** When true, `actions` stay visible while editing (e.g. Print on measurement detail). */
  persistActions?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  backTo,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  actions,
  middleContent,
  persistActions = false,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3 min-w-0 shrink-0">
        {backTo && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-card transition-colors shrink-0 print:hidden"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-primary truncate">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </div>
      
      {middleContent && (
        <div className="flex-1 flex justify-center min-w-0">
          {middleContent}
        </div>
      )}

      <div className="flex items-center gap-2 shrink-0 print:hidden">
        {(persistActions || !isEditing) && actions}
        {isEditing ? (
          <>
            <Button variant="cancel" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={onSave}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
          </>
        ) : (
          onEdit && (
            <Button variant="default" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
          )
        )}
      </div>
    </div>
  );
}
