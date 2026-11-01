import type { Metadata } from "next";
import Link from "next/link";
import { createProfile } from "@/lib/admin/actions/profiles";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { ChevronLeft } from "@/components/admin/icons";
import { Card, PageHeader } from "@/components/admin/ui";
import { ProfileFields } from "../profile-fields";

export const metadata: Metadata = { title: "New profile" };

export default function NewProfilePage() {
  return (
    <>
      <PageHeader
        back={<BackLink />}
        title="New profile"
        description="Profiles start as drafts. Add photos on the next screen, then publish when ready."
      />
      <ActionForm action={createProfile}>
        <Card>
          <ProfileFields />
          <div className="mt-6 flex justify-end">
            <SubmitButton>Create draft</SubmitButton>
          </div>
        </Card>
      </ActionForm>
    </>
  );
}

function BackLink() {
  return (
    <Link href="/admin/profiles" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-primary">
      <ChevronLeft width={16} height={16} /> Profiles
    </Link>
  );
}
