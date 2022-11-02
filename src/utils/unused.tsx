import { FC } from 'react';
import { Rect } from '../components/svg';

const cellPosX = (x: number, size: number) => x * size;
const cellPosY = (y: number, size: number, height: number, maxHeight: number) =>
  (y + (maxHeight - height) / 2) * 2 * size;

type CellProps = {
  x: number;
  y: number;
  size: number;
  height: number;
  maxHeight: number;
  color: string;
  border?: string;
};
const Cell: FC<CellProps> = ({ x, y, size, height, maxHeight, color, border }) => (
  <Rect
    fill={color}
    x={x * 3 * size}
    y={(y + (maxHeight - height) / 2) * 2 * size}
    width={size}
    height={size}
    borderColor={border ?? '#aaaaaa'}
  />
);
