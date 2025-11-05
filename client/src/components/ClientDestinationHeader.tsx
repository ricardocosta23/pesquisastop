import { Card } from "@/components/ui/card";
import { MapPin, User, Calendar } from "lucide-react";

interface ClientDestinationHeaderProps {
  cliente: string;
  destino: string;
  dataViagem?: string | null;
}

export function ClientDestinationHeader({ cliente, destino, dataViagem }: ClientDestinationHeaderProps) {
  return (
    <Card className="p-8 rounded-xl mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            <User className="w-4 h-4" />
            <span>Cliente</span>
          </div>
          <p className="text-2xl font-semibold text-foreground" data-testid="text-cliente">
            {cliente}
          </p>
        </div>
        
        <div className="space-y-2 md:border-l md:border-border md:pl-8">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            <MapPin className="w-4 h-4" />
            <span>Destino</span>
          </div>
          <p className="text-2xl font-semibold text-foreground" data-testid="text-destino">
            {destino}
          </p>
        </div>

        {dataViagem && (
          <div className="space-y-2 md:border-l md:border-border md:pl-8">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              <Calendar className="w-4 h-4" />
              <span>Data da Viagem</span>
            </div>
            <p className="text-2xl font-semibold text-foreground" data-testid="text-data-viagem">
              {dataViagem}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
