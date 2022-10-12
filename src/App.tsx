import { useEffect, useState } from "react";
import { createWorkerFactory, useWorker } from "@shopify/react-web-worker";
import "./styles.css";
import { hello } from "./workers";

import {
  COLOR_INDEX_LABEL,
  COLOR_INDEX_RGB,
  TRAIN_DATA,
  TEST_DATA
} from "./dataset";
import { dataset_to_numjs } from "./data_loader";
/*
console.log(COLOR_INDEX_LABEL);
const [x_train, t_train] = dataset_to_numjs(
  TRAIN_DATA,
  COLOR_INDEX_LABEL.length
);
const [x_test, t_test] = dataset_to_numjs(TEST_DATA, COLOR_INDEX_LABEL.length);
const SAMPLE_SIZE = 1000;
*/
const createWorker = createWorkerFactory(() => import("./workers"));

export default function App() {
  const worker = useWorker(createWorker);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    (async () => {
      // Note: in your actual app code, make sure to check if Home
      // is still mounted before setting state asynchronously!
      //const webWorkerMessage = await worker.hello("Tobi");
      //setMessage(webWorkerMessage as any);
    })();
  }, []);

  return <div title="Home"> {message} </div>;
}
hello("1");
