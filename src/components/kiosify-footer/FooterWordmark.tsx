/**
 * Chữ KIOSIFY lớn ở đáy footer: từng chữ trượt lên khi cuộn tới,
 * glow + đường cung sáng dần theo vị trí cuộn. Tôn trọng prefers-reduced-motion.
 * (Bản gốc dùng styled-components — ở đây chuyển sang class CSS trong kiosify-footer.css)
 */
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { useRef } from 'react'

const WORD = 'KIOSIFY'
const EASE = [0.22, 1, 0.36, 1] as const

export const FooterWordmark = () => {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  // Theo dõi cả khối: các chữ bắt đầu bị cắt dưới đáy nên tự chúng không "in view" được
  const inView = useInView(ref, { once: true, amount: 0.35 })

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end end'],
  })
  const glowOpacity = useTransform(scrollYProgress, [0, 1], [0, 1])
  const arcY = useTransform(scrollYProgress, [0, 1], ['40%', '0%'])

  return (
    <div className="kf-wordmark" ref={ref} aria-hidden="true">
      <motion.div
        className="kf-wordmark__glow"
        style={reduce ? undefined : { opacity: glowOpacity }}
      />
      <motion.div
        className="kf-wordmark__arc"
        style={reduce ? undefined : { y: arcY }}
      />
      <div className="kf-wordmark__word">
        {WORD.split('').map((char, i) => (
          <motion.span
            key={`${char}-${i}`}
            className="kf-wordmark__letter"
            initial={reduce ? false : { y: '70%', opacity: 0 }}
            animate={inView ? { y: '0%', opacity: 1 } : undefined}
            transition={{ duration: 0.9, ease: EASE, delay: i * 0.07 }}
          >
            {char}
          </motion.span>
        ))}
      </div>
    </div>
  )
}

export default FooterWordmark
