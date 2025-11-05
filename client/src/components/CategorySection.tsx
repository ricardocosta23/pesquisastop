import { Card } from "@/components/ui/card";
import type { QuestionAnswer } from "@shared/schema";

interface CategorySectionProps {
  title: string;
  icon: React.ReactNode;
  questions: QuestionAnswer[];
  testIdPrefix: string;
}

export function CategorySection({ title, icon, questions, testIdPrefix }: CategorySectionProps) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b-4 border-primary/20">
        <div className="text-primary">
          {icon}
        </div>
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      </div>
      
      <Card className="p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {questions.map((qa, index) => (
            <div key={index} className="space-y-2" data-testid={`${testIdPrefix}-item-${index}`}>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {qa.question}
              </p>
              <p className="text-base font-medium text-foreground break-words" data-testid={`${testIdPrefix}-answer-${index}`}>
                {qa.answer || "Sem resposta"}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
