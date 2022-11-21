import React, { useRef } from 'react';

export const elementCollision = (
  elRef1: React.RefObject<any>,
  elRef2: React.RefObject<any>,
) => {
  const rect1 = elRef1.current?.getBoundingClientRect();
  const rect2 = elRef2.current?.getBoundingClientRect();
  if (rect1 === undefined || rect2 === undefined) return false;
  console.log("!",rect1,rect2)

  return !(
    rect1.top > rect2.bottom ||
    rect1.right < rect2.left ||
    rect1.bottom < rect2.top ||
    rect1.left > rect2.right
  );
};
