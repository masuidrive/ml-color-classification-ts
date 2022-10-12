import { COLOR_INDEX_LABEL, TRAIN_DATA, TEST_DATA } from "../dataset";

/// 配列の次元数を求める
function array_dims(x: any): number {
    if (Array.isArray(x)) {
        return array_dims(x[0]) + 1;
    }
    return 0;
}

/// 0で埋めた1次元配列を返す
function fill_zero_1d(size: number) {
    return [...Array(size)].map(() => 0);
}

/// 0から(maxNum ?? size)までの重複しないランダムな値の入った、要素数sizeの1次元配列を返す
function non_overlapping_random_1d(size: number, maxNum?: number): number[] {
    const nums = [...Array(maxNum ?? size)].map((_, i) => i);
    return nums.sort((a, b) => 0.5 - Math.random()).slice(0, size);
}

// 0から1.0のランダムな値で埋められた二次元配列を返す
function random_2d(height: number, width: number): number[][] {
    return [...Array(height)].map((v) =>
        [...Array(width)].map((v) => Math.random())
    );
}

// 二次元配列の各要素にvalを掛ける
function product_2d_number(x: number[][], val: number) {
    return x.map((xx) => xx.map(xxx => xxx * val));
}

/// 1次元配列の中身を全部足す
function sum_1d(x: number[]): number {
    return x.reduce((v, s) => v + s, 0);
}

/// 1次元配列の中にマイナスの数字があれば0にする
function relu_1d(x: number[]): number[] {
    return x.map((v) => Math.max(v, 0));
}

/// 配列の中の値の上下関係を保ったまま、合計値が1.0に調整する
function softmax_1d(x: number[]): number[] {
    const base = sum_1d(x.map((v) => Math.exp(v)));
    return x.map((v) => Math.exp(v) / base);
}

/// 1次元配列の一番大きな値のインデックス値
function argmax_1d(vector: number[]) {
    return vector.map((val, i) => [val, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}

/// 1次元配列と2次元配列の内積(ドット積)を求める
function dot_produce_1d_2d(x: number[], y: number[][]): number[] {
    return [...Array(y[0].length)].map((_, w1i) =>
        sum_1d(x.map((xx, i) => xx * y[i][w1i]))
    )
}

/// 同じサイズの1次元配列同士の足し算
function add_1d(x: number[], y: number[]): number[] {
    return x.map((xx, i) => xx + y[i]);
}

/// weightsとxから推測の1次元配列を返す
function predict(x: number[], weights: any): number[] {
    // x.shape,W1.shape,b1.shape,a1.shape,
    // shape  x(3), W1(3, 30), b1(30,), a1(100, 30)

    const a1 = add_1d(dot_produce_1d_2d(x, weights.W1), weights.b1);
    const z1 = relu_1d(a1);
    const a2 = add_1d(dot_produce_1d_2d(z1, weights.W2), weights.b2);
    const y = softmax_1d(a2);

    return y;
}

/// 1次元の配列の傾きを求める
function numerical_gradient_1d(loss_func: any, x: number[]) {
    const h = 0.0001;
    let grad = [...Array(x.length)].map((v) => 0);
    for (const [idx, val] of x.entries()) {
        x[idx] = val + h;
        const fxh1 = loss_func(x);

        x[idx] = val - h;
        const fxh2 = loss_func(x);

        grad[idx] = (fxh1 - fxh2) / (2 * h);

        x[idx] = val;
    };

    return grad;
}

/// 2次元の配列の傾きを求める
function numerical_gradient_2d(loss_func: any, x: number[][]) {
    return x.map((val, idx) =>
        numerical_gradient_1d(loss_func, val)
    );
}

/// クロスエントロピーロスを計算
function cross_entropy_error(y: number[][], t: number[]) {
    const h = 0.0000001;
    const batch_size = y.length;
    let val =
        -[...Array(batch_size)]
            .map((_, i) => Math.log(y[i][t[i]]))
            .reduce((v, s) => v + s) / batch_size;
    return val;
}

/// ロス関数
function loss(x: number[][], t: number[], weights: any) {
    const y = x.map((xx) => predict(xx, weights))
    return cross_entropy_error(y, t);
}

// 正解率を求める
function accuracy(x: number[][], t: number[], weights: any) {
    const correctCount = sum_1d(x.map((xx, xi) => argmax_1d(predict(xx, weights)) == t[xi] ? 1 : 0));
    return correctCount / t.length;
}

// x:入力データ, t:教師データ
function numerical_gradient(x: number[][], t: number[], weights: any): { [key: string]: number[][] | number[] } {
    let grads: { [key: string]: number[][] | number[] } = {};
    for (const key in weights) {
        if (array_dims(weights[key]) === 2) {
            grads[key] = numerical_gradient_2d(
                (w: number) => loss(x, t, weights),
                weights[key]
            );
        } else if (array_dims(weights[key]) === 1) {
            grads[key] = numerical_gradient_1d(
                (w: number) => loss(x, t, weights),
                weights[key]
            );
        }
    };

    return grads;
}

const is1D = <T>(maybeArray: T | readonly T[]): maybeArray is T[] => {
    return Array.isArray(maybeArray);
};

export function hello() {
    const iters_num = 1000;
    const hidden_size = 4;

    const train_size = TRAIN_DATA.length;
    const input_size = TRAIN_DATA[0].length - 1;
    const output_size = COLOR_INDEX_LABEL.length;

    const batch_size = 10;
    const learning_rate = 0.001;

    const weight_init_std = 0.01;
    let weights: { [key: string]: number[][] | number[] } = {
        W1: product_2d_number(random_2d(input_size, hidden_size), weight_init_std),
        b1: fill_zero_1d(hidden_size),
        W2: product_2d_number(random_2d(hidden_size, output_size), weight_init_std),
        b2: fill_zero_1d(output_size)
    };
    //console.log("init weights", JSON.stringify(weights));

    const iter_per_epoch = Math.max(Math.floor(train_size / batch_size), 1);
    for (let iter = 0; iter < iters_num; ++iter) {
        // ミニバッチの取得
        // ランダムにbatch_size個分のtrainRGB, trainColorIndexを取り出す
        const batch_mask = non_overlapping_random_1d(batch_size, train_size);
        const trainRGB = batch_mask.map((i) => TRAIN_DATA[i].slice(1, 4));
        const trainColorLabel = batch_mask.map((i) => TRAIN_DATA[i][0]);

        // 勾配を求める
        const grad = numerical_gradient(trainRGB, trainColorLabel, weights);

        // パラメータの更新
        for (const key in weights) {
            weights[key] = weights[key].map((row: number | number[], rowi: number) => {
                if (is1D(row)) {
                    return row.map((val: number, vali: number) =>
                        val - learning_rate * ((grad as any)[key][rowi][vali] as number));
                }
                else {
                    return row - learning_rate * (grad[key][rowi] as number);
                }
            }) as number[] | number[][]
        };
        if (iter % iter_per_epoch == 0) {
            const train_acc = accuracy(TRAIN_DATA.map((data) => data.slice(1, 4)), TRAIN_DATA.map((data) => data[0]), weights)
            const test_acc = accuracy(TEST_DATA.map((data) => data.slice(1, 4)), TEST_DATA.map((data) => data[0]), weights)
            console.log(`${iter}: train acc, test acc, loss: ${train_acc}, ${test_acc}, ${loss(trainRGB, trainColorLabel, weights)}`)
        }
    }
    const train_acc = accuracy(TRAIN_DATA.map((data) => data.slice(1, 4)), TRAIN_DATA.map((data) => data[0]), weights)
    const test_acc = accuracy(TEST_DATA.map((data) => data.slice(1, 4)), TEST_DATA.map((data) => data[0]), weights)
    console.log(`Fin: train acc, test acc, loss: ${train_acc}, ${test_acc}`)
}
