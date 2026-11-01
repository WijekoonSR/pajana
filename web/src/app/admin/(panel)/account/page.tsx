import type { Metadata } from "next";
import { getAdmin } from "@/lib/admin/api";
import { changePassword } from "@/lib/admin/actions/auth";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { input } from "@/components/admin/styles";
import { Badge, Card, Field, PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const me = await getAdmin();
  return (
    <>
      <PageHeader title="My account" />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card title="Signed in as">
          <p className="text-lg font-semibold text-ink">{me.login}</p>
          <p className="mt-2"><Badge tone={me.role === "OWNER" ? "night" : "slate"}>{me.role.toLowerCase()}</Badge></p>
          <p className="mt-4 text-xs text-muted">
            Sessions last 12 hours. After 5 wrong passwords an account is locked for 15 minutes.
          </p>
        </Card>
        <Card title="Change password" description="At least 8 characters. Your other devices will be signed out.">
          <ActionForm action={changePassword} resetOnSuccess className="space-y-4">
            <Field label="Current password" htmlFor="currentPassword">
              <input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" className={input} />
            </Field>
            <Field label="New password" htmlFor="newPassword">
              <input id="newPassword" name="newPassword" type="password" required minLength={8} autoComplete="new-password" className={input} />
            </Field>
            <Field label="Confirm new password" htmlFor="confirmPassword">
              <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className={input} />
            </Field>
            <SubmitButton>Change password</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
