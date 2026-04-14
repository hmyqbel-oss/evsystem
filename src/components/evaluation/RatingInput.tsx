import { Star } from "lucide-react";

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
}

const RatingInput = ({ value, onChange }: RatingInputProps) => {
  const labels = ["", "ضعيف", "مقبول", "متوسط", "جيد", "ممتاز"];

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-1 transition-transform hover:scale-110"
        >
          <Star
            className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
              star <= value
                ? "fill-warning text-warning"
                : "fill-none text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-xs font-medium text-muted-foreground mr-2">
          {labels[value]}
        </span>
      )}
    </div>
  );
};

export default RatingInput;
