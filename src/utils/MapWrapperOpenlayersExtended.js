/**
 * Copyright 2017 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Immutable from "immutable";
import moment from "moment";
import Ol_Map from "ol/map";
import Ol_View from "ol/view";
import Ol_Layer_Vector from "ol/layer/vector";
import Ol_Layer_Tile from "ol/layer/tile";
import Ol_Source_WMTS from "ol/source/wmts";
import Ol_Source_Cluster from "ol/source/cluster";
import Ol_Source_Vector from "ol/source/vector";
import Ol_Source_XYZ from "ol/source/xyz";
import Ol_Tilegrid_WMTS from "ol/tilegrid/wmts";
import Ol_Style_Fill from "ol/style/fill";
import Ol_Style from "ol/style/style";
import Ol_Style_Text from "ol/style/text";
import Ol_Style_Circle from "ol/style/circle";
import Ol_Style_Stroke from "ol/style/stroke";
import Ol_Proj from "ol/proj";
import Ol_Proj_Projection from "ol/proj/projection";
import Ol_Interaction from "ol/interaction";
import Ol_Interaction_Draw from "ol/interaction/draw";
import Ol_Interaction_DoubleClickZoom from "ol/interaction/doubleclickzoom";
import Ol_Overlay from "ol/overlay";
import Ol_Feature from "ol/feature";
import Ol_Geom_Circle from "ol/geom/circle";
import Ol_Geom_Linestring from "ol/geom/linestring";
import Ol_Geom_Polygon from "ol/geom/polygon";
import OL_Geom_GeometryType from "ol/geom/geometrytype";
import Ol_Format_GeoJSON from "ol/format/geojson";
import Ol_Format_TopoJSON from "ol/format/topojson";
import Ol_Format_KML from "ol/format/kml";
import Ol_Easing from "ol/easing";
import proj4js from "proj4";
import * as appStrings from "_core/constants/appStrings";
import appConfig from "constants/appConfig";
import MapWrapper from "_core/utils/MapWrapper";
import MiscUtil from "_core/utils/MiscUtil";
import MapUtil from "_core/utils/MapUtil";
import TileHandler from "_core/utils/TileHandler";
import Cache from "_core/utils/Cache";
import tooltipStyles from "_core/components/Map/MapTooltip.scss";
import MapWrapperOpenlayers from "_core/utils/MapWrapperOpenlayers";

/**
 * Extension of Openlayers Map Wrapper
 *
 * @export
 * @class MapWrapperOpenlayersExtended
 * @extends {MapWrapperOpenlayers}
 */
export default class MapWrapperOpenlayersExtended extends MapWrapperOpenlayers {
    /**
     * decide if a place label is in view based on feature size
     *
     * @param {object} feature
     * @param {string} resolution
     * @returns {boolean} true if feature should be visible
     * @memberof MapWrapperOpenlayersExtended
     */
    determineFeatureLabelVisibility(feature, resolutionString) {
        let resolution = parseFloat(resolutionString);
        if (typeof resolution !== "number") {
            console.warn("Invalid resolution:", resolutionString);
            return false;
        }
        let diameter = parseFloat(feature.get("diameter"));
        if (typeof diameter !== "number") {
            console.warn("Invalid resolution:", diameter);
            return false;
        }

        if (resolution >= 0.5625) {
            return diameter > 2000;
        }
        if (resolution >= 0.28125) {
            return diameter > 1500;
        }
        if (resolution >= 0.140625) {
            return diameter > 1000;
        }
        if (resolution >= 0.0703125) {
            return diameter > 500;
        }
        if (resolution >= 0.03515625) {
            return diameter > 250;
        }
        return true;
    }

    /**
     * create an openlayers vector layer
     *
     * @param {ImmutableJS.Map} layer layer object from map state in redux
     * @param {boolean} [fromCache=true] true if the layer may be pulled from the cache
     * @returns {object} openlayers vector layer
     * @memberof MapWrapperOpenlayers
     */
    createVectorLayer(layer, fromCache = true) {
        try {
            let layerSource = this.createLayerSource(layer, {
                url: layer.get("url")
            });
            if (layer.get("clusterVector")) {
                layerSource = new Ol_Source_Cluster({ source: layerSource });
            }

            return new Ol_Layer_Vector({
                source: layerSource,
                opacity: layer.get("opacity"),
                visible: layer.get("isActive"),
                extent: appConfig.DEFAULT_MAP_EXTENT,
                style: (feature, resolution) => {
                    const name = feature.get("clean_name");
                    if (this.determineFeatureLabelVisibility(feature, resolution)) {
                        return new Ol_Style({
                            text: new Ol_Style_Text({
                                font: "12px Roboto, sans-serif",
                                overflow: true,
                                text: name,
                                fill: new Ol_Style_Fill({
                                    color: "#000"
                                }),
                                stroke: new Ol_Style_Stroke({
                                    color: "#fff",
                                    width: 3
                                })
                            })
                        });
                    } else {
                        return null;
                    }
                }
            });
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.createVectorLayer:", err);
            return false;
        }
    }

    /**
     * creates an openlayers kml vector layer source
     *
     * @param {ImmutableJS.Map} layer layer object from map state in redux
     * @param {object} options raster imagery options for layer from redux state
     * - url - {string} base url for this layer
     * @returns {object} openlayers source object
     * @memberof MapWrapperOpenlayers
     */
    createVectorKMLSource(layer, options) {
        // customize the layer url if needed
        if (
            typeof options.url !== "undefined" &&
            typeof layer.getIn(["urlFunctions", appStrings.MAP_LIB_2D]) !== "undefined"
        ) {
            let urlFunction = this.tileHandler.getUrlFunction(
                layer.getIn(["urlFunctions", appStrings.MAP_LIB_2D])
            );
            options.url = urlFunction({
                layer: layer,
                url: options.url
            });
        }

        return new Ol_Source_Vector({
            url: options.url,
            format: new Ol_Format_KML({
                extractStyles: false
            })
        });
    }
}
