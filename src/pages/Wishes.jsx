import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import config from '@/config/config';

const Wishes = ({ convidados = [] }) => {
  const convidadosMock = convidados;

  const [showModal, setShowModal] = useState(false);
  const [confirmados, setConfirmados] = useState([]);
  const [erroEnvio, setErroEnvio] = useState("");
  const [envioFinalizado, setEnvioFinalizado] = useState(false);
  const [formPayload, setFormPayload] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [statusTemp, setStatusTemp] = useState(
    convidadosMock.map(c => (c.status === 0 ? 1 : c.status))
  );

  const hoje = new Date();
  const inicioConfirmacao = new Date("2025-06-15T00:00:00");
  const fimConfirmacao = new Date("2025-07-30T23:59:59");
  const dentroDoPrazo = hoje >= inicioConfirmacao && hoje <= fimConfirmacao;

  // Bloqueio por recusa há mais de 3 dias (por convidado)
  const bloqueiosPorRecusa = useMemo(() => {
    const resultado = {};
    convidadosMock.forEach(c => {
      if (c.status !== 2 || !c.dataRecusa) {
        resultado[c.idConvidado] = false;
        return;
      }
      const dataRecusa = new Date(c.dataRecusa);
      const tresDiasDepois = new Date(dataRecusa);
      tresDiasDepois.setDate(tresDiasDepois.getDate() + 3);
      resultado[c.idConvidado] = hoje > tresDiasDepois;
    });
    return resultado;
  }, [convidadosMock]);
  
  const CountdownTimer = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    function calculateTimeLeft() {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                dias: Math.floor(difference / (1000 * 60 * 60 * 24)),
                horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutos: Math.floor((difference / 1000 / 60) % 60),
                segundos: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    }
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            {Object.keys(timeLeft).map((interval) => (
                <div
                    key={interval}
                    className="flex flex-col items-center p-3 bg-[#F2B21D] rounded-xl border border-[#F2B21D] transition-all duration-500"
                >
                    <span className="text-xl sm:text-2xl font-['TexGyreTermes'] font-bold text-black">
                        {timeLeft[interval]}
                    </span>
                    <span className="text-xs text-black capitalize font-['TexGyreTermes']">{interval}</span>
                </div>
            ))}
        </div>
    );
};

  const enviarConfirmacao = () => {
    if (!formPayload) return;
    setCarregando(true);
    console.log(formPayload)
    fetch(`${import.meta.env.VITE_URL_API}/api/confirmarPresenca`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formPayload)
    })
    .then(res => res.json())
    .then((response) => {
      if (!response || response.erro) {
        setErroEnvio("Ocorreu um erro ao confirmar sua presença. Por favor, tente novamente mais tarde ou entre em contato com João.");
        setShowModal(false);
        setCarregando(false);
        return;
      }
      setShowModal(false);
      setEnvioFinalizado(true);
      setCarregando(false);
      
      // Atualiza os dados dos convidados com o que foi confirmado
      formPayload.convidados.forEach(({ idConvidado, status, idade }) => {
        const index = convidadosMock.findIndex(c => c.idConvidado === idConvidado);
        if (index !== -1) {
          convidadosMock[index].status = status;
          convidadosMock[index].idade = idade;
        }
      });
    })
    .catch(err => {
      console.error("Erro ao confirmar presença:", err);
      setErroEnvio("Ocorreu um erro ao confirmar sua presença. Por favor, tente novamente mais tarde ou entre em contato com João.");
      setShowModal(false);
      setCarregando(false);
    });
  };

  return (
    <div>
      {/* Existing content of the Wishes component */}

      <section id="confirmar" className="max-w-3xl mx-auto mt-12 space-y-6">
        {hoje < inicioConfirmacao ? (
          <div className="bg-[#0f3e57] text-[#F2B21C] font-['TexGyreTermes'] text-center p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-2">Confirmação de Presença</h2>
            <p className="text-sm">
              A confirmação de presença estará disponível de <strong>{inicioConfirmacao.toLocaleDateString('pt-BR')}</strong> até <strong>{fimConfirmacao.toLocaleDateString('pt-BR')}</strong>.
            </p>
            <p className="text-sm mt-2">
              Fique tranquilo, ainda não é possível confirmar. Mas não esqueça de voltar aqui durante o período de confirmação para confirmar!
            </p>
            <CountdownTimer targetDate={inicioConfirmacao} message="Faltam:" />
          </div>
        ) : dentroDoPrazo ? (
          <>
            <h2 className="text-3xl font-['Alex_Brush'] text-center text-[#F2B21C]">Confirmar Presença</h2>
            <p className="text-sm text-center text-[#F2B21C] font-['TexGyreTermes']">
              Por favor, confirme sua presença até 30/07/2025
            </p>
            <p className="text-sm text-center text-[#F2B21C] font-['TexGyreTermes']">
              Marque a presença de todos que irão comparecer e desmarque os que não poderão ir.
            </p>
     
            {convidadosMock.some(c => c.status === 1 || c.status === 2) && (
              <div className="bg-green-600 text-black p-4 rounded-xl text-center font-['TexGyreTermes']">
                Tudo certo, você já confirmou presença. Se quiser, pode editar o formulário abaixo.
              </div>
            )}

            <form className="bg-[#F2B21C]/10 p-6 rounded-2xl border border-[#F2B21C]/50 shadow-lg space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.target);
              const dados = convidadosMock.map((convidado, i) => {
                const idadeInput = form.get(`idade-${i}`);
                const idade = convidado.crianca === true && idadeInput && parseInt(idadeInput) > 0 ? parseInt(idadeInput) : null;
                return {
                  ...convidado,
                  confirmado: form.get(`confirmado-${i}`) === 'on',
                  idade: idade
                };
              });
              const email = form.get("email");

              setFormPayload({
                codigoConvite: convidadosMock[0]?.codigoConvite,
                emailConfirmacao: email,
                convidados: dados.map(p => ({
                  idConvidado: p.idConvidado,
                  nome: p.nome,
                  status: p.confirmado ? 1 : 2,
                  idade: p.idade,
                  crianca: p.crianca
                }))
              });
              setConfirmados(dados);
              setShowModal(true);
            }}>
            {convidadosMock.map((convidado, index) => (
              <div key={convidado.idConvidado} className="border border-[#F2B21C]/30 p-4 rounded-lg space-y-2 bg-white/5">
                <p className="text-[#F2B21C] font-semibold font-['TexGyreTermes']">{convidado.nome}</p>
                <div className="flex items-center gap-2">
                  {convidado.status === 1 ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-500 font-bold">Confirmado</span>
                    </>
                  ) : convidado.status === 2 ? (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-500 font-bold">Não comparecerá</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                      <span className="text-yellow-500 font-bold">Pendente</span>
                    </>
                  )}
                </div>
                {/* Data-limite para alterar recusa */}
                {!bloqueiosPorRecusa[convidado.idConvidado] && convidado.status === 2 && convidado.dataRecusa && (
                  <p className="text-yellow-300 text-sm italic">
                    Você recusou o convite. Por questões de organização, você tem apenas 3 dias (até {new Date(new Date(convidado.dataRecusa).setDate(new Date(convidado.dataRecusa).getDate() + 3)).toLocaleDateString('pt-BR')}) para reverter sua resposta.
                  </p>
                )}
                {bloqueiosPorRecusa[convidado.idConvidado] ? (
                  <p className="text-red-400 text-sm italic">Este convidado recusou há mais de 3 dias. Alterações estão bloqueadas.</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#F2B21C] font-['TexGyreTermes']">Confirmar presença</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name={`confirmado-${index}`}
                          checked={statusTemp[index] === 1}
                          onChange={(e) => {
                            const newStatus = e.target.checked ? 1 : 2;
                            setStatusTemp(prev => {
                              const updated = [...prev];
                              updated[index] = newStatus;
                              return updated;
                            });
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/20 border border-[#F2B21C]/40 peer-focus:outline-none rounded-full peer peer-checked:bg-[#F2B21C] peer-checked:border-[#F2B21C] transition-all duration-300"></div>
                        <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-all duration-300 peer-checked:translate-x-full"></div>
                      </label>
                    </div>

                    {convidado.crianca === true && (
                      <>
                        <p className="text-sm italic text-[#F2B21C] font-['TexGyreTermes'] mt-2">O anfitrião marcou que este convidado é uma criança.</p>
                        <div className="flex justify-between items-start mt-2">
                          <label className="text-sm text-[#F2B21C] font-['TexGyreTermes'] mt-1">Idade da criança em 30/08/2025:</label>
                          <input
                            type="number"
                            name={`idade-${index}`}
                            defaultValue={convidado.status !== 0 && convidado.idade ? convidado.idade : ""}
                            required
                            className="w-20 px-3 py-1.5 rounded-xl bg-white/10 border border-[#F2B21C]/50 text-[#F2B21C] placeholder-[#F2B21C]/60 font-['TexGyreTermes']"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2 pt-2">
                      {statusTemp[index] !== convidadosMock[index].status && (
                        statusTemp[index] === 1 ? (
                          <p className="text-green-500 text-sm font-['TexGyreTermes']">
                            Você está confirmando presença. Clique em {convidadosMock.some(c => c.status === 1 || c.status === 2) ? "editar" : "enviar"} para salvar.
                          </p>
                        ) : (
                          <p className="text-red-500 text-sm font-['TexGyreTermes']">
                            Você está informando que não comparecerá. Clique em {convidadosMock.some(c => c.status === 1 || c.status === 2) ? "editar" : "enviar"} para salvar.
                          </p>
                        )
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}

              <div className="space-y-4 pt-6 border-t border-[#F2B21C]/30">
                <div>
                  <label className="block text-sm text-[#F2B21C] font-['TexGyreTermes']">Seu e-mail</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Digite seu e-mail"
                    required
                    className="w-full px-4 py-2 rounded-xl bg-white/10 border border-[#F2B21C]/50 text-[#F2B21C] placeholder-[#F2B21C]/60 font-['TexGyreTermes']"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#F2B21C] hover:bg-[#bfa67e] text-black font-['TexGyreTermes']"
                >
                  {convidadosMock.some(c => c.status === 1 || c.status === 2) ? "Editar" : "Enviar confirmação"}
                </button>
              </div>
            </form>

            {showModal && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-[#0f3e57] p-6 rounded-lg max-w-md w-full text-center space-y-4 text-[#F2B21C] font-['TexGyreTermes']">
                  <h3 className="text-xl font-semibold">
                    {convidadosMock.some(c => c.status === 1 || c.status === 2)
                      ? "Você está editando sua confirmação de presença:"
                      : "Você está confirmando a presença na recepção de:"}
                  </h3>
                  <ul className="space-y-1 text-sm text-left">
                    {confirmados.map(p =>
                      p.confirmado ? (
                        <li key={p.idConvidado}>
                          {p.nome}, {p.crianca ? (p.idade > 0 ? `Criança, ${p.idade} anos.` : 'Criança.') : 'Adulto.'}
                        </li>
                      ) : (
                        <li key={p.idConvidado}>
                          Você está informando que {p.nome} não irá comparecer.
                        </li>
                      )
                    )}
                  </ul>
                  <div className="flex justify-center gap-4 pt-4">
                    <button
                      className="px-4 py-2 bg-[#F2B21C] text-black rounded flex items-center justify-center gap-2"
                      onClick={enviarConfirmacao}
                      disabled={carregando}
                    >
                      {carregando ? (
                        <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                      ) : (
                        "Sim"
                      )}
                    </button>
                    <button
                      className="px-4 py-2 border border-[#F2B21C] text-[#F2B21C] rounded"
                      onClick={() => setShowModal(false)}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {erroEnvio && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-[#0f3e57] p-6 rounded-lg max-w-md w-full text-center space-y-4 text-[#F2B21C] font-['TexGyreTermes']">
                  <h3 className="text-xl font-semibold text-red-500">Erro</h3>
                  <p className="text-sm text-[#F2B21C]">{erroEnvio}</p>
                  <button
                    className="px-4 py-2 border border-[#F2B21C] text-[#F2B21C] rounded"
                    onClick={() => setErroEnvio("")}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
            
            {envioFinalizado && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-[#0f3e57] p-6 rounded-lg max-w-md w-full text-center space-y-4 text-[#F2B21C] font-['TexGyreTermes']">
                  <h3 className="text-xl font-semibold">Confirmação registrada!</h3>
                  <p className="text-sm">
                    Agradecemos por confirmar sua presença. Esperamos por você na formatura! 📩
                    Você receberá um e-mail de confirmação em instantes — verifique sua caixa de entrada.
                  </p>
                  <button
                    className="px-4 py-2 bg-[#F2B21C] text-black rounded"
                    onClick={() => setEnvioFinalizado(false)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </>
        ) : convidadosMock.some(c => bloqueiosPorRecusa[c.idConvidado]) ? (
          <div className="bg-[#0f3e57] text-[#F2B21C] font-['TexGyreTermes'] text-center p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-2">Confirmação de Presença</h2>
            <p className="text-sm mb-4">
              Você informou que não poderá comparecer, e o prazo de 3 dias para reverter a decisão já passou.
            </p>
            <p className="text-sm text-[#F2B21C] mt-4">
              Em caso de mudança de planos, entre em contato diretamente com o João.
            </p>
          </div>
        ) : (
          <div className="bg-[#0f3e57] text-[#F2B21C] font-['TexGyreTermes'] text-center p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-2">Confirmação de Presença</h2>
            <p className="text-sm mb-4">
              O prazo para confirmar ou editar a presença se encerrou em <strong>{fimConfirmacao.toLocaleDateString('pt-BR')}</strong>. As informações estão bloqueadas para alterações.
            </p>
            {convidadosMock.map((convidado, index) => (
              <div key={convidado.idConvidado} className="border border-[#F2B21C]/30 p-4 rounded-lg space-y-2 bg-white/5 mb-4 text-left">
                <p className="text-[#F2B21C] font-semibold font-['TexGyreTermes']">{convidado.nome}</p>
                <div className="flex items-center gap-2">
                  {convidado.status === 1 ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-500 font-bold">Confirmado</span>
                    </>
                  ) : convidado.status === 2 ? (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-500 font-bold">Não comparecerá</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                      <span className="text-yellow-500 font-bold">Pendente</span>
                    </>
                  )}
                </div>
                {convidado.crianca && convidado.idade && (
                  <div className="text-sm text-[#F2B21C]">
                    Idade informada: {convidado.idade} anos
                  </div>
                )}
              </div>
            ))}
            <p className="text-sm text-[#F2B21C] mt-4">
              Em caso de imprevisto, pedimos que entre em contato imediatamente com o João.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Wishes;
