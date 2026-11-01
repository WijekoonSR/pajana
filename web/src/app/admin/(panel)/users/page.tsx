import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminFetch, getAdmin } from "@/lib/admin/api";
import { createUser, updateUser } from "@/lib/admin/actions/users";
import type { UserRow } from "@/lib/admin/types";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { input } from "@/components/admin/styles";
import { Badge, Card, Field, PageHeader, formatDateTime } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Admin users" };

export default async function UsersPage() {
  const me = await getAdmin();
  if (me.role !== "OWNER") notFound();
  const users = await adminFetch<UserRow[]>("/users");

  return (
    <>
      <PageHeader
        title="Admin users"
        description="Owners manage accounts and can do everything. Editors manage content only. There is no public sign-up."
      />

      <Card padded={false} className="mb-6">
        <ul className="divide-y divide-border/60">
          {users.map((u) => {
            const locked = u.lockedUntil && new Date(u.lockedUntil) > new Date();
            return (
              <li key={u.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-sm font-bold uppercase text-primary">
                    {u.login.slice(0, 1)}
                  </span>
                  <p className="font-semibold text-ink">{u.login}</p>
                  {u.id === me.id && <Badge tone="pink">You</Badge>}
                  <Badge tone={u.role === "OWNER" ? "night" : "slate"}>{u.role.toLowerCase()}</Badge>
                  {u.status === "DISABLED" && <Badge tone="red">Disabled</Badge>}
                  {locked && <Badge tone="amber">Locked until {formatDateTime(u.lockedUntil)}</Badge>}
                  <span className="ml-auto text-xs text-muted">Last sign-in: {formatDateTime(u.lastLoginAt)}</span>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-semibold text-primary">Manage</summary>
                  <ActionForm action={updateUser.bind(null, u.id)} className="mt-3 grid gap-3 rounded-xl bg-surface-2/30 p-4 sm:grid-cols-4 sm:items-end">
                    <Field label="Role" htmlFor={`role-${u.id}`}>
                      <select id={`role-${u.id}`} name="role" defaultValue={u.role} className={input}>
                        <option value="EDITOR">Editor</option>
                        <option value="OWNER">Owner</option>
                      </select>
                    </Field>
                    <Field label="Status" htmlFor={`status-${u.id}`}>
                      <select id={`status-${u.id}`} name="status" defaultValue={u.status} className={input}>
                        <option value="ACTIVE">Active</option>
                        <option value="DISABLED">Disabled</option>
                      </select>
                    </Field>
                    <Field label="Reset password (optional)" htmlFor={`pw-${u.id}`}>
                      <input id={`pw-${u.id}`} name="password" type="password" minLength={8} autoComplete="new-password" placeholder="Leave empty to keep" className={input} />
                    </Field>
                    <SubmitButton variant="small" className="h-9">Save</SubmitButton>
                  </ActionForm>
                </details>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="Add an account" description="Give each person their own login. Share the first password through a secure channel.">
        <ActionForm action={createUser} resetOnSuccess className="grid gap-4 sm:grid-cols-[1fr_1fr_160px_auto] sm:items-end">
          <Field label="Login or email" htmlFor="new-login">
            <input id="new-login" name="login" required autoComplete="off" autoCapitalize="none" className={input} />
          </Field>
          <Field label="Password" htmlFor="new-password">
            <input id="new-password" name="password" type="password" required minLength={8} autoComplete="new-password" className={input} />
          </Field>
          <Field label="Role" htmlFor="new-role">
            <select id="new-role" name="role" defaultValue="EDITOR" className={input}>
              <option value="EDITOR">Editor</option>
              <option value="OWNER">Owner</option>
            </select>
          </Field>
          <SubmitButton>Create</SubmitButton>
        </ActionForm>
      </Card>
    </>
  );
}
