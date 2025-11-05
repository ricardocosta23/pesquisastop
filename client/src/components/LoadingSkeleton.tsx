import { Card } from "@/components/ui/card";

export function LoadingSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-16 space-y-12 animate-pulse">
      <Card className="p-8 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-8 bg-muted rounded w-48" />
          </div>
          <div className="space-y-3 md:border-l md:border-border md:pl-8">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-8 bg-muted rounded w-40" />
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <div className="h-10 bg-muted rounded w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6 rounded-lg">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-muted rounded-md" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-16" />
                    <div className="h-6 bg-muted rounded w-full" />
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="h-5 bg-muted rounded w-32" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-10 bg-muted rounded w-40" />
        <Card className="p-6 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-32" />
                <div className="h-5 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
