import { useEffect, useState } from "react";
import { createWorkerFactory, useWorker } from "@shopify/react-web-worker";
import "./styles.css";

const createWorker = createWorkerFactory(() => import("./workers"));

export default function App() {
  const worker = useWorker(createWorker);
  const [message, setMessage] = useState(Math.random());
  useEffect(() => {
    (async () => {
      // Note: in your actual app code, make sure to check if Home
      // is still mounted before setting state asynchronously!
      // const webWorkerMessage = await worker.hello("Tobi");
      // setMessage(webWorkerMessage as any);
      // const webWorkerMessage = await worker.train();
      console.log("run", message)

    })();
  }, [worker]);

  return <div title="Home">! {message} !</div>;
}
