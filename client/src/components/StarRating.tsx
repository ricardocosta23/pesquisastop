import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number | null;
  maxStars?: number;
}

export function StarRating({ rating, maxStars = 5 }: StarRatingProps) {
  if (rating === null || rating === 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {Array.from({ length: maxStars }).map((_, i) => (
            <Star key={i} className="w-5 h-5 text-muted stroke-muted" />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">Sem avaliação</span>
      </div>
    );
  }

  const normalizedRating = Math.min(Math.max(rating / 2, 0), maxStars);
  const fullStars = Math.floor(normalizedRating);
  const hasHalfStar = normalizedRating % 1 >= 0.5;

  const getRatingColor = (rating: number) => {
    if (rating >= 9) return "text-chart-1 fill-chart-1";
    if (rating >= 7) return "text-chart-2 fill-chart-2";
    if (rating >= 5) return "text-chart-3 fill-chart-3";
    return "text-chart-4 fill-chart-4";
  };

  const colorClass = getRatingColor(rating);

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: maxStars }).map((_, i) => {
          const isFilled = i < fullStars;
          const isHalf = i === fullStars && hasHalfStar;
          
          return (
            <Star
              key={i}
              className={`w-5 h-5 ${
                isFilled || isHalf ? colorClass : "text-muted stroke-muted"
              }`}
            />
          );
        })}
      </div>
      <span className={`text-base font-semibold ${colorClass.split(' ')[0]}`}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}
