"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  requestPasswordReset,
  signInCustomer,
  signUpCustomer,
  type AuthActionState,
} from "@/app/auth/actions";

const initialState: AuthActionState = {};

export function LoginForm({ returnTo = "/account" }: { returnTo?: string }) {
  const [state, action, pending] = useActionState(signInCustomer, initialState);

  return (
    <form action={action} className="space-y-4 border border-[#e8e8e8] bg-white p-6">
      <input type="hidden" name="returnTo" value={returnTo} />
      <Field label="Email" name="email" type="email" />
      <Field label="Password" name="password" type="password" />
      {state.error ? <p className="text-sm text-[#bd1115]">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-[#bd1115] px-5 py-3 text-xs font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#9a0e12] disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Login"}
      </button>
      <p className="text-center text-sm text-[#6b6b6b]">
        <Link href="/forgot-password" className="text-[#bd1115] hover:underline">
          Forgot password?
        </Link>
      </p>
      <p className="text-center text-sm text-[#6b6b6b]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-[#bd1115] hover:underline">
          Create account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signUpCustomer, initialState);

  return (
    <form action={action} className="space-y-4 border border-[#e8e8e8] bg-white p-6">
      <Field label="Full name" name="full_name" />
      <Field label="Email" name="email" type="email" />
      <Field label="Phone" name="phone" type="tel" required={false} />
      <Field label="Password" name="password" type="password" />
      <Field label="Confirm password" name="confirm_password" type="password" />
      {state.error ? <p className="text-sm text-[#bd1115]">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-[#bd1115] px-5 py-3 text-xs font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#9a0e12] disabled:opacity-60"
      >
        {pending ? "Creating..." : "Create account"}
      </button>
      <p className="text-center text-sm text-[#6b6b6b]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#bd1115] hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <form action={action} className="space-y-4 border border-[#e8e8e8] bg-white p-6">
      <Field label="Email" name="email" type="email" />
      {state.error ? <p className="text-sm text-[#bd1115]">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-[#bd1115] px-5 py-3 text-xs font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#9a0e12] disabled:opacity-60"
      >
        {pending ? "Sending..." : "Send reset link"}
      </button>
      <p className="text-center text-sm text-[#6b6b6b]">
        <Link href="/login" className="text-[#bd1115] hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full border border-[#e0e0e0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#bd1115]"
      />
    </div>
  );
}
