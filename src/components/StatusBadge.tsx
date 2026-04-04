const statusStyles: Record<string, string> = {
  confirmed: 'bg-foreground text-card',
  pending: 'bg-card text-foreground border border-border',
  completed: 'bg-success text-success-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
  'in-progress': 'bg-info/10 text-info',
  delivered: 'bg-success/10 text-success',
  paid: 'bg-foreground text-card',
  overdue: 'bg-destructive text-destructive-foreground',
  complete: 'bg-foreground text-card',
  incomplete: 'bg-card text-foreground border border-border',
};

const priorityStyles: Record<string, string> = {
  HIGH: 'text-destructive',
  NORMAL: 'text-primary',
  LOW: 'text-muted-foreground',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`text-xs font-bold ${priorityStyles[priority] || 'text-muted-foreground'}`}>
      {priority}
    </span>
  );
}
