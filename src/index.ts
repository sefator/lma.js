import error from "./error";
import step from "./step";

/**
 * Curve fitting algorithm
 * @param {{x:Array<number>, y:Array<number>}} data - Array of points to fit in the format [x1, x2, ... ], [y1, y2, ... ]
 * @param {function} parameterizedFunction - The parameters and returns a function with the independent variable as a parameter
 * @param {object} [options] - Options object
 * @param {number} [options.damping] - Levenberg-Marquardt parameter
 * @param {number} [options.gradientDifference = 10e-2] - Adjustment for decrease the damping parameter
 * @param {Array<number>} [options.initialValues] - Array of initial parameter values
 * @param {number} [options.maxIterations = 100] - Maximum of allowed iterations
 * @param {number} [options.errorTolerance = 10e-3] - Minimum uncertainty allowed for each point
 * @param {number} [options.v = 1.5] - Damping correction factor v > 1
 * @return {{parameterValues: Array<number>, parameterError: number, iterations: number}}
 */
export default function lma(
    data: {x: number[], y: number[]},
    parameterizedFunction: (params: number[]) => (x: number) => number,
    options = {
      damping : 0,
      errorTolerance : 10e-3,
      gradientDifference : 10e-2,
      initialValues: new Array(parameterizedFunction.length).map(() => 1),
      maxIterations : 100,
      v: 1.5,
    }
  ) {
    const {
      maxIterations,
      gradientDifference,
      damping,
      errorTolerance,
      initialValues,
      v
    } = options;
  
    let parameters = initialValues;
  
    let err = error(data, parameters, parameterizedFunction);
    let errD;
    let errV;
    let damp = damping;
    let count = 0;
    let par = parameters;
    do {
        const stepD = step(data, par, damp, gradientDifference, parameterizedFunction);
        errD = error(data, stepD, parameterizedFunction);
        const stepV = step(data, par, damp / v, gradientDifference, parameterizedFunction);
        errV = error(data, stepV, parameterizedFunction);
        if (err > errD || err > errV) {
          if (errD > errV) {
              damp = damp / v;
              par = stepV;
          } else {
              break;
          }
        } else {
            damp = damp * v;
        }
  
        count++;
  
    } while (err < errD || err < errV || count < maxIterations);
  
    let converged = err <= errorTolerance;
    let i = 0;
    let lastParams = initialValues;
    for (i; i < maxIterations && !converged; i++) {
      parameters = step(
        data,
        parameters,
        damp,
        gradientDifference,
        parameterizedFunction
      );
      err = error(data, parameters, parameterizedFunction);
      if (isNaN(err)) { break; }
      converged = err <= errorTolerance;
      lastParams = parameters;
    }
  
    return {
      iterations: i,
      parameterError: isNaN(err) ? error(data, lastParams, parameterizedFunction) : err,
      parameterValues: isNaN(err) ? lastParams : parameters,
    };
  }