import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, UtensilsCrossed, Building2, MapPin, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { FornecedorCard } from "@/components/FornecedorCard";

export type FornecedorType = "Restaurantes" | "Hotéis" | "DMC" | "Passeios";

interface FornecedorResult {
  name: string;
  location: string;
  country: string;
  averageRating: number;
  totalEvaluations: number;
  distribution?: { rating: number; count: number }[];
}

interface FornecedorResponse {
  type: FornecedorType;
  location: string;
  results: {
    country: string;
    suppliers: FornecedorResult[];
  }[];
}

export default function Fornecedores() {
  const [searchLocation, setSearchLocation] = useState("");
  const [fornecedorType, setFornecedorType] = useState<FornecedorType>("Restaurantes");
  const [activeSearch, setActiveSearch] = useState<{ location: string; type: FornecedorType } | null>(null);

  const { data: results, isLoading } = useQuery<FornecedorResponse>({
    queryKey: ["/api/fornecedores", activeSearch?.location, activeSearch?.type],
    queryFn: async () => {
      const response = await fetch(`/api/fornecedores?location=${encodeURIComponent(activeSearch!.location)}&type=${activeSearch!.type}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch suppliers");
      }
      return response.json();
    },
    enabled: activeSearch !== null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchLocation.trim()) {
      setActiveSearch({ location: searchLocation.trim(), type: fornecedorType });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-2xl mx-auto pt-16 pb-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 text-foreground">
            Consulta de Fornecedores
          </h1>
          <p className="text-muted-foreground text-lg">
            Busque fornecedores por palavras-chave (nome, localização e tipo)
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card rounded-xl border p-6 shadow-sm">
            <Label className="text-base font-semibold mb-4 block">
              Tipo de Fornecedor
            </Label>
            <RadioGroup
              value={fornecedorType}
              onValueChange={(value) => setFornecedorType(value as FornecedorType)}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="Restaurantes"
                  id="restaurantes"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="restaurantes"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[rgb(251,146,60)] peer-data-[state=checked]:bg-[rgb(251,146,60)] peer-data-[state=checked]:text-white cursor-pointer transition-all"
                >
                  <UtensilsCrossed className="mb-2 h-6 w-6" />
                  <span className="font-medium">Restaurantes</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="Hotéis"
                  id="hoteis"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="hoteis"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[rgb(59,130,246)] peer-data-[state=checked]:bg-[rgb(59,130,246)] peer-data-[state=checked]:text-white cursor-pointer transition-all"
                >
                  <Building2 className="mb-2 h-6 w-6" />
                  <span className="font-medium">Hotéis</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="DMC"
                  id="dmc"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="dmc"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[rgb(34,197,94)] peer-data-[state=checked]:bg-[rgb(34,197,94)] peer-data-[state=checked]:text-white cursor-pointer transition-all"
                >
                  <MapPin className="mb-2 h-6 w-6" />
                  <span className="font-medium">DMC</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="Passeios"
                  id="passeios"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="passeios"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[rgb(168,85,247)] peer-data-[state=checked]:bg-[rgb(168,85,247)] peer-data-[state=checked]:text-white cursor-pointer transition-all"
                >
                  <Compass className="mb-2 h-6 w-6" />
                  <span className="font-medium">Passeios</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Digite a cidade ou país"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="h-14 text-base px-6 rounded-lg shadow-sm"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-14 px-8 rounded-lg shadow-md"
              disabled={isLoading || !searchLocation.trim()}
            >
              <Search className="w-5 h-5 mr-2" />
              Procurar
            </Button>
          </div>
        </form>
      </div>

      {isLoading && <LoadingSkeleton />}

      {!isLoading && results && results.results.length > 0 && (
        <div className="w-full max-w-7xl mx-auto px-4 pb-16 space-y-8">
          {results.results.map((countryGroup) => (
            <div key={countryGroup.country} className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b-4 border-primary/20">
                <MapPin className="w-7 h-7 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">{countryGroup.country}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {countryGroup.suppliers.map((supplier, index) => (
                  <FornecedorCard
                    key={index}
                    name={supplier.name}
                    location={supplier.location}
                    averageRating={supplier.averageRating}
                    totalEvaluations={supplier.totalEvaluations}
                    distribution={supplier.distribution}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && results && results.results.length === 0 && (
        <div className="w-full max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
            <Search className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Nenhum resultado encontrado
          </h2>
          <p className="text-muted-foreground text-lg">
            Não encontramos fornecedores para essa localização
          </p>
        </div>
      )}

      {!isLoading && !results && !activeSearch && <EmptyState />}
    </div>
  );
}
