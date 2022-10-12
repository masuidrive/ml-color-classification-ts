import nj from "@d4c/numjs";

export function dataset_to_numjs(data: number[][], label_count: number) {
  const x_data = nj.array(data.map((line) => line.slice(1)));

  // 教師データはone hot encodingで
  const one_hot = nj.identity(label_count).tolist();
  const t_data = nj.array(data.map((line) => one_hot[line[0]]));
  return [x_data, t_data];
}
