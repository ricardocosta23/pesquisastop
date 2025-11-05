import { CombinedRatingCard } from "./CombinedRatingCard";
import type { RatingDistribution } from "@shared/schema";
import type { TripEvaluation } from "@shared/schema";
import { Plane, UtensilsCrossed, Building2, FileText, Compass, MapPin, MessageSquare } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

interface RatingDistributionSectionProps {
  distribution: RatingDistribution;
  evaluation: TripEvaluation | null;
}

const getCategoryAverage = (category: CategoryDistribution): number | null => {
  // Calculate average from the distribution data
  if (category.totalResponses === 0) return null;
  
  let totalScore = 0;
  let totalCount = 0;
  
  for (const item of category.distribution) {
    totalScore += item.rating * item.count;
    totalCount += item.count;
  }
  
  return totalCount > 0 ? totalScore / totalCount : null;
};

const getCategoryDisplayName = (categoryName: string, evaluation: TripEvaluation | null): string => {
  // Category names are already coming from Monday.com with proper names
  return categoryName;
};

const getCategoryIcon = (categoryName: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      'Geral': <MapPin className="w-7 h-7 text-primary" />,
      'Aéreo': <Plane className="w-7 h-7 text-primary" />,
      'Hospedagem': <Building2 className="w-7 h-7 text-primary" />,
      'Alimentação': <UtensilsCrossed className="w-7 h-7 text-primary" />,
      'Passeios': <Compass className="w-7 h-7 text-primary" />,
      'Comentários': <MessageSquare className="w-7 h-7 text-primary" />,
    };
    return iconMap[categoryName] || <FileText className="w-7 h-7 text-primary" />;
  };

export function RatingDistributionSection({ distribution, evaluation }: RatingDistributionSectionProps) {
  if (!distribution || distribution.categories.length === 0) {
    return null;
  }

  const categories = distribution.categories.map(category => ({
    ...category,
    category: getCategoryDisplayName(category.category, evaluation),
    originalCategory: category.category
  }));

  // Group categories by type
  const groupedCategories: Record<string, typeof categories> = {
    'Geral': [],
    'Aéreo': [],
    'Hospedagem': [],
    'Alimentação': [],
    'Passeios': []
  };

  // Check if category is a hotel, passeio, or restaurante by checking if it exists in evaluation
  categories.forEach(category => {
    const isHotel = evaluation?.hotels?.some(h => h.name === category.category);
    const isPasseio = evaluation?.passeios?.some(p => p.name === category.category);
    const isRestaurante = evaluation?.alimentacao?.restaurantes?.some(r => r.name === category.category);
    const lowerCategory = category.originalCategory.toLowerCase();

    if (isHotel) {
      groupedCategories['Hospedagem'].push(category);
    } else if (isPasseio) {
      groupedCategories['Passeios'].push(category);
    } else if (isRestaurante || lowerCategory.includes('alimentação')) {
      groupedCategories['Alimentação'].push(category);
    } else if (
      lowerCategory.includes('malha') ||
      lowerCategory.includes('aérea') ||
      lowerCategory.includes('assentos') ||
      lowerCategory.includes('assistência aeroporto') ||
      lowerCategory.includes('tempo conexão')
    ) {
      groupedCategories['Aéreo'].push(category);
    } else {
      groupedCategories['Geral'].push(category);
    }
  });

  const orderedGroupNames = [
    'Geral',
    'Aéreo',
    'Hospedagem',
    'Alimentação',
    'Passeios'
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-16 space-y-12">
      <h2 className="text-3xl font-bold text-center">Avaliação Detalhada</h2>

      {orderedGroupNames.map((groupName) => {
        const groupCategories = groupedCategories[groupName];
        if (!groupCategories || groupCategories.length === 0) return null;

        return (
          <div key={groupName} className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-4 border-primary/20">
              {getCategoryIcon(groupName)}
              <h2 className="text-2xl font-semibold text-foreground">{groupName}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupCategories.map((category) => (
                <CombinedRatingCard
                  key={category.category}
                  category={category}
                  average={getCategoryAverage(category)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {evaluation && evaluation.longTextComments && evaluation.longTextComments.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b-4 border-primary/20">
            {getCategoryIcon('Comentários')}
            <h2 className="text-2xl font-semibold text-foreground">Comentários</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {evaluation.longTextComments.map((comment, index) => (
              <div key={index}>
                <AccordionItem value={`item-${index}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <span className="font-medium">{comment.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-2 pb-4 text-muted-foreground">
                      {comment.content.split('\n').map((line, lineIndex) => (
                        <div key={lineIndex}>
                          {line.startsWith('— ') ? (
                            <span className="italic text-muted-foreground/80">{line}</span>
                          ) : (
                            <span>{line}</span>
                          )}
                        </div>
                      ))}
                      {comment.author && (
                        <div className="mt-2 text-[11px] italic text-muted-foreground/70">
                          — {comment.author}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {index < evaluation.longTextComments.length - 1 && (
                  <div className="my-4">
                    <hr className="border-t border-border w-full" />
                  </div>
                )}
              </div>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
}