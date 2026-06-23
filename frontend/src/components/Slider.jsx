import { Volume1, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function handleSliderChange(event, isControlled, setInternalValue, onChange) {
  const nextValue = Number(event.target.value);

  if (!isControlled) {
    setInternalValue(nextValue);
  }

  onChange?.(nextValue);
}

function renderVolumeIcon(sliderValue, min, max) {
  const normalizedValue = (sliderValue - min) / (max - min);

  if (sliderValue <= min) {
    return <VolumeX className="size-10 shrink-0 sm:size-12 md:size-14" strokeWidth={2} />;
  }

  if (normalizedValue <= 0.5) {
    return <Volume1 className="size-10 shrink-0 sm:size-12 md:size-14" strokeWidth={2} />;
  }

  return <Volume2 className="size-10 shrink-0 sm:size-12 md:size-14" strokeWidth={2} />;
}

function Slider({
  sliderTitle,
  value,
  defaultValue = 50,
  min = 0,
  max = 100,
  step = 1,
  onChange,
}) {
  const isControlled = value != null;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const sliderValue = clamp(isControlled ? value : internalValue, min, max);

  const progress = ((sliderValue - min) / (max - min)) * 100;

  return (
    <section className="m-8 mt-10 flex flex-col gap-8 text-white">
      <h3 className="text-4xl font-bold tracking-tight sm:text-3xl md:text-4xl">
        {sliderTitle}
      </h3>

      <div className="flex items-center gap-4 sm:gap-6">
        {renderVolumeIcon(sliderValue, min, max)}

        <div className="relative flex-1 py-3">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-white/35" />
          <div
            className="pointer-events-none absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white"
            style={{ width: `${progress}%` }}
          />

          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={sliderValue}
            onChange={(event) =>
              handleSliderChange(
                event,
                isControlled,
                setInternalValue,
                onChange,
              )
            }
            aria-label={sliderTitle}
            className="
              relative z-5 h-4 w-full cursor-pointer appearance-none bg-transparent
              focus:outline-none
              [&::-webkit-slider-runnable-track]:h-2.5
              [&::-webkit-slider-runnable-track]:bg-transparent
              [&::-webkit-slider-thumb]:mt-[-0.5rem]
              [&::-webkit-slider-thumb]:h-8
              [&::-webkit-slider-thumb]:w-8
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:border-0
              [&::-webkit-slider-thumb]:bg-white
              [&::-moz-range-track]:h-2.5
              [&::-moz-range-track]:border-0
              [&::-moz-range-track]:bg-transparent
              [&::-moz-range-thumb]:h-12
              [&::-moz-range-thumb]:w-12
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:bg-white
            "
          />
        </div>
      </div>
    </section>
  );
}

export default Slider;