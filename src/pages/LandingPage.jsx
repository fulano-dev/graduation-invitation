import logoPuc from '@/photos/logo-puc.png';
import backgroundImg from '@/photos/foto-background.jpeg';
import config from '@/config/config';
import { useState } from 'react';
import { formatEventDate } from '@/lib/formatEventDate';
import { motion } from 'framer-motion';
import InputMask from 'react-input-mask';
const API_URL = import.meta.env.VITE_URL_API;

const LandingPage = ({ onOpenInvitation, setConvidados }) => {
  const [code, setCode] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phone, setPhone] = useState('');
  const [foundCode, setFoundCode] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [familias, setFamilias] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGuest, setNewGuest] = useState({ nome: '', telefone: '', codigoConvite: '', crianca: false });

  const atualizarStatus = async (idConvidado, novoStatus) => {
    try {
      const endpoint =
        novoStatus === 1
          ? "/api/confirmarConvidado"
          : novoStatus === 2
          ? "/api/recusarConvidado"
          : "/api/pendenteConvidado";

      await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idConvidado }),
      });

      setFamilias((prev) =>
        prev.map((familia) => ({
          ...familia,
          convidados: familia.convidados.map((convidado) =>
            convidado.idConvidado === idConvidado
              ? { ...convidado, status: novoStatus }
              : convidado
          ),
        }))
      );
    } catch (err) {
      alert("Erro ao atualizar o status.");
    }
  };

  const handleEnter = async () => {
    if (code.length === 4) {
      try {
        const response = await fetch(`${API_URL}/api/buscaConvite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigoConvite: code })
        });

        const data = await response.json();

        if (code === 'JOAO' || code === "LIST") {
          const senha = prompt("Digite a senha para acessar:");
          if (senha !== "lobo") {
            alert("Senha incorreta.");
            return;
          }

          if (code === 'JOAO') {
            setShowImportModal(true);
            return;
          } else if (code === "LIST") {
            const res = await fetch(`${API_URL}/api/listarConvidadosPorFamilia`);
            const data = await res.json();
            if (res.ok && typeof data === 'object') {
              const familiasConvertidas = Object.entries(data).map(([codigoConvite, convidados]) => ({
                codigoConvite,
                convidados,
              }));
              setFamilias(familiasConvertidas);
            }
            setShowListModal(true);
            return;
          }
        } else if (response.ok && data.convidados && data.convidados.length > 0 && data.codigoValido !== false) {
          setConvidados(data.convidados);
          onOpenInvitation();
        } else {
          setModalMessage('Não encontramos convidado com esse código. Tente usar os 4 últimos números do telefone de algum dos convidados da sua família ou usar a opção "Buscar código do convite pelo telefone". Se não conseguir, entre em contato com o João.');
          setShowModal(true);
        }
      } catch (error) {
        console.error('Erro ao validar código:', error);
        alert('Erro ao validar o código. Tente novamente mais tarde.');
      }
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen relative overflow-hidden flex flex-col justify-between h-screen"
      >
        {import.meta.env.VITE_AMBIENTE === 'HML' && (
          <div className="bg-red-600 text-white text-center py-2 font-semibold uppercase tracking-wide z-50 relative">
            AMBIENTE DE HOMOLOGAÇÃO
          </div>
        )}
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-[#0047AB]/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-yellow-400/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

        {/* Main Content */}
        <div className="relative z-10 h-screen flex flex-col items-center justify-between px-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-3xl h-screen card-auto-height"
          >
            {/* Card Container */}
            <div
              className="relative overflow-hidden w-full h-full p-0 sm:p-8 md:p-10 sm:rounded-2xl sm:border border-yellow-100/50 shadow-xl text-[#CFAA93]"
              style={{
                marginTop: '2vh',
                height: '90vh',
                width: 'auto',
              }}
            >
              <div className="relative z-10 h-full">
                {/* Top Decorative Line */}
                <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
                  <div className="h-px w-12 sm:w-16 bg-[#CFAA93]/50" />
                  <div className="w-2 h-2 rounded-full bg-[#CFAA93]" />
                  <div className="h-px w-12 sm:w-16 bg-[#CFAA93]/50" />
                </div>

                {/* Foto e Campo de Código */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col justify-between h-full px-2 pt-6 pb-6 sm:pt-8 sm:pb-12"
                >
                  <div className="mt-2 mb-4 text-center sm:mb-6 space-y-3">
                    <div className="flex justify-center">
                      <img src={logoPuc} alt="Logo PUC" className="h-24 sm:h-28 md:h-32 object-contain" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-['Alex_Brush'] text-[#CFAA93]">
                      João Pedro Vargas da Silva
                    </h1>
                    <p className="text-sm sm:text-base font-['TexGyreTermes'] text-[#CFAA93]">
                      E SUA FAMÍLIA SENTEM-SE HONRADOS EM CONVIDÁ-LOS PARA A SUA FORMATURA EM
                    </p>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-['Alex_Brush'] text-[#CFAA93]">
                      Análise e Desenvolvimento de Sistemas
                    </h1>
                  </div>

                  <div className="w-full flex flex-col items-center gap-3 mb-4 sm:mb-6">
                    <p className="text-sm sm:text-base font-['TexGyreTermes'] text-[#CFAA93]">
                      Digite o código de 4 dígitos que está no cartão com o QRCode que acompanha seu convite.
                    </p>
                    <input
                      type="text"
                      maxLength={4}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Digite seu código de convite"
                      className="w-full text-center px-4 py-2 border border-[#0047AB] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0047AB] text-gray-800 text-lg font-medium font-['TexGyreTermes']"
                    />
                    <button
                      onClick={handleEnter}
                      className="bg-[#CFAA93] text-black px-6 py-2 rounded-md hover:bg-[#bfa67e] transition font-['TexGyreTermes']"
                    >
                      Entrar no convite
                    </button>
                    <button
                      onClick={() => setShowPhoneModal(true)}
                      className="text-sm font-['TexGyreTermes'] text-[#CFAA93] underline hover:text-[#bfa67e]"
                    >
                      Buscar código do convite pelo telefone
                    </button>
                    <a
                      href="https://wa.me/5551996121240"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-['TexGyreTermes'] text-[#CFAA93] underline hover:text-[#bfa67e] mt-2"
                    >
                      Dúvidas? Clique aqui para entrar em contato.
                    </a>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-[#0d2931] text-[#CFAA93] p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-2 font-['TexGyreTermes']">Código não encontrado</h2>
            <p className="text-sm font-['TexGyreTermes']">{modalMessage}</p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 px-4 py-2 bg-[#CFAA93] text-black rounded-md hover:bg-[#bfa67e] font-['TexGyreTermes']"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {showPhoneModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-gradient-to-b from-[#0d2931] to-[#091d24] border border-[#CFAA93]/30 text-[#CFAA93] p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-2 font-['TexGyreTermes']">Buscar código por telefone</h2>
            <InputMask
              mask="(99) 99999-9999"
              maskChar={null}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            >
              {(inputProps) => (
                <input
                  {...inputProps}
                  type="tel"
                  placeholder="Digite seu telefone com DDD"
                  className="w-full mb-4 px-4 py-2 border border-[#CFAA93]/40 bg-black/20 text-[#CFAA93] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#CFAA93] text-base font-['TexGyreTermes']"
                />
              )}
            </InputMask>
            <div className="flex gap-4 mt-4">
              <button
                onClick={async () => {
                  setPhoneError('');
                  setFoundCode(null);
                  try {
                    const response = await fetch(`${API_URL}/api/buscaCodigoConvitePorTelefone`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ telefone: phone.replace(/\D/g, '') })
                    });
                    const data = await response.json();
                    if (data.encontrado) {
                      setFoundCode(data.codigoConvite);
                    } else {
                      setPhoneError("Não encontramos um código com esse número. Por favor, entre em contato com o João.");
                    }
                  } catch (err) {
                    setPhoneError("Erro ao buscar o código. Tente novamente.");
                  }
                }}
                className="bg-[#CFAA93] text-black px-6 py-2 rounded-md hover:bg-[#bfa67e] transition font-['TexGyreTermes']"
              >
                Buscar código
              </button>
              <button
                onClick={() => {
                  setShowPhoneModal(false);
                  setPhone('');
                  setFoundCode(null);
                  setPhoneError('');
                }}
                className="px-6 py-2 bg-[#CFAA93] text-black rounded-md hover:bg-[#bfa67e] font-['TexGyreTermes']"
              >
                Fechar
              </button>
            </div>
            {foundCode && (
              <p className="mt-4 text-sm font-['TexGyreTermes']">Seu código de convite é: <strong>{foundCode}</strong></p>
            )}
            {phoneError && (
              <p className="mt-4 text-sm text-red-400 font-['TexGyreTermes']">{phoneError}</p>
            )}
          </div>
        </div>
      )}
      {modalMessage && !showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-[#0d2931] text-[#CFAA93] p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-2 font-['TexGyreTermes']">Código não encontrado</h2>
            <p className="text-sm font-['TexGyreTermes']">{modalMessage}</p>
            <button
              onClick={() => {
                setModalMessage('');
              }}
              className="mt-4 px-4 py-2 bg-[#CFAA93] text-black rounded-md hover:bg-[#bfa67e] font-['TexGyreTermes']"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-gradient-to-b from-[#0d2931] to-[#091d24] border border-[#CFAA93]/30 text-[#CFAA93] p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 font-['TexGyreTermes']">Importar convidados</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fileInput = e.target.elements.file;
                const formData = new FormData();
                formData.append("arquivo", fileInput.files[0]);

                try {
                  const response = await fetch(`${API_URL}/api/importarConvidados`, {
                    method: "POST",
                    body: formData
                  });

                  if (response.ok) {
                    alert("Convidados importados com sucesso!");
                  } else {
                    alert("Erro ao importar convidados.");
                  }
                } catch (err) {
                  alert("Erro na requisição.");
                }

                setShowImportModal(false);
              }}
            >
              <input
                type="file"
                name="file"
                accept=".xlsx"
                required
                className="w-full mb-4 px-4 py-2 border border-[#CFAA93]/40 bg-black/20 text-[#CFAA93] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#CFAA93] text-base font-['TexGyreTermes']"
              />
              <div className="flex gap-4">
                <button type="submit" className="bg-[#CFAA93] text-black px-6 py-2 rounded-md hover:bg-[#bfa67e] transition font-['TexGyreTermes']">
                  Importar
                </button>
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-6 py-2 bg-[#CFAA93] text-black rounded-md hover:bg-[#bfa67e] font-['TexGyreTermes']"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showListModal && (
        <div className="fixed inset-0 flex items-start justify-center bg-black bg-opacity-70 z-50 overflow-y-auto pt-10">
          <div className="bg-gradient-to-b from-[#0d2931] to-[#091d24] border border-[#CFAA93]/30 text-[#CFAA93] p-6 rounded-2xl shadow-2xl max-w-3xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="font-['TexGyreTermes'] text-sm">
                  <strong>Total de Convidados:</strong> {familias.reduce((acc, f) => acc + f.convidados.length, 0)}
                </p>
                <p className="font-['TexGyreTermes'] text-sm">
                  <strong>Total de Famílias:</strong> {familias.length}
                </p>
                <p className="font-['TexGyreTermes'] text-sm">
                  <strong>Adultos Confirmados:</strong> {
                    familias.reduce((acc, f) =>
                      acc + f.convidados.filter(c => c.status === 1 && (!c.crianca || (c.idade && c.idade > 10))).length
                    , 0)
                  }
                </p>
                <p className="font-['TexGyreTermes'] text-sm">
                  <strong>Crianças 6 a 10 anos Confirmadas:</strong> {
                    familias.reduce((acc, f) =>
                      acc + f.convidados.filter(c => c.status === 1 && c.crianca && c.idade >= 6 && c.idade <= 10).length
                    , 0)
                  }
                </p>
                <p className="font-['TexGyreTermes'] text-sm">
                  <strong>Crianças 0 a 5 anos Confirmadas:</strong> {
                    familias.reduce((acc, f) =>
                      acc + f.convidados.filter(c => c.status === 1 && c.crianca && c.idade >= 0 && c.idade <= 5).length
                    , 0)
                  }
                </p>
                <p className="font-['TexGyreTermes'] text-sm">
                  <strong>Total de Recusados:</strong> {
                    familias.reduce((acc, f) =>
                      acc + f.convidados.filter(c => c.status === 2).length
                    , 0)
                  }
                </p>
              </div>
              <button
                onClick={() => setShowListModal(false)}
                className="text-[#CFAA93] hover:text-[#bfa67e] font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <h2 className="text-2xl font-bold mb-4 font-['TexGyreTermes'] text-center">Lista de Convidados</h2>
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full mb-2 px-4 py-2 border border-[#CFAA93]/40 bg-black/20 text-[#CFAA93] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#CFAA93] text-base font-['TexGyreTermes']"
            />
            <div className="flex flex-wrap gap-4 mb-6">
              {[
                { label: "Confirmados", value: "confirmados" },
                { label: "Recusados", value: "recusados" },
                { label: "Pendentes", value: "pendentes" },
                { label: "Crianças", value: "criancas" },
              ].map(({ label, value }) => (
                <label key={value} className="flex items-center space-x-2 font-['TexGyreTermes']">
                  <input
                    type="checkbox"
                    value={value}
                    checked={selectedFilters.includes(value)}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setSelectedFilters((prev) =>
                        isChecked ? [...prev, value] : prev.filter((v) => v !== value)
                      );
                    }}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {familias
              .filter((familia) =>
                searchTerm.trim() === '' ||
                familia.convidados.some((convidado) =>
                  convidado.nome.toLowerCase().includes(searchTerm.toLowerCase())
                )
              )
              .map((familia) => {
                const convidadosFiltrados = familia.convidados.filter((convidado) => {
                  const matchesStatus =
                    selectedFilters.length === 0 ||
                    (selectedFilters.includes("confirmados") && convidado.status === 1) ||
                    (selectedFilters.includes("recusados") && convidado.status === 2) ||
                    (selectedFilters.includes("pendentes") && convidado.status === 0);

                  const matchesCrianca =
                    !selectedFilters.includes("criancas") || Boolean(convidado.crianca);

                  return matchesStatus && matchesCrianca;
                });

                return {
                  ...familia,
                  convidados: convidadosFiltrados,
                };
              })
              .filter((familia) => familia.convidados.length > 0)
              .map((familia, index) => (
              <div key={index} className="mb-6 border-t border-[#CFAA93]/20 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Família {familia.codigoConvite}</h3>
                  <button
                    onClick={() => {
                      setNewGuest(prev => ({ ...prev, codigoConvite: familia.codigoConvite }));
                      setShowAddModal(true);
                    }}
                    className="bg-[#CFAA93] text-black px-3 py-1 rounded-full hover:bg-[#bfa67e] text-sm"
                  >
                    +
                  </button>
                </div>
                {familia.convidados.map((convidado) => (
                  <div key={convidado.idConvidado} className="flex justify-between items-center mb-2 p-2 bg-black/20 rounded-md">
                      <span className="text-sm">
                        {convidado.nome}
                        {convidado.crianca && (
                          <>
                            {' '}👶
                            {convidado.idade ? ` (${convidado.idade} anos)` : ''}
                          </>
                        )}
                      </span>
                    <div className="flex items-center gap-2">
                      <span title={convidado.status === 1 ? "Confirmado" : convidado.status === 2 ? "Recusado" : "Pendente"}>
                        {convidado.status === 1 ? "✅" : convidado.status === 2 ? "❌" : "⚠️"}
                      </span>
                      <button
                        onClick={() => atualizarStatus(convidado.idConvidado, 1)}
                        className="bg-green-600 text-white px-2 py-1 rounded-full text-xs hover:bg-green-700"
                        title="Confirmar"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => atualizarStatus(convidado.idConvidado, 2)}
                        className="bg-red-600 text-white px-2 py-1 rounded-full text-xs hover:bg-red-700"
                        title="Recusar"
                      >
                        Recusar
                      </button>
                      <div className="relative inline-block text-left">
  <button
    onClick={() =>
      setFamilias((prev) =>
        prev.map((f) =>
          f.codigoConvite === familia.codigoConvite
            ? {
                ...f,
                convidados: f.convidados.map((c) =>
                  c.idConvidado === convidado.idConvidado
                    ? { ...c, showMenu: !c.showMenu }
                    : { ...c, showMenu: false }
                ),
              }
            : f
        )
      )
    }
    className="ml-2 px-2 py-1 bg-[#CFAA93] text-black rounded-full"
  >
    ⋮
  </button>

  {convidado.showMenu && (
    <div className="absolute z-10 mt-2 right-0 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
      <button
        onClick={() => atualizarStatus(convidado.idConvidado, 0)}
        className="block w-full px-4 py-2 text-left text-yellow-700 hover:bg-yellow-50"
      >
        ⚠️ Pendente
      </button>
      <button
        onClick={() => {
          const confirmar = window.confirm("Tem certeza que deseja excluir este convidado?");
          if (!confirmar) return;
          fetch(`${API_URL}/api/deletarConvidado`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idConvidado: convidado.idConvidado }),
          }).then(async (response) => {
            if (response.ok) {
              const res = await fetch(`${API_URL}/api/listarConvidadosPorFamilia`);
              const data = await res.json();
              if (res.ok && typeof data === "object") {
                const familiasConvertidas = Object.entries(data).map(([codigoConvite, convidados]) => ({
                  codigoConvite,
                  convidados,
                }));
                setFamilias(familiasConvertidas);
              }
            } else {
              alert("Erro ao excluir convidado.");
            }
          }).catch(() => alert("Erro na requisição."));
        }}
        className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
      >
        🗑️ Excluir
      </button>
      <button
        onClick={() => {
          setNewGuest({
            idConvidado: convidado.idConvidado,
            nome: convidado.nome,
            telefone: convidado.telefone || '',
            codigoConvite: familia.codigoConvite,
            crianca: !!convidado.crianca,
          });
          setShowAddModal(true);
        }}
        className="block w-full px-4 py-2 text-left text-blue-700 hover:bg-blue-50"
      >
        ✏️ Editar
      </button>
    </div>
  )}
</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <button
              onClick={() => setShowAddModal(true)}
              className="mb-4 px-6 py-2 bg-[#CFAA93] text-black rounded-md hover:bg-[#bfa67e] font-['TexGyreTermes'] w-full"
            >
              Adicionar Convidado
            </button>
            <a
              href={`${API_URL}/api/exportarListaPDF`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center mt-2 mb-2 bg-[#CFAA93] text-black px-6 py-3 rounded-lg text-base font-semibold hover:bg-[#bfa67e] transition font-['TexGyreTermes']"
            >
              📄 Exportar Lista em PDF
            </a>
            <button
              onClick={() => setShowListModal(false)}
              className="mt-4 px-6 py-2 bg-[#CFAA93] text-black rounded-md hover:bg-[#bfa67e] font-['TexGyreTermes'] w-full"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-gradient-to-b from-[#0d2931] to-[#091d24] border border-[#CFAA93]/30 text-[#CFAA93] p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 font-['TexGyreTermes']">Adicionar Convidado</h2>
            <input
              type="text"
              placeholder="Nome"
              value={newGuest.nome}
              onChange={(e) => setNewGuest({ ...newGuest, nome: e.target.value })}
              className="w-full mb-2 px-4 py-2 border border-[#CFAA93]/40 bg-black/20 text-[#CFAA93] rounded-md"
            />
            <input
              type="text"
              placeholder="Telefone"
              value={newGuest.telefone}
              onChange={(e) => setNewGuest({ ...newGuest, telefone: e.target.value })}
              className="w-full mb-2 px-4 py-2 border border-[#CFAA93]/40 bg-black/20 text-[#CFAA93] rounded-md"
            />
            <input
              type="text"
              placeholder="Código do Convite"
              value={newGuest.codigoConvite}
              onChange={(e) => setNewGuest({ ...newGuest, codigoConvite: e.target.value })}
              className="w-full mb-2 px-4 py-2 border border-[#CFAA93]/40 bg-black/20 text-[#CFAA93] rounded-md"
            />
            <label className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={newGuest.crianca}
                onChange={(e) => setNewGuest({ ...newGuest, crianca: e.target.checked })}
                className="mr-2"
              />
              É criança?
            </label>
            {newGuest.crianca && (
              <input
                type="number"
                placeholder="Idade"
                value={newGuest.idade || ''}
                onChange={(e) => setNewGuest({ ...newGuest, idade: e.target.value })}
                className="w-full mb-4 px-4 py-2 border border-[#CFAA93]/40 bg-black/20 text-[#CFAA93] rounded-md"
              />
            )}
            <div className="flex gap-4">
              <button
                onClick={async () => {
                  try {
                    const url = newGuest.idConvidado
                      ? `${API_URL}/api/editarConvidado`
                      : `${API_URL}/api/adicionarConvidado`;
 
                    const response = await fetch(url, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ...newGuest, idade: newGuest.crianca ? newGuest.idade : null })
                    });
 
                    if (response.ok) {
                      alert(newGuest.idConvidado ? 'Convidado atualizado com sucesso!' : 'Convidado adicionado com sucesso!');
                      const res = await fetch(`${API_URL}/api/listarConvidadosPorFamilia`);
                      const data = await res.json();
                      if (res.ok && typeof data === 'object') {
                        const familiasConvertidas = Object.entries(data).map(([codigoConvite, convidados]) => ({
                          codigoConvite,
                          convidados,
                        }));
                        setFamilias(familiasConvertidas);
                      }
                      setShowAddModal(false);
                      setNewGuest({ nome: '', telefone: '', codigoConvite: '', crianca: false });
                    } else {
                      alert('Erro ao salvar convidado.');
                    }
                  } catch (err) {
                    alert('Erro na requisição.');
                  }
                }}
                className="bg-[#CFAA93] text-black px-6 py-2 rounded-md hover:bg-[#bfa67e]"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewGuest({ nome: '', telefone: '', codigoConvite: '', crianca: false });
                }}
                className="px-6 py-2 bg-[#CFAA93] text-black rounded-md hover:bg-[#bfa67e]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LandingPage;
