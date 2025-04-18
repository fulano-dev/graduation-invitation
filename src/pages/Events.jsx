import EventCards from '@/components/EventsCard'
import config from '@/config/config'
import { motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'

export default function Events() {
    return (
        <>
            {/* Seção de Eventos */}
            <section id="event" className="min-h-screen relative overflow-hidden">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 container mx-auto px-4 py-20"
                >
                    {/* Cabeçalho da Seção */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center space-y-4 mb-16"
                    >
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="inline-block text-[#CFAA93] font-['TexGyreTermes'] mb-2"
                        >
                            Espero por você!
                        </motion.span>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="text-6xl md:text-5xl font-['Alex_Brush'] text-[#CFAA93] leading-tight"
                        >
                            Informações
                        </motion.h2>

                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="inline-block text-[#CFAA93] font-['TexGyreTermes'] mb-2 text-[25px]"
                        >
                            Traje Passeio Completo
                        </motion.span>

                        {/* Linha decorativa */}
                        <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center justify-center gap-4 mt-6"
                        >
                            <div className="h-[1px] w-12 bg-[#CFAA93]" />
                            <div className="text-[#CFAA93]">
                                <GraduationCap className="w-4 h-4" />
                            </div>
                            <div className="h-[1px] w-12 bg-[#CFAA93]" />
                        </motion.div>
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="inline-block text-[#CFAA93] font-['TexGyreTermes'] mb-2 text-[20px]"
                        >
                            Confirme presença na recepção até 30/07/2025
                        </motion.span>
                    </motion.div>

                    {/* Grade de Eventos */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="max-w-2xl mx-auto"
                    >
                        
                        <EventCards events={config.data.agenda} />
                    </motion.div>
                </motion.div>
            </section>
        </>
    )
}