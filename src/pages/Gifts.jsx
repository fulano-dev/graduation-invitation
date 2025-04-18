import config from '@/config/config';
import { motion } from 'framer-motion'
import {
    Copy,
    Gift,
    CheckCircle,
    Wallet,
    Building2,
} from 'lucide-react'
import { useState, useEffect } from 'react';

export default function Gifts() {
    const [copiedAccount, setCopiedAccount] = useState(null);
    const [hasAnimated, setHasAnimated] = useState(false);
    
    useEffect(() => {
        setHasAnimated(true);
    }, []);
    
    const copyToClipboard = (text, bank) => {
        navigator.clipboard.writeText(text);
        setCopiedAccount(bank);
        setTimeout(() => setCopiedAccount(null), 2000);
    };
    
    return (
        <>
        <section id="gifts" className="min-h-screen relative overflow-hidden">
            <div className="container mx-auto px-4 py-20 relative z-10">
                {/* Cabeçalho da seção */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                    className="text-center space-y-4 mb-16"
                >
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.2 }}
                        className="inline-block text-[#CFAA93] font-['TexGyreTermes']"
                    >
                        Contamos com você
                    </motion.span>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.3 }}
                        className="text-4xl md:text-5xl font-['Alex_Brush'] text-[#CFAA93]"
                    >
                        Confirmar Presença
                    </motion.h2>

                    {/* Divisor decorativo */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={hasAnimated ? { scale: 1 } : {}}
                        transition={{ delay: 0.4 }}
                        className="flex items-center justify-center gap-4 pt-4"
                    >
                        <div className="h-[1px] w-12 bg-[#CFAA93]/50" />
                        <Gift className="w-5 h-5 text-[#CFAA93]" />
                        <div className="h-[1px] w-12 bg-[#CFAA93]/50" />
                    </motion.div>

                    {/* Mensagem principal */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={hasAnimated ? { opacity: 1 } : {}}
                        transition={{ delay: 0.5 }}
                        className="space-y-4 max-w-md mx-auto"
                    >

                        <p className="text-[#CFAA93] font-['TexGyreTermes'] leading-relaxed">
                        Nossa celebração será intimista, com as pessoas que mais amamos e você é uma delas!!
</p>
                    </motion.div>

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={hasAnimated ? { scale: 1 } : {}}
                        transition={{ delay: 0.6 }}
                        className="flex items-center justify-center gap-3 pt-4"
                    >
                        <div className="h-px w-8 bg-[#CFAA93]/50" />
                        <div className="w-1.5 h-1.5 rounded-full bg-[#CFAA93]" />
                        <div className="h-px w-8 bg-[#CFAA93]/50" />
                    </motion.div>
                </motion.div>

            </div>
            
            
        </section>
        </>
    );
}