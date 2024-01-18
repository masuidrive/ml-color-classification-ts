import { COLOR_INDEX_LABEL, TRAIN_DATA, TEST_DATA } from '../dataset';

const times = (n: number, callbackfn: (index: number) => number[] | number | void) =>
  [...Array(n)].map((_: any, index: number) => callbackfn(index));

// 親に進捗を送る
const progress = (label: string, data?: any) => {
  self.postMessage({ command: 'progress', label, data });
};

// 1次元配列以上かどうかの確認
const is1D = <T>(maybeArray: T | readonly T[][] | readonly T[]): maybeArray is T[] => Array.isArray(maybeArray);

// 2次元配列以上かどうかの確認
const is2D = <T>(maybeArray: T | readonly T[][] | readonly T[]): maybeArray is T[][] =>
  Array.isArray(maybeArray) && Array.isArray(maybeArray[0]);

/// 0で埋めた1次元配列を返す
const fill_zero_1d = (size: number): number[] => [...Array(size)].map(() => 0);

/// 0から(maxNum ?? size)までの重複しないランダムな値の入った、要素数sizeの1次元配列を返す
const non_overlapping_random_1d = (size: number, maxNum?: number): number[] => {
  const nums = [...Array(maxNum ?? size)].map((_, i) => i);
  return nums.sort((a, b) => 0.5 - Math.random()).slice(0, size);
};

// 0から1.0のランダムな値で埋められた二次元配列を返す
const random_2d = (height: number, width: number): number[][] => {
  return [...Array(height)].map((v) => [...Array(width)].map((v) => Math.random()));
};

/// 1次元配列の中身を全部足す
const sum_1d = (x: number[]): number => x.reduce((v, s) => v + s, 0);

/// 1次元配列の中身の平均を求める
const average_1d = (x: number[]): number => sum_1d(x) / x.length;

/// 1次元配列の一番大きな値のインデックス値
const argmax_1d = (vector: number[]) => vector.map((val, i) => [val, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];

/// 1次元配列の中にマイナスの数字があれば0にする
const relu_1d = (x: number[]): number[] => x.map((v) => Math.max(v, 0));

// 未テスト
const relu_1d_backwards = (x: number[]): number[] => x.map((v) => (v > 0 ? 1 : 0));

// 全結合層
const affine_1d = (x: number[], w: number[][], b: number[]): number[] => {
  return times(w[0].length, (w1i) => sum_1d(x.map((xx, i) => xx * w[i][w1i] + b[i]))) as number[];
};
/*
const affine_1d_backwards = (
  dout: number[],
  w: number[][],
  x: number[],
): { dx: number[]; dw: number[]; db: number[] } => {
  let dx = dout.map((d, i) => d * w[i]);
  let dw = x.map((xx, i) => xx * dout[i]);
  let db = dout;
  return { dx, dw, db };
};
*/

/// 1次元配列の合計値が1.0に調整する
const softmax_1d = (x: number[]): number[] => {
  const base = sum_1d(x.map((v) => Math.exp(v)));
  return x.map((v) => Math.exp(v) / base);
};

// 未テスト
const softmax_1d_backwards = (x: number[]): number[] => {
  const y = softmax_1d(x);
  return y.map((yy, i) => yy * (1 - yy));
};

/// 同じサイズの1次元配列同士の足し算
const add_1d = (x: number[], y: number[]): number[] => x.map((xx, i) => xx + y[i]);

// 1次元配列の各要素にvalを掛ける
const product_1d_number = (x: number[], val: number): number[] => x.map((xx) => xx * val);

// 2次元配列の各要素にvalを掛ける
const product_2d_number = (x: number[][], val: number): number[][] => x.map((xx) => product_1d_number(xx, val));

// 2次元配列をmapする
const map_2d = (x: number[][], func: (val: number, idx: number, idx2: number) => number): number[][] =>
  x.map((xx, xxi) => xx.map((xxx, xxxi) => func(xxx, xxxi, xxi)));

/// 1次元の配列の傾きを求める
const numerical_gradient_1d = (loss_func: any, x: number[]) => {
  const h = 0.0001;
  let grad = fill_zero_1d(x.length);
  for (const [idx, val] of x.entries()) {
    x[idx] = val + h;
    const fxh1 = loss_func(x);

    x[idx] = val - h;
    const fxh2 = loss_func(x);

    grad[idx] = (fxh1 - fxh2) / (2 * h);

    x[idx] = val;
  }

  return grad;
};

/// 2次元の配列の傾きを求める
const numerical_gradient_2d = (loss_func: any, x: number[][]) => {
  return x.map((val, idx) => numerical_gradient_1d(loss_func, val));
};

/// weightsとxから推測された1次元配列を返す
export const predict = (x: number[], weights: any): number[] => {
  // x.shape,W1.shape,b1.shape,a1.shape,
  // shape  x(3), W1(3, 30), b1(30,), a1(100, 30)
  const _a1 = times(weights.W1[0].length, (w1i) =>
    sum_1d(x.map((xx, i) => xx * weights.W1[i][w1i] + weights.b1[i])),
  ) as number[];
  const a1 = affine_1d(x, weights.W1, weights.b1);
  const z1 = relu_1d(a1);
  const a2 = affine_1d(z1, weights.W2, weights.b2);
  const _a2 = times(weights.W2[0].length, (w2i) =>
    sum_1d(z1.map((xx, i) => xx * weights.W2[i][w2i] + weights.b2[i])),
  ) as number[];
  const y = softmax_1d(a2);

  return y;
};

/// クロス エントロピー ロスを計算
const cross_entropy_error = (y: number[][], t: number[]) => {
  return -average_1d(y.map((yy, i) => Math.log(yy[t[i]])));
};

/// ロス関数
const loss = (x: number[][], t: number[], weights: any) => {
  const y = x.map((xx) => predict(xx, weights));
  return cross_entropy_error(y, t);
};

// x:入力データ, t:教師データ
const numerical_gradient = (x: number[][], t: number[], weights: any): { [key: string]: number[][] | number[] } => {
  let grads: { [key: string]: number[][] | number[] } = {};
  for (const key in weights) {
    if (is2D(weights[key])) {
      grads[key] = numerical_gradient_2d((w: number) => loss(x, t, weights), weights[key]);
    } else if (is1D(weights[key])) {
      grads[key] = numerical_gradient_1d((w: number) => loss(x, t, weights), weights[key]);
    }
  }

  return grads;
};

/*
const backpropagation = (x: number[][], t: number[], weights: any): { [key: string]: number[][] | number[] } => {
  let l = loss(x, t, weights);
  let dout = 1;

  return grads;
};
*/

// 正解率を求める
const accuracy = (x: number[][], t: number[], weights: any) => {
  const correctCount = sum_1d(x.map((xx, xi) => (argmax_1d(predict(xx, weights)) == t[xi] ? 1 : 0)));
  return correctCount / t.length;
};

export function train() {
  const iters_num = 3000;
  const hidden_size = 4;

  const train_size = TRAIN_DATA.length;
  const input_size = TRAIN_DATA[0].length - 1;
  const output_size = COLOR_INDEX_LABEL.length;

  const batch_size = 10;
  const learning_rate = 0.1;

  const iter_per_epoch = Math.max(Math.floor(train_size / batch_size), 1);
  const max_epoch = Math.ceil(iters_num / iter_per_epoch);

  const weight_init_std = 0.01;
  let weights: { [key: string]: number[][] | number[] } = {
    W1: product_2d_number(random_2d(input_size, hidden_size), weight_init_std),
    b1: fill_zero_1d(hidden_size),
    W2: product_2d_number(random_2d(hidden_size, output_size), weight_init_std),
    b2: fill_zero_1d(output_size),
  };

  progress('train:info', {
    weight_init_std,
    iters_num,
    hidden_size,
    train_size,
    input_size,
    output_size,
    batch_size,
    learning_rate,
    max_epoch,
  });

  for (let iter = 0; iter < iters_num; ++iter) {
    // ミニバッチの取得
    // ランダムにbatch_size個分のtrainRGB, trainColorIndexを取り出す
    const batch_mask = non_overlapping_random_1d(batch_size, train_size);
    const trainRGB = batch_mask.map((i) => TRAIN_DATA[i].slice(1, 4));
    const trainColorLabel = batch_mask.map((i) => TRAIN_DATA[i][0]);

    // 勾配を求める
    const grads = numerical_gradient(trainRGB, trainColorLabel, weights);

    // パラメータの更新
    // weights = weights - grads * learning_rate
    for (const key in weights) {
      const weight = weights[key];
      const grad = grads[key];
      if (is2D(weight) && is2D(grad)) {
        weights[key] = map_2d(weight, (v, i1, i2) => v - grad[i2][i1] * learning_rate);
      } else if (is1D(weight) && is1D(grad)) {
        weights[key] = weight.map((v, i) => v - grad[i] * learning_rate);
      }
    }

    const train_loss = loss(
      TRAIN_DATA.map((data) => data.slice(1, 4)),
      TRAIN_DATA.map((data) => data[0]),
      weights,
    );

    progress('train:iterator', { weights, iter, train_loss });

    if (iter % iter_per_epoch == 0) {
      const epoch = Math.floor(iter / iter_per_epoch);
      const train_accuracy = accuracy(
        TRAIN_DATA.map((data) => data.slice(1, 4)),
        TRAIN_DATA.map((data) => data[0]),
        weights,
      );
      const test_accuracy = accuracy(
        TEST_DATA.map((data) => data.slice(1, 4)),
        TEST_DATA.map((data) => data[0]),
        weights,
      );

      const test_loss = loss(trainRGB, trainColorLabel, weights);
      progress('train:epoch', { epoch, max_epoch, train_accuracy, test_accuracy, test_loss });
      console.log(`${iter}: train acc, test acc, test loss: ${train_accuracy}, ${train_accuracy}, ${test_loss}`);
    }
  }
  const train_acc = accuracy(
    TRAIN_DATA.map((data) => data.slice(1, 4)),
    TRAIN_DATA.map((data) => data[0]),
    weights,
  );
  const test_acc = accuracy(
    TEST_DATA.map((data) => data.slice(1, 4)),
    TEST_DATA.map((data) => data[0]),
    weights,
  );
  console.log(`Fin: train acc, test acc, loss: ${train_acc}, ${test_acc}`);
  progress('train:finish');
}

self.onmessage = (message: MessageEvent) => {
  console.log('onmessage', message);
  if (message?.data.command === 'train:start') {
    console.log('>train');
    train();
    console.log('<train');
  }
};
