"use client";

import { useSearchParams } from "next/navigation";

const errors: Record<string, string> = {
  missing: "Username and password are required.",
  invalid: "Invalid admin credentials. Check username/email and password.",
};

export function AdminLoginForm() {
  const searchParams = useSearchParams();
  const errorKey = searchParams.get("error");
  const error = errorKey ? errors[errorKey] : null;

  return (
    <form action="/api/admin/login" method="POST" className="space-y-5">
      <div>
        <label
          htmlFor="identifier"
          className="mb-2 block text-xs font-semibold tracking-[0.16em] text-[#141414] uppercase"
        >
          Username or email
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          required
          placeholder="Murtaza Bohri"
          className="w-full border border-[#e0e0e0] bg-white px-4 py-3 text-sm text-[#141414] outline-none transition-colors focus:border-[#bd1115]"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-xs font-semibold tracking-[0.16em] text-[#141414] uppercase"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Enter password"
          className="w-full border border-[#e0e0e0] bg-white px-4 py-3 text-sm text-[#141414] outline-none transition-colors focus:border-[#bd1115]"
        />
      </div>

      {error ? (
        <p className="text-sm font-medium text-[#bd1115]">{error}</p>
      ) : null}

      <button
        type="submit"
        className="w-full bg-[#bd1115] px-4 py-3 text-sm font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-[#9a0e12] disabled:opacity-60"
      >
        Sign in
      </button>
    </form>
  );
}
