import { useEffect, useState } from "react";
import { createWorkerFactory, useWorker } from "@shopify/react-web-worker";
import "./styles.css";

const worker = new Worker(new URL('./workers', import.meta.url));

worker.postMessage({
  command:
    'train:start',
});

export default function App() {
  const [message, setMessage] = useState<any>();
  useEffect(() => {
    (async () => {
      worker.onmessage = (message: MessageEvent) => {
        setMessage(message.data);
      };
      // Note: in your actual app code, make sure to check if Home
      // is still mounted before setting state asynchronously!
      // const webWorkerMessage = await worker.hello("Tobi");
      // setMessage(webWorkerMessage as any);
      // const webWorkerMessage = await worker.train();
      console.log("run", message)

    })();
    return () => { worker.onmessage = null }
  }, [worker]);

  return <div title="Home">{JSON.stringify(message)}</div>;
}
