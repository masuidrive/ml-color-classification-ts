import { useEffect, useState } from "react";
import { createWorkerFactory, useWorker } from "@shopify/react-web-worker";
import "./styles.css";
import { Image, Layer, Rect, Stage } from "react-konva";

const worker = new Worker(new URL('./workers', import.meta.url));
setTimeout(() => {

  worker.postMessage({
    command:
      'train:start',
  });
}, 2000)

export default function App() {
  const [message, setMessage] = useState<any>();
  useEffect(() => {
    worker.onmessage = (message: MessageEvent) => {
      console.log("onmessage", message)
      setMessage(message.data);
      if (message.data.label === 'train:info') {
        setTimeout(() => {
          console.log("cancel!")
          worker.terminate()
        }, 500)
      };
      // Note: in your actual app code, make sure to check if Home
      // is still mounted before setting state asynchronously!
      // const webWorkerMessage = await worker.hello("Tobi");
      // setMessage(webWorkerMessage as any);
      // const webWorkerMessage = await worker.train();
    }
    return () => { worker.onmessage = null }
  }, [worker]);

  return <div title="Home">
    <Stage width={500} height={500}>
      <Layer><Rect stroke='black' strokeWidth={4} x={5} y={5} width={490} height={490} />
        <Rect fill='red' x={100} y={100} width={300} height={200} /></Layer>
    </Stage>
    <div>{JSON.stringify(message)}</div>

  </div>;
}
