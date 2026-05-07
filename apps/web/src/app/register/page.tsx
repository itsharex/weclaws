import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/layout/auth-shell';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { getMessages, getRequestLocale } from '@/lib/locale';
import { getServerSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const session = await getServerSession();
  const heroHighlights = [
    messages.auth.heroFeatureMultiAssistant,
    messages.auth.heroFeatureCloudHosted,
    messages.auth.heroFeatureWeixin,
    messages.auth.heroFeatureMediaAutomation,
  ] as const;

  if (session) {
    redirect('/bots');
  }

  return (
    <AuthShell
      eyebrow={messages.auth.createAccessEyebrow}
      footer={(
        <>
          {messages.auth.alreadyRegistered} <Link href="/login">{messages.auth.signInLink}</Link>
        </>
      )}
      heroDescription={messages.auth.heroDescription}
      heroHighlights={heroHighlights}
      heroTitle={messages.auth.heroTitle}
      subtitle={messages.auth.signUpSubtitle}
      title={messages.auth.signUp}
    >
      <SignUpForm />
    </AuthShell>
  );
}
