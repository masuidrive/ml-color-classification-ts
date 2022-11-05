import { ReactNode, useState } from 'react';
import { Range } from 'react-daisyui';
import { Line, Rect, Text, Tooltip, PlusIcon, RightArrowIcon, Slider } from './svg';
import { num2color, num2gray } from '../utils/color';
import { clone, times } from '../utils/array';
import { COLOR_INDEX_LABEL } from '../dataset';

const layerFunc = ['relu', 'softmax'];
const rangeHeight = 20;

/// 1次元配列の一番大きな値のインデックス値
const argmax_1d = (vector: number[]) => vector.map((val, i) => [val, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];

type DLGraphProps = { weights: any; layersCount: number };
export const DLGraph = ({ weights, layersCount }: DLGraphProps) => {
  const fontSize = 12;
  const cellSize = 16;
  const [tooltip, setTooltip] = useState<any>(undefined);
  const [inputs, setInputs] = useState<number[]>(times(3, (_) => Math.random()) as number[]);

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
  const rangeWidth = 5;
  const weightMargin = 6;

  // 入力レイヤー → hidden layer
  const hidden_height = weights[`W1`][0].length as number;
  times(input_layer, (color) => {
    const lineColor = inputs.map((_, j) => (color == j ? 0.75 : 0));
    times(hidden_height, (y) => {
      elements.push(
        <Line
          x1={cX(posX + rangeWidth)}
          y1={cY(color, input_layer)}
          x2={cX(posX + color * 3 + weightMargin + rangeWidth) - cellSize * 0.5 - 2}
          y2={cY(y, hidden_height)}
          color={`rgb(${lineColor.map((v) => v * 255).join(',')})`}
        />,
      );
    });
  });

  // 入力レイヤー
  const rangeColor = ['#880000', '#008800', '#000088'];
  inputs.forEach((val, i) => {
    elements.push(
      <Slider
        x={cX(posX)}
        y={cY(i, inputs.length) - rangeHeight / 2}
        width={cellSize * rangeWidth}
        height={rangeHeight}
        color={rangeColor[i]}
        value={val}
        onChange={(val: any) => {
          let newInputs = [...inputs];
          newInputs[i] = val;
          setInputs(newInputs);
        }}
      />,
    );
  });
  elements.push(
    <Rect
      x={cX(0)}
      y={cY(0, inputs.length) - cellSize * 4}
      width={cellSize * rangeWidth}
      height={cellSize * 2.5}
      fill={`rgb(${inputs.map((v) => v * 255).join(',')})`}
      borderColor="#eeeeee"
      key={`color-sample`}
    />,
  );
  posX += rangeWidth;

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
              x2={cX(posX + i * 3 + weightMargin) - cellSize * 0.5 - 2}
              y2={cY(j, layer2Count)}
              color={`#aaaaaa`}
            />,
          );
        });
      });
    }
    posX += weightMargin;

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
            align="center"
            fill={num2color(calculated[x][y])}
            borderColor="#aaaaaa"
            key={`${posX}-${x}-${y}`}
            onShowTooltip={(x, y, text) => setTooltip({ x, y: y + cellSize / 2 + 2, text })}
            onHideTooltip={() => setTooltip(undefined)}
            tooltip={[
              `f(x) = x * W[${y},${x}] + b[${x}]`,
              `x = ${data[x].toFixed(16)}`,
              `W[${y},${x}] = ${val.toFixed(16)}`,
              `b[${x}] = ${bias.toFixed(16)}`,
              `result = ${calculated[x][y].toFixed(16)}`,
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
            align="center"
            fill={num2color(data[y] / base)}
            borderColor="#aaaaaa"
            key={`${posX}-${y}`}
            onShowTooltip={(x, y, text) => setTooltip({ x, y: y + cellSize / 2 + 2, text })}
            onHideTooltip={() => setTooltip(undefined)}
            tooltip={[
              'f(x) = exp(x) / total',
              `x = ${data[y].toFixed(16)}`,
              `result = ${(data[y] / base).toFixed(16)}`,
            ]}
          />,
        );
        data[y] = data[y] / base;
      });
      posX += 4;
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
            align="center"
            fill={num2color(data[y])}
            borderColor="#aaaaaa"
            key={`${posX}-${y}`}
            onShowTooltip={(x, y, text) => setTooltip({ x, y: y + cellSize / 2 + 2, text })}
            onHideTooltip={() => setTooltip(undefined)}
            tooltip={['f(x) = max(0, x)', `x = ${sum.toFixed(16)}`, `result = ${data[y].toFixed(16)}`]}
          />,
        );
      });
    }
  });

  posX -= 2;
  const resultIndex = argmax_1d(data);
  const labels = COLOR_INDEX_LABEL.map((label, idx) => (
    <>
      <Text
        key={`l-${idx}`}
        x={cX(posX)}
        y={cY(idx, COLOR_INDEX_LABEL.length) - (cellSize - fontSize) / 2}
        text={`${data[idx].toFixed(3)}`}
        fontSize={fontSize}
        height={cellSize}
        align="bottom"
        color="black"
      />
      <Text
        key={`v-${idx}`}
        x={cX(posX + 3)}
        y={cY(idx, COLOR_INDEX_LABEL.length) - (cellSize - fontSize) / 2}
        text={label}
        fontSize={14}
        height={cellSize}
        align="bottom"
        color={num2gray((1 - data[idx]) * 0.8)}
        fontWeight={idx === resultIndex ? 'bold' : 'normal'}
      />
    </>
  ));

  const width = 1000;
  const height = max_layer_height * cellSize * 2;
  return (
    <svg
      width="100%"
      viewBox={`0,0,${width},${height}`}
      style={{ objectFit: 'cover' }}
      xmlns="http://www.w3.org/2000/svg"
    >
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
      {labels}
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
