import logoPuc from '@/photos/logo-puc.png';
import backgroundImg from '@/photos/foto-background.jpeg';
import infoIcon from '@/photos/info.png';
import config from '@/config/config';
import { useState, useEffect } from 'react';
import { formatEventDate } from '@/lib/formatEventDate';
import { motion } from 'framer-motion';
import InputMask from 'react-input-mask';
const API_URL = import.meta.env.VITE_URL_API;

const LandingPage = ({ onOpenInvitation, setConvidados }) => {
  const [code, setCode] = useState(() => localStorage.getItem('codigoConvite') || '');
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
  const [showEntregueModal, setShowEntregueModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Estado para modal de confirmação SMS
  const [confirmarSMS, setConfirmarSMS] = useState({ mostrar: false, idConvidado: null });

  const [showDashboardModal, setShowDashboardModal] = useState(false);
  // Estado para mensagem WhatsApp e edição
  const [whatsappMensagem, setWhatsappMensagem] = useState("");
  const [editandoMensagem, setEditandoMensagem] = useState(false);
  const [mensagemEditada, setMensagemEditada] = useState("");

  useEffect(() => {
    // Recupera o código salvo no localStorage ao montar o componente
    const savedCode = localStorage.getItem('codigoConvite');
    if (savedCode && savedCode !== code) {
      setCode(savedCode);
    }

    // Verifica se há código de convite na URL (?=1234 ou ?code=1234)
    const params = new URLSearchParams(window.location.search);
    const codeFromURL = params.get('') || params.get('code');
    if (codeFromURL && codeFromURL.length === 4) {
      setCode(codeFromURL);
      localStorage.setItem('codigoConvite', codeFromURL);
    }
  }, []);

  // Carregar mensagem WhatsApp do backend ao abrir lista admin
  useEffect(() => {
    if (showListModal) {
      // Busca convidados por família normalmente
      fetch(`${API_URL}/api/listarConvidadosPorFamilia`)
        .then(res => res.json())
        .then(data => {
          // Remove suporte à mensagem do backend, busca mensagem separadamente
        })
        .catch(() => {});
      // Busca a mensagem do WhatsApp diretamente do endpoint dedicado
      fetch(`${API_URL}/api/mensagem/whatsapp`)
        .then((res) => res.json())
        .then((mensagemData) => {
          if (mensagemData?.mensagem) {
            setWhatsappMensagem(mensagemData.mensagem);
          }
        });
    }
  }, [showListModal]);

  // Função para atualizar status de convidado (refatorada para SMS)
  const atualizarStatus = async (idConvidado, novoStatus, enviarSMS = null) => {
    try {
      let endpoint;
      let body = { idConvidado };
      if (novoStatus === 1 && enviarSMS !== null) {
        endpoint = "/api/confirmarConvidado";
        body.enviaSMS = enviarSMS;
      } else if (novoStatus === 1) {
        // Ao confirmar, perguntar sobre SMS se ainda não foi perguntado
        setConfirmarSMS({ mostrar: true, idConvidado });
        return;
      } else if (novoStatus === 2) {
        endpoint = "/api/recusarConvidado";
      } else {
        endpoint = "/api/pendenteConvidado";
      }

      await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      setIsLoading(true);
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
            setIsLoading(false);
            return;
          }

          if (code === 'JOAO') {
            setShowImportModal(true);
            setIsLoading(false);
            return;
          } else if (code === "LIST") {
            const res = await fetch(`${API_URL}/api/listarConvidadosPorFamilia`);
            const data = await res.json();
            if (res.ok && typeof data === 'object') {
              const familiasConvertidas = Object.entries(data).map(([codigoConvite, grupo]) => ({
                codigoConvite,
                ...grupo,
              }));
              setFamilias(familiasConvertidas);
            }
            setShowListModal(true);
            setIsLoading(false);
            return;
          }
        } else if (response.ok && data.convidados && data.convidados.length > 0 && data.codigoValido !== false) {
          if (data.entregue === false) {
            setShowEntregueModal(true);
            setModalMessage(data.convidados[0]?.nome || '');
            setIsLoading(false);
            return;
          }
          setConvidados(data.convidados);
          onOpenInvitation();
          setIsLoading(false);
        } else {
          setModalMessage('Não encontramos convidado com esse código. Tente usar os 4 últimos números do telefone de algum dos convidados da sua família ou usar a opção "Buscar código do convite pelo telefone". Se não conseguir, entre em contato com o João.');
          setShowModal(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erro ao validar código:', error);
        alert('Erro ao validar o código. Tente novamente mais tarde.');
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="text-center text-[#F2B21C] font-['TexGyreTermes']">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#F2B21C] border-opacity-50 mx-auto mb-4"></div>
            <p className="text-lg">Buscando convite...</p>
          </div>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen relative overflow-hidden flex flex-col justify-between h-screen"
      >
        {import.meta.env.VITE_AMBIENTE === 'HML' && (
          <div className="bg-red-600 text-black text-center py-2 font-semibold uppercase tracking-wide z-50 relative">
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
              className="relative overflow-hidden w-full h-full p-0 sm:p-8 md:p-10 sm:rounded-2xl sm:border border-yellow-100/50 shadow-xl text-[#F2B21C]"
              style={{
                marginTop: '2vh',
                height: '90vh',
                width: 'auto',
              }}
            >
              <div className="relative z-10 h-full">
                {/* Top Decorative Line */}
                <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
                  <div className="h-px w-12 sm:w-16 bg-[#F2B21C]/50" />
                  <div className="w-2 h-2 rounded-full bg-[#F2B21C]" />
                  <div className="h-px w-12 sm:w-16 bg-[#F2B21C]/50" />
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
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-['Alex_Brush'] text-[#F2B21C]">
                      João Pedro Vargas da Silva
                    </h1>
                    <p className="text-sm sm:text-base font-['TexGyreTermes'] text-[#F2B21C]">
                      E SUA FAMÍLIA SENTEM-SE HONRADOS EM CONVIDÁ-LOS PARA A SUA FORMATURA EM
                    </p>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-['Alex_Brush'] text-[#F2B21C]">
                      Análise e Desenvolvimento de Sistemas
                    </h1>
                  </div>

                  <div className="w-full flex flex-col items-center gap-3 mb-4 sm:mb-6">
                    <p className="text-sm sm:text-base font-['TexGyreTermes'] text-[#F2B21C]">
                      Digite o código de 4 dígitos que está no cartão com o QRCode.
                      <span className="relative group inline-block ml-2 cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline text-[#F2B21C]" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-8 3a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1zm-1-6a1 1 0 012 0v1a1 1 0 11-2 0V7z" clipRule="evenodd" />
                        </svg>
                        <div className="absolute hidden group-hover:block group-focus:block z-10 top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-60">
                          <img src={infoIcon} alt="Ajuda sobre código QR" className="w-full h-auto rounded-md" />
                        </div>
                      </span>
                    </p>
                    <input
                      type="text"
                      maxLength={4}
                    value={code}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCode(value);
                      localStorage.setItem('codigoConvite', value);
                    }}
                    placeholder="Digite seu código de convite"
                    className="w-full text-center px-4 py-2 border border-[#0047AB] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0047AB] text-gray-800 text-lg font-medium font-['TexGyreTermes']"
                    />
                    <button
                      onClick={handleEnter}
                      className="bg-[#F2B21C] text-black px-6 py-2 rounded-md hover:bg-[#bfa67e] transition font-['TexGyreTermes']"
                    >
                      Entrar no convite
                    </button>
                    <button
                      onClick={() => setShowPhoneModal(true)}
                      className="text-sm font-['TexGyreTermes'] text-[#F2B21C] underline hover:text-[#bfa67e]"
                    >
                      Buscar código do convite pelo telefone
                    </button>
                    <a
                      href="https://wa.me/5551996121240"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-['TexGyreTermes'] text-[#F2B21C] underline hover:text-[#bfa67e] mt-2"
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
          <div className="bg-[#0d2931] text-[#F2B21C] p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-2 font-['TexGyreTermes']">Código não encontrado</h2>
            <p className="text-sm font-['TexGyreTermes']">{modalMessage}</p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 px-4 py-2 bg-[#F2B21C] text-black rounded-md hover:bg-[#bfa67e] font-['TexGyreTermes']"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {showPhoneModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-gradient-to-b from-[#0d2931] to-[#091d24] border border-[#F2B21C]/30 text-[#F2B21C] p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4">
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
                  className="w-full mb-4 px-4 py-2 border border-[#F2B21C]/40 bg-black/20 text-[#F2B21C] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F2B21C] text-base font-['TexGyreTermes']"
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
                className="bg-[#F2B21C] text-black px-6 py-2 rounded-md hover:bg-[#bfa67e] transition font-['TexGyreTermes']"
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
                className="px-6 py-2 bg-[#F2B21C] text-black rounded-md hover:bg-[#bfa67e] font-['TexGyreTermes']"
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

      {showEntregueModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-[#0d2931] text-[#F2B21C] p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-2 font-['TexGyreTermes']">Calma, {modalMessage}!</h2>
            <p className="text-sm font-['TexGyreTermes']">
              Localizamos seu convite, mas parece que seu convite físico ainda não foi entregue. Assim que receber, você poderá acessar normalmente o convite virtual.
              <br /><br />
              Se você já recebeu o convite físico, clique abaixo para nos avisar.
            </p>
            <div className="mt-4 flex gap-4">
              <button
                onClick={() => setShowEntregueModal(false)}
                className="px-4 py-2 bg-[#F2B21C] text-black rounded-md hover:bg-[#bfa67e] font-['TexGyreTermes']"
              >
                Fechar
              </button>
              <a
                href="https://wa.me/5551996121240?text=Oi%20Jo%C3%A3o%2C%20fui%20acessar%20o%20convite%20virtual%20e%20aparece%20que%20ainda%20n%C3%A3o%20foi%20entregue."
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#F2B21C] text-black rounded-md hover:bg-[#bfa67e] font-['TexGyreTermes'] text-center"
              >
                Já recebi meu convite
              </a>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-gradient-to-b from-[#0d2931] to-[#091d24] border border-[#F2B21C]/30 text-[#F2B21C] p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4">
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
                className="w-full mb-4 px-4 py-2 border border-[#F2B21C]/40 bg-black/20 text-[#F2B21C] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F2B21C] text-base font-['TexGyreTermes']"
              />
              <div className="flex gap-4">
                <button type="submit" className="bg-[#F2B21C] text-black px-6 py-2 rounded-md hover:bg-[#bfa67e] transition font-['TexGyreTermes']">
                  Importar
                </button>
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-6 py-2 bg-[#F2B21C] text-black rounded-md hover:bg-[#bfa67e] font-['TexGyreTermes']"
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
          <div className="bg-gradient-to-b from-[#0d2931] to-[#091d24] border border-[#F2B21C]/30 text-[#F2B21C] p-6 rounded-2xl shadow-2xl max-w-3xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              {/* Botão Dashboard movido para o topo, logo após o cabeçalho */}
              <h2 className="text-2xl font-bold font-['TexGyreTermes']">Painel Administrativo</h2>
              <button
                onClick={() => setShowListModal(false)}
                className="text-[#F2B21C] hover:text-[#bfa67e] font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <button
              onClick={() => setShowDashboardModal(true)}
              className="mb-4 px-6 py-2 bg-[#F2B21C] text-black rounded-md hover:bg-[#bfa67e] font-['TexGyreTermes']"
            >
              📊 Dados Consolidados
            </button>
            <button
              onClick={() => {
                const confirmar = window.confirm("Tem certeza que deseja enviar SMS de lembrete para os convidados pendentes?");
                if (!confirmar) return;

                fetch(`${API_URL}/api/enviarLembretePendentes`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                })
                  .then((res) => {
                    if (res.ok) {
                      alert("✅ SMS de lembrete enviado com sucesso para todos os pendentes.");
                    } else {
                      alert("❌ Erro ao enviar os SMS. Verifique o servidor.");
                    }
                  })
                  .catch(() => {
                    alert("❌ Erro na requisição. Verifique sua conexão.");
                  });
              }}
              className="mb-2 px-6 py-2 bg-[#F2B21C] text-black rounded-md hover:bg-[#bfa67e] font-['TexGyreTermes']"
            >
              📲 Enviar SMS Lembrete Pendentes
            </button>
            {/* Botão e campo para editar mensagem WhatsApp */}
            <button
              className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              onClick={() => {
                setMensagemEditada(whatsappMensagem);
                setEditandoMensagem(true);
              }}
            >
              Enviar WhatsApp
            </button>
            {editandoMensagem && (
              <div className="mt-2 flex flex-col">
                <textarea
                  value={mensagemEditada}
                  onChange={(e) => setMensagemEditada(e.target.value)}
                  rows={5}
                  className="w-full p-2 border border-gray-400 rounded resize-none"
                  placeholder="Escreva sua mensagem. Use {name} e {url} como variáveis."
                />
                <button
                  className="mt-2 self-end bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
                  onClick={async () => {
                    const res = await fetch(`${API_URL}/api/mensagem/salvar`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ service: "whatsapp", mensagem: mensagemEditada }),
                    });
                    if (res.ok) {
                      setWhatsappMensagem(mensagemEditada);
                      setEditandoMensagem(false);
                      alert("Mensagem salva com sucesso!");
                    } else {
                      alert("Erro ao salvar a mensagem.");
                    }
                  }}
                >
                  Salvar Mensagem
                </button>
              </div>
            )}
            <h2 className="text-2xl font-bold mb-4 font-['TexGyreTermes'] text-center">Lista de Convidados</h2>
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full mb-2 px-4 py-2 border border-[#F2B21C]/40 bg-black/20 text-[#F2B21C] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F2B21C] text-base font-['TexGyreTermes']"
            />
            <div className="flex flex-wrap gap-4 mb-6">
              {[
                { label: "Confirmados", value: "confirmados" },
                { label: "Recusados", value: "recusados" },
                { label: "Pendentes", value: "pendentes" },
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
            {(Array.isArray(familias) ? familias : [])
              .filter((familia) =>
                searchTerm.trim() === '' ||
                (Array.isArray(familia.convidados) ? familia.convidados : []).some((convidado) =>
                  convidado.nome && convidado.nome.toLowerCase().includes(searchTerm.toLowerCase())
                )
              )
              .map((familia) => {
                const convidadosFiltrados = (Array.isArray(familia.convidados) ? familia.convidados : []).filter((convidado) => {
                  const matchesStatus =
                    selectedFilters.length === 0 ||
                    (selectedFilters.includes("confirmados") && convidado.status === 1) ||
                    (selectedFilters.includes("recusados") && convidado.status === 2) ||
                    (selectedFilters.includes("pendentes") && convidado.status === 0);

                  return matchesStatus;
                });

                return {
                  ...familia,
                  convidados: convidadosFiltrados,
                };
              })
              .filter((familia) => Array.isArray(familia.convidados) && familia.convidados.length > 0)
              .map((familia, index) => (
                <div key={index} className="mb-6 border-t border-[#F2B21C]/20 pt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      Família {familia.codigoConvite}{' '}
                      {familia.entregue ? '📦' : '⏳'}
                    </h3>
                    <div className="flex items-center">
                      <button
                        onClick={() => {
                          setNewGuest(prev => ({ ...prev, codigoConvite: familia.codigoConvite }));
                          setShowAddModal(true);
                        }}
                        className="bg-[#F2B21C] text-black px-3 py-1 rounded-full hover:bg-[#bfa67e] text-sm"
                      >
                        +
                      </button>
                      <button
                        onClick={() => {
                          const link = `https://joaovargas.dev.br/formatura/?=${familia.codigoConvite}`;
                          navigator.clipboard.writeText(link)
                            .then(() => {
                              const toast = document.createElement('div');
                              toast.textContent = `Link da família #${familia.codigoConvite} copiado!`;
                              toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#F2B21C] text-black px-6 py-3 rounded-full shadow-lg text-sm font-semibold z-50';
                              document.body.appendChild(toast);
                              setTimeout(() => {
                                toast.remove();
                              }, 3000);
                            })
                            .catch(() => alert('Erro ao copiar o link.'));
                        }}
                        title="Copiar link do convite"
                        className="ml-2 px-3 py-1 rounded-full bg-[#F2B21C] text-black hover:bg-[#bfa67e] text-sm"
                      >
                        🔗
                      </button>
                    </div>
                  </div>
                  {(Array.isArray(familia.convidados) ? familia.convidados : []).map((convidado) => (
                    <div key={convidado.idConvidado} className="flex justify-between items-center mb-2 p-2 bg-black/20 rounded-md">
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <p className="text-sm mb-0" style={{ marginBottom: 0 }}>
                          {convidado.nome}
                          {convidado.crianca && (
                            <>
                              {' '}👶
                              {convidado.idade ? ` (${convidado.idade} anos)` : ''}
                            </>
                          )}
                          {/* Botão WhatsApp para cada convidado com telefone */}
                          {convidado.telefone && whatsappMensagem && (
                            <a
                              href={`https://wa.me/55${convidado.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(
                                whatsappMensagem
                                  .replace("{name}", convidado.nome.split(" ")[0])
                                  .replace("{url}", `https://joaovargas.dev.br/formatura/?=${convidado.idFamilia || convidado.id_familia || convidado.codigoConvite || 'erro'}`)
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 underline ml-2"
                            >
                              WhatsApp
                            </a>
                          )}
                        </p>
                        <div className="flex items-center gap-2 ml-auto">
                          <span title={convidado.status === 1 ? "Confirmado" : convidado.status === 2 ? "Recusado" : "Pendente"}>
                            {convidado.status === 1 ? "✅" : convidado.status === 2 ? "❌" : "⚠️"}
                          </span>
                          <button
                            onClick={() => atualizarStatus(convidado.idConvidado, 1)}
                            className="bg-green-600 text-black px-2 py-1 rounded-full text-xs hover:bg-green-700"
                            title="Confirmar"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => atualizarStatus(convidado.idConvidado, 2)}
                            className="bg-red-600 text-black px-2 py-1 rounded-full text-xs hover:bg-red-700"
                            title="Recusar"
                          >
                            Recusar
                          </button>
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() =>
                                setFamilias((prev) =>
                                  (Array.isArray(prev) ? prev : []).map((f) =>
                                    f.codigoConvite === familia.codigoConvite
                                      ? {
                                          ...f,
                                          convidados: (Array.isArray(f.convidados) ? f.convidados : []).map((c) =>
                                            c.idConvidado === convidado.idConvidado
                                              ? { ...c, showMenu: !c.showMenu }
                                              : { ...c, showMenu: false }
                                          ),
                                        }
                                      : f
                                  )
                                )
                              }
                              className="ml-2 px-2 py-1 bg-[#F2B21C] text-black rounded-full"
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
                                {convidado.telefone && (
                                  <a
                                    href={`https://wa.me/55${convidado.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(
                                      whatsappMensagem
                                        .replace("{name}", convidado.nome.split(" ")[0])
                                        .replace("{url}", `https://joaovargas.dev.br/formatura/?=${convidado.idFamilia || convidado.id_familia || convidado.codigoConvite || 'erro'}`)
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-green-700 hover:underline my-1"
                                  >
                                    📲 WhatsApp
                                  </a>
                                )}
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
                                          const familiasConvertidas = Object.entries(data).map(([codigoConvite, grupo]) => ({
                                            codigoConvite,
                                            ...grupo,
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
                    </div>
                  ))}
                  {/* Bloco de visita */}
                  {familia.visita?.totalVisitas > 0 ? (
                    <p className="text-sm text-[#F2B21C] mt-1">
                      😀 Último Acesso: {new Date(familia.visita.ultimaVisita).toLocaleString('pt-BR')} — {familia.visita.totalVisitas} acesso(s)
                    </p>
                  ) : (
                    <p className="text-sm text-[#F2B21C] mt-1">
                      😢 Ainda não acessou.
                    </p>
                  )}
                  {/* Bloco de confirmação */}
                  {familia.confirmacao?.totalConfirmacoes > 0 ? (
                    <p className="text-sm text-[#F2B21C] mt-1">
                      ✅ Última confirmação: {new Date(familia.confirmacao.ultimaConfirmacao).toLocaleString('pt-BR')} — por <strong>{familia.confirmacao.emailConfirmacao}</strong> — {familia.confirmacao.totalConfirmacoes} edição(ões)
                    </p>
                  ) : (
                    <p className="text-sm text-[#F2B21C] mt-1">
                      ⚠️ Ainda não confirmou presença.
                    </p>
                  )}
                  <button
                    onClick={async () => {
                      const endpoint = familia.entregue ? '/api/marcarNaoEntregue' : '/api/marcarEntregue';
                      await fetch(`${API_URL}${endpoint}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ codigoConvite: familia.codigoConvite })
                      });
                      const res = await fetch(`${API_URL}/api/listarConvidadosPorFamilia`);
                      const data = await res.json();
                      if (res.ok && typeof data === 'object') {
                        const familiasConvertidas = Object.entries(data).map(([codigoConvite, grupo]) => ({
                          codigoConvite,
                          ...grupo,
                        }));
                        setFamilias(familiasConvertidas);
                      }
                    }}
                    className="mt-2 bg-[#F2B21C] text-black px-3 py-1 rounded-full hover:bg-[#bfa67e] text-sm"
                  >
                    {familia.entregue ? 'Desfazer Entrega' : 'Entregar Convite'}
                  </button>
                </div>
              ))}
            <button
              onClick={() => setShowAddModal(true)}
              className="mb-4 px-6 py-2 bg-[#F2B21C] text-black rounded-md hover:bg-[#bfa67e] font-['TexGyreTermes'] w-full"
            >
              Adicionar Convidado
            </button>
            <a
              href={`${API_URL}/api/exportarListaPDF`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center mt-2 mb-2 bg-[#F2B21C] text-black px-6 py-3 rounded-lg text-base font-semibold hover:bg-[#bfa67e] transition font-['TexGyreTermes']"
            >
              📄 Exportar Lista em PDF
            </a>
            <button
              onClick={() => setShowListModal(false)}
              className="mt-4 px-6 py-2 bg-[#F2B21C] text-black rounded-md hover:bg-[#bfa67e] font-['TexGyreTermes'] w-full"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-gradient-to-b from-[#0d2931] to-[#091d24] border border-[#F2B21C]/30 text-[#F2B21C] p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 font-['TexGyreTermes']">Adicionar Convidado</h2>
            <input
              type="text"
              placeholder="Nome"
              value={newGuest.nome}
              onChange={(e) => setNewGuest({ ...newGuest, nome: e.target.value })}
              className="w-full mb-2 px-4 py-2 border border-[#F2B21C]/40 bg-black/20 text-[#F2B21C] rounded-md"
            />
            <input
              type="text"
              placeholder="Telefone"
              value={newGuest.telefone}
              onChange={(e) => setNewGuest({ ...newGuest, telefone: e.target.value })}
              className="w-full mb-2 px-4 py-2 border border-[#F2B21C]/40 bg-black/20 text-[#F2B21C] rounded-md"
            />
            <input
              type="text"
              placeholder="Código do Convite"
              value={newGuest.codigoConvite}
              onChange={(e) => setNewGuest({ ...newGuest, codigoConvite: e.target.value })}
              className="w-full mb-2 px-4 py-2 border border-[#F2B21C]/40 bg-black/20 text-[#F2B21C] rounded-md"
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
                className="w-full mb-4 px-4 py-2 border border-[#F2B21C]/40 bg-black/20 text-[#F2B21C] rounded-md"
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
                        const familiasConvertidas = Object.entries(data).map(([codigoConvite, grupo]) => ({
                          codigoConvite,
                          ...grupo,
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
                className="bg-[#F2B21C] text-black px-6 py-2 rounded-md hover:bg-[#bfa67e]"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewGuest({ nome: '', telefone: '', codigoConvite: '', crianca: false });
                }}
                className="px-6 py-2 bg-[#F2B21C] text-black rounded-md hover:bg-[#bfa67e]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de confirmação SMS */}
      {confirmarSMS.mostrar && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-[#0d2931] text-[#F2B21C] p-6 rounded-lg shadow-lg max-w-sm w-full mx-4 text-center">
            <h2 className="text-xl font-bold mb-4 font-['TexGyreTermes']">Enviar alerta SMS?</h2>
            <p className="text-sm mb-6 font-['TexGyreTermes']">
              Deseja enviar uma confirmação por SMS ao convidado?
            </p>
            <div className="flex justify-around gap-4">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-['TexGyreTermes']"
                onClick={async () => {
                  await atualizarStatus(confirmarSMS.idConvidado, 1, 1);
                  setConfirmarSMS({ mostrar: false, idConvidado: null });
                }}
              >
                Sim
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-['TexGyreTermes']"
                onClick={async () => {
                  await atualizarStatus(confirmarSMS.idConvidado, 1, 0);
                  setConfirmarSMS({ mostrar: false, idConvidado: null });
                }}
              >
                Não
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Dashboard Modal */}
      {showDashboardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-start overflow-y-auto pt-10 pb-10">
          <div className="bg-[#0d2931] border border-[#F2B21C]/30 text-[#F2B21C] p-6 rounded-2xl shadow-2xl w-full max-w-4xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold font-['TexGyreTermes']">📊 Painel Consolidado</h2>
              <button
                onClick={() => setShowDashboardModal(false)}
                className="text-[#F2B21C] hover:text-[#bfa67e] font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Limites da Festa - moved to first */}
              <div className="bg-black/30 rounded-lg p-4 col-span-1 md:col-span-2">
                <h3 className="font-bold text-lg mb-2">🎯 Limites da Festa</h3>
                {(() => {
                const limiteAdultos = 84;
                const limiteCriancas = 12;
                const adultos = (Array.isArray(familias) ? familias : []).reduce((acc, f) => acc + (Array.isArray(f.convidados) ? f.convidados : []).filter(c => (c.status === 0 || c.status === 1) && (!c.crianca || (c.idade && c.idade > 10))).length, 0);
                const criancas = (Array.isArray(familias) ? familias : []).reduce((acc, f) => acc + (Array.isArray(f.convidados) ? f.convidados : []).filter(c => (c.status === 0 || c.status === 1) && c.crianca).length, 0);
                  const adultosRestantes = Math.max(0, limiteAdultos - adultos);
                  const criancasRestantes = Math.max(0, limiteCriancas - criancas);
                  const grafico = (valor, limite) => {
                    const percentual = Math.min(100, Math.round((valor / limite) * 100));
                    return (
                      <div className="mb-3">
                        <p className="text-sm">Reservado: <strong>{valor}</strong> / {limite} ({percentual}%) — Vagas: <strong>{limite - valor}</strong></p>
                        <div className="w-full h-3 bg-blue-200 rounded-full">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percentual}%` }}></div>
                        </div>
                      </div>
                    );
                  };
                  return (
                    <>
                      <p className="font-semibold mb-1">Adultos</p>
                      {grafico(adultos, limiteAdultos)}
                      <p className="font-semibold mb-1">Crianças</p>
                      {grafico(criancas, limiteCriancas)}
                    </>
                  );
                })()}
              </div>
              {/* 1. Convidados Geral */}
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">👥 Convidados - Geral</h3>
                {(() => {
                  const total = (Array.isArray(familias) ? familias : []).reduce((acc, f) => acc + (Array.isArray(f.convidados) ? f.convidados.length : 0), 0);
                  const confirmados = (Array.isArray(familias) ? familias : []).reduce((acc, f) => acc + (Array.isArray(f.convidados) ? f.convidados : []).filter(c => c.status === 1).length, 0);
                  const pendentes = (Array.isArray(familias) ? familias : []).reduce((acc, f) => acc + (Array.isArray(f.convidados) ? f.convidados : []).filter(c => c.status === 0).length, 0);
                  const recusados = (Array.isArray(familias) ? familias : []).reduce((acc, f) => acc + (Array.isArray(f.convidados) ? f.convidados : []).filter(c => c.status === 2).length, 0);
                  const reservados = confirmados + pendentes;

                  const dados = [
                    { label: "Reservados", valor: reservados },
                    { label: "Confirmados", valor: confirmados },
                    { label: "Pendentes", valor: pendentes },
                    { label: "Recusados", valor: recusados }
                  ];

                  // Cores: Reservados - amarelo, Confirmados - verde, Pendentes - laranja, Recusados - vermelho
                  const barColors = [
                    { bg: "bg-yellow-200", fg: "bg-yellow-500" }, // Reservados
                    { bg: "bg-green-200", fg: "bg-green-500" },   // Confirmados
                    { bg: "bg-orange-200", fg: "bg-orange-500" }, // Pendentes
                    { bg: "bg-red-200", fg: "bg-red-500" },       // Recusados
                  ];

                  return dados.map((item, idx) => {
                    const percentual = Math.round((item.valor / total) * 100);
                    return (
                      <div key={idx} className="mb-2">
                        <p className="text-sm">{item.label}: <strong>{item.valor}</strong> ({percentual}%)</p>
                        <div className={`w-full h-3 ${barColors[idx].bg} rounded-full`}>
                          <div className={`h-full ${barColors[idx].fg} rounded-full`} style={{ width: `${percentual}%` }}></div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              {/* 2. Convites (Famílias) */}
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">📨 Convites - Famílias</h3>
                {(() => {
                  const total = Array.isArray(familias) ? familias.length : 0;
                  const entregues = (Array.isArray(familias) ? familias : []).filter(f => f.entregue).length;
                  const faltando = total - entregues;
                  // Indigo para esta seção
                  const barColors = [
                    { bg: "bg-indigo-200", fg: "bg-indigo-500" }, // Entregues
                    { bg: "bg-indigo-200", fg: "bg-indigo-500" }, // Faltando (mesma cor para manter padrão)
                  ];
                  return ["Entregues", "Faltando"].map((tipo, idx) => {
                    const valor = tipo === "Entregues" ? entregues : faltando;
                    const percentual = total > 0 ? Math.round((valor / total) * 100) : 0;
                    return (
                      <div key={idx} className="mb-2">
                        <p className="text-sm">{tipo}: <strong>{valor}</strong> ({percentual}%)</p>
                        <div className={`w-full h-3 ${barColors[idx].bg} rounded-full`}>
                          <div className={`h-full ${barColors[idx].fg} rounded-full`} style={{ width: `${percentual}%` }}></div>
                        </div>
                      </div>
                    );
                  });
                })()}
                {/* Gráfico "Acessaram o Convite" e "Não acessaram o convite" com base apenas nas entregues */}
                {(() => {
                  const entregues = (Array.isArray(familias) ? familias : []).filter(f => f.entregue);
                  const total = entregues.length;
                  const acessaram = entregues.filter(f => f.visita && f.visita.totalVisitas > 0).length;
                  const naoAcessaram = total - acessaram;

                  const dados = [
                    { label: "Acessaram o convite", valor: acessaram },
                    { label: "Não acessaram o convite", valor: naoAcessaram }
                  ];

                  return dados.map((item, idx) => {
                    const percentual = total > 0 ? Math.round((item.valor / total) * 100) : 0;
                    return (
                      <div key={idx} className="mb-2">
                        <p className="text-sm">{item.label}: <strong>{item.valor}</strong> ({percentual}%)</p>
                        <div className="w-full h-3 bg-indigo-200 rounded-full">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percentual}%` }}></div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              {/* 3. Confirmados Detalhado */}
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">✅ Confirmados por faixa</h3>
                {(() => {
                  const confirmados = (Array.isArray(familias) ? familias : []).reduce((acc, f) => acc + (Array.isArray(f.convidados) ? f.convidados : []).filter(c => c.status === 1).length, 0);
                  const adultos = (Array.isArray(familias) ? familias : []).reduce((acc, f) => acc + (Array.isArray(f.convidados) ? f.convidados : []).filter(c => c.status === 1 && (!c.crianca || (c.idade && c.idade > 10))).length, 0);
                  const criancas6a10 = (Array.isArray(familias) ? familias : []).reduce((acc, f) => acc + (Array.isArray(f.convidados) ? f.convidados : []).filter(c => c.status === 1 && c.crianca && c.idade >= 6 && c.idade <= 10).length, 0);
                  const criancas0a5 = (Array.isArray(familias) ? familias : []).reduce((acc, f) => acc + (Array.isArray(f.convidados) ? f.convidados : []).filter(c => c.status === 1 && c.crianca && c.idade >= 0 && c.idade <= 5).length, 0);
                  const data = [
                    { label: "Adultos", valor: adultos },
                    { label: "Crianças 6-10", valor: criancas6a10 },
                    { label: "Crianças 0-5", valor: criancas0a5 }
                  ];
                  // Usar verde para confirmados
                  return data.map((item, idx) => {
                    const percentual = confirmados > 0 ? Math.round((item.valor / confirmados) * 100) : 0;
                    return (
                      <div key={idx} className="mb-2">
                        <p className="text-sm">{item.label}: <strong>{item.valor}</strong> ({percentual}%)</p>
                        <div className="w-full h-3 bg-green-200 rounded-full">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${percentual}%` }}></div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              {/* 4. Recusados Detalhado */}
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">❌ Recusados por faixa</h3>
                {(() => {
                  const total = (Array.isArray(familias) ? familias : []).reduce((acc, f) => acc + (Array.isArray(f.convidados) ? f.convidados : []).filter(c => c.status === 2).length, 0);
                  const adultos = (Array.isArray(familias) ? familias : []).reduce((acc, f) => acc + (Array.isArray(f.convidados) ? f.convidados : []).filter(c => c.status === 2 && (!c.crianca || (c.idade && c.idade > 10))).length, 0);
                  const criancas = (Array.isArray(familias) ? familias : []).reduce((acc, f) => acc + (Array.isArray(f.convidados) ? f.convidados : []).filter(c => c.status === 2 && c.crianca).length, 0);
                  const data = [
                    { label: "Adultos", valor: adultos },
                    { label: "Crianças", valor: criancas }
                  ];
                  // Usar vermelho para recusados
                  return data.map((item, idx) => {
                    const percentual = total > 0 ? Math.round((item.valor / total) * 100) : 0;
                    return (
                      <div key={idx} className="mb-2">
                        <p className="text-sm">{item.label}: <strong>{item.valor}</strong> ({percentual}%)</p>
                        <div className="w-full h-3 bg-red-200 rounded-full">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${percentual}%` }}></div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              {/* 5. Reservados Detalhado */}
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">📋 Reservados por faixa</h3>
                {(() => {
                  const total = (Array.isArray(familias) ? familias : []).reduce((acc, f) => acc + (Array.isArray(f.convidados) ? f.convidados : []).filter(c => c.status === 0 || c.status === 1).length, 0);
                  const adultos = (Array.isArray(familias) ? familias : []).reduce((acc, f) => acc + (Array.isArray(f.convidados) ? f.convidados : []).filter(c => (c.status === 0 || c.status === 1) && (!c.crianca || (c.idade && c.idade > 10))).length, 0);
                  const criancas = (Array.isArray(familias) ? familias : []).reduce((acc, f) => acc + (Array.isArray(f.convidados) ? f.convidados : []).filter(c => (c.status === 0 || c.status === 1) && c.crianca).length, 0);
                  const data = [
                    { label: "Adultos", valor: adultos },
                    { label: "Crianças", valor: criancas }
                  ];
                  // Usar amarelo para reservados
                  return data.map((item, idx) => {
                    const percentual = total > 0 ? Math.round((item.valor / total) * 100) : 0;
                    return (
                      <div key={idx} className="mb-2">
                        <p className="text-sm">{item.label}: <strong>{item.valor}</strong> ({percentual}%)</p>
                        <div className="w-full h-3 bg-yellow-200 rounded-full">
                          <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${percentual}%` }}></div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              {/* 6. Pendentes por Faixa */}
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">🕗 Pendentes por Faixa</h3>
                {(() => {
                  const pendentes = (Array.isArray(familias) ? familias : []).reduce((acc, f) => acc + (Array.isArray(f.convidados) ? f.convidados : []).filter(c => c.status === 0).length, 0);
                  const adultos = (Array.isArray(familias) ? familias : []).reduce((acc, f) => acc + (Array.isArray(f.convidados) ? f.convidados : []).filter(c => c.status === 0 && (!c.crianca || (c.idade && c.idade > 10))).length, 0);
                  const criancas = pendentes - adultos;
                  const data = [
                    { label: "Adultos", valor: adultos },
                    { label: "Crianças", valor: criancas }
                  ];
                  // Usar laranja para pendentes
                  return data.map((item, idx) => {
                    const percentual = pendentes > 0 ? Math.round((item.valor / pendentes) * 100) : 0;
                    return (
                      <div key={idx} className="mb-2">
                        <p className="text-sm">{item.label}: <strong>{item.valor}</strong> ({percentual}%)</p>
                        <div className="w-full h-3 bg-orange-200 rounded-full">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${percentual}%` }}></div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LandingPage;