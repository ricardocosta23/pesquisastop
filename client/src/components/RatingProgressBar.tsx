interface RatingProgressBarProps {
  rating: number | null;
  maxRating?: number;
}

export function RatingProgressBar({ rating, maxRating = 10 }: RatingProgressBarProps) {
  if (rating === null) {
    return (
      <div className="space-y-2">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-muted-foreground/20" style={{ width: "0%" }} />
        </div>
        <p className="text-xs text-muted-foreground text-right">Sem avaliação</p>
      </div>
    );
  }

  const percentage = Math.min((rating / maxRating) * 100, 100);
  
  const getRatingColor = (rating: number) => {
    if (rating === 0) return "bg-chart-4";
    if (rating >= 9) return "bg-chart-1";
    if (rating >= 7) return "bg-chart-2";
    if (rating >= 5) return "bg-chart-3";
    return "bg-chart-4";
  };

  const getRatingTextColor = (rating: number) => {
    if (rating === 0) return "text-chart-4";
    if (rating >= 9) return "text-chart-1";
    if (rating >= 7) return "text-chart-2";
    if (rating >= 5) return "text-chart-3";
    return "text-chart-4";
  };

  const colorClass = getRatingColor(rating);
  const textColorClass = getRatingTextColor(rating);

  return (
    <div className="space-y-2">
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className={`font-semibold ${textColorClass} text-right`}>
        <span className="text-3xl">{rating.toFixed(1)}</span>
        <span className="text-xs"> / {maxRating}</span>
      </p>
    </div>
  );
}
