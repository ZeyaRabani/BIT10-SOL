"use client";

import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { ChevronsUpIcon } from 'lucide-react';

export default function ScrollToTopBtn() {
    const [showButton, setShowButton] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, 'change', (latest) => {
        if (latest > 400) {
            setShowButton(true);
        } else {
            setShowButton(false);
        }
    });

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <motion.button
            initial={{ opacity: 0, y: 40 }}
            animate={showButton ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className='fixed bottom-4 right-4 md:bottom-20 md:right-14 z-48 cursor-pointer bg-accent border-2 border-primary rounded-full p-2 outline-none' onClick={scrollToTop}>
            <ChevronsUpIcon />
        </motion.button>
    );
}
