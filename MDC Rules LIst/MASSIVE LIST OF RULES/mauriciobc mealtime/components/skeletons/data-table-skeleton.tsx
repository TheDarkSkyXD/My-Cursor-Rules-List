export function DataTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-card rounded-lg border shadow-sm animate-pulse">
            <div className="p-4 pb-2">
              <div className="h-5 w-32 bg-muted rounded"></div>
            </div>
            <div className="p-4 pt-0">
              <div className="h-8 w-16 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-card rounded-lg border shadow-sm animate-pulse">
        <div className="p-6">
          <div className="h-6 w-48 bg-muted rounded mb-2"></div>
          <div className="h-4 w-64 bg-muted rounded mb-8"></div>
          <div className="h-[300px] bg-muted/50 rounded"></div>
        </div>
      </div>
    </div>
  );
} 