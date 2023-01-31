export async function loadImage(url: string) {
    const image = new Image();
    image.src = url;
    image.crossOrigin = "anonymous";
    return await new Promise<HTMLImageElement>((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = err => reject(err);
    });
}
