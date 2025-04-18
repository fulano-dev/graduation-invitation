import logoPuc from '@/photos/logo-puc.png';
import backgroundImg from '@/photos/foto-background.jpeg';
import config from '@/config/config';
import { useState } from 'react';
import { formatEventDate } from '@/lib/formatEventDate';
import { motion } from 'framer-motion';

const LandingPage = ({ onOpenInvitation }) => {
  const [code, setCode] = useState('');

  const handleEnter = () => {
    if (code.length === 4) {
      // Aqui futuramente será feita uma requisição ao backend
      onOpenInvitation();
    } else {
      alert('Por favor, digite um código válido de 4 dígitos.');
    }
  };

  return (
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
                    Digite o código que está no verso do cartão com o QRCode.
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
  );
};

export default LandingPage;
