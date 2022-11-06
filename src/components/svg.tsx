import { useState, useRef } from 'react';

type TooltipProps = {
  x: number;
  y: number;
  width: number;
  lineHeight?: number;
  arrow?: string;
  offset?: string;
  text: string | string[];
};
export const Tooltip = ({ x, y, width, lineHeight, arrow, text }: TooltipProps) => {
  if (typeof text == 'string') {
    text = text.split(/\n/);
  }
  lineHeight ??= 20;
  arrow ??= 'left';
  const lineCount = text.length;
  const arrowSize = 8;
  const radius = 5;
  const height = lineHeight! * lineCount;
  const path = `M ${x},${y}
      l 0,0 ${arrowSize / 2},${arrowSize}
      h ${arrow === 'left' ? width - arrowSize * 1.5 : arrowSize * 1.5}
      a ${radius},${radius} 0 0 1 ${radius},${radius}
      v ${height}
      a ${radius},${radius} 0 0 1 ${-radius},${radius}
      h ${-width}
      a ${radius},${radius} 0 0 1 ${-radius},${-radius}
      v ${-height}
      a ${radius},${radius} 0 0 1 ${radius},${-radius}
      h ${arrow === 'left' ? arrowSize * 0.5 : width - arrowSize * 2.5}
      z`;
  return (
    <g>
      <path fill="#eeeeee" stroke="#888888" d={path} strokeWidth={2} />
      {text.map((line, lineNo) => (
        <text
          x={arrow === 'left' ? x : x - width + arrowSize * 2 + radius}
          y={y + arrowSize + radius + lineHeight! / 2 + lineNo * lineHeight!}
          stroke="black"
          dominantBaseline="central"
          fontFamily="monospace"
          fontSize={12}
          fontWeight="normal"
          key={`text-${lineNo}`}
        >
          {line}
        </text>
      ))}
    </g>
  );
};

type LineProps = { x1: number; y1: number; x2: number; y2: number; color: string; style?: any };
export const Line = ({ x1, y1, x2, y2, color, style }: LineProps) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: color, strokeWidth: 1, ...style }} markerEnd="url(#arrow)" />
);

type RectProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  align?: 'center';
  fill: string;
  borderColor?: string;
  tooltip?: string;
  radius?: number;
  onShowTooltip?: (x: number, y: number, text: string) => void;
  onHideTooltip?: (x: number, y: number, text: string) => void;
  onToggleTooltip?: (x: number, y: number, text: string) => void;
};
export const Rect = ({
  x,
  y,
  width,
  height,
  fill,
  align,
  borderColor,
  radius,
  tooltip,
  onShowTooltip,
  onHideTooltip,
  onToggleTooltip,
}: RectProps) => (
  <rect
    x={align === undefined ? x : x - width / 2}
    y={align === undefined ? y : y - height / 2}
    width={width}
    height={height}
    rx={radius}
    style={{ fill, stroke: borderColor, strokeWidth: 1 }}
    onMouseEnter={() => {
      if (onShowTooltip && tooltip) onShowTooltip(x, y, tooltip);
    }}
    onMouseLeave={() => {
      if (onHideTooltip && tooltip) onHideTooltip(x, y, tooltip);
    }}
    onClick={() => {
      if (onToggleTooltip && tooltip) onToggleTooltip(x, y, tooltip);
    }}
  />
);

type TextProps = {
  x: number;
  y: number;
  height: number;
  fontSize: number;
  fontWeight?: 'bold' | 'normal';
  text: string;
  color: string;
  align: 'middle' | 'bottom';
};
export const Text = ({ x, y, height, fontSize, fontWeight, text, color, align = 'middle' }: TextProps) =>
  align === 'bottom' ? (
    <text x={x} y={y} style={{ fontWeight: fontWeight ?? 'normal', fill: color, fontSize }}>
      {text}
    </text>
  ) : (
    <text
      x={x}
      y={y - height / 2}
      style={{ dominantBaseline: 'middle', fontWeight: fontWeight ?? 'normal', fill: color, fontSize }}
    >
      {text}
    </text>
  );

type CircleProps = {
  x: number;
  y: number;
  radius: number;
  fill: string;
  borderColor?: string;
  style?: any;
};
export const Circle = ({ x, y, fill, radius, borderColor, style }: CircleProps) => (
  <circle cx={x} cy={y} r={radius} style={{ ...style, fill, stroke: borderColor, strokeWidth: 2 }}></circle>
);

// https://feathericons.com/
type IconProps = { x: number; y: number; size: number; stroke?: string };
export const PlusIcon = ({ x, y, size, stroke }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    x={x - size / 2}
    y={y - size / 2}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke ?? 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
export const RightArrowIcon = ({ x, y, size, stroke = 'currentColor' }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    x={x - size / 2}
    y={y - size / 2}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

function screenToSvg(point: any, el: any, svg: any) {
  const pt = svg.createSVGPoint();
  pt.x = point.x;
  pt.y = point.y;
  return pt.matrixTransform(el.getScreenCTM().inverse());
}

// https://feathericons.com/
type SliderProps = { x: number; y: number; width: number; height: number; color: string; value: number; onChange: any };
export const Slider = ({ x, y, width, height, color, value, onChange }: SliderProps) => {
  const [click, setClick] = useState(false);
  const changeValue = (e: React.TouchEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const [x, y] =
      'targetTouches' in e ? [e.targetTouches[0].clientX, e.targetTouches[0].clientY] : [e.clientX, e.clientY];
    const newVal = Math.max(
      0.0,
      Math.min(
        1.0,
        (screenToSvg({ x: Math.floor(x), y: Math.floor(y) }, e.target, ref.current).x - height / 2) / (width - height),
      ),
    );
    if (newVal !== value) {
      onChange(newVal);
    }
  };
  const ref = useRef(null);
  const path = `
      M ${height / 2} 0
      h ${(width - height) * value}
      a ${height / 2} ${height / 2} 0 0 1 0 ${height}
      h ${-(width - height) * value}
      a ${height / 2} ${height / 2} 0 0 1 0 ${-height}
      z`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      x={x}
      y={y}
      width={width}
      height={height}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      ref={ref}
      style={{ touchAction: 'none' }}
      onMouseMove={(e) => {
        e.preventDefault();
        if (e.buttons > 0) changeValue(e);
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        changeValue(e);
      }}
      onTouchStart={(e) => changeValue(e)}
      onTouchMove={(e) => changeValue(e)}
    >
      <line x1={height / 2} y1={height / 2} x2={width - height / 2} y2={height / 2} stroke="#aaaaaa" strokeWidth="2" />
      <path fill={color} d={path} strokeWidth={0} />
      <circle cx={(width - height) * value + height / 2} cy={height / 2} r={height / 3} fill="white" />
    </svg>
  );
};
