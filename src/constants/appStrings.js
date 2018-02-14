export const PROJECTIONS = {
    mars: {
        // code: "IAU2000:49900",
        code: "EPSG:104905",
        proj4Def:
            'GEOGCS["GCS_Mars_2000",DATUM["D_Mars_2000",SPHEROID["Mars_2000_IAU_IAG",3396190.0,169.8944472236118]],PRIMEM["Reference_Meridian",0.0],UNIT["Degree",0.0174532925199433],AUTHORITY["ESRI",104905]]',
        extent: [-1809259.2673023238, -1809300.1269719133, 1809259.2673023238, 1809300.1269719133]
    }
    // mars: {
    //     code: "IAU2000:49900",
    //     proj4Def: "+proj=longlat +a=3396190 +b=3376200 +no_defs ",
    //     extent: [-1809259.2673023238, -1809300.1269719133, 1809259.2673023238, 1809300.1269719133]
    // }
};

export const ALERTS = {
    ZOOM_TO_LAYER_FAILED: {
        title: "Zoom to Layer Failed",
        formatString: "Unable to find layer {LAYER}.",
        severity: 3
    }
};
