import type { Metadata } from "next";
import styles from "@/app/privacy/privacy.module.css";
import SiteShell from "@/components/SiteShell";
import site from "@/components/site.module.css";
import { paths } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Privacy policy - Trackly",
  description: "What data the Trackly extension collects, why, and what happens to it.",
  alternates: {
    canonical: "/en/privacy",
    languages: { pl: "/privacy", en: "/en/privacy", "x-default": "/privacy" },
  },
  openGraph: {
    title: "Privacy policy - Trackly",
    description: "What data the Trackly extension collects, why, and what happens to it.",
    url: "/en/privacy",
    siteName: "Trackly",
    locale: "en_US",
    type: "website",
    images: [{ url: "/og-en.png", width: 1200, height: 630, alt: "Trackly" }],
  },
};

export default function PrivacyEn() {
  return (
    <SiteShell lang="en" alternateHref={paths.pl.privacy}>
      <main className={site.main} id={paths.en.content}>
        <div className={site.shell}>
          <div className={styles.doc}>
            <a className={styles.back} href={paths.en.home}>
              ← Back to the home page
            </a>

            <h1 className={styles.title}>Privacy policy</h1>
            <p className={styles.updated}>Last updated: October 1, 2026</p>

            <div className={styles.body}>
              <p>
                Trackly is a browser extension that helps you keep track of your subscriptions.
                This document explains what data we collect, why, and what happens to it. We tried
                to write it so that you can read it without a lawyer.
              </p>

              <h2>What we don&apos;t collect</h2>
              <p>We start with this because it matters most:</p>
              <ul>
                <li>
                  <strong>We don&apos;t collect your browsing history.</strong> We don&apos;t know
                  which sites you visit.
                </li>
                <li>
                  <strong>We don&apos;t send page content.</strong> Subscriptions are recognised
                  entirely on your computer, and the text of a page never leaves your browser.
                </li>
                <li>
                  <strong>We don&apos;t collect payment details.</strong> Trackly has no access to
                  your card numbers or to your accounts with the services.
                </li>
                <li>
                  <strong>We don&apos;t sell data</strong> and we don&apos;t share it with
                  advertisers.
                </li>
              </ul>

              <h2>What we collect</h2>
              <p>
                <strong>Your email address and Google account ID.</strong> We receive them when you
                sign in with Google. They are used only to recognise you and to link your
                subscriptions to your account. We don&apos;t fetch your profile picture, your
                contacts or anything else from your Google account.
              </p>
              <p>
                <strong>The subscriptions you save.</strong> When you confirm a subscription, we
                store the service name, plan name, price, currency, billing cycle, renewal date and
                whether it renews automatically. Nothing else. The address of the page where the
                subscription was detected stays in your browser.
              </p>
              <p>
                <strong>Data stored locally in your browser.</strong> Your session token, a copy of
                your subscription list so the panel opens straight away, detected subscriptions
                waiting for your confirmation, a record of which services we have already asked
                about, and your reminder settings. Only the token is sent to the server, attached to
                requests so the server knows it&apos;s you. The token and the copy of the list are
                removed when you sign out, and everything is removed when you uninstall the
                extension.
              </p>
              <p>
                <strong>Reminders.</strong> If you turn them on, the extension fetches your
                subscription list from our server once a day and checks on its own whether anything
                is about to renew. The notification is shown by your browser on your computer,
                without any third-party service.
              </p>

              <h2>Why the extension asks for permissions</h2>
              <ul>
                <li>
                  <strong>Access to selected sites:</strong> the extension only runs on a list of
                  specific subscription services, not on every website. It needs this to recognise a
                  subscription at the moment you buy it.
                </li>
                <li>
                  <strong>Local storage:</strong> to keep your session and data between browser
                  sessions.
                </li>
                <li>
                  <strong>Identity:</strong> to sign in with your Google account.
                </li>
                <li>
                  <strong>Alarms:</strong> to check once a day whether a renewal is coming up, when
                  reminders are turned on.
                </li>
                <li>
                  <strong>Notifications:</strong> we only ask for this permission when you turn on
                  reminders.
                </li>
              </ul>

              <h2 id="waitlist">Mobile app waitlist</h2>
              <p>
                On tracklyapp.pl you can join the list of people who want to hear when the Trackly
                mobile app launches. We then store your email address, the language of the page and
                the date you signed up. We do this based on your consent and use this data only to
                tell you about the app launch and to invite you to early access.
              </p>
              <p>
                You can withdraw your consent at any time by writing to the address below or replying
                to our email. Withdrawing consent doesn&apos;t affect the lawfulness of processing
                before the withdrawal.
              </p>

              <h2>Who we share data with</h2>
              <p>We use three third-party services:</p>
              <ul>
                <li>
                  <strong>Google</strong> handles sign-in. We check with Google that the sign-in
                  token is genuine and receive your email address.
                </li>
                <li>
                  <strong>Vercel</strong> runs the website and the application server that requests
                  from the extension and the waitlist form go through.
                </li>
                <li>
                  <strong>Supabase</strong> hosts the database with your account, saved subscriptions
                  and the waitlist.
                </li>
              </ul>
              <p>
                Vercel and Supabase process data only so that Trackly can work. Their servers may be
                located outside the European Economic Area. We don&apos;t use analytics or
                advertising tools.
              </p>

              <h2>How long we keep data</h2>
              <p>
                We keep your subscriptions for as long as you use your account. You can delete any
                subscription at any time in the extension panel.
              </p>
              <p>
                We delete waitlist addresses once we have sent the app launch email, or earlier if you
                withdraw your consent.
              </p>

              <h2>Your rights</h2>
              <p>
                You can ask to access your data, correct it or delete your whole account. Just write
                to the address below. We reply as quickly as we can.
              </p>

              <h2>Changes to this document</h2>
              <p>
                If we change how we process data, we will update this page and the date at the top.
              </p>

              <h2>Contact</h2>
              <p>
                Send privacy questions to{" "}
                <a href="mailto:kontakt@tracklyapp.pl">kontakt@tracklyapp.pl</a>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
