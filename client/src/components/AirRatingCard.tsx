
import { Card } from "@/components/ui/card";
import { RatingProgressBar } from "./RatingProgressBar";

interface AirRatingCardProps {
  question: string;
  answer: string;
  icon: React.ReactNode;
  index: number;
}

export function AirRatingCard({ question, answer, icon, index }: AirRatingCardProps) {
  const rating = parseFloat(answer);
  const validRating = isNaN(rating) ? null : rating;

  return (
    <Card className="p-4 rounded-lg hover-elevate transition-all duration-200" data-testid={`card-air-${index}`}>
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <div className="text-primary mt-0.5">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-medium text-foreground break-words" data-testid={`text-air-name-${index}`}>
              {question}
            </h4>
          </div>
        </div>
        
        <RatingProgressBar rating={validRating} />
      </div>
    </Card>
  );
}
