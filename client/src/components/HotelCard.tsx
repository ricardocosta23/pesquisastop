
import { Card } from "@/components/ui/card";
import { RatingProgressBar } from "./RatingProgressBar";
import { Hotel as HotelIcon } from "lucide-react";

interface HotelCardProps {
  name: string;
  rating: number | null;
  index: number;
}

export function HotelCard({ name, rating, index }: HotelCardProps) {
  if (!name && (rating === null || rating === 0)) {
    return null;
  }

  return (
    <Card className="p-4 rounded-lg hover-elevate transition-all duration-200" data-testid={`card-hotel-${index}`}>
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <div className="text-primary mt-0.5">
            <HotelIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-medium text-foreground break-words" data-testid={`text-hotel-name-${index}`}>
              {name || "Sem nome"}
            </h4>
          </div>
        </div>
        
        <RatingProgressBar rating={rating} />
      </div>
    </Card>
  );
}
