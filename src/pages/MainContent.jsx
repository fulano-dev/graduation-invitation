import { useEffect, useState } from 'react';
import { CheckCircle, Info, Volume2 } from 'lucide-react';
import Hero from '@/pages/Hero'
import Events from '@/pages/Events'
import Location from '@/pages/Location';
import Wishes from '@/pages/Wishes';
import CountdownTimer from '@/components/CountdownTimer';

// Main Invitation Content
export default function MainContent({ convidados }) {
    const [mostrarModalConvite, setMostrarModalConvite] = useState(true);

    const confirmados = convidados?.some(c => c.status === 1 || c.status === 2);

    const hoje = new Date();
    const inicioConfirmacao = new Date("2025-06-15T00:00:00");
    const fimConfirmacao = new Date("2025-07-30T23:59:59");
    const dentroDoPrazo = hoje >= inicioConfirmacao && hoje <= fimConfirmacao;

    return (
        <>
            {mostrarModalConvite && convidados && convidados.length > 0 && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-[#0d2931] p-6 rounded-xl max-w-lg w-full text-center space-y-4 text-[#F2B21C] font-['TexGyreTermes'] shadow-lg">
                  {hoje < inicioConfirmacao && (
                    <>
                      <Volume2 className="mx-auto w-10 h-10 text-[#F2B21C]" />
                      <h3 className="text-xl font-semibold">Aumenta o Som!</h3>
                      <p className="text-sm">Aumente o som para entrar na experiência do convite virtual.</p>
                      <p className="text-sm mt-2 italic text-[#F2B21C]/80">
                        Gostou do kit-convite? Tá liberado postar! 📸 
                      </p>
                      <p className="text-sm mt-2 italic text-[#F2B21C]/80">Se quiser compartilhar, marque <strong>@joaovargas.jpg</strong> ao postar nos stories! 😉</p>
                     
                      <p className="text-sm mt-2">
                        Volte aqui de <strong>{inicioConfirmacao.toLocaleDateString('pt-BR')}</strong> à <strong>{fimConfirmacao.toLocaleDateString('pt-BR')}</strong> para confirmar sua presença.
                      </p>
                      <div className="mt-4">
                        <CountdownTimer targetDate={inicioConfirmacao} message="Você poderá confirmar sua presença em:" />
                      </div>
                    </>
                  )}

                  {hoje >= inicioConfirmacao && hoje <= fimConfirmacao && !confirmados && (
                    <>
                      <Info className="mx-auto w-10 h-10 text-[#F2B21C]" />
                      <h3 className="text-xl font-semibold">Confirmação Pendente</h3>
                      <p className="text-sm">
                        Você ainda não confirmou sua presença. Clique em <strong>Confirmar</strong> no menu ou role até o final da página para confirmar.
                      </p>
                      <p className="text-sm">Você tem até <strong>{fimConfirmacao.toLocaleDateString('pt-BR')}</strong> para confirmar.</p>
                      <div className="mt-4">
                        <CountdownTimer targetDate={fimConfirmacao} message="O período de confirmação se encerra em" />
                      </div>
                    </>
                  )}

                  {hoje >= inicioConfirmacao && hoje <= fimConfirmacao && confirmados && (
                    <>
                      <CheckCircle className="mx-auto w-10 h-10 text-green-500" />
                      <h3 className="text-xl font-semibold text-green-600">Confirmação recebida!</h3>
                      <p className="text-sm text-[#F2B21C]">Você confirmou presença para:</p>
                      <ul className="text-left text-sm list-disc list-inside">
                        {convidados.map((c, i) => (
                          <li key={i}>
                            {c.nome || c.nomeConvidado || 'Convidado'} – {c.status === 1 ? 'Confirmado' : 'Não comparecerá'}
                            {c.crianca && c.status !== 0 && c.idade ? ` (${c.idade} anos)` : ''}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm">Você pode editar até <strong>{fimConfirmacao.toLocaleDateString('pt-BR')}</strong>.</p>
                      <div className="mt-4">
                        <CountdownTimer targetDate={fimConfirmacao} message="O período para edição se encerra em" />
                      </div>
                    </>
                  )}

                  {hoje > fimConfirmacao && confirmados && (
                    <>
                      <CheckCircle className="mx-auto w-10 h-10 text-green-500" />
                      <h3 className="text-xl font-semibold text-green-600">Confirmação encerrada</h3>
                      <p className="text-sm text-[#F2B21C]">Você confirmou presença para:</p>
                      <ul className="text-left text-sm list-disc list-inside">
                        {convidados.map((c, i) => (
                          <li key={i}>
                            {c.nome || c.nomeConvidado || 'Convidado'} – {c.status === 1 ? 'Confirmado' : 'Não comparecerá'}
                            {c.crianca && c.status !== 0 && c.idade ? ` (${c.idade} anos)` : ''}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-yellow-400">O prazo para edições se encerrou. Se houver algum imprevisto, entre em contato.</p>
                    </>
                  )}

                  {hoje > fimConfirmacao && !confirmados && (
                    <>
                      <Info className="mx-auto w-10 h-10 text-red-600" />
                      <h3 className="text-xl font-semibold text-red-500">Período encerrado</h3>
                      <p className="text-sm">
                        O prazo para confirmar presença foi encerrado em {fimConfirmacao.toLocaleDateString('pt-BR')}, e infelizmente não identificamos sua confirmação.
                      </p>
                      <p className="text-sm mt-2">
                        Por questões de organização, o acesso ao convite não está mais disponível. Caso tenha ocorrido algum imprevisto, entre em contato com o João para mais informações. 
                      </p>
                    </>
                  )}

                  {hoje > fimConfirmacao && !confirmados ? (
                    <button
                      className="mt-4 px-4 py-2 bg-[#F2B21C] text-black rounded-md hover:bg-[#bfa67e] transition"
                      onClick={() => window.location.href = window.location.origin}
                    >
                      Voltar ao início
                    </button>
                  ) : (
                    <button
                      className="mt-4 px-4 py-2 bg-[#F2B21C] text-black rounded-md hover:bg-[#bfa67e] transition"
                      onClick={() => setMostrarModalConvite(false)}
                    >
                      Entendi
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Conteúdo principal */}
            <Hero convidados={convidados} />
            <Events />
            <Location />
            <Wishes convidados={convidados} />
        </>
    )
}