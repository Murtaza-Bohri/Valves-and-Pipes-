"use client";

import { useActionState } from "react";
import { updateCustomerProfile, type AuthActionState } from "@/app/auth/actions";

const initialState: AuthActionState = {};

export function ProfileForm({
  fullName,
  phone,
}: {
  fullName: string;
  phone: string;
}) {
  const [state, action, pending] = useActionState(updateCustomerProfile, initialState);

  return (
    <form action={action} className="max-w-xl space-y-4 border border-[#e8e8e8] bg-white p-6">
      <Field label="Full name" name="full_name" defaultValue={fullName} />
      <Field label="Phone" name="phone" defaultValue={phone} />
      {state.error ? <p className="text-sm text-[#bd1115]">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#bd1115] px-5 py-2.5 text-xs font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#9a0e12] disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase">
        {label}
      </label>
      <input
        name={name}
        defaultValue={defaultValue}
        className="w-full border border-[#e0e0e0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#bd1115]"
      />
    </div>
  );
}
