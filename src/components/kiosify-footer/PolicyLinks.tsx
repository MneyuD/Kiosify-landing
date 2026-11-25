/**
 * Dải link chính sách dưới cùng footer.
 * Mặc định dùng thẻ <a>. Nếu web dùng react-router / Next.js, truyền renderLink:
 *   renderLink={l => <Link to={l.href}>{l.label}</Link>}       // react-router
 *   renderLink={l => <Link href={l.href}>{l.label}</Link>}     // next/link
 */
import { ReactNode } from 'react'

export interface PolicyLinkItem {
  label: string
  href: string
}

export const DEFAULT_POLICY_LINKS: PolicyLinkItem[] = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'SMS Program', href: '/sms' },
]

export const PolicyLinks = ({
  links = DEFAULT_POLICY_LINKS,
  renderLink,
  className = 'kf-policy-links',
}: {
  links?: PolicyLinkItem[]
  renderLink?: (item: PolicyLinkItem) => ReactNode
  className?: string
}) => (
  <nav aria-label="Policies" className={className}>
    {links.map(item =>
      renderLink ? (
        <span key={item.href}>{renderLink(item)}</span>
      ) : (
        <a key={item.href} href={item.href}>
          {item.label}
        </a>
      ),
    )}
  </nav>
)

export default PolicyLinks
