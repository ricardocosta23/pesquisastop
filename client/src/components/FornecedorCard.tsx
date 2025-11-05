
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface FornecedorCardProps {
  name: string;
  location: string;
  averageRating: number;
  totalEvaluations: number;
  distribution?: { rating: number; count: number }[];
}

const getRatingColor = (rating: number): string => {
  if (rating === 10) return '#166534'; // dark green
  if (rating === 9) return '#22c55e';  // lighter green
  if (rating === 8) return '#ca8a04';  // darker yellow
  if (rating === 7) return '#facc15';  // lighter yellow
  return '#dc2626'; // red for 6 and below
};

const getAverageColor = (avg: number): string => {
  if (avg >= 9.5) return '#166534'; // dark green
  if (avg >= 8.5) return '#22c55e'; // lighter green
  if (avg >= 7.5) return '#eab308'; // yellow
  if (avg >= 6.5) return '#f97316'; // orange
  return '#dc2626'; // red
};

export function FornecedorCard({ name, location, averageRating, totalEvaluations, distribution }: FornecedorCardProps) {
  const percentage = Math.min((averageRating / 10) * 100, 100);
  const avgColor = getAverageColor(averageRating);

  // Prepare pie chart data
  const pieData = distribution && distribution.length > 0
    ? distribution
        .filter(item => item.count > 0)
        .map((item) => ({
          name: `${item.rating}`,
          value: item.count,
          rating: item.rating,
          percentage: (item.count / totalEvaluations) * 100,
        }))
    : [];

  return (
    <Card className="p-6 rounded-lg hover:shadow-lg transition-all duration-200">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground">{location}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Left Half - Rating Bar */}
          <div className="flex flex-col justify-center">
            <h4 className="text-xs font-medium mb-2 text-gray-600">Média</h4>
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%`, backgroundColor: avgColor }}
                />
              </div>
              <p className="font-semibold text-right" style={{ color: avgColor }}>
                <span className="text-2xl">{averageRating.toFixed(1)}</span>
                <span className="text-xs"> / 10</span>
              </p>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {totalEvaluations} {totalEvaluations === 1 ? 'avaliação' : 'avaliações'}
            </p>
          </div>

          {/* Right Half - Pie Chart */}
          <div className="flex flex-col">
            <h4 className="text-xs font-medium mb-2 text-gray-600 text-center">Distribuição</h4>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={45}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getRatingColor(entry.rating)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name: string, props: any) => [
                      `${value} ${value === 1 ? 'avaliação' : 'avaliações'} (${props.payload.percentage.toFixed(1)}%)`,
                      `Nota ${props.payload.name}`
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-xs h-[120px] flex items-center justify-center">
                Sem dados
              </div>
            )}
          </div>
        </div>

        {/* Color Legend */}
        {pieData.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center items-center">
              {pieData.map((item) => (
                <div key={item.rating} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getRatingColor(item.rating) }}
                  />
                  <span className="text-xs text-gray-700">
                    Nota {item.name}: {item.percentage.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
