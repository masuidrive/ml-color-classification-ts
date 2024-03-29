import React, { FC, ReactNode, useState } from 'react';
import { Line, Rect, Text, PlusIcon, Slider } from './svg';
import { num2color, num2gray } from '../utils/color';
import { clone, times } from '../utils/array';

const fontSize = 12;
const cellSize = 16;
const layerMargin = 6;

// レイヤーの処理を行う
type layerTooltipFunc = (x: number, y: number, text: string) => void;
type layerFunc = (
  inputs: number[],
  params: any,
  paramsIndex: number,
  tooltipFunc?: layerTooltipFunc,
) => [number[], React.ReactNode[], number, number, string];

const fullConnectedLayer: layerFunc = (input, params, paramsIndex, tooltipFunc) => {
  const numberCellWidth = 2.75; // 数字を表示するセル数
  let elements: ReactNode[] = [];
  const weights = params[`W${paramsIndex}`] as number[][];
  const biases = params[`b${paramsIndex}`] as number[];
  let data = Array(weights[0].length).fill(0);

  const iLen = weights.length;
  const oLen = weights[0].length;
  const h = Math.max(iLen, oLen);
  let connectorWidth = Math.max(iLen - 1, 2);
  times(iLen, (x) => {
    times(oLen, (y) => {
      elements.push(
        <Line
          key={`${x}-${y}`}
          x1={layerMargin}
          y1={(x * 2 + (h - iLen) + 0.5) * cellSize}
          x2={(connectorWidth + x * 2) * cellSize}
          y2={(y * 2 + (h - oLen) + 0.5) * cellSize}
          color={`#aaaaaa`}
        />,
      );
    });
  });

  // ブロックを書く
  weights.forEach((row, x) =>
    row.forEach((val, y) => {
      const bias = biases[x];
      const result = input[x] * val + bias;
      data[y] += result;
      elements.push(
        <Rect
          x={(connectorWidth + x * 2) * cellSize + 0.5}
          y={y * 2 * cellSize + 0.5}
          width={cellSize - 1}
          height={cellSize - 1}
          fill={num2color(result)}
          borderColor="#aaaaaa"
          key={`fullConnected-${paramsIndex}-${x}-${y}`}
          tooltip={[
            `f(x) = x * W[${y},${x}] + b[${x}]`,
            `x = ${(input[x] ?? -10).toFixed(4)}`,
            `W[${y},${x}] = ${val.toFixed(4)}`,
            `b[${x}] = ${bias.toFixed(4)}`,
            `result = ${result.toFixed(4)}`,
          ].join('\n')}
          onTooltip={tooltipFunc}
        />,
      );
      if (x > 0) {
        elements.push(
          <PlusIcon
            x={(x * 2 - 0.5 + connectorWidth) * cellSize}
            y={(y * 2 + 0.5) * cellSize}
            size={fontSize}
            key={`plusicon-${paramsIndex}-${x}-${y}`}
          />,
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
        valign="middle"
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
    `Full connected ${paramsIndex}`,
  ];
};

const activationLayer = (
  label: string,
  input: number[],
  func: (val: number) => number,
  tooltip: string,
  tooltipFunc?: layerTooltipFunc,
): [number[], React.ReactNode[], number, number, string] => {
  const numberCellWidth = 2.75; // 数字を表示するセル数
  const connectorWidth = 2;
  let elements: ReactNode[] = [];

  // ブロックを書く
  const data = input.map((val, y) => {
    const result = func(val);
    elements.push(
      <Line
        x1={layerMargin}
        y1={(y * 2 + 0.5) * cellSize}
        x2={connectorWidth * cellSize - 2}
        y2={(y * 2 + 0.5) * cellSize}
        key={`activation-line-${y}`}
        color={`#aaaaaa`}
      />,
      <Rect
        x={0.5 + connectorWidth * cellSize}
        y={y * 2 * cellSize + 0.5}
        width={cellSize - 1}
        height={cellSize - 1}
        fill={num2color(val)}
        borderColor="#aaaaaa"
        key={`activation-rect-${y}`}
        tooltip={[tooltip, `x = ${val.toFixed(16)}`, `result = ${result.toFixed(16)}`].join('\n')}
        onTooltip={tooltipFunc}
      />,
      <Text
        x={(1.5 + connectorWidth) * cellSize}
        y={y * 2 * cellSize}
        text={result.toFixed(3)}
        fontSize={fontSize}
        height={cellSize}
        valign="middle"
        color="black"
        key={`input-relu-text-${y}`}
      />,
    );
    return result;
  });

  return [data, elements, (1 + numberCellWidth + 0.5 + connectorWidth) * cellSize, input.length * 2 * cellSize, label];
};

const reluLayer: layerFunc = (input, params, paramsIndex, tooltipFunc) => {
  return activationLayer('ReLU', input, (val) => Math.max(0, val), 'f(x) = max(0, x)', tooltipFunc);
};

const softmaxLayer: layerFunc = (input, params, paramsIndex, tooltipFunc) => {
  const total = input.reduce((a, b) => Math.exp(b) + a);
  return activationLayer('Softmax', input, (val) => Math.exp(val) / total, 'f(x) = exp(x) / total', tooltipFunc);
};

type DLGraphProps = { weights: any; layers: string[]; forcusLayerIndex?: number[]; outputLabel?: string[] };
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
  layerFuncs: { [name: string]: layerFunc };
  _handleTooltip: (x: number, y: number, text: string) => void;

  constructor(props: DLGraphProps) {
    super(props);

    this.layerFuncs = {
      input: this.inputRGBLayer.bind(this),
      fullConnected: fullConnectedLayer,
      relu: reluLayer,
      softmax: softmaxLayer,
      output: this.outputColorLayer.bind(this),
    };
    this._handleTooltip = this.handleTooltip.bind(this);
    this.state = { input: times(this.inputNeuronCount, (_) => Math.random()), tooltip: undefined };
  }

  handleTooltip(x: number, y: number, text: string): void {
    if (text === '') {
      this.setState({ tooltip: undefined });
    } else {
      this.setState({ tooltip: { x, y, text } });
    }
  }

  inputRGBLayer: layerFunc = (input, params, paramsIndex) => {
    const numberCellWidth = 2.5; // 数字を表示するセル数
    const inputSliderWidth = 5; // 入力のセル数
    const sampleWidth = 5;
    const sampleHeight = 2.5;

    let elements: ReactNode[] = [
      <Rect
        key="init-rect"
        x={((inputSliderWidth - sampleWidth) / 2) * cellSize + 3}
        y={0}
        width={sampleWidth * cellSize - 2}
        height={sampleHeight * cellSize}
        fill={`rgb(${input.map((v) => v * 255).join(',')})`}
        borderColor="#e0e0e0"
      />,
    ];
    const rangeColor = ['#880000', '#008800', '#000088'];
    this.state.input.forEach((val, i) => {
      elements.push(
        <Slider
          x={2}
          y={(sampleHeight + 1 + i * 2) * cellSize}
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
          y={(sampleHeight + 1 + i * 2) * cellSize}
          text={this.state.input[i].toFixed(3)}
          fontSize={fontSize}
          height={cellSize}
          valign="middle"
          color="black"
          key={`input-layer-text-${i}`}
        />,
      );
    });

    return [
      this.state.input,
      elements,
      (inputSliderWidth + 0.5 + numberCellWidth) * cellSize,
      (this.state.input.length * 2 + (sampleHeight + 1) * 2) * cellSize,
      'Input',
    ];
  };

  outputColorLayer: layerFunc = (input, params, paramsIndex) => {
    const width = 8;

    const maxVal = Math.max(...input);
    const elements = input.map((val, i) => (
      <Text
        x={layerMargin}
        y={i * 2 * cellSize}
        text={this.props.outputLabel![i]}
        fontSize={fontSize}
        fontWeight={maxVal === val ? 'bold' : 'normal'}
        height={cellSize}
        valign="middle"
        color={`rgba(0,0,0,${Math.min(1, val * 1.6 + 0.2)})`}
        key={`output-layer-text-${i}`}
      />
    ));

    return [input, elements, width * cellSize, input.length * 2 * cellSize, 'Output'];
  };

  render() {
    let data = clone(this.state.input);

    let posX = 0;
    const layers = this.props.layers.map((layer, i) => {
      const [layerName, paramsIndex] = layer.split(/:/, 2);
      const [output, el, layerWidth, layerHeight, label] = this.layerFuncs[layerName](
        data,
        this.props.weights,
        parseInt(paramsIndex, 10),
        this._handleTooltip,
      );
      data = output;
      posX += layerWidth;
      const opacity = this.props.forcusLayerIndex === undefined || this.props.forcusLayerIndex.includes(i) ? 1.0 : 0.2;
      return { x: posX - layerWidth, width: layerWidth, height: layerHeight, el, label, opacity };
    });

    let maxH = Math.max(...layers.map((l) => l.height));
    return (
      <>
        <svg
          width="100%"
          viewBox={`0,0,${this.width},${maxH + fontSize}`}
          style={{ objectFit: 'cover' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {layers.map((layer, i) => {
            return (
              <>
                <svg x={layer.x} y={(maxH - layer.height) / 2} style={{ opacity: layer.opacity }} key={`layer-${i}`}>
                  {layer.el}
                </svg>
                <Text
                  x={layer.x + layer.width / 2}
                  y={maxH - fontSize / 2}
                  height={fontSize}
                  fontSize={fontSize}
                  align="center"
                  valign="top"
                  color="black"
                  text={layer.label}
                  key={`layer-label-${i}`}
                  style={{ opacity: layer.opacity }}
                />
                {i > 0 ? <Line x1={layer.x} y1={0} x2={layer.x} y2={maxH} color="#e0e0e0" /> : undefined}
              </>
            );
          })}
        </svg>
        {this.state.tooltip ? (
          <div
            style={{
              left: this.state.tooltip.x,
              top: this.state.tooltip.y + 24,
              position: 'fixed',
            }}
            className="p-2 rounded-md shadow-md bg-slate-200 text-xs"
          >
            {this.state.tooltip.text.split(/\n/).map((str: string) => (
              <p>{str}</p>
            ))}
          </div>
        ) : undefined}
      </>
    );
  }
}
