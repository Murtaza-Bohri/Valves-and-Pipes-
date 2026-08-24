import { getCustomerSession } from "@/app/auth/actions";
import { ProfileForm } from "@/components/account/ProfileForm";

export default async function AccountPage() {
  const session = await getCustomerSession();

  return (
    <ProfileForm
      fullName={session?.profile?.full_name ?? ""}
      phone={session?.profile?.phone ?? ""}
    />
  );
}
