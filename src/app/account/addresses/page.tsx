import { getCustomerAddresses } from "@/app/auth/actions";
import { AddressesManager } from "@/components/account/AddressesManager";
import type { DbAddress } from "@/types/database";

export default async function AccountAddressesPage() {
  const addresses = (await getCustomerAddresses()) as DbAddress[];

  return <AddressesManager addresses={addresses} />;
}
