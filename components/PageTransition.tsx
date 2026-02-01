'use client'

import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}

const transition = { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.main
        id="main-content"
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={transition}
        className="min-h-full"
        aria-live="polite"
        aria-label="Main content"
        tabIndex={-1}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  )
}
