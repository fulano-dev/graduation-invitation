import React, { useState } from 'react';

const Wishes = ({ convidados = [] }) => {
  const convidadosMock = convidados;

  const [showModal, setShowModal] = useState(false);
  const [confirmados, setConfirmados] = useState([]);

  return (
    <div>
      {/* Existing content of the Wishes component */}

      <section className="max-w-3xl mx-auto mt-12 space-y-6">
        <h2 className="text-3xl font-['Alex_Brush'] text-center text-[#CFAA93]">Confirmar Presença</h2>
        <p className="text-sm text-center text-[#CFAA93] font-['TexGyreTermes']">
          Por favor, confirme sua presença até 30/07/2025
        </p>
        <p className="text-sm text-center text-[#CFAA93] font-['TexGyreTermes']">
          Marque a presença de todos que irão comparecer e desmarque os que não poderão ir.
        </p>

        <form className="bg-[#CFAA93]/10 p-6 rounded-2xl border border-[#CFAA93]/50 shadow-lg space-y-4" onSubmit={(e) => {
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
          setConfirmados(dados);
          setShowModal(true);
        }}>
          {convidadosMock.map((convidado, index) => (
            <div key={convidado.idConvidado} className="border border-[#CFAA93]/30 p-4 rounded-lg space-y-2 bg-white/5">
              <p className="text-[#CFAA93] font-semibold font-['TexGyreTermes']">{convidado.nome}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#CFAA93] font-['TexGyreTermes']">Confirmar presença</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name={`confirmado-${index}`} defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/20 border border-[#CFAA93]/40 peer-focus:outline-none rounded-full peer peer-checked:bg-[#CFAA93] peer-checked:border-[#CFAA93] transition-all duration-300"></div>
                  <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-all duration-300 peer-checked:translate-x-full"></div>
                </label>
              </div>

              {convidado.crianca === true && (
                <>
                  <p className="text-sm italic text-[#CFAA93] font-['TexGyreTermes']">O anfitrião marcou que este convidado é uma criança.</p>
                  <div>
                    <label className="block text-sm text-[#CFAA93] font-['TexGyreTermes']">Idade da criança em 30 de agosto de 2025:</label>
                    <input
                      type="number"
                      name={`idade-${index}`}
                      defaultValue=""
                      className="w-full px-4 py-2 rounded-xl bg-white/10 border border-[#CFAA93]/50 text-[#CFAA93] placeholder-[#CFAA93]/60 font-['TexGyreTermes']"
                    />
                  </div>
                </>
              )}
            </div>
          ))}

          <div className="space-y-4 pt-6 border-t border-[#CFAA93]/30">
            <div>
              <label className="block text-sm text-[#CFAA93] font-['TexGyreTermes']">Seu e-mail</label>
              <input
                type="email"
                placeholder="Digite seu e-mail"
                required
                className="w-full px-4 py-2 rounded-xl bg-white/10 border border-[#CFAA93]/50 text-[#CFAA93] placeholder-[#CFAA93]/60 font-['TexGyreTermes']"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#CFAA93] hover:bg-[#bfa67e] text-black font-['TexGyreTermes']"
            >
              Enviar confirmação
            </button>
          </div>
        </form>

        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full text-center space-y-4 text-[#CFAA93] font-['TexGyreTermes']">
              <h3 className="text-xl font-semibold">Você está confirmando a presença na recepção de:</h3>
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
                  className="px-4 py-2 bg-[#CFAA93] text-black rounded"
                  onClick={() => {
                    setShowModal(false);
                    alert('Presença confirmada!');
                  }}
                >
                  Sim
                </button>
                <button
                  className="px-4 py-2 border border-[#CFAA93] text-[#CFAA93] rounded"
                  onClick={() => setShowModal(false)}
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Wishes;
