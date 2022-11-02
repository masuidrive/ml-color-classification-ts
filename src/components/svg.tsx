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
  fill: string;
  borderColor?: string;
  tooltip?: string | string[];
  onShowTooltip?: (x: number, y: number, text: string | string[]) => void;
  onHideTooltip?: (x: number, y: number, text: string | string[]) => void;
  onToggleTooltip?: (x: number, y: number, text: string | string[]) => void;
};
export const Rect = ({
  x,
  y,
  width,
  height,
  fill,
  borderColor,
  tooltip,
  onShowTooltip,
  onHideTooltip,
  onToggleTooltip,
}: RectProps) => (
  <rect
    x={x - width / 2}
    y={y - height / 2}
    width={width}
    height={height}
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
  width: number;
  height: number;
  fontSize: number;
  text: string;
  color: string;
  align: 'middle' | 'bottom';
};
export const Text = ({ x, y, width, height, fontSize, text, color, align = 'middle' }: TextProps) =>
  align === 'bottom' ? (
    <text x={x} y={y + height / 2}>
      {text}
    </text>
  ) : (
    <text x={x} y={y - height / 2}>
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
