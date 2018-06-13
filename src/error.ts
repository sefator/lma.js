export default function error(
    data: {x: number[], y: number[]},
    params: number[],
    parameterizedFunction: (params: number[]) => (x: number) => number): number {

        let err = 0;
        const func = parameterizedFunction(params);

        for (let i = 0; i < data.x.length; i++) {
            err += Math.abs(data.y[i] - func(data.x[i]));
        }
        return err;

}