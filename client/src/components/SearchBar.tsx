import { useState } from "react";
import { Search, Users, Briefcase, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type TripType = "Guias" | "Convidados" | "Corporativo";

interface SearchBarProps {
  onSearch: (searchId: string, tripType: TripType) => void;
  isLoading: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [searchId, setSearchId] = useState("");
  const [tripType, setTripType] = useState<TripType>("Guias");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      onSearch(searchId.trim(), tripType);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto pt-16 pb-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3 text-foreground">
          Avaliações de Viagens
        </h1>
        <p className="text-muted-foreground text-lg">
          Busque e visualize feedbacks detalhados de clientes
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <Label className="text-base font-semibold mb-4 block">
            Tipo de Avaliação
          </Label>
          <RadioGroup
            value={tripType}
            onValueChange={(value) => setTripType(value as TripType)}
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem
                value="Guias"
                id="guias"
                className="peer sr-only"
              />
              <Label
                htmlFor="guias"
                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[rgb(10,230,167)] peer-data-[state=checked]:bg-[rgb(10,230,167)] peer-data-[state=checked]:text-white cursor-pointer transition-all"
              >
                <MapPin className="mb-2 h-6 w-6" />
                <span className="font-medium">Guias</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem
                value="Convidados"
                id="convidados"
                className="peer sr-only"
              />
              <Label
                htmlFor="convidados"
                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[rgb(176,69,227)] peer-data-[state=checked]:bg-[rgb(176,69,227)] peer-data-[state=checked]:text-white cursor-pointer transition-all"
              >
                <Users className="mb-2 h-6 w-6" />
                <span className="font-medium">Convidados</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem
                value="Corporativo"
                id="corporativo"
                className="peer sr-only"
              />
              <Label
                htmlFor="corporativo"
                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[rgb(111,148,245)] peer-data-[state=checked]:bg-[rgb(111,148,245)] peer-data-[state=checked]:text-white cursor-pointer transition-all"
              >
                <Briefcase className="mb-2 h-6 w-6" />
                <span className="font-medium">Corporativo</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Digite o ID da avaliação"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="h-14 text-base px-6 rounded-lg shadow-sm"
              disabled={isLoading}
              data-testid="input-search-id"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-14 px-8 rounded-lg shadow-md bg-[#0f172a] hover:bg-[#1e293b] text-white border-[#0f172a]"
            disabled={isLoading || !searchId.trim()}
            data-testid="button-search"
          >
            <Search className="w-5 h-5 mr-2" />
            Procurar
          </Button>
        </div>
      </form>
    </div>
  );
}
