/**
 * Trang chính sách (Privacy / Terms / SMS) — bản standalone của
 * kiot-master/src/app/page/landing-page/policies.tsx.
 * Không phụ thuộc router: link nội bộ là thẻ <a>. Gắn vào route:
 *   /privacy -> <PolicyPage kind="privacy" />
 *   /terms   -> <PolicyPage kind="terms" />
 *   /sms     -> <PolicyPage kind="sms" />
 * Nội dung pháp lý giữ NGUYÊN văn bản gốc — không tự ý sửa.
 */
import { useEffect } from 'react'
import { AnchorHTMLAttributes } from 'react'
import { PolicyLinks as BasePolicyLinks } from './PolicyLinks'
import './policies.css'
import { SMS_CONSENT_DISCLOSURE, SMS_CONSENT_LABEL } from './sms-consent'



/* Thay bằng Link của router nếu muốn điều hướng SPA */
const Link = ({
  to,
  ...rest
}: { to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a href={to} {...rest} />
)

const PolicyLinks = () => <BasePolicyLinks className="policy-links" />

export const PolicyPage = ({ kind }: { kind: 'privacy' | 'terms' | 'sms' }) => {
  const title = {
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    sms: 'Kiosify Order Updates by SMS',
  }[kind]

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = title
  }, [kind, title])

  return (
    <article className="policy-page">
      <Link to="/" className="policy-home">Kiosify / Policies</Link>
      <h1>{title}</h1>
      <p className="policy-updated">Effective October 27, 2026</p>
      <PolicyLinks />
      {kind === 'privacy' && <PrivacyContent />}
      {kind === 'terms' && <TermsContent />}
      {kind === 'sms' && <SmsContent />}
    </article>
  )
}

const Support = () => (
  <p>
    For questions about an order or to request help with your personal information,
    contact the restaurant using the contact details on your receipt. Restaurant
    operators can contact Kiosify through their existing account support channel.
    For SMS assistance, reply HELP to a message you receive.
  </p>
)

const PrivacyContent = () => (
  <>
    <p>
      Kiosify provides self-service ordering and restaurant management software.
      This policy describes information used to operate our website, merchant
      accounts, orders, and transactional messaging. The restaurant where you order
      may also have its own privacy policy.
    </p>
    <h2>Information we collect</h2>
    <p>
      Depending on the service you use, we collect account and business contact
      details, order details, the name and phone number you provide, payment
      references, device and technical logs, and messaging records such as message
      content, delivery status, and opt-out requests. Payment processors handle
      payment credentials according to their own privacy policies.
    </p>
    <h2>How we use information</h2>
    <p>
      We use information to manage accounts, process and fulfill orders, provide
      receipts and support, deliver requested order updates, operate and secure
      the service, investigate errors, and meet applicable obligations.
    </p>
    <h2>SMS consent and mobile information</h2>
    <p>
      Providing a phone number alone does not constitute consent to SMS. Order
      updates require a separate, affirmative choice. SMS consent is optional and
      is not a condition of purchase. Messages relate to order confirmation and
      pickup readiness; consent for these messages does not authorize marketing.
    </p>
    <p>
      We do not sell or share mobile phone numbers, SMS opt-in data, or consent
      records with third parties or affiliates for marketing or promotional
      purposes. We share information with service providers only as needed to
      operate the program, such as Twilio and telecommunications carriers that
      deliver messages, subject to appropriate confidentiality obligations.
    </p>
    <p>
      All the above categories exclude text messaging originator opt-in data and
      consent; this information won’t be shared with any third parties.
    </p>
    <h2>Service providers and disclosures</h2>
    <p>
      Information may be processed by the restaurant fulfilling your order and
      providers supporting hosting, payments, messaging, and service operation.
      Processing may occur outside your country. We may also disclose information
      when required by law or to protect the service and its users.
    </p>
    <h2>Retention and security</h2>
    <p>
      We retain information as needed for service operation, order support,
      recordkeeping, resolving disputes, and applicable obligations. Opt-out and
      consent records may be retained to honor messaging preferences. We use
      access controls and technical safeguards; no system guarantees absolute
      security.
    </p>
    <h2>Your choices</h2>
    <p>
      You can decline SMS and still place an order. Reply STOP to unsubscribe from
      the messaging program. Where applicable, you may request access, correction,
      or deletion of your information, subject to verification and lawful
      retention requirements. Stopping SMS does not cancel an order.
    </p>
    <h2>Contact and changes</h2>
    <Support />
    <p>
      Updates to this policy will appear on this page with a revised effective
      date. See our <Link to="/terms">Terms of Service</Link> and{' '}
      <Link to="/sms">SMS Program</Link> for messaging details.
    </p>
  </>
)

const SmsTerms = () => (
  <>
    <h2>Optional transactional SMS</h2>
    <p>
      The Kiosify Order Updates program provides order confirmation and pickup
      readiness notifications for participating restaurants. It does not include
      promotional messages. Enrollment requires your affirmative consent to the
      SMS program; entering a phone number or accepting general terms alone does
      not enroll you. Consent is not a condition of purchase.
    </p>
    <p>
      Message frequency varies with your orders and their status. Message and
      data rates may apply. Messages may identify the restaurant and Kiosify.
      Wireless carriers are not liable for delayed or undelivered messages.
      Delivery is not guaranteed; use the restaurant's pickup display or contact
      the restaurant if you do not receive an update.
    </p>
    <h2>STOP and HELP</h2>
    <p>
      Reply STOP to unsubscribe. You may receive a final confirmation of your
      opt-out. Reply HELP for assistance. An opt-out applies to the messaging
      program associated with the sending number. It does not cancel your order.
      Replying START can remove a sender-level block, but does not replace any
      separate order consent required by the restaurant.
    </p>
    <p>
      Provide only a phone number you own or are authorized to use. Your SMS
      consent and mobile information are handled as described in our{' '}
      <Link to="/privacy">Privacy Policy</Link>.
    </p>
  </>
)

const TermsContent = () => (
  <>
    <p>
      These terms describe use of Kiosify's website, self-service ordering
      software, and order messaging program. Any separate signed agreement with
      a restaurant operator continues to govern that operator's services.
    </p>
    <h2>Using Kiosify</h2>
    <p>
      Provide accurate information, protect account credentials, and use the
      service only for authorized and lawful purposes. Do not misuse another
      person's contact information, interfere with the service, or use messaging
      for unsolicited or prohibited content.
    </p>
    <h2>Orders and payments</h2>
    <p>
      The participating restaurant is responsible for its products, prices,
      preparation, fulfillment, and order-related assistance. Review order and
      payment details before confirming. Contact the restaurant regarding changes,
      cancellations, refunds, or food and allergen questions. Messaging enrollment
      does not change the restaurant's order or refund policies.
    </p>
    <SmsTerms />
    <h2>Availability and updates</h2>
    <p>
      Service availability can be affected by maintenance, connectivity, and
      third-party providers. We may update the service and these terms. Changes
      to the messaging purpose do not expand the scope of an existing SMS consent.
      These terms do not limit rights that cannot be limited under applicable law.
    </p>
    <h2>Contact</h2>
    <Support />
  </>
)

const SmsContent = () => (
  <>
    <p>
      Read about optional text updates for orders placed through Kiosify. This is
      an information page: visiting it does not enroll you or send a text message.
    </p>
    <h2>Your choice at checkout</h2>
    <p>
      When SMS updates are offered at checkout, the SMS choice must start
      unchecked and remain separate from acceptance of general terms. You can
      leave it unchecked and still complete your purchase. Providing a contact
      number alone does not subscribe you to SMS. If a number is collected only
      for text updates, you can leave it blank when declining SMS.
    </p>
    <p>
      The following describes the optional SMS choice. This page does not collect
      your number, place an order, or record consent.
    </p>
    <blockquote>
      <strong>{SMS_CONSENT_LABEL}</strong>
      <p>{SMS_CONSENT_DISCLOSURE}</p>
      <Link to="/privacy">Privacy Policy</Link>{' · '}
      <Link to="/terms">Terms of Service</Link>
    </blockquote>
    <SmsTerms />
    <h2>What messages look like</h2>
    <blockquote>
      Kiosify / Restaurant: Order #1001 is ready for pickup at the counter.
      Reply STOP to opt out. Reply HELP for help.
    </blockquote>
    <p>
      This is an illustrative message. Your actual update contains the restaurant
      and order details. SMS availability depends on the restaurant, your consent,
      and completion of sender verification.
    </p>
    <h2 id="help">Need help?</h2>
    <Support />
  </>
)
