import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/layout/auth-shell';
import { SignInForm } from '@/components/auth/sign-in-form';
import { getMessages, getRequestLocale } from '@/lib/locale';
import { getServerSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
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
      eyebrow={messages.auth.accessEyebrow}
      footer={(
        <>
          {messages.auth.needAccount} <Link href="/register">{messages.auth.createOne}</Link>
        </>
      )}
      heroDescription={messages.auth.heroDescription}
      heroHighlights={heroHighlights}
      heroTitle={messages.auth.heroTitle}
      subtitle={messages.auth.signInSubtitle}
      title={messages.auth.signIn}
    >
      <SignInForm />
    </AuthShell>
  );
}
