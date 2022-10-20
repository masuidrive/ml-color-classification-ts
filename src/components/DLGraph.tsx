import { FC, ReactNode, useState } from 'react';
import { Line, Rect, Circle, Tooltip, PlusIcon, RightArrowIcon } from './svg';

const times = (n: number, callbackfn: (index: number) => number[] | number | void) =>
  [...Array(n)].map((_: any, index: number) => callbackfn(index));
const clone = (data: any) => JSON.parse(JSON.stringify(data));

const num2color = (val: number) =>
  `rgb(${(val > 0 ? [1 - val, 1, 1 - val] : [1 + val, 1 + val, 1]).map((v) => v * 255).join(',')})`;
type DLGraphProps = { weights: any; layersCount: number; inputs: number[] };

const layerFunc = ['relu', 'softmax'];
export const DLGraph = ({ weights, layersCount, inputs }: DLGraphProps) => {
  const cellSize = 16;
  const [tooltip, setTooltip] = useState<any>(undefined);

  //console.log('predict', predict(inputs, weights));

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
    const lineColor = inputs.map((_, j) => (color == j ? 0.75 : 0));
    times(hidden_height, (y) => {
      elements.push(
        <Line
          x1={cX(posX)}
          y1={cY(color, input_layer)}
          x2={cX(posX + color * 3 + 6) - cellSize * 0.5 - 2}
          y2={cY(y, hidden_height)}
          color={`rgb(${lineColor.map((v) => v * 255).join(',')})`}
        />,
      );
    });
  });

  // 入力レイヤー
  inputs.forEach((val, i) => {
    const color = inputs.map((_, j) => (i == j ? 1 : 1 - val));
    const borderColor = inputs.map((_, j) => (i == j ? 1 : 0.75));
    elements.push(
      <Circle
        x={cX(posX)}
        y={cY(i, input_layer)}
        radius={cellSize / 2}
        borderColor={`rgb(${(val < 0.25 ? borderColor : color).map((v) => v * 255).join(',')})`}
        fill={`rgb(${color.map((v) => v * 255).join(',')})`}
        key={`${posX}-${i}`}
      />,
    );
  });

  // レイヤー
  let data = clone(inputs);
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
    const calculated = clone(w) as number[][];
    // ブロックを書く
    w.forEach((row, x) =>
      row.forEach((val, y) => {
        const bias = weights[`b${layerNo + 1}`][x];
        calculated[x][y] = data[x] * val + bias;
        elements.push(
          <Rect
            x={cX(posX + x * 3)}
            y={cY(y, row.length)}
            width={cellSize}
            height={cellSize}
            fill={num2color(calculated[x][y])}
            borderColor="#aaaaaa"
            key={`${posX}-${x}-${y}`}
            onShowTooltip={(x, y, text) => setTooltip({ x, y: y + cellSize / 2 + 2, text })}
            onHideTooltip={() => setTooltip(undefined)}
            tooltip={[
              `f(x) = x * W[${y},${x}] + b[${x}]`,
              `x = ${data[x]}`,
              `W[${y},${x}] = ${val}`,
              `b[${x}] = ${bias}`,
              `result = ${calculated[x][y]}`,
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
    const neuronCount = (weights[`b${layerNo + 1}`] as number[]).length;
    const inputCount = calculated.length;
    data = times(neuronCount, (neuronNo) =>
      (times(inputCount, (inputNo) => calculated[inputNo][neuronNo]) as number[]).reduce((a, b) => a + b),
    );
    if (layerFunc[layerNo] == 'softmax') {
      data = (data as number[]).map((val, idx) => Math.exp(val));
      const base = (data as number[]).reduce((a, b) => a + b);
      times(neuronCount, (y) => {
        elements.push(
          <Rect
            x={cX(posX)}
            y={cY(y, neuronCount)}
            width={cellSize}
            height={cellSize}
            fill={num2color(data[y] / base)}
            borderColor="#aaaaaa"
            key={`${posX}-${y}`}
            onShowTooltip={(x, y, text) => setTooltip({ x, y: y + cellSize / 2 + 2, text })}
            onHideTooltip={() => setTooltip(undefined)}
            tooltip={['f(x) = exp(x) / total', `x = ${data[y]}`, `result = ${data[y] / base}`]}
          />,
        );
        data[y] = data[y] / base;
      });
    } else {
      times(neuronCount, (y) => {
        const sum = calculated.map((val) => val[y]).reduce((a, b) => a + b);
        data[y] = sum > 0 ? sum : 0;

        elements.push(
          <Rect
            x={cX(posX)}
            y={cY(y, neuronCount)}
            width={cellSize}
            height={cellSize}
            fill={num2color(data[y])}
            borderColor="#aaaaaa"
            key={`${posX}-${y}`}
            onShowTooltip={(x, y, text) => setTooltip({ x, y: y + cellSize / 2 + 2, text })}
            onHideTooltip={() => setTooltip(undefined)}
            tooltip={['f(x) = x > 0 ? x : 0', `x = ${sum}`, `result = ${data[y]}`]}
          />,
        );
      });
    }
  });

  const width = 800;
  const height = 400;
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
        key="marker"
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
          key="tooltip"
        />
      )}
    </svg>
  );
};
