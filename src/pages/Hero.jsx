import { Calendar, Clock, Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react';
import config from '@/config/config';
import { formatEventDate } from '@/lib/formatEventDate';
import { Helmet } from 'react-helmet'; // Adicionado para preload das imagens
import foto1 from '../photos/foto1.JPG';
import foto2 from '../photos/foto4.JPG';
import foto3 from '../photos/foto5.JPG';
import logoPUC from '../photos/logo-puc.png';

const images = [foto1, foto2, foto3];

export default function Hero({ convidados = [] }) {
    const [mainEmoji, setMainEmoji] = useState("🎓");
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 5000);
      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const sequence = ["🎓", "🎓"];
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % sequence.length;
            setMainEmoji(sequence[index]);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

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
                        className="flex flex-col items-center p-3 bg-[#6B4C3B] rounded-xl border border-[#6B4C3B] transition-all duration-500"
                    >
                        <span className="text-xl sm:text-2xl font-['TexGyreTermes'] font-bold text-white">
                            {timeLeft[interval]}
                        </span>
                        <span className="text-xs text-white capitalize font-['TexGyreTermes']">{interval}</span>
                    </div>
                ))}
            </div>
        );
    };

    const FloatingHearts = () => {
        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{
                            opacity: 0,
                            scale: 0,
                            x: Math.random() * window.innerWidth,
                            y: window.innerHeight
                        }}
                        animate={{
                            opacity: [0, 1, 1, 0],
                            scale: [0, 1, 1, 0.5],
                            x: Math.random() * window.innerWidth,
                            y: -100
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            delay: i * 0.8,
                            ease: "easeOut"
                        }}
                        className="absolute"
                    >
                        <Heart
                            className={`w-${Math.floor(Math.random() * 2) + 8} h-${Math.floor(Math.random() * 2) + 8} ${i % 3 === 0 ? 'text-[#CFAA93]' :
                                i % 3 === 1 ? 'text-[#CFAA93]' :
                                    'text-[#CFAA93]'
                                }`}
                            fill="currentColor"
                        />
                    </motion.div>
                ))}
            </div>
        );
    };

    return (
        <>
            <Helmet>
              <link rel="preload" as="image" href={foto1} />
              <link rel="preload" as="image" href={foto2} />
              <link rel="preload" as="image" href={foto3} />
            </Helmet>
            <section id="home" className="min-h-screen flex flex-col items-center justify-center px-4 py-16 sm:py-20 text-center relative overflow-hidden">
                {import.meta.env.VITE_AMBIENTE === 'HML' && (
                    <div className="bg-red-600 text-white text-center py-4 px-4 mb-6 shadow-md w-full">
                        <h2 className="text-lg sm:text-2xl font-['TexGyreTermes'] font-bold uppercase">AMBIENTE DE HOMOLOGAÇÃO</h2>
                        <p className="text-xs sm:text-sm mt-1 font-['TexGyreTermes']">
                          Esta página é destinada apenas para testes. As confirmações feitas aqui não afetarão a lista oficial de convidados.
                        </p>
                    </div>
                )}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-6 relative z-10"
                >
                    <img src={logoPUC} alt="Logo PUC" className="h-16 sm:h-20 mx-auto mb-4" />
                    <motion.h2
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-4xl sm:text-5xl font-['Alex_Brush'] text-[#CFAA93]"
                        >
                            João Pedro Vargas da Silva
                        </motion.h2>
                        
                        

                    <div className="space-y-4">
                    <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                            className="text-[#CFAA93] max-w-md mx-auto space-y-2 font-['TexGyreTermes']"
                        >
                      <p className="text-center font-['TexGyreTermes'] text-[#CFAA93] text-[11px]">
                            E SUA FAMÍLIA SENTEM-SE HONRADOS EM CONVIDÁ-LOS PARA A RECEPÇÃO DE SUA FORMATURA EM
                            </p>
                            
                        </motion.div>
                        <motion.h2
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-2xl sm:text-5xl font-['Alex_Brush'] text-[28px] text-[#CFAA93]"
                        >
                            Análise e Desenvolvimento de Sistemas
                        </motion.h2>

                        <div className="relative flex justify-center mt-8">
                        <motion.img
                            key={currentImageIndex}
                            src={images[currentImageIndex]}
                            alt="Foto do formando"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                            className="w-full max-w-2xl h-auto rounded-xl object-cover shadow-md border-4 border-[#CFAA93]"
                          />
                        </div>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-[#CFAA93] font-['TexGyreTermes'] font-light italic text-base sm:text-lg"
                        >
                           Quero comemorar esta conquista com você!
                        </motion.p>
                        <CountdownTimer targetDate={config.data.date} />
                        
                    </div>

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-block mx-auto"
                    >
                        <span className="px-4 py-1 text-sm bg-[#6B4C3B] text-[#FFF] rounded-full border border-[#6B4C3B]">
                            #SaveTheDate 🎓
                        </span>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="relative max-w-md mx-auto"
                    >
                        <div className="absolute inset-0 rounded-2xl" />

                        <div className="relative px-4 sm:px-8 py-8 sm:py-10 rounded-2xl border border-[#CFAA93]/50">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px">
                                <div className="w-20 sm:w-32 h-[2px] bg-gradient-to-r from-transparent via-[#CFAA93] to-transparent" />
                            </div>

                            <div className="space-y-6 text-center">
                                <div className="space-y-3">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.9 }}
                                        className="flex items-center justify-center space-x-2"
                                    >
                                        <Calendar className="w-4 h-4 text-[#CFAA93]" />
                                        <span className="text-[#CFAA93] font-['TexGyreTermes'] font-medium text-sm sm:text-base">
                                            {formatEventDate(config.data.date, "full")}
                                        </span>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 }}
                                        className="flex items-center justify-center space-x-2"
                                    >
                                        <Clock className="w-4 h-4 text-[#CFAA93]" />
                                        <span className="text-[#CFAA93] font-['TexGyreTermes'] font-medium text-sm sm:text-base">
                                            {config.data.time}
                                        </span>
                                    </motion.div>
                                </div>

                                <div className="flex items-center justify-center gap-3">
                                    <div className="h-px w-8 sm:w-12 bg-[#CFAA93]/50" />
                                    <div className="w-2 h-2 rounded-full bg-[#CFAA93]" />
                                    <div className="h-px w-8 sm:w-12 bg-[#CFAA93]/50" />
                                </div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.1 }}
                                    className="space-y-2"
                                >
                                        <p className="text-[#CFAA93] font-['TexGyreTermes'] font-serif italic text-sm">
                                          {convidados.length > 1 ? "Queridos" : "Querido"}
                                        </p>
                                        <p className="text-[#CFAA93] font-['TexGyreTermes'] font-semibold text-xl sm:text-2xl">
                                          {convidados.map((c, i) => {
                                            const isLast = i === convidados.length - 1;
                                            const isSecondLast = i === convidados.length - 2;
                                            return `${c.nome}${isLast ? '.' : isSecondLast ? ' e ' : ', '}`;
                                          }).join('')}
                                        </p>
                                </motion.div>
                            </div>

                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-px">
                                <div className="w-20 sm:w-32 h-[2px] bg-gradient-to-r from-transparent via-[#CFAA93] to-transparent" />
                            </div>
                        </div>

                        <div className="absolute -top-2 -right-2 w-16 sm:w-24 h-16 sm:h-24 bg-[#CFAA93]/20 rounded-full blur-xl" />
                        <div className="absolute -bottom-2 -left-2 w-16 sm:w-24 h-16 sm:h-24 bg-[#CFAA93]/20 rounded-full blur-xl" />
                    </motion.div>   
                </motion.div>
            </section>
        </>
    )
}
