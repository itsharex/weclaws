import { AdminSandboxRuntimeConsole } from '@/components/admin/admin-sandbox-runtime-console';
import { PageHeader } from '@/components/layout/page-header';
import { resolveSrtPoolStatusFile } from '@/lib/env';
import { getMessages, getRequestLocale } from '@/lib/locale';
import { getRepositories } from '@/lib/repositories';
import { listAdminSandboxRuntimePools } from '@/lib/sandbox-runtime-admin';

export const dynamic = 'force-dynamic';

export default async function AdminSandboxRuntimePage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const data = await listAdminSandboxRuntimePools({
    repositories: getRepositories(),
    statusFilePath: resolveSrtPoolStatusFile(),
  });

  return (
    <section className="grid gap-8">
      <PageHeader
        description={messages.adminSandboxRuntime.pageDescription}
        title={messages.adminSandboxRuntime.pageTitle}
      />

      <AdminSandboxRuntimeConsole initialData={data} />
    </section>
  );
}
