import { Card } from "@/components/ui/card";
import { RatingProgressBar } from "./RatingProgressBar";

interface NamedRatingCardProps {
  name: string;
  rating: number | null;
  icon: React.ReactNode;
  index: number;
  testIdPrefix: string;
}

export function NamedRatingCard({ name, rating, icon, index, testIdPrefix }: NamedRatingCardProps) {
  if (!name && (rating === null || rating === 0)) {
    return null;
  }

  return (
    <Card className="p-4 rounded-lg hover-elevate transition-all duration-200" data-testid={`${testIdPrefix}-${index}`}>
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <div className="text-primary mt-0.5">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-medium text-foreground break-words" data-testid={`text-${testIdPrefix}-name-${index}`}>
              {name || `Sem nome`}
            </h4>
          </div>
        </div>
        
        <RatingProgressBar rating={rating} />
      </div>
    </Card>
  );
}
