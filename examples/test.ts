import { SimpleMap } from "../src/core/map";
import { EPSG3857RasterTileLayer } from "../src/layer/EPSG3857RasterTileLayer";

// TODO: zoom时，如果跨域了zoom，则会填满。否则，两边会出现留白。为什么？
// 因为瓦片加载的数量不对，只加载了4个，实际上应该加载更多
const map = new SimpleMap("app", {
    // zoom: 1.2049269547450105,
    zoom: 1.2,
    // center: [116, 34],
});
const layer = new EPSG3857RasterTileLayer({
    url: "https://api.mapbox.com/v4/mapbox.satellite/[z]/[x]/[y]@2x.webp?sku=101ozOUpQXOjo&access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXFhYTA2bTMyeW44ZG0ybXBkMHkifQ.gUGbDOPUN1v1fTs5SeOR4A",
    cacheSize: 500,
    zIndex: 1,
    zooms: [2, 22],
});
map.addLayer(layer);
