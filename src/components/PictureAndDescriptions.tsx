import React, { useEffect, useState, useRef } from 'react';
import { elementCollision } from '../utils/dom';

export const Section = () => {};


export const PictureAndDescription = () => {
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
    const collRef = refs
      .reverse()
      .find((ref) => refGraph != undefined && elementCollision(refGraph, ref[0] as React.RefObject<HTMLElement>));
    if (collRef) setGraphLayers(collRef[1] as number[]);
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
            今回は色をRGBの0.0〜1.0の数字で表します。
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
          </div>
          <div ref={ref2}>
            <h1>第一層 全結合層</h1>
            今回は色をRGBの0.0〜1.0の数字で表します。
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
          </div>
          <div style={{ marginBottom: '1024px' }} ref={ref3}>
            ここには次の単元が入ります
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
          </div>
        </div>
      </div>
    );
  } else {
    return <div>loading...</div>;
  }
};
