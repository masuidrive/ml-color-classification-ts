import React, { ReactNode, useState } from 'react';
import { Line, Rect, Text, Tooltip, PlusIcon, RightArrowIcon, Slider } from './svg';
import { num2color, num2gray } from '../utils/color';
import { clone, times } from '../utils/array';
import { COLOR_INDEX_LABEL } from '../dataset';

const fontSize = 12;
const cellSize = 16;

// レイヤーの処理を行う
type layerFunc = (inputs: number[], params: any, paramsIndex: number) => [number[], React.ReactNode[], number, number];

const inputLayer: layerFunc = (input, params, paramsIndex) => {
  const numberCellWidth = 2.5; // 数字を表示するセル数
  const inputSliderWidth = 5; // 入力のセル数

  let elements: ReactNode[] = [];
  const rangeColor = ['#880000', '#008800', '#000088'];
  input.forEach((val, i) => {
    elements.push(
      <Slider
        x={0}
        y={i * 2 * cellSize}
        width={inputSliderWidth * cellSize}
        height={cellSize}
        color={rangeColor[i]}
        value={val}
        onChange={(val: any) => {
          input[i] = val;
        }}
        key={`input-layer-slider-${i}`}
      />,
      <Text
        x={(inputSliderWidth + 0.5) * cellSize}
        y={i * cellSize * 2}
        text={input[i].toFixed(3)}
        fontSize={fontSize}
        height={cellSize}
        align="middle"
        color="black"
        key={`input-layer-text-${i}`}
      />,
    );
  });
  return [input, elements, (inputSliderWidth + 0.5 + numberCellWidth) * cellSize, input.length * 2 * cellSize];
};

const fullConnectedLayer: layerFunc = (input, params, paramsIndex) => {
  const numberCellWidth = 2.5; // 数字を表示するセル数

  let elements: ReactNode[] = [];
  const weights = params[`W${paramsIndex}`] as number[][];
  const biases = params[`b${paramsIndex}`] as number[];
  let calculated = clone(weights); // 同じサイズの配列を作りたいだけ
  let data = Array(weights[0].length).fill(0);

  const iLen = weights.length;
  const oLen = weights[0].length;
  const h = Math.max(iLen, oLen);
  let connectorWidth = Math.max(iLen - 1, 2);
  times(iLen, (x) => {
    times(oLen, (y) => {
      elements.push(
        <Line
          x1={0}
          y1={(x * 2 + (h - iLen) + 0.5) * cellSize}
          x2={(connectorWidth + x * 2) * cellSize}
          y2={(y * 2 + (h - oLen) + 0.5) * cellSize}
          color={`#aaaaaa`}
        />,
      );
    });
  });
  let x =
    // ブロックを書く
    weights.forEach((row, x) =>
      row.forEach((val, y) => {
        const bias = biases[x];
        calculated[x][y] = input[x] * val + bias;
        data[y] += calculated[x][y];
        elements.push(
          <Rect
            x={(connectorWidth + x * 2) * cellSize + 0.5}
            y={y * 2 * cellSize + 0.5}
            width={cellSize - 1}
            height={cellSize - 1}
            fill={num2color(calculated[x][y])}
            borderColor="#aaaaaa"
            key={`fullConnected-${paramsIndex}-${x}-${y}`}
            tooltip={[
              `f(x) = x * W[${y},${x}] + b[${x}]`,
              `x = ${(input[x] ?? -10).toFixed(16)}`,
              `W[${y},${x}] = ${val.toFixed(16)}`,
              `b[${x}] = ${bias.toFixed(16)}`,
              `result = ${calculated[x][y].toFixed(16)}`,
            ].join('\n')}
          />,
        );
        if (x > 0) {
          elements.push(
            <PlusIcon x={(x * 2 - 0.5 + connectorWidth) * cellSize} y={(y * 2 + 0.5) * cellSize} size={fontSize} />,
          );
        }
      }),
    );
  data.forEach((val, y) => {
    elements.push(
      <Text
        x={(connectorWidth + weights.length * 2 - 0.5) * cellSize}
        y={y * 2 * cellSize}
        text={val.toFixed(3)}
        fontSize={fontSize}
        height={cellSize}
        align="middle"
        color="black"
        key={`input-relu-text-${y}`}
      />,
    );
  });

  return [
    data,
    elements,
    (connectorWidth + weights.length * 2 - 1 + numberCellWidth + 0.5) * cellSize,
    data.length * 2 * cellSize,
  ];
};

const activationLayer = (
  input: number[],
  func: (val: number) => number,
  // tooltip: (val: number) => string,
): [number[], React.ReactNode[], number, number] => {
  const numberCellWidth = 2.5; // 数字を表示するセル数
  const connectorWidth = 2;
  let elements: ReactNode[] = [];

  // ブロックを書く
  const data = input.map((val, y) => {
    const result = func(val);
    elements.push(
      <Line
        x1={0}
        y1={(y * 2 + 0.5) * cellSize}
        x2={connectorWidth * cellSize - 2}
        y2={(y * 2 + 0.5) * cellSize}
        color={`#aaaaaa`}
      />,
      <Rect
        x={0.5 + connectorWidth * cellSize}
        y={y * 2 * cellSize + 0.5}
        width={cellSize - 1}
        height={cellSize - 1}
        fill={num2color(val)}
        borderColor="#aaaaaa"
        key={`relu-${y}`}
      />,
      <Text
        x={(1.5 + connectorWidth) * cellSize}
        y={y * 2 * cellSize}
        text={result.toFixed(3)}
        fontSize={fontSize}
        height={cellSize}
        align="middle"
        color="black"
        key={`input-relu-text-${y}`}
      />,
    );
    return result;
  });

  return [data, elements, (1 + numberCellWidth + 0.5 + connectorWidth) * cellSize, input.length * 2 * cellSize];
};

const reluLayer: layerFunc = (input, params, paramsIndex) => {
  return activationLayer(input, (val) => Math.max(0, val));
};

const softmaxLayer: layerFunc = (input, params, paramsIndex) => {
  const total = input.reduce((a, b) => Math.exp(b) + a);
  const tooltip = (val: number) =>
    [
      'f(x) = exp(x) / total',
      `x = ${val.toFixed(16)}`,
      `total = ${total}`,
      `result = ${(Math.exp(val) / total).toFixed(16)}`,
    ].join('\n');
  return activationLayer(input, (val) => Math.exp(val) / total);
};

type DLGraphProps = { weights: any; layers: string[] };
type DLGraphStates = { input: number[]; tooltip: any };
export class DLGraph extends React.Component<DLGraphProps, DLGraphStates> {
  // グラフのサイズとか
  fontSize = 12;
  cellSize = 16;
  width = 1024;
  height = 300;

  inputNeuronCount = 3; // 入力は3次元
  layerMargin = 4; // レイヤー間の隙間
  numberCellWidth = 3; // 数字を表示するセル数
  inputSliderWidth = 5; // 入力のセル数
  layerWidths = [] as number[]; // レイヤー毎の幅

  neuronCounts = [] as number[]; // 各レイヤーのニューロン数
  maxNeuronCount = 0; // 一番大きいレイヤーのニューロン数

  constructor(props: DLGraphProps) {
    super(props);
    this.state = { input: times(this.inputNeuronCount, (_) => Math.random()), tooltip: undefined };
  }

  inputRGBLayer: layerFunc = (input, params, paramsIndex) => {
    const numberCellWidth = 2.5; // 数字を表示するセル数
    const inputSliderWidth = 5; // 入力のセル数

    let elements: ReactNode[] = [];
    const rangeColor = ['#880000', '#008800', '#000088'];
    this.state.input.forEach((val, i) => {
      elements.push(
        <Slider
          x={0}
          y={i * 2 * cellSize}
          width={inputSliderWidth * cellSize}
          height={cellSize}
          color={rangeColor[i]}
          value={val}
          onChange={(val: any) => {
            let newInput = clone(this.state.input);
            newInput[i] = val;
            this.setState({ input: newInput });
          }}
          key={`input-layer-slider-${i}`}
        />,
        <Text
          x={(inputSliderWidth + 0.5) * cellSize}
          y={i * cellSize * 2}
          text={this.state.input[i].toFixed(3)}
          fontSize={fontSize}
          height={cellSize}
          align="middle"
          color="black"
          key={`input-layer-text-${i}`}
        />,
      );
    });
    return [
      this.state.input,
      elements,
      (inputSliderWidth + 0.5 + numberCellWidth) * cellSize,
      this.state.input.length * 2 * cellSize,
    ];
  };

  render() {
    let data = clone(this.state.input);

    const layerFuncs = {
      input: this.inputRGBLayer.bind(this),
      fullConnected: fullConnectedLayer,
      relu: reluLayer,
      softmax: softmaxLayer,
    } as { [name: string]: layerFunc };

    let posX = 0;
    const layers = this.props.layers.map((layer) => {
      const [layerName, paramsIndex] = layer.split(/:/, 2);
      const [output, el, layerWidth, layerHeight] = layerFuncs[layerName](
        data,
        this.props.weights,
        parseInt(paramsIndex, 10),
      );
      data = output;
      posX += layerWidth;
      return { x: posX - layerWidth, width: layerWidth, height: layerHeight, el };
    });

    let maxH = Math.max(...layers.map((l) => l.height));
    return (
      <svg
        width="100%"
        viewBox={`0,0,${this.width},${maxH}`}
        style={{ objectFit: 'cover' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {layers.map((layer) => {
          return (
            <svg x={layer.x} y={(maxH - layer.height) / 2}>
              {layer.el}
            </svg>
          );
        })}
      </svg>
    );
  }
  /*
  renderFullConnectedLayer(input: number[], weight: number[][], bias: number[]) {}
  renderReluLayer(input: number) {}
  renderSoftmaxLayer(input: number) {}

  renderInputLayer() {
    let elements: ReactNode[] = [];
    const rangeColor = ['#880000', '#008800', '#000088'];
    this.state.inputs.forEach((val, i) => {
      elements.push(
        <Slider
          x={this.cX(0)}
          y={this.cY(i, this.inputNeuronCount) - this.cellSize / 2}
          width={this.cellSize * this.inputSliderWidth}
          height={this.cellSize}
          color={rangeColor[i]}
          value={val}
          onChange={(val: any) => {
            let newInputs = [...this.state.inputs];
            newInputs[i] = val;
            this.setState({ inputs: newInputs });
          }}
          key={`input-layer-slider-${i}`}
        />,
        <Text
          x={this.cX(this.inputSliderWidth + 0.5)}
          y={this.cY(i, this.inputNeuronCount) + this.cellSize / 2}
          text={`${this.state.inputs[i].toFixed(3)}`}
          fontSize={this.fontSize}
          height={this.cellSize}
          align="middle"
          color="black"
          key={`input-layer-text-${i}`}
        />,
      );
    });
    return [elements, this.inputSliderWidth + 0.5 + this.numberCellWidth, this.state.inputs];
  }

  // 必要ならTooltipを表示する
  renderTooltip() {
    return this.state.tooltip === undefined ? undefined : (
      <Tooltip
        x={this.state.tooltip.x}
        y={this.state.tooltip.y}
        width={240}
        arrow={this.state.tooltip.x < this.width / 2 ? 'left' : 'right'}
        text={this.state.tooltip.text}
        key="tooltip"
      />
    );
  }

  // 入力の線を一番下に引く
  renderArrows() {
    let elements: ReactNode[] = [];

    const heights = [this.inputNeuronCount, ...this.neuronCounts];
    let layerX = 0;
    times(this.props.layersCount, (layerNo) => {
      layerX += this.layerWidths[layerNo];
      times(heights[layerNo], (i) => {
        // inputレイヤーだけRGBで線を引く
        const lineColor = layerNo === 0 ? times(this.inputNeuronCount, (j) => (i == j ? 192 : 0)) : [192, 192, 192];
        times(heights[layerNo + 1], (y) => {
          elements.push(
            <Line
              x1={this.cX(layerX - 0.5)}
              y1={this.cY(i, heights[layerNo])}
              x2={this.cX(layerX + this.layerMargin + i * 3) - this.cellSize * 0.5 - 2}
              y2={this.cY(y, heights[layerNo + 1])}
              color={`rgb(${lineColor.join(',')})`}
              key={`input-arrow-${layerNo}-${i}-${y}`}
            />,
          );
        });
      });
      layerX += this.layerMargin;
    });

    return elements;
  }

  // 入力の箱
  renderInputs() {
    let elements: ReactNode[] = [];
    const rangeColor = ['#880000', '#008800', '#000088'];
    this.state.inputs.forEach((val, i) => {
      elements.push(
        <Slider
          x={this.cX(0)}
          y={this.cY(i, this.inputNeuronCount) - this.cellSize / 2}
          width={this.cellSize * this.inputSliderWidth}
          height={this.cellSize}
          color={rangeColor[i]}
          value={val}
          onChange={(val: any) => {
            let newInputs = [...this.state.inputs];
            newInputs[i] = val;
            this.setState({ inputs: newInputs });
          }}
          key={`input-slider-${i}`}
        />,
        <Text
          x={this.cX(this.inputSliderWidth + 0.5)}
          y={this.cY(i, this.inputNeuronCount) + this.cellSize / 2}
          text={`${this.state.inputs[i].toFixed(3)}`}
          fontSize={this.fontSize}
          height={this.cellSize}
          align="middle"
          color="black"
          key={`input-text-${i}`}
        />,
      );
    });
    return elements;
  }

  // 計算の箱
  renderFuncs() {
    let elements: ReactNode[] = [];
    let layerX = 0;
    let data = this.state.inputs;
    times(this.props.layers.length, (layerNo) => {
      layerX += this.layerWidths[layerNo] + this.layerMargin;

      const weights = this.props.weights[`W${layerNo + 1}`] as number[][];
      let calculated = clone(weights); // 同じサイズの配列を作りたいだけ

      // ブロックを書く
      weights.forEach((row, x) =>
        row.forEach((val, y) => {
          const bias = this.props.weights[`b${layerNo + 1}`][x] as number;
          calculated[x][y] = data[x] * val + bias;
          elements.push(
            <Rect
              x={this.cX(layerX + x * 3)}
              y={this.cY(y, row.length)}
              width={this.cellSize}
              height={this.cellSize}
              align="center"
              fill={num2color(calculated[x][y])}
              borderColor="#aaaaaa"
              key={`func-${layerNo}-${x}-${y}`}
              onShowTooltip={(x, y, text) => this.setState({ tooltip: { x, y: y + this.cellSize / 2 + 2, text } })}
              onHideTooltip={() => this.setState({ tooltip: undefined })}
              tooltip={[
                `f(x) = x * W[${y},${x}] + b[${x}]`,
                `x = ${(data[x] ?? -10).toFixed(16)}`,
                `W[${y},${x}] = ${val.toFixed(16)}`,
                `b[${x}] = ${bias.toFixed(16)}`,
                `result = ${calculated[x][y].toFixed(16)}`,
              ].join('\n')}
            />,
          );
          if (x > 0) {
            elements.push(
              <PlusIcon x={this.cX(layerX + x * 3 - 1.5)} y={this.cY(y, row.length)} size={this.cellSize} />,
            );
          } else {
            elements.push(
              <RightArrowIcon
                x={this.cX(layerX + weights.length * 3 - 1.5)}
                y={this.cY(y, row.length)}
                size={this.cellSize}
              />,
            );
          }
        }),
      );

      data = times(weights[0].length, (neuronNo) =>
        times(weights.length, (inputNo) => calculated[inputNo][neuronNo] as number).reduce((a, b) => a + b),
      );
      times(this.neuronCounts[layerNo], (y) =>
        elements.push(
          <Rect
            x={this.cX(layerX + weights.length * 3)}
            y={this.cY(y, this.neuronCounts[layerNo])}
            width={this.cellSize}
            height={this.cellSize}
            radius={this.cellSize / 4}
            align="center"
            fill={num2color(1)}
            borderColor="#aaaaaa"
            key={`func-${layerNo}-activation-${y}`}
            onShowTooltip={(x, y, text) => this.setState({ tooltip: { x, y: y + this.cellSize / 2 + 2, text } })}
            onHideTooltip={() => this.setState({ tooltip: undefined })}
            tooltip={[
              'f(x) = exp(x) / total',
              `x = ${data[y].toFixed(16)}`,
              `result = ${(data[y] / 1).toFixed(16)}`,
            ].join('\n')}
          />,
          <Text
            x={this.cX(layerX + weights.length * 3 + 1)}
            y={this.cY(y, this.neuronCounts[layerNo]) + this.cellSize / 2}
            text={`${(0).toFixed(3)}`}
            fontSize={this.fontSize}
            height={this.cellSize}
            align="middle"
            color="black"
            key={`func-${layerNo}-result-${y}`}
          />,
        ),
      );

      layerX += 0;
    });
    return elements;
  }
  */
}
