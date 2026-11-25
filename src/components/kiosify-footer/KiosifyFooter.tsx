/**
 * KiosifyFooter — from kiosify-footer-export/standalone (kiot-master landing footer).
 * The newsletter block ("Sign Up For A Free Trial", "Subcribe to our newsletter…",
 * email input and "Get for free" button) is removed on this landing page —
 * the sign-up section right above the footer already covers it.
 */
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { ReactNode, useRef } from 'react'
import FooterWordmark from './FooterWordmark'
import PolicyLinks, { PolicyLinkItem } from './PolicyLinks'
import './kiosify-footer.css'

import imgCardFooter from './assets/img_card_footer.png'
import logo from './assets/ic_new_logo.png'
import logoWhite from './assets/ic_new_logo_white.png'

const EASE = [0.22, 1, 0.36, 1] as const

export interface KiosifyFooterProps {
  /** Use the white logo on dark backgrounds */
  theme?: 'light' | 'dark'
  /** Policy links — defaults to /privacy, /terms, /sms */
  policyLinks?: PolicyLinkItem[]
  /** Pass a router Link for SPA navigation */
  renderLink?: (item: PolicyLinkItem) => ReactNode
  /** Override texts */
  texts?: Partial<typeof DEFAULT_TEXTS>
  /** Hide the big KIOSIFY wordmark */
  hideWordmark?: boolean
}

const DEFAULT_TEXTS = {
  tagline: 'Kiosify: Elevate Your Customer Experience with Self-Service',
  copyright: 'Kiosify Copyright © 2024',
}

/** Fade + slide up when scrolled into view */
const Reveal = ({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.2 })
  const reduce = useReducedMotion()
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduce ? false : { opacity: 0, y: 30 }}
      animate={inView || reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

export const KiosifyFooter = ({ theme = 'light', policyLinks, renderLink, texts, hideWordmark }: KiosifyFooterProps) => {
  const t = { ...DEFAULT_TEXTS, ...texts }

  return (
    <footer className="kf-footer">
      <section className="kf-root">
        {/* Brand + card */}
        <div className="kf-showcase">
          <Reveal delay={0.25} className="kf-brand">
            <img src={theme === 'dark' ? logoWhite : logo} alt="Kiosify" width={100} />
            <p className="kf-tagline">{t.tagline}</p>
          </Reveal>
          <Reveal delay={0.1} className="kf-card">
            <img
              src={imgCardFooter}
              alt="We offer convenience for time management. Streamline sales, skip the line, boost growth!"
            />
          </Reveal>
        </div>

        {/* Copyright */}
        <Reveal delay={0.4} className="kf-bottom">
          <span>{t.copyright}</span>
        </Reveal>
      </section>

      {!hideWordmark && <FooterWordmark />}

      <PolicyLinks links={policyLinks} renderLink={renderLink} />
    </footer>
  )
}

export default KiosifyFooter
