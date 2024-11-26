import { useState, useRef, useEffect } from 'react';
import './DoubleRangeSlider.css';

type Props = {
  onChange: (min: number, max: number) => void;
  initialMinValue: number;
  initialMaxValue: number;
}

const DoubleRangeSlider = (props: Props) => {
  const { onChange, initialMinValue, initialMaxValue } = props;
  const [minValue, setMinValue] = useState<number>(initialMinValue);
  const [maxValue, setMaxValue] = useState<number>(initialMaxValue);

  const minInputRef = useRef<HTMLInputElement>(null);
  const maxInputRef = useRef<HTMLInputElement>(null);
  const inverseLeftRef = useRef<HTMLDivElement>(null);
  const inverseRightRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);
  const thumbMinRef = useRef<HTMLSpanElement>(null);
  const thumbMaxRef = useRef<HTMLSpanElement>(null);
  const signMinRef = useRef<HTMLDivElement>(null);
  const signMaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => updateMinValue(minValue), [minValue]);
  useEffect(() => updateMaxValue(maxValue), [maxValue]);

  const updateMinValue = (value: number) => {
    // console.debug("updateMinValue", value);
    const min = parseInt(minInputRef.current?.min || '0');
    const max = parseInt(maxInputRef.current?.max || '100');

    const percent = (100 / (max - min)) * value;

    if (inverseLeftRef.current) inverseLeftRef.current.style.width = `${percent}%`;
    if (rangeRef.current) rangeRef.current.style.left = `${percent}%`;
    if (thumbMinRef.current) thumbMinRef.current.style.left = `${percent}%`;
    if (signMinRef.current) signMinRef.current.style.left = `${percent}%`;

    onChange(minValue, maxValue);
  };

  const updateMaxValue = (value: number) => {
    // console.debug("updateMaxValue", value);
    const min = parseInt(minInputRef.current?.min || '0');
    const max = parseInt(maxInputRef.current?.max || '100');

    const percent = (100 / (max - min)) * value;

    if (inverseRightRef.current) inverseRightRef.current.style.width = `${100 - percent}%`;
    if (rangeRef.current) rangeRef.current.style.right = `${100 - percent}%`;
    if (thumbMaxRef.current) thumbMaxRef.current.style.left = `${percent}%`;
    if (signMaxRef.current) signMaxRef.current.style.left = `${percent}%`;

    onChange(minValue, maxValue);
  };

  return (
    <div className="slider" id="slider-distance">
      <div>
        <div ref={inverseLeftRef} className="inverse-left"></div>
        <div ref={inverseRightRef} className="inverse-right"></div>
        <div ref={rangeRef} className="range"></div>
        <span ref={thumbMinRef} className="thumb"></span>
        <span ref={thumbMaxRef} className="thumb"></span>
        <div ref={signMinRef} className="sign">
          <span>{minValue}</span>
        </div>
        <div ref={signMaxRef} className="sign">
          <span>{maxValue}</span>
        </div>
      </div>
      <input
        type="range"
        value={minValue}
        min="0"
        max="100"
        step="1"
        ref={minInputRef}
        onChange={(e) => setMinValue(parseInt(e.target.value))}
        className="range-input"
      />
      <input
        type="range"
        value={maxValue}
        min="0"
        max="100"
        step="1"
        ref={maxInputRef}
        onChange={(e) => setMaxValue(parseInt(e.target.value))}
        className="range-input"
      />
    </div>
  );
};

export default DoubleRangeSlider;
