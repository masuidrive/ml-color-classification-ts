import { FC, ReactNode, useState } from 'react';
import { Line, Rect, Circle, Tooltip, PlusIcon, RightArrowIcon } from './svg';
const times = (n: number, callbackfn: (index: number) => number[] | void) =>
  [...Array(n)].map((_: any, index: number) => callbackfn(index));

type DLGraphProps = { weights: any; layersCount: number; inputs: number[] };
export const DLGraph = ({ weights, layersCount, inputs }: DLGraphProps) => {
  const cellSize = 16;
  const [tooltip, setTooltip] = useState<any>(undefined);

  const input_layer = weights['W1'].length;
  const output_layer = weights[`W${layersCount - 1}`][0].length;
  let max_layer_height = input_layer;
  times(layersCount, (i) => {
    const h = weights[`b${i + 1}`].length;
    max_layer_height = Math.max(max_layer_height, h);
  });

  const cX = (x: number) => x * cellSize + cellSize;
  const cY = (y: number, height: number) => (y + (max_layer_height - height) / 2) * 2 * cellSize + cellSize;

  let elements: ReactNode[] = [];
  let posX = 0;

  // 入力レイヤー → hidden layer
  const hidden_height = weights[`W1`][0].length as number;
  times(input_layer, (color) => {
    const lineColor = inputs.map((_, j) => (color == j ? 192 : 0));
    times(hidden_height, (y) => {
      elements.push(
        <Line
          x1={cX(posX)}
          y1={cY(color, input_layer)}
          x2={cX(posX + color * 3 + 6) - cellSize * 0.5 - 2}
          y2={cY(y, hidden_height)}
          color={`rgb(${lineColor.join(',')})`}
        />,
      );
    });
  });

  // 入力レイヤー
  inputs.forEach((val, i) => {
    const color = inputs.map((_, j) => (i == j ? 255 : 255 - val));
    const borderColor = inputs.map((_, j) => (i == j ? 255 : 192));
    elements.push(
      <Circle
        x={cX(posX)}
        y={cY(i, input_layer)}
        radius={cellSize / 2}
        borderColor={`rgb(${(val < 64 ? borderColor : color).join(',')})`}
        fill={`rgb(${color.join(',')})`}
        key={`${posX}-${i}`}
      />,
    );
  });

  // レイヤー
  times(layersCount, (layerNo) => {
    if (layerNo > 0) {
      const layer1Count = weights[`W${layerNo}`][0].length;
      times(layer1Count, (i) => {
        const layer2Count = weights[`W${layerNo + 1}`][0].length;
        times(layer2Count, (j) => {
          elements.push(
            <Line
              x1={cX(posX) + cellSize / 2}
              y1={cY(i, layer1Count)}
              x2={cX(posX + i * 3 + 6) - cellSize * 0.5 - 2}
              y2={cY(j, layer2Count)}
              color={`#aaaaaa`}
            />,
          );
        });
      });
    }
    posX += 6;

    const w = weights[`W${layerNo + 1}`] as number[][];
    // ブロックを書く
    w.forEach((row, x) =>
      row.forEach((val, y) => {
        elements.push(
          <Rect
            x={cX(posX + x * 3)}
            y={cY(y, row.length)}
            width={cellSize}
            height={cellSize}
            fill={`#eeeeee`}
            borderColor="#aaaaaa"
            key={`${posX}-${x}-${y}`}
            onShowTooltip={(x, y, text) => setTooltip({ x, y: y + cellSize / 2 + 2, text })}
            onHideTooltip={() => setTooltip(undefined)}
            tooltip={[
              `f(x) = x * W[${y},${x}] + b[${x}]`,
              `x = 0.`,
              `W[${y},${x}] = ${val}`,
              `b[${x}] = ${weights[`b${layerNo + 1}`][x]}`,
              `result = 0.001283134`,
            ]}
          />,
        );
        return [posX + x * 3, y];
      }),
    );

    // +, →を書く
    w.forEach((row, x) =>
      row.forEach((_, y) => {
        if (x > 0) {
          elements.push(<PlusIcon x={cX(posX + x * 3 - 1.5)} y={cY(y, row.length)} size={cellSize} />);
        } else {
          elements.push(<RightArrowIcon x={cX(posX + w.length * 3 - 1)} y={cY(y, row.length)} size={cellSize} />);
        }
      }),
    );
    posX += w.length * 3;

    posX += 1;
    const b = weights[`b${layerNo + 1}`] as number[];
    b.map((val, y) => {
      elements.push(
        <Rect
          x={cX(posX)}
          y={cY(y, b.length)}
          width={cellSize}
          height={cellSize}
          fill={`#eeeeee`}
          borderColor="#aaaaaa"
          key={`${posX}-${y}`}
          onShowTooltip={(x, y, text) => setTooltip({ x, y: y + cellSize / 2 + 2, text })}
          onHideTooltip={() => setTooltip(undefined)}
          tooltip={['f(x) = x > 0 ? x : 0', `x = ${0}`, `result = ${0}`]}
        />,
      );
      return [posX, y];
    });
  });

  const width = 600;
  const height = 500;
  return (
    <svg width={width} height={height} xmlns="http://www.w3.org/2000/svg">
      <marker
        id="arrow"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerUnits="strokeWidth"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#aaaaaa" />
      </marker>
      {elements}
      {tooltip === undefined ? undefined : (
        <Tooltip
          x={tooltip.x}
          y={tooltip.y}
          width={240}
          arrow={tooltip.x < width / 2 ? 'left' : 'right'}
          text={tooltip.text}
        />
      )}
    </svg>
  );
};
