import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-16">
      <Card className="p-8 rounded-xl border-destructive/20">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Erro ao buscar avaliação
            </h2>
            <p className="text-muted-foreground">
              {message || "Não foi possível encontrar a avaliação. Verifique o ID e tente novamente."}
            </p>
          </div>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" data-testid="button-retry">
              Tentar novamente
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
