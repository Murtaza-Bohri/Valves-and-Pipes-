"use client";

import { useActionState } from "react";
import { saveCustomerAddress, type AuthActionState } from "@/app/auth/actions";
import type { DbAddress } from "@/types/database";

const initialState: AuthActionState = {};

export function AddressesManager({ addresses }: { addresses: DbAddress[] }) {
  const [state, action, pending] = useActionState(saveCustomerAddress, initialState);

  return (
    <div className="space-y-8">
      {addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((address) => (
            <article key={address.id} className="border border-[#e8e8e8] bg-white p-4 text-sm">
              <p className="font-semibold text-[#141414]">{address.full_name}</p>
              <p className="mt-1 text-[#6b6b6b]">
                {address.address_line_1}
                {address.address_line_2 ? `, ${address.address_line_2}` : ""}
              </p>
              <p className="text-[#6b6b6b]">
                {address.city}
                {address.state ? `, ${address.state}` : ""}, {address.country}
              </p>
              {address.is_default ? (
                <p className="mt-2 text-xs font-semibold tracking-[0.12em] text-[#bd1115] uppercase">
                  Default
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#6b6b6b]">No saved addresses yet.</p>
      )}

      <form action={action} className="max-w-xl space-y-4 border border-[#e8e8e8] bg-white p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[#141414]">
          Add new address
        </h2>
        <Field label="Full name" name="full_name" />
        <Field label="Phone" name="phone" required={false} />
        <Field label="Address line 1" name="address_line_1" />
        <Field label="Address line 2" name="address_line_2" required={false} />
        <Field label="City" name="city" />
        <Field label="State / Emirate" name="state" required={false} />
        <Field label="Country" name="country" defaultValue="UAE" />
        <Field label="Postal code" name="postal_code" required={false} />
        <label className="flex items-center gap-2 text-sm text-[#141414]">
          <input type="checkbox" name="is_default" />
          Set as default
        </label>
        {state.error ? <p className="text-sm text-[#bd1115]">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="bg-[#bd1115] px-5 py-2.5 text-xs font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#9a0e12] disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save address"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required = true,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase">
        {label}
      </label>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="w-full border border-[#e0e0e0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#bd1115]"
      />
    </div>
  );
}
