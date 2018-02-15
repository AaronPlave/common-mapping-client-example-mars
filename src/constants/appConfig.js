/**
 * Copyright 2017 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Immutable from "immutable";
import * as coreConfig from "_core/constants/appConfig";
import * as appStrings from "constants/appStrings";

// the config as defined by CMC Core
const CORE_CONFIG = Immutable.fromJS(coreConfig);

// this config is defined in `src/config.js` for in ops changes
const OPS_CONFIG = Immutable.fromJS(window.APPLICATION_CONFIG);

// define your overrides for Core config here
const APP_CONFIG = Immutable.fromJS({
    APP_TITLE: "CMC Walkthrough – Mars",
    DEFAULT_TERRAIN_ENDPOINT: "http://dzw9r5p966egh.cloudfront.net/mars_v6/",
    URLS: {
        layerConfig: [
            {
                url: "default-data/demo-default-data/capabilities.xml",
                type: "wmts/xml"
            },
            {
                url: "default-data/demo-default-data/layers.json",
                type: "json"
            }
        ],
        paletteConfig: "default-data/demo-default-data/palettes.json"
    },
    MIN_ZOOM: 0,
    MAX_ZOOM: 20,
    MAX_ZOOM_DISTANCE_3D: 18000000,
    MIN_ZOOM_DISTANCE_3D: 100.0,
    REFERENCE_LABELS_LAYER_ID: "MARS_nomenclature",
    POLITICAL_BOUNDARIES_LAYER_ID: "MARS_nomenclature",
    DEFAULT_MAP_EXTENT: [-180, -90, 180, 90]
    // DEFAULT_MAP_EXTENT: [
    //     -179.99999001642675,
    //     -89.99996889507656,
    //     179.99999001642672,
    //     89.99996889507656
    // ]
    // DEFAULT_PROJECTION: appStrings.PROJECTIONS.mars,
});

// define and export the final config
const appConfig = CORE_CONFIG.mergeDeep(APP_CONFIG)
    .mergeDeep(OPS_CONFIG)
    .toJS();
export default appConfig;
