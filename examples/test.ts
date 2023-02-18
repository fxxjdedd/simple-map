import { SimpleMap } from "../src/core/map";
import { EPSG3857RasterTileLayer } from "../src/layer/EPSG3857RasterTileLayer";

const map = new SimpleMap("app", {
    zoom: 1,
});
const layer = new EPSG3857RasterTileLayer({
    url: "https://api.mapbox.com/v4/mapbox.satellite/[z]/[x]/[y]@2x.webp?sku=101ozOUpQXOjo&access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXFhYTA2bTMyeW44ZG0ybXBkMHkifQ.gUGbDOPUN1v1fTs5SeOR4A",
    cacheSize: 500,
    zIndex: 1,
    zooms: [2, 22],
});
map.addLayer(layer);
