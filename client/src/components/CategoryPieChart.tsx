import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import type { CategoryDistribution } from '@shared/schema';

interface CategoryPieChartProps {
  category: CategoryDistribution;
}

const getRatingColor = (rating: number): string => {
  if (rating === 10) return '#166534'; // dark green
  if (rating === 9) return '#22c55e';  // lighter green
  if (rating === 8) return '#ca8a04';  // darker yellow
  if (rating === 7) return '#facc15';  // lighter yellow
  return '#dc2626'; // red for 6 and below
};

export function CategoryPieChart({ category }: CategoryPieChartProps) {
  const data = category.distribution.map((item) => ({
    name: `Nota ${item.rating}`,
    value: item.percentage,
    count: item.count,
    rating: item.rating,
  }));

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-center mb-2">{category.category}</h3>
      <p className="text-sm text-gray-600 text-center mb-4">
        {category.totalResponses} {category.totalResponses === 1 ? 'resposta' : 'respostas'}
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getRatingColor(entry.rating)} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, _name: string, props: any) => [
              `${value}% (${props.payload.count} ${props.payload.count === 1 ? 'avaliação' : 'avaliações'})`,
              props.payload.name
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
