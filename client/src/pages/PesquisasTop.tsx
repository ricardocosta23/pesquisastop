import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { RatingDistributionSection } from "@/components/RatingDistributionSection";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { ClientDestinationHeader } from "@/components/ClientDestinationHeader";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import type { TripEvaluation, RatingDistribution } from "@shared/schema";

export default function PesquisasTop() {
  const [searchId, setSearchId] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const { data: evaluation, isLoading, error, refetch } = useQuery<TripEvaluation>({
    queryKey: ["/api/pesquisas-top/evaluation", activeKey],
    queryFn: async () => {
      const response = await fetch(`/api/pesquisas-top/evaluation/${activeKey}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch evaluation");
      }
      return response.json();
    },
    enabled: activeKey !== null,
  });

  const { data: distribution, isLoading: isLoadingDistribution } = useQuery<RatingDistribution>({
    queryKey: ["/api/pesquisas-top/distribution", activeKey],
    queryFn: async () => {
      const response = await fetch(`/api/pesquisas-top/distribution/${activeKey}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch distribution");
      }
      return response.json();
    },
    enabled: activeKey !== null,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.length === 5) {
      setActiveKey(searchId);
    }
  };

  const handleRetry = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="w-full max-w-2xl mx-auto pt-16 pb-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 text-foreground">
            Pesquisas TOP
          </h1>
          <p className="text-muted-foreground text-lg">
            Digite a chave de 5 dígitos para visualizar os resultados
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col items-center gap-6">
          <InputOTP
            maxLength={5}
            value={searchId}
            onChange={(value) => setSearchId(value)}
            disabled={isLoading}
          >
            <InputOTPGroup className="gap-2">
              <InputOTPSlot index={0} className="w-12 h-14 text-2xl font-bold rounded-lg border-2" />
              <InputOTPSlot index={1} className="w-12 h-14 text-2xl font-bold rounded-lg border-2" />
              <InputOTPSlot index={2} className="w-12 h-14 text-2xl font-bold rounded-lg border-2" />
              <InputOTPSlot index={3} className="w-12 h-14 text-2xl font-bold rounded-lg border-2" />
              <InputOTPSlot index={4} className="w-12 h-14 text-2xl font-bold rounded-lg border-2" />
            </InputOTPGroup>
          </InputOTP>

          <Button
            type="submit"
            size="lg"
            className="h-14 px-8 rounded-lg shadow-md bg-[#0f172a] hover:bg-[#1e293b] text-white border-[#0f172a]"
            disabled={isLoading || searchId.length !== 5}
          >
            <Search className="w-5 h-5 mr-2" />
            Procurar
          </Button>
        </form>
      </div>

      {isLoading && <LoadingSkeleton />}

      {error && !isLoading && (
        <ErrorState 
          message={(error as Error).message}
          onRetry={handleRetry}
        />
      )}

      {!isLoading && !error && evaluation && !isLoadingDistribution && distribution && (
        <div className="w-full max-w-7xl mx-auto px-4 pb-12">
          <ClientDestinationHeader 
            cliente={evaluation.cliente} 
            destino={evaluation.destino}
            dataViagem={evaluation.dataViagem}
          />
          <RatingDistributionSection distribution={distribution} evaluation={evaluation} />
        </div>
      )}
    </div>
  );
}