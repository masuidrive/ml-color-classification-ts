import React, { FC, useEffect, useState, useRef } from 'react';
import { Range, Progress, Divider } from 'react-daisyui';
import { DLGraph } from './components/DLGraph';
import { predict } from './workers';
import { COLOR_INDEX_LABEL } from './dataset';
import { clone, times } from './utils/array';
import { num2color } from './utils/color';
import { Line, Text, Rect, Circle } from './components/svg';
import { elementCollision } from './utils/dom';
import './styles.css';

const worker = new Worker(new URL('./workers', import.meta.url));
setTimeout(() => {
  worker.postMessage({
    command: 'train:start',
  });
}, 2000);

const weight2color = (val: number) => num2color(val / 3);

type ColorMatrix2DProps = { matrix: number[][]; cellSize?: number; rotate?: boolean };
const ColorMatrix2D: FC<ColorMatrix2DProps> = ({ matrix, cellSize = 16, rotate = false }) => {
  if (rotate) {
    return (
      <svg width={matrix.length * cellSize} height={matrix[0].length * cellSize}>
        {matrix.map((row, x) =>
          row.map((val, y) => (
            <Rect
              key={`${y}-${x}`}
              fill={weight2color(val)}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
            />
          )),
        )}
      </svg>
    );
  } else {
    return (
      <svg width={matrix[0].length * cellSize} height={matrix.length * cellSize}>
        {matrix.map((row, y) =>
          row.map((val, x) => (
            <Rect
              key={`${y}-${x}`}
              fill={weight2color(val / 3)}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
            />
          )),
        )}
      </svg>
    );
  }
};

type ColorMatrix1DProps = { vector: number[]; cellSize?: number; direction?: 'vertical' | 'horizontal' };
const ColorMatrix1D: FC<ColorMatrix1DProps> = ({ vector, cellSize = 16, direction = 'vertical' }) => {
  if (direction == 'vertical') {
    return (
      <svg width={cellSize} height={vector.length * cellSize}>
        {vector.map((val, y) => (
          <Rect key={`${y}`} fill={weight2color(val)} x={0} y={y * cellSize} width={cellSize} height={cellSize} />
        ))}
      </svg>
    );
  } else {
    return (
      <svg width={vector.length * cellSize} height={cellSize}>
        {vector.map((val, x) => (
          <Rect key={`${x}`} fill={weight2color(val)} x={x * cellSize} y={0} width={cellSize} height={cellSize} />
        ))}
      </svg>
    );
  }
};

export default function App() {
  const [message, setMessage] = useState<any>({});
  const [graphLayers, setGraphLayers] = useState<number[]>([0, 5]);
  const refGraph = useRef<any>();
  const ref1 = useRef<any>();
  const ref2 = useRef<any>();
  const ref3 = useRef<any>();
  const refs = [
    [ref1, [0, 1, 5]],
    [ref2, [0, 1, 2, 5]],
    [ref3, [0, 1, 2, 3, 4, 5]],
  ];
  const handleScroll = (e: Event) => {
    const collRef =  refs.reverse().find((ref) => 
      refGraph != undefined && elementCollision(refGraph, ref[0] as React.RefObject<HTMLElement>)
    );
    if(collRef) setGraphLayers( collRef[1] as number[] )
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [graphLayers, ...refs.map((val) => val[0])]);

  useEffect(() => {
    worker.onmessage = (message: MessageEvent) => {
      if (message?.data?.command === 'progress' && message?.data?.label == 'train:iterator') {
        setMessage(message.data);
      }
    };
    return () => {
      worker.onmessage = null;
    };
  }, [worker]);
  const W1 = message?.data?.weights?.W1 as number[][] | undefined;
  const b1 = message?.data?.weights?.b1 as number[] | undefined;
  const W2 = message?.data?.weights?.W2 as number[][] | undefined;
  const b2 = message?.data?.weights?.b2 as number[] | undefined;

  if (W1 && b1 && W2 && b2) {
    return (
      <div className="lg:container lg:mx-auto">
        <div style={{ margin: '0 auto' }}>
          ここに機械学習の説明を入れます
          <div style={{ position: 'sticky', top: '0px', backgroundColor: 'white' }} ref={refGraph}>
            <DLGraph
              weights={message?.data?.weights}
              layers={['input', 'fullConnected:1', 'relu', 'fullConnected:2', 'softmax', 'output']}
              forcusLayerIndex={graphLayers}
              outputLabel={COLOR_INDEX_LABEL}
            />
          </div>
          <div ref={ref1}>
            <h1>入力</h1>
            今回は色をRGBの0.0〜1.0の数字で表します。<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>
          </div>
          <div ref={ref2}>
            <h1>第一層 全結合層</h1>
            今回は色をRGBの0.0〜1.0の数字で表します。<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>
          </div>
          <div style={{ marginBottom: '1024px' }} ref={ref3}>
            ここには次の単元が入ります<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>
          </div>
        </div>
      </div>
    );
  } else {
    return <div>loading...</div>;
  }
}

/*
  const W1 = message?.data?.weights?.W1 as number[][] | undefined;
  const b1 = message?.data?.weights?.b1 as number[] | undefined;
  const W2 = message?.data?.weights?.W2 as number[][] | undefined;
  const b2 = message?.data?.weights?.b2 as number[] | undefined;

  if (W1 && b1 && W2 && b2) {
    return (
      <div className="lg:container lg:mx-auto">
        <div style={{ margin: '0 auto' }}>
          ここに機械学習の説明を入れます
          <div style={{ position: 'sticky', top: '0px', backgroundColor: 'white' }}>
            <DLGraph
              weights={message?.data?.weights}
              layers={['input', 'fullConnected:1', 'relu', 'fullConnected:2', 'softmax', 'output']}
              forcusLayerIndex={[0, 5]}
              outputLabel={COLOR_INDEX_LABEL}
            />
          </div>
          <div>
            <h1>入力</h1>
            今回は色をRGBの0.0〜1.0の数字で表します。
          </div>
          <div>
            <h1>第一層 全結合層</h1>
            今回は色をRGBの0.0〜1.0の数字で表します。
          </div>
          <hr />
          W1
          <ColorMatrix2D matrix={W1} rotate={true} />
          <br />
          b1
          <ColorMatrix1D vector={b1.map((v) => v * 20)} />
          <br />
          W2
          <ColorMatrix2D matrix={W2} rotate={true} />
          <br />
          b2
          <ColorMatrix1D vector={b2.map((v) => v * 20)} />
        </div>
        <div style={{ marginBottom: '1024px' }}>ここには次の単元が入ります</div>
      </div>
    );
  } else {
    return <div>loading...</div>;
  }

*/
