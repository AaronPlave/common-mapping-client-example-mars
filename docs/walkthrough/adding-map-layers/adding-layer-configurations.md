# Adding Layer Configurations

We'll now move on to adding the map layer configurations so that we can ingest and display these layers on our 2D and 3D maps. Inside of this new `demo-default-data` we'll take a look at two files: `capabilities.xml` and `layers.json`.

Let's take a look at `layers.json` first. We'll use this configuration to construct most of the required information CMC needs to ingest and manage the map layers we want to add.


## Leveraging MarsTrek layers

If we do a little digging into the [Mars Trek application](https://marstrek.jpl.nasa.gov/#) we can determine where the map tiles are being requested from and eventually end up [here](http://mars-2035432769.us-west-1.elb.amazonaws.com/catalog/layers/all/index.html) at an overview of the map layers being served.



The full layer model is defined in `layerModel` inside `src/_core/reducers/models/map.js`.