import { Search } from "lucide-react";

export function EmptyState() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
        <Search className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold text-foreground mb-3">
        Busque uma avaliação
      </h2>
      <p className="text-muted-foreground text-lg">
        Digite um ID no campo acima para visualizar os detalhes da avaliação
      </p>
    </div>
  );
}
