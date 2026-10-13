import { formatAmount, nearbyAmounts } from "@/lib/measuringTable";
import type { Amount } from "@/lib/types";

interface AmountPickerProps {
  current: Amount;
  onPick: (amount: Amount) => void;
  onClose: () => void;
}

export function isSameAmount(a: Amount, b: Amount): boolean {
  return a.unit === b.unit && Math.abs(a.quantity - b.quantity) < 0.0001;
}

/** The row of amount buttons. The current one, if it is in the row, is filled in. */
export function AmountOptions({ amounts, current, onPick }: { amounts: Amount[]; current?: Amount; onPick: (amount: Amount) => void }) {
  return (
    <div className="picker__options">
      {amounts.map((amount) => (
        <button
          key={`${amount.quantity}-${amount.unit}`}
          type="button"
          className={current && isSameAmount(amount, current) ? "button picker__option picker__option--current" : "button button--quiet picker__option"}
          onClick={() => onPick(amount)}
        >
          {formatAmount(amount)}
        </button>
      ))}
    </div>
  );
}

/** A few smaller and larger amounts around the current one, smallest first. */
export function AmountPicker({ current, onPick, onClose }: AmountPickerProps) {
  return (
    <div className="picker" role="group" aria-label="Pick the right amount">
      <p className="picker__hint">Smaller or larger? Tap the right amount.</p>
      <AmountOptions amounts={nearbyAmounts(current)} current={current} onPick={onPick} />
      <button type="button" className="button button--quiet picker__close" onClick={onClose}>
        Never mind
      </button>
    </div>
  );
}
