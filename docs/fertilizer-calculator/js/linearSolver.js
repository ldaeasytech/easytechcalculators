// linearSolver.js

function determinant3x3(m) {
  return (
    m[0][0]*(m[1][1]*m[2][2] - m[1][2]*m[2][1]) -
    m[0][1]*(m[1][0]*m[2][2] - m[1][2]*m[2][0]) +
    m[0][2]*(m[1][0]*m[2][1] - m[1][1]*m[2][0])
  );
}

export function solveFertilizerSet(matrix, required) {

  const detMain = determinant3x3(matrix);
  if (Math.abs(detMain) < 1e-6) return null;

  function replaceColumn(m, colIndex, newCol) {
    return m.map((row, i) =>
      row.map((val, j) => (j === colIndex ? newCol[i] : val))
    );
  }

  const det1 = determinant3x3(replaceColumn(matrix, 0, required));
  const det2 = determinant3x3(replaceColumn(matrix, 1, required));
  const det3 = determinant3x3(replaceColumn(matrix, 2, required));

  const F1 = det1 / detMain;
  const F2 = det2 / detMain;
  const F3 = det3 / detMain;

  if (F1 < 0 || F2 < 0 || F3 < 0) return null;

  return [F1, F2, F3];
}
