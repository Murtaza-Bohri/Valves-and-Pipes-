"use client";

import { useState } from "react";

type HasImpaSelectorProps = {
  name?: string;
  defaultValue?: boolean;
  onChange?: (hasImpa: boolean) => void;
};

export function HasImpaSelector({
  name = "has_impa",
  defaultValue = false,
  onChange,
}: HasImpaSelectorProps) {
  const [hasImpa, setHasImpa] = useState(defaultValue);

  const update = (value: boolean) => {
    setHasImpa(value);
    onChange?.(value);
  };

  return (
    <div className="sm:col-span-2">
      <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase">
        Does this product have an IMPA number?
      </p>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-[#141414]">
          <input
            type="radio"
            name={name}
            value="yes"
            checked={hasImpa}
            onChange={() => update(true)}
          />
          Yes
        </label>
        <label className="flex items-center gap-2 text-sm text-[#141414]">
          <input
            type="radio"
            name={name}
            value="no"
            checked={!hasImpa}
            onChange={() => update(false)}
          />
          No
        </label>
      </div>
    </div>
  );
}

export function DirectPriceField({
  visible,
  defaultValue,
}: {
  visible: boolean;
  defaultValue?: number | null;
}) {
  if (!visible) return null;

  return (
    <div className="sm:col-span-2">
      <label className="mb-2 block text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase">
        Price (AED)
      </label>
      <input
        name="price"
        type="number"
        min="0"
        step="0.01"
        required
        defaultValue={defaultValue ?? ""}
        className="w-full border border-[#e0e0e0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#bd1115]"
      />
    </div>
  );
}

export function ImpaRemovalConfirm({
  visible,
}: {
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div className="rounded border border-[#f0d4d4] bg-[#fff5f5] p-4 sm:col-span-2">
      <label className="flex items-start gap-2 text-sm text-[#141414]">
        <input type="checkbox" name="confirm_remove_impa" value="yes" />
        <span>
          I confirm switching to direct pricing. Existing IMPA entries will be
          removed.
        </span>
      </label>
    </div>
  );
}
