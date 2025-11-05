import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { TripEvaluation, RatingDistribution } from "@shared/schema";
import { SearchBar, type TripType } from "@/components/SearchBar";
import { RatingDistributionSection } from "@/components/RatingDistributionSection";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LongTextCommentsSection } from "@/components/LongTextCommentsSection";
import { ClientDestinationHeader } from "@/components/ClientDestinationHeader";

export default function Home() {
  const [searchId, setSearchId] = useState<string | null>(null);
  const [tripType, setTripType] = useState<TripType>("Guias");

  const { data: evaluation, isLoading, error, refetch } = useQuery<TripEvaluation>({
    queryKey: ["/api/evaluation", searchId, tripType],
    queryFn: async () => {
      const response = await fetch(`/api/evaluation/${searchId}?type=${tripType}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch evaluation");
      }
      return response.json();
    },
    enabled: searchId !== null,
  });

  const { data: distribution, isLoading: isLoadingDistribution } = useQuery<RatingDistribution>({
    queryKey: ["/api/rating-distribution", searchId, tripType],
    queryFn: async () => {
      const response = await fetch(`/api/rating-distribution/${searchId}?type=${tripType}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch distribution");
      }
      return response.json();
    },
    enabled: searchId !== null,
  });

  const handleSearch = (id: string, type: TripType) => {
    setSearchId(id);
    setTripType(type);
  };

  const handleRetry = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      <SearchBar onSearch={handleSearch} isLoading={isLoading} />

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

      {!isLoading && !error && !evaluation && searchId === null && (
        <EmptyState />
      )}
    </div>
  );
}