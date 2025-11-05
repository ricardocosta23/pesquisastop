import type { TripEvaluation } from "@shared/schema";
import { ClientDestinationHeader } from "./ClientDestinationHeader";
import { HotelCard } from "./HotelCard";
import { NamedRatingCard } from "./NamedRatingCard";
import { CategorySection } from "./CategorySection";
import { Plane, UtensilsCrossed, Building2, FileText, Compass, MapPin } from "lucide-react";

import { AirRatingCard } from "./AirRatingCard";



interface EvaluationResultsProps {
  evaluation: TripEvaluation;
}

export function EvaluationResults({ evaluation }: EvaluationResultsProps) {
  const hasHotels = evaluation.hotels.some(h => h.name || (h.rating && h.rating > 0));
  const hasPasseios = evaluation.passeios.some(p => p.name || (p.rating && p.rating > 0));
  const hasRestaurantes = evaluation.alimentacao.restaurantes.some(r => r.name || (r.rating && r.rating > 0));

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-16 space-y-12">
      <ClientDestinationHeader
        cliente={evaluation.cliente}
        destino={evaluation.destino}
      />

      {evaluation.malhaAerea.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b-4 border-primary/20">
            <Plane className="w-7 h-7 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Malha Aérea</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {evaluation.malhaAerea.map((qa, index) => (
              <AirRatingCard
                key={index}
                question={qa.question}
                answer={qa.answer}
                icon={<Plane className="w-5 h-5" />}
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      

      {(evaluation.topAntesViagem !== null) ||
       (evaluation.viagemGeral !== null) ||
       (evaluation.indicariaTop !== null) ||
       (evaluation.assentos !== null) ||
       (evaluation.malhaAerea2 !== null) ||
       (evaluation.assistenciaAeroporto !== null) ||
       (evaluation.tempoConexao !== null) ||
       (evaluation.dmc1 !== null) ||
       (evaluation.dmc2 !== null) ||
       (evaluation.guiasLocais !== null) ||
       (evaluation.transfer !== null) ||
       (evaluation.materialCriacao !== null) ||
       (evaluation.experienciaTop !== null) ||
       (evaluation.qualidadeProposta !== null) ||
       (evaluation.materiaisComunicacao !== null) ||
       (evaluation.gerenteContas !== null) ||
       (evaluation.atendimentoCorporativo !== null) ||
       (evaluation.rsvp !== null) ||
       (evaluation.equipeCampo !== null) ||
       (evaluation.viagemGeralCorporativo !== null) ||
       (evaluation.servicosTecnologia !== null) ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b-4 border-primary/20">
            <MapPin className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Avaliações Gerais</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {evaluation.topAntesViagem !== null && (
              <AirRatingCard
                question="Top antes viagem"
                answer={evaluation.topAntesViagem.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={0}
              />
            )}
            {evaluation.viagemGeral !== null && (
              <AirRatingCard
                question="Viagem em geral"
                answer={evaluation.viagemGeral.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={1}
              />
            )}
            {evaluation.indicariaTop !== null && (
              <AirRatingCard
                question="Indicaria a Top?"
                answer={evaluation.indicariaTop.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={2}
              />
            )}
            {evaluation.assentos !== null && (
              <AirRatingCard
                question="Assentos"
                answer={evaluation.assentos.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={3}
              />
            )}
            {evaluation.malhaAerea2 !== null && (
              <AirRatingCard
                question="Malha Aérea"
                answer={evaluation.malhaAerea2.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={4}
              />
            )}
            {evaluation.assistenciaAeroporto !== null && (
              <AirRatingCard
                question="Assistência aeroporto"
                answer={evaluation.assistenciaAeroporto.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={5}
              />
            )}
            {evaluation.tempoConexao !== null && (
              <AirRatingCard
                question="Tempo conexão"
                answer={evaluation.tempoConexao.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={6}
              />
            )}
            {evaluation.dmc1 !== null && (
              <AirRatingCard
                question="DMC 1"
                answer={evaluation.dmc1.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={7}
              />
            )}
            {evaluation.dmc2 !== null && (
              <AirRatingCard
                question="DMC 2"
                answer={evaluation.dmc2.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={8}
              />
            )}
            {evaluation.guiasLocais !== null && (
              <AirRatingCard
                question="Guias locais"
                answer={evaluation.guiasLocais.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={9}
              />
            )}
            {evaluation.transfer !== null && (
              <AirRatingCard
                question="Transfer"
                answer={evaluation.transfer.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={10}
              />
            )}
            {evaluation.materialCriacao !== null && (
              <AirRatingCard
                question="Material Criação"
                answer={evaluation.materialCriacao.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={11}
              />
            )}
            {evaluation.experienciaTop !== null && (
              <AirRatingCard
                question="Experiência com a Top"
                answer={evaluation.experienciaTop.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={12}
              />
            )}
            {evaluation.qualidadeProposta !== null && (
              <AirRatingCard
                question="Qualidade e Criatividade da Proposta"
                answer={evaluation.qualidadeProposta.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={13}
              />
            )}
            {evaluation.materiaisComunicacao !== null && (
              <AirRatingCard
                question="Materiais Comunicação"
                answer={evaluation.materiaisComunicacao.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={14}
              />
            )}
            {evaluation.gerenteContas !== null && (
              <AirRatingCard
                question="Gerente de contas"
                answer={evaluation.gerenteContas.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={15}
              />
            )}
            {evaluation.atendimentoCorporativo !== null && (
              <AirRatingCard
                question="Atendimento Corporativo"
                answer={evaluation.atendimentoCorporativo.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={16}
              />
            )}
            {evaluation.rsvp !== null && (
              <AirRatingCard
                question="RSVP"
                answer={evaluation.rsvp.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={17}
              />
            )}
            {evaluation.equipeCampo !== null && (
              <AirRatingCard
                question="Equipe de campo"
                answer={evaluation.equipeCampo.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={18}
              />
            )}
            {evaluation.viagemGeralCorporativo !== null && (
              <AirRatingCard
                question="Viagem em geral"
                answer={evaluation.viagemGeralCorporativo.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={19}
              />
            )}
            {evaluation.servicosTecnologia !== null && (
              <AirRatingCard
                question="Serviços de tecnologia"
                answer={evaluation.servicosTecnologia.toString()}
                icon={<MapPin className="w-5 h-5" />}
                index={20}
              />
            )}
          </div>
        </div>
      ) : null}

      {hasHotels && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b-4 border-primary/20">
            <Building2 className="w-7 h-7 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Hotéis</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {evaluation.hotels.map((hotel, index) => (
              <HotelCard
                key={index}
                name={hotel.name}
                rating={hotel.rating}
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      {(hasRestaurantes || (evaluation.alimentacao.alimentacaoGeral !== null)) && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b-4 border-primary/20">
            <UtensilsCrossed className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Alimentação</h2>
          </div>
          {evaluation.alimentacao.alimentacaoGeral !== null && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AirRatingCard
                question="Alimentação Geral"
                answer={evaluation.alimentacao.alimentacaoGeral.toString()}
                icon={<UtensilsCrossed className="w-5 h-5" />}
                index={0}
              />
            </div>
          )}
          {hasRestaurantes && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {evaluation.alimentacao.restaurantes.map((restaurante, index) => (
                <NamedRatingCard
                  key={index}
                  name={restaurante.name}
                  rating={restaurante.rating}
                  icon={<UtensilsCrossed className="w-5 h-5" />}
                  index={index}
                  testIdPrefix="restaurante"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {hasPasseios && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b-4 border-primary/20">
            <Compass className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Passeios</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evaluation.passeios.map((passeio, index) => (
              <NamedRatingCard
                key={index}
                name={passeio.name}
                rating={passeio.rating}
                icon={<Compass className="w-5 h-5" />}
                index={index}
                testIdPrefix="passeio"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}