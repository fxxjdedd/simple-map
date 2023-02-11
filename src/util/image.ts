export async function loadImage(url: string) {
    const image = new Image();
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
        image.onload = () => {
            resolve(image);
        };
        image.onerror = err => {
            reject(err);
        };
    });

    image.src = url;
    image.crossOrigin = "anonymous";
    return await promise;
}
