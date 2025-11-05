import type { LongTextComment } from "@shared/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { MessageSquare } from "lucide-react";

interface LongTextCommentsSectionProps {
  comments: LongTextComment[];
}

export function LongTextCommentsSection({ comments }: LongTextCommentsSectionProps) {
  if (!comments || comments.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-16 space-y-6">
      <div className="flex items-center gap-3 pb-3 border-b-4 border-primary/20">
        <MessageSquare className="w-7 h-7 text-primary" />
        <h2 className="text-2xl font-semibold text-foreground">Comentários</h2>
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        {comments.map((comment, index) => (
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
            {index < comments.length - 1 && (
              <div className="my-4">
                <hr className="border-t border-border w-full" />
              </div>
            )}
          </div>
        ))}
      </Accordion>
    </div>
  );
}
