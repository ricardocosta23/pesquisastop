
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import type { CategoryDistribution } from '@shared/schema';

interface CombinedRatingCardProps {
  category: CategoryDistribution;
  average: number | null;
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

export function CombinedRatingCard({ category, average }: CombinedRatingCardProps) {
  // Filter out ratings with 0 count for cleaner pie chart
  const pieData = category.distribution
    .filter(item => item.count > 0)
    .map((item) => ({
      name: `${item.rating}`,
      value: item.count,
      rating: item.rating,
      percentage: item.percentage,
    }));

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow flex flex-col">
      <h3 className="text-lg font-semibold text-center mb-2">{category.category}</h3>
      <p className="text-sm text-gray-600 text-center mb-4">
        {category.totalResponses} {category.totalResponses === 1 ? 'resposta' : 'respostas'}
      </p>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {/* Left Half - Average */}
        <div className="flex flex-col items-center justify-center border-r pr-4">
          <p className="text-xs text-gray-600 mb-2">Média</p>
          {average !== null ? (
            <div
              className="text-5xl font-bold"
              style={{ color: getAverageColor(average) }}
            >
              {average.toFixed(1)}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">N/A</div>
          )}
        </div>

        {/* Right Half - Pie Chart */}
        <div className="flex flex-col">
          <h4 className="text-xs font-medium mb-2 text-gray-600 text-center">Distribuição</h4>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={55}
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
            <div className="text-gray-400 text-xs h-[140px] flex items-center justify-center">
              Sem dados
            </div>
          )}
        </div>
      </div>

      {/* Color Legend */}
      {pieData.length > 0 && (
        <div className="mt-4 pt-3 border-t">
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
    </Card>
  );
}
