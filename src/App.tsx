import { FC, useEffect, useState } from 'react';
// import { Text, Line, Circle, Rect, Layer, Stage } from "react-konva";
import { Range, Progress } from 'react-daisyui';
import { DLGraph } from './components/DLGraph';
import { predict } from './workers';
import { COLOR_INDEX_LABEL } from './dataset';
import { clone, times } from './utils/array';
import { num2color } from './utils/color';
import { Line, Text, Rect, Circle } from './components/svg';
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
  const [colorR, setColorR] = useState<number>(Math.floor(Math.random() * 255));
  const [colorG, setColorG] = useState<number>(Math.floor(Math.random() * 255));
  const [colorB, setColorB] = useState<number>(Math.floor(Math.random() * 255));
  useEffect(() => {
    worker.onmessage = (message: MessageEvent) => {
      if (message?.data?.command === 'progress' && message?.data?.label == 'train:iterator') {
        setMessage(message.data);
      }
      // Note: in your actual app code, make sure to check if Home
      // is still mounted before setting state asynchronously!
      // const webWorkerMessage = await worker.hello("Tobi");
      // setMessage(webWorkerMessage as any);
      // const webWorkerMessage = await worker.train();
    };
    return () => {
      worker.onmessage = null;
    };
  }, [worker]);

  const form = (
    <div>
      <div className="grid grid-rows-3 grid-flow-col gap-2 grid-cols-[48px_2em_1fr]">
        <div className="row-span-3" style={{ backgroundColor: `rgb(${colorR}, ${colorG}, ${colorB})` }}></div>
        <div className="text-right text-sm">{colorR}</div>
        <div className="text-right text-sm">{colorG}</div>
        <div className="text-right text-sm">{colorB}</div>
        <div>
          <Range
            value={colorR}
            min={0}
            max={255}
            onChange={(e) => setColorR(parseInt(e.target.value, 10))}
            size="xs"
            className="range-red"
          />
        </div>
        <div>
          <Range
            value={colorG}
            min={0}
            max={255}
            onChange={(e) => setColorG(parseInt(e.target.value, 10))}
            size="xs"
            className="range-green"
          />
        </div>
        <div>
          <Range
            value={colorB}
            min={0}
            max={255}
            onChange={(e) => setColorB(parseInt(e.target.value, 10))}
            size="xs"
            className="range-blue"
          />
        </div>
      </div>
    </div>
  );

  const W1 = message?.data?.weights?.W1 as number[][] | undefined;
  const b1 = message?.data?.weights?.b1 as number[] | undefined;
  const W2 = message?.data?.weights?.W2 as number[][] | undefined;
  const b2 = message?.data?.weights?.b2 as number[] | undefined;

  if (W1 && b1 && W2 && b2) {
    const rgb = [colorR / 255.0, colorG / 255.0, colorB / 255.0];
    const input_layer = 3;
    const hidden_layer = 4;
    const output_layer = 10;
    const max_layer_height = Math.max(input_layer, hidden_layer, output_layer);
    const answers = predict(rgb, message?.data?.weights);
    return (
      <div className="lg:container lg:mx-auto">
        <div style={{ margin: '0 auto' }}>
          ここに機械学習の説明を入れます
          <div className="flex flex-row">
            <div className="basis-1/7">01</div>
            <div className="basis-2/7">02</div>
            <div className="basis-2/7">03</div>
            <div className="basis-2/7">04</div>
          </div>

          <div style={{ position: 'sticky', top: '0px', backgroundColor: "white" }}>
            {form}
            <DLGraph weights={message?.data?.weights} layersCount={2} inputs={rgb} />
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
}
