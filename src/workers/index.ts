import { useEffect } from "react";
import { COLOR_INDEX_LABEL, TRAIN_DATA, TEST_DATA } from "../dataset";
import { sum, shuffle } from "lodash";

function relu(x: number[][]) {
  return x.map((xx) => xx.map((v) => (v < 0 ? 0 : v)));
}

function softmax(x: number[][]) {
  return x.map((xx) => {
    const base = sum(xx.map((v) => Math.exp(v)));
    return xx.map((v) => Math.exp(v) / base);
  });
}

function dot_produce(x: number[][], y: number[][]): number[][] {
  return x.map((xx: number[], xi: number) =>
    // xxは3次元のベクトル
    // [1,2]
    // (1*10+2*60)
    [...Array(y[0].length)].map((_, w1i) =>
      sum(xx.map((x3, i) => x3 * y[i][w1i]))
    )
  );
}

function matrix_add(x: number[][], y: number[]): number[][] {
  return x.map((xx, xi) => xx.map((x3, i) => x3 * y[i]));
}

function predict(x: number[][], weights: any): any {
  // x.shape,W1.shape,b1.shape,a1.shape,
  // shape  x(100, 3) W1(3, 30) b1(30,) a1(100, 30)
  /// (2) [100, 3], [3, 30], [30]
  // a1 = np.dot(x, W1) + b1

  x.map((xx: number[], xi: number) =>
    // xxは3次元のベクトル
    sum(xx.map((x3, i) => x3 * weights.W1[i][xi]))
  );
  const a1 = matrix_add(dot_produce(x, weights.W1), weights.b1);
  console.log("a1", a1);
  const z1 = relu(a1);
  const a2 = matrix_add(dot_produce(z1, weights.W2), weights.b2);
  const y = softmax(a2);
  console.log("y", y);
  return y;
}

function numerical_gradient_1d(loss_func: any, x: number[]) {
  const h = 0.0001;
  let grad = [...Array(x.length)].map((v) => 0);
  x.forEach((val: number, idx: number) => {
    x[idx] = val + h;
    const fxh1 = loss_func(x);

    x[idx] = val - h;
    const fxh2 = loss_func(x);

    grad[idx] = (fxh1 - fxh2) / (2 * h);

    x[idx] = val;
  });

  return grad;
}

function numerical_gradient_2d(loss_func: any, x: number[][]) {
  let grad = x.map((val: number[], idx: number) =>
    numerical_gradient_1d(loss_func, val)
  );

  return grad;
}

function cross_entropy_error(y: number[][], t: number[]) {
  const h = 0.0000001;
  const batch_size = y.length;
  let val =
    -[...Array(batch_size)]
      .map((_, i) => Math.log(y[i][t[i]]))
      .reduce((v, s) => v + s) / batch_size;
  return val;
}

function loss(x: number[][], t: number[], weights: any) {
  const y = predict(x, weights);
  return cross_entropy_error(y, t);
}

// x:入力データ, t:教師データ
function numerical_gradient(x: number[][], t: number[], weights: any) {
  let grads: { [key: string]: number[][] | number[] } = {};
  ["W1", "b1", "W2", "b2"].forEach((key) => {
    if (Array.isArray(weights[key][0])) {
      grads[key] = numerical_gradient_2d(
        (_: number) => loss(x, t, weights),
        weights[key]
      );
    } else {
      grads[key] = numerical_gradient_1d(
        (_: number) => loss(x, t, weights),
        weights[key]
      );
    }
  });

  return grads;
}

function init_weight(
  weight_init_std: number,
  input_size: number,
  output_size: number
) {
  return [...Array(input_size)].map((v) =>
    [...Array(output_size)].map((v) => Math.random() * weight_init_std)
  );
}

export function hello(name: string) {
  console.log("> hello");
  const iters_num = 3;
  const train_size = TRAIN_DATA.length;
  const input_size = TRAIN_DATA[0].length - 1;
  const output_size = COLOR_INDEX_LABEL.length;

  const batch_size = 100;
  const learning_rate = 0.001;
  const hidden_size = 30;

  let train_loss_list = [];
  let train_acc_list = [];
  let test_acc_list = [];

  const weight_init_std = 0.01;
  let weights = {
    W1: init_weight(weight_init_std, input_size, hidden_size),
    b1: [...Array(hidden_size)].map(() => 0),
    W2: init_weight(weight_init_std, hidden_size, output_size),
    b2: [...Array(output_size)].map(() => 0)
  };

  const iter_per_epoch = Math.max(Math.floor(train_size / batch_size), 1);
  for (let iter = 0; iter < iters_num; ++iter) {
    console.log(`> iter ${iter}`);

    // ミニバッチの取得
    // ランダムにbatch_size個分のx_train, t_trainを取り出す
    const batch_mask = shuffle([...Array(train_size)].map((_, i) => i)).slice(
      0,
      batch_size
    );

    const x_batch = batch_mask.map((i) => TRAIN_DATA[i].slice(1, 4));
    const t_batch = batch_mask.map((i) => TRAIN_DATA[i][0]);

    // 勾配を求める
    const grad = numerical_gradient(x_batch, t_batch, weights);

    console.log(grad);

    // パラメータの更新
    console.log("update");
    ["W1", "b1", "W2", "b2"].forEach((key) => {
      console.log("key", weights[key].length, grad[key].length);
      //      weights[key] -= learning_rate * grad[key];
    });
  }
  console.log(weights);
  /*
    const x = [
      [1, 2],
      [3, 4],
      [5, 6]
    ];
    const W1 = [
      [10, 20, 30, 40, 50],
      [60, 70, 80, 90, 100]
    ];
    console.log(
      x.map((xx: number[], xi: number) =>
        // xxは3次元のベクトル
        // [1,2]
        // (1*10+2*60)
        [...Array(W1[0].length)].map((_, w1i) =>
          sum(xx.map((x3, i) => x3 * W1[i][w1i]))
        )
      )
    );
    console.log(x.length);
  */

  return `Hello, ${name}`;
}
