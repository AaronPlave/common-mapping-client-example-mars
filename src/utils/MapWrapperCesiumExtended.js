/**
 * Copyright 2017 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import MapWrapperCesium from "_core/utils/MapWrapperCesium";
// import moment from "moment";
import MiscUtil from "_core/utils/MiscUtil";
// import CesiumTilingScheme_GIBS from "_core/utils/CesiumTilingScheme_GIBS";
import * as appStrings from "_core/constants/appStrings";
import appConfig from "constants/appConfig";
import MapUtil from "_core/utils/MapUtil";
import TileHandler from "_core/utils/TileHandler";
// import "assets/cesium/Cesium.js";
import "utils/CesiumDrawHelper.js";
import Modernizr from "modernizr";

const MARS_ELLIPSOID = new window.Cesium.Ellipsoid(3396190, 3396190, 3369200);

/**
 * Wrapper class for Cesium
 *
 * @export
 * @class MapWrapperCesium
 * @extends {MapWrapper}
 */
export default class MapWrapperCesiumExtended extends MapWrapperCesium {
    /**
     * create a cesium map object
     *
     * @param {string|domnode} container the domnode to render to
     * @param {object} options options for creating this map (usually map state from redux)
     * @returns {object} cesium viewer object
     * @memberof MapWrapperCesiumExtended
     */
    createMap(container, options) {
        try {
            this.cesium.Ellipsoid.WGS84 = MARS_ELLIPSOID;

            // Check for webgl support
            if (!Modernizr.webgl) {
                throw "WebGL not available in this browser but is required by CesiumJS";
            }
            let map = new this.cesium.Viewer(container, {
                animation: false,
                baseLayerPicker: false,
                fullscreenButton: false,
                geocoder: false,
                globe: new this.cesium.Globe(MARS_ELLIPSOID),
                mapProjection: new this.cesium.GeographicProjection(MARS_ELLIPSOID),
                homeButton: false,
                infoBox: false,
                sceneModePicker: false,
                selectionIndicator: false,
                timeline: false,
                navigationHelpButton: false,
                vrButton: false,
                contextOptions: {
                    alpha: true
                },
                terrainExaggeration: 1,
                navigationInstructionsInitiallyVisible: false,
                scene3DOnly: true,
                //initialize an empty layer so Cesium doesn't load bing maps
                imageryProvider: new this.cesium.WebMapServiceImageryProvider({
                    url: " ",
                    ellipsoid: MARS_ELLIPSOID,
                    layers: 0
                })
            });

            // Depth testing
            // Seems to be causing issues with vector rendering. Removing.
            // map.scene.globe.depthTestAgainstTerrain = true;

            // Terrain
            let terrainProvider = new this.cesium.CesiumTerrainProvider({
                url: appConfig.DEFAULT_TERRAIN_ENDPOINT,
                ellipsoid: MARS_ELLIPSOID
            });
            let defaultTerrainProvider = new this.cesium.EllipsoidTerrainProvider({
                ellipsoid: MARS_ELLIPSOID
            });
            map.terrainProvider = terrainProvider;

            // remove sun and moon
            map.scene.sun = undefined;
            map.scene.moon = undefined;

            //change the maximum distance we can move from the globe
            map.scene.screenSpaceCameraController.maximumZoomDistance = options.getIn([
                "view",
                "maxZoomDistance3D"
            ]);
            map.scene.screenSpaceCameraController.minimumZoomDistance = options.getIn([
                "view",
                "minZoomDistance3D"
            ]);

            // disable right click zoom weirdness
            map.scene.screenSpaceCameraController.zoomEventTypes = this.cesium.CameraEventType.WHEEL;

            map.scene.globe.baseColor = this.cesium.Color.BLACK;

            // change atmosphere colors to mirror Mars
            map.scene.skyAtmosphere.saturationShift = 0;
            map.scene.skyAtmosphere.brightnessShift = 0;
            map.scene.skyAtmosphere.hueShift = 0.51;

            // Reduce fog density a bit
            map.scene.fog.density = 0.00005;

            //remove all preloaded earth layers
            map.scene.globe.imageryLayers.removeAll();

            console.log(this, "this");
            return map;
        } catch (err) {
            console.warn("Error in MapWrapperCesiumExtended.createMap:", err);
            return false;
        }
    }

    /**
     * set the current view extent of the map
     *
     * @param {array} extent set of [minX, minY, maxX, minY] coordinates
     * @returns true if change succeeds
     * @memberof MapWrapperCesiumExtended
     */
    setExtent(extent) {
        try {
            if (!extent) {
                return false;
            }
            let extentClone = extent.slice(0);
            // Ensure that extent lat is -90 to 90
            if (extentClone[1] < -90) {
                extentClone[1] = -90;
            }
            if (extentClone[3] > 90) {
                extentClone[3] = 90;
            }
            this.map.camera.flyTo({
                destination: this.cesium.Rectangle.fromDegrees(
                    ...extentClone,
                    null,
                    this.cesium.Ellipsoid.WGS84
                ),
                duration: 0
            });
            return true;
        } catch (err) {
            console.warn("Error in MapWrapperCesiumExtended.setExtent:", err);
            return false;
        }
    }

    /**
     * add a label to the map
     *
     * @param {string} label the content of the label
     * @param {array} coords location of the label on the map [lon,lat]
     * @param {object} [opt_meta={}] additional data to attach to the label object (optional)
     * @returns {boolean} true if it succeeds
     * @memberof MapWrapperCesiumExtended
     */
    addLabel(label, coords, opt_meta = {}) {
        try {
            coords = this.cesium.Cartesian3.fromDegrees(
                coords[0],
                coords[1],
                null,
                this.cesium.Ellipsoid.WGS84
            );
            let result = this.createOverlayImage(label);
            let overlay = result[0];
            let canvas = result[1];

            //Need to wait for image to load before proceeding to draw
            overlay.onload = () => {
                // label options
                let labelOptions = {
                    id: Math.random(),
                    position: coords,
                    billboard: {
                        image: canvas
                    }
                };

                // store meta options
                for (let key in opt_meta) {
                    if (opt_meta.hasOwnProperty(key)) {
                        labelOptions[key] = opt_meta[key];
                    }
                }

                // place the label
                canvas.getContext("2d").drawImage(overlay, 0, 0);
                this.map.entities.add(labelOptions);
            };
            return true;
        } catch (err) {
            console.warn("Error in MapWrapperCesiumExtended.addLabel:", err);
            return false;
        }
    }

    /**
     * convert lat-lon coordinates to cartesian coordinates
     *
     * @param {number} lat latitude value
     * @param {number} lon longitude value
     * @returns {object} cartesian point {x,y,z}
     * @memberof MapWrapperCesiumExtended
     */
    latLonToCartesian(lat, lon) {
        return new this.cesium.Cartesian3.fromDegrees(lon, lat, null, this.cesium.Ellipsoid.WGS84);
    }

    /**
     * pan the map in a given direction by a preset number of degrees
     * default to 5 degrees, 20 if specified
     *
     * @param {string} direction (MAP_PAN_DIRECTION_UP|MAP_PAN_DIRECTION_DOWN|MAP_PAN_DIRECTION_LEFT|MAP_PAN_DIRECTION_RIGHT)
     * @param {boolean} extraFar true if the map should pan 20 degrees instead of 5
     * @returns true if pan succeeds
     * @memberof MapWrapperCesiumExtended
     */
    panMap(direction, extraFar) {
        try {
            if (!direction) {
                return false;
            }
            let horizontalDegreesAmt = extraFar ? 20.0 : 5.0;
            let verticalDegreesAmt = extraFar ? 20.0 : 5.0;
            let viewRect = this.map.camera.computeViewRectangle();
            let horizontalDegrees = 0;
            let verticalDegrees = 0;
            if (this.cesium.defined(viewRect)) {
                horizontalDegrees =
                    horizontalDegreesAmt *
                    this.cesium.Math.toDegrees(viewRect.east - viewRect.west) /
                    360.0;
                verticalDegrees =
                    verticalDegreesAmt *
                    this.cesium.Math.toDegrees(viewRect.north - viewRect.south) /
                    180.0;
            }
            let currPosition = this.map.scene.camera.positionCartographic;
            let newPosition = currPosition.clone();

            switch (direction) {
                case appStrings.MAP_PAN_DIRECTION_UP:
                    newPosition.latitude = Math.min(
                        newPosition.latitude + this.cesium.Math.toRadians(verticalDegrees),
                        this.cesium.Math.PI_OVER_TWO
                    );
                    break;
                case appStrings.MAP_PAN_DIRECTION_DOWN:
                    newPosition.latitude = Math.max(
                        newPosition.latitude - this.cesium.Math.toRadians(verticalDegrees),
                        -this.cesium.Math.PI_OVER_TWO
                    );
                    break;
                case appStrings.MAP_PAN_DIRECTION_LEFT:
                    if (viewRect.west > viewRect.east) {
                        horizontalDegrees =
                            horizontalDegreesAmt *
                            ((this.cesium.Math.toDegrees(viewRect.east) -
                                (-180 - (180 - this.cesium.Math.toDegrees(viewRect.west)) * 2)) /
                                360.0);
                    }
                    newPosition.longitude =
                        newPosition.longitude - this.cesium.Math.toRadians(horizontalDegrees);
                    break;
                case appStrings.MAP_PAN_DIRECTION_RIGHT:
                    if (viewRect.east < viewRect.west) {
                        horizontalDegrees =
                            horizontalDegreesAmt *
                            ((180 +
                                (this.cesium.Math.toDegrees(viewRect.east) + 180) * 2 -
                                this.cesium.Math.toDegrees(viewRect.west)) /
                                360.0);
                    }
                    newPosition.longitude =
                        newPosition.longitude + this.cesium.Math.toRadians(horizontalDegrees);
                    break;
                default:
                    return false;
            }

            this.map.scene.camera.flyTo({
                destination: this.cesium.Ellipsoid.WGS84.cartographicToCartesian(newPosition),
                easingFunction: this.cesium.EasingFunction.LINEAR_NONE,
                duration: 0
            });
            return true;
        } catch (err) {
            console.warn("Error in MapWrapperCesium.panMap:", err);
            return false;
        }
    }

    /**
     * zoom the map in by half of the current zoom level
     *
     * @returns {boolean} true if it succeeds
     * @memberof MapWrapperCesium
     */
    zoomIn() {
        try {
            let currPosition = this.map.scene.camera.positionCartographic;
            let newH = Math.max(
                currPosition.height - currPosition.height / 2,
                appConfig.MIN_ZOOM_DISTANCE_3D
            );
            console.log(
                currPosition,
                "cp",
                currPosition.height - currPosition.height / 2,
                appConfig.MIN_ZOOM_DISTANCE_3D,
                newH
            );
            let newPosition = currPosition.clone();
            newPosition.height = newH;
            newPosition = this.cesium.Ellipsoid.WGS84.cartographicToCartesian(newPosition);
            console.log(
                newPosition,
                this.map.scene.globe.ellipsoid.cartographicToCartesian(newPosition),
                "!!!"
            );
            this.map.scene.camera.flyTo({
                destination: newPosition,
                duration: 0
            });
            // let cameraHeight = this.cesium.Ellipsoid.WGS84.cartesianToCartographic(
            //     this.map.scene.camera.position
            // ).height;
            // // var moveRate = cameraHeight / 450.0;
            // this.map.scene.camera.moveForward(1000000);
            // console.log(this.map.scene.camera,"cam")
            return true;
        } catch (err) {
            console.warn("Error in MapWrapperCesium.zoomIn:", err);
            return false;
        }
    }

    // /**
    //  * zoom the map in by half of the current zoom level
    //  *
    //  * @returns {boolean} true if it succeeds
    //  * @memberof MapWrapperCesium
    //  */
    // zoomIn() {
    //     try {
    //         let currPosition = this.map.scene.camera.positionCartographic;
    //         let newH = Math.max(
    //             currPosition.height - currPosition.height / 2,
    //             appConfig.MIN_ZOOM_DISTANCE_3D
    //         );
    //         let newPosition = currPosition.clone();
    //         newPosition.height = newH;
    //         newPosition = this.map.scene.globe.ellipsoid.cartographicToCartesian(newPosition);
    //         console.log(currPosition, "cp", currPosition.height - currPosition.height / 2, appConfig.MIN_ZOOM_DISTANCE_3D, newPosition);
    //         this.map.scene.camera.flyTo({
    //             destination: newPosition,
    //             duration: 0.175
    //         });
    //         return true;
    //     } catch (err) {
    //         console.warn("Error in MapWrapperCesium.zoomIn:", err);
    //         return false;
    //     }
    // }

    /**
     * zoom out by doubling the current zoom height
     *
     * @returns {boolean} true if it succeeds
     * @memberof MapWrapperCesium
     */
    zoomOut() {
        try {
            let currPosition = this.map.scene.camera.positionCartographic;
            let newH = Math.min(
                currPosition.height + currPosition.height,
                appConfig.MAX_ZOOM_DISTANCE_3D
            );
            let newPosition = currPosition.clone();
            newPosition.height = newH;
            newPosition = this.cesium.Ellipsoid.WGS84.cartographicToCartesian(newPosition);
            this.map.scene.camera.flyTo({
                destination: newPosition,
                duration: 0
            });
            return true;
        } catch (err) {
            console.warn("Error in MapWrapperCesium.zoomOut:", err);
            return false;
        }
    }

    /**
     * get the lat-lon corresponding to a given pixel position
     * within the containing domnode
     *
     * @param {array} pixel location on the container [x,y]
     * @returns {object|boolean} object of position of false if it fails
     * - lat - {number} latitude of the pixel location
     * - lon - {number} longitude of the pixel location
     * - isValid - {boolean} pixel was on the globe
     * @memberof MapWrapperCesium
     */
    getLatLonFromPixelCoordinate(pixel) {
        try {
            let cartesian = this.map.scene.camera.pickEllipsoid(
                { x: pixel[0], y: pixel[1] },
                this.cesium.Ellipsoid.WGS84
            );
            if (cartesian) {
                let cartographic = this.cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
                // Switching to lat/lon lines definition as opposed to distance in lat/lon direction
                return {
                    lat: this.cesium.Math.toDegrees(cartographic.longitude),
                    lon: this.cesium.Math.toDegrees(cartographic.latitude),
                    isValid: true
                };
            }
            return false;
        } catch (err) {
            console.warn("Error in MapWrapperCesium.getLatLonFromPixelCoordinate:", err);
            return false;
        }
    }

    /**
     * create wmts imagery provider
     *
     * @param {ImmutableJS.Map} layer layer object from map state in redux
     * @param {object} options wmts layer options
     * - url - {string} base url for this layer
     * - layer - {string} layer identifier
     * - format - {string} tile resouce format
     * - requestEncoding - {string} url encoding (REST|KVP)
     * - matrixSet - {string} matrix set for the tile pyramid
     * - projection - {string} projection string
     * - extents - {array} bounding box extents for this layer
     * - tileGrid - {object} of tiling options
     *   - origin - {array} lat lon coordinates of layer upper left
     *   - resolutions - {array} list of tile resolutions
     *   - matrixIds - {array} identifiers for each zoom level
     *   - tileSize - {number} size of the tiles
     * @returns {object} cesium imagery provider
     * @memberof MapWrapperCesium
     */
    createGenericWMTSProvider(layer, options) {
        try {
            if (typeof options !== "undefined") {
                let west = this.cesium.Math.toRadians(-180);
                let south = this.cesium.Math.toRadians(-90);
                let east = this.cesium.Math.toRadians(180);
                let north = this.cesium.Math.toRadians(90);
                let rectangle = this.cesium.Rectangle.MAX_VALUE;
                if (options.extents) {
                    rectangle = this.cesium.Rectangle.fromDegrees(
                        ...options.extents,
                        null,
                        this.cesium.Ellipsoid.WGS84
                    );
                }
                console.log("Rectangle", rectangle, options);
                return new this.cesium.WebMapTileServiceImageryProvider({
                    url: options.url,
                    layer: options.layer,
                    format: options.format,
                    rectangle: rectangle,
                    ellipsoid: MARS_ELLIPSOID,
                    style: "",
                    tileMatrixSetID: options.matrixSet,
                    minimumLevel: options.tileGrid.minZoom,
                    maximumLevel: options.tileGrid.maxZoom,
                    tilingScheme: this.createTilingScheme(
                        {
                            handleAs: layer.get("handleAs"),
                            projection: options.projection
                        },
                        options
                    )
                });
            }
            return false;
        } catch (err) {
            console.warn("Error in MapWrapperCesium.createGenericWMTSProvider:", err);
            return false;
        }
    }

    /**
     * create a kml vector data source
     *
     * @param {ImmutableJS.Map} layer layer object from map state in redux
     * @param {object} options vector data source options
     * - url - {string} url for the data
     * @returns {object} a cesium vector data source
     * @memberof MapWrapperCesium
     */
    createKmlSource(layer, options) {
        let kmlSource = this.cesium.KmlDataSource.load(options.url, {
            camera: this.map.scene.camera,
            clampToGround: true,
            canvas: this.map.scene.canvas,
            show: layer.get("isActive")
        });
        // kmlSource.loadingEvent.addEventListener(() => {console.log("loaded")})
        // console.log(kmlSource)
        let distanceCondition = new this.cesium.DistanceDisplayCondition(10.0, 200000.0);
        kmlSource.then(dataSource => {
            let entities = dataSource.entities.values;
            console.log(entities, "entities");
            for (let i = 0; i < entities.length; i++) {
                let entity = entities[i];
                // console.log("?", entity);
                // Adjust the vertical origin so pins sit on terrain
                if (entity.billboard) {
                    entity.billboard = undefined;
                }
                if (entity.label) {
                    // console.log(entity.label.distanceCondition)
                    // entity.label.distanceDisplayCondition = distanceCondition;
                    entity.label.distanceDisplayCondition = new this.cesium.DistanceDisplayCondition(
                        10.0,
                        180000000.0
                    );
                    entity.label.font = "16px Roboto, sans-serif";
                    entity.label.horizontalOrigin = this.cesium.HorizontalOrigin.CENTER;
                    entity.label.verticalOrigin = this.cesium.VerticalOrigin.BASELINE;
                    entity.label.fillColor = this.cesium.Color.BLACK;
                    entity.label.outlineColor = this.cesium.Color.WHITE;
                    entity.label.outlineWidth = 4;
                    entity.label.style = this.cesium.LabelStyle.FILL_AND_OUTLINE;
                    // entity.label.translucencyByDistance = undefined;
                    entity.label.translucencyByDistance = new this.cesium.NearFarScalar(
                        1.5e2,
                        1.0,
                        8.0e6,
                        0.0
                    );
                }
            }
            // dataSource.loadingEvent.addEventListener(() => {
            //     console.log("loaded");
            // });
        });
        return kmlSource;
    }
}
