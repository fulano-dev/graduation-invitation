import { useEffect, useState } from 'react';
import { CheckCircle, Info } from 'lucide-react';
import Hero from '@/pages/Hero'
import Events from '@/pages/Events'
import Location from '@/pages/Location';
import Wishes from '@/pages/Wishes';

// Main Invitation Content
export default function MainContent({ convidados }) {
    const [mostrarModalConvite, setMostrarModalConvite] = useState(true);

    const confirmados = convidados?.some(c => c.status === 1 || c.status === 2);

    return (
        <>
            {mostrarModalConvite && convidados && convidados.length > 0 && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-[#0d2931] p-6 rounded-xl max-w-lg w-full text-center space-y-4 text-[#CFAA93] font-['TexGyreTermes'] shadow-lg">
                        {confirmados ? (
                            <>
                                <CheckCircle className="mx-auto w-10 h-10 text-green-500" />
                                <h3 className="text-xl font-semibold text-green-600">Confirmação recebida!</h3>
                                <p className="text-sm text-[#CFAA93]">Tudo certo! Você já confirmou presença para:</p>
                                <ul className="text-left text-sm list-disc list-inside">
                                    {convidados.map((c, i) => (
                                        <li key={i}>
                                            {c.nome || c.nomeConvidado || 'Convidado'} – {c.status === 1 ? 'Confirmado' : 'Não comparecerá'}
                                            {c.crianca && c.status !== 0 && c.idade ? ` (${c.idade} anos)` : ''}
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-sm">Se quiser editar, você pode usar o menu ou rolar até o final da página. Edições permitidas até 30/07/2025.</p>
                            </>
                        ) : (
                            <>
                                <Info className="mx-auto w-10 h-10 text-[#CFAA93]" />
                                <h3 className="text-xl font-semibold">Confirmação Pendente</h3>
                                <p className="text-sm">Confirme sua presença até 30/07/2025 clicando no botão <strong>Confirmar</strong> no menu ou rolando até o final da página.</p>
                            </>
                        )}
                        <button
                            className="mt-4 px-4 py-2 bg-[#CFAA93] text-black rounded-md hover:bg-[#bfa67e] transition"
                            onClick={() => setMostrarModalConvite(false)}
                        >
                            Entendi
                        </button>
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