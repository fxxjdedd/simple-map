type Scalar = [number];
type Vector2 = [number, number];
type Vector3 = [number, number, number];
type Vector4 = [number, number, number, number];

type VectorList = {
    1: Scalar;
    2: Vector2;
    3: Vector3;
    4: Vector4;
};
export type Vector<N> = N extends keyof VectorList ? VectorList[N] : never;
