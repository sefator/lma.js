import * as math from 'mathjs';

/**
 * Difference of the matrix function over the parameters
 * @ignore
 * @param {{x:Array<number>, y:Array<number>}} data - Array of points to fit in the format [x1, x2, ... ], [y1, y2, ... ]
 * @param {Array<number>} evaluatedData - Array of previous evaluated function values
 * @param {Array<number>} params - Array of previous parameter values
 * @param {number} gradientDifference - Adjustment for decrease the damping parameter
 * @param {function} paramFunction - The parameters and returns a function with the independent variable as a parameter
 * @return {Matrix}
 */
function gradientFunction(
    data: {x: number[], y: number[]},
    evaluatedData: number[],
    params: number[],
    gradientDifference: number,
    paramFunction: (params: number[]) => (x: number) => number
  ) {
    const n = params.length;
    const m = data.x.length;

    const ans = new Array(n);

    for (let param = 0; param < n; param++) {
      ans[param] = new Array(m);
      const auxParams = params.concat();
      auxParams[param] += gradientDifference;
      const funcParam = paramFunction(auxParams);

      for (let point = 0; point < m; point++) {
        ans[param][point] = evaluatedData[point] - funcParam(data.x[point]);
      }
    }
    return math.matrix(ans);
  }

/**
 * Matrix function over the samples
 * @ignore
 * @param {{x:Array<number>, y:Array<number>}} data - Array of points to fit in the format [x1, x2, ... ], [y1, y2, ... ]
 * @param {Array<number>} evaluatedData - Array of previous evaluated function values
 * @return {Matrix}
 */
function matrixFunction(data: {x: number[], y: number[]}, evaluatedData: number[]) {
    const m = data.x.length;

    const ans = new Array(m);

    for (let point = 0; point < m; point++) {
      ans[point] = data.y[point] - evaluatedData[point];
    }

    return math.matrix([ans]);
  }

/**
 * Iteration for Levenberg-Marquardt
 * @ignore
 * @param {{x:Array<number>, y:Array<number>}} data - Array of points to fit in the format [x1, x2, ... ], [y1, y2, ... ]
 * @param {Array<number>} params - Array of previous parameter values
 * @param {number} damping - Levenberg-Marquardt parameter
 * @param {number} gradientDifference - Adjustment for decrease the damping parameter
 * @param {function} parameterizedFunction - The parameters and returns a function with the independent variable as a parameter
 * @return {Array<number>}
 */
export default function step(
    data: {x: number[], y: number[]},
    params: number[],
    damping: number,
    gradientDifference: number,
    parameterizedFunction: (params: number[]) => (x: number) => number
  ) {
    const identity: math.Matrix
        = math.multiply(math.eye(params.length), damping * gradientDifference * gradientDifference);
    const l = data.x.length;
    const evaluatedData = new Array(l);
    const func = parameterizedFunction(params);
    for (let i = 0; i < l; i++) {
      evaluatedData[i] = func(data.x[i]);
    }
    const gradientFunc = gradientFunction(
      data,
      evaluatedData,
      params,
      gradientDifference,
      parameterizedFunction
    );
    const matrixFunc = math.transpose(matrixFunction(data, evaluatedData));
    const inverseMatrix = math.inv(
      math.add(identity, math.multiply(gradientFunc, math.transpose(gradientFunc))) as math.Matrix
    );
    const p = math.subtract(math.matrix([params]),
      math.chain(inverseMatrix)
        .multiply(gradientFunc)
        .multiply(matrixFunc)
        .multiply(gradientDifference)
        .transpose()
        .valueOf()
    );

    return (p as any).toArray()[0];
  }