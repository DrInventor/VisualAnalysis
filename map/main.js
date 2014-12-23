            var lon = 5;
            var lat = 40;
            var zoom = 5;
            var map, layer, gLayer,vlayer,panel;
			var markers;
			var measureControls;
			//---cluster
			// create a semi-random grid of features to be clustered
            var dx = 3;
            var dy = 3;
            var px, py;
            var features = [];
            for(var x=-45; x<=45; x+=dx) {
                for(var y=-22.5; y<=22.5; y+=dy) {
                    px = x + (2 * dx * (Math.random() - 0.5));
                    py = y + (2 * dy * (Math.random() - 0.5));
                    features.push(new OpenLayers.Feature.Vector(
                        new OpenLayers.Geometry.Point(px, py), {x: px, y: py}
                    ));
                }
            }
			 var strategy, clusters,clusterMeasureControls;
			//------cluster end

            function init(){
				//alert("aa);
                layer = new OpenLayers.Layer.WMS( "OpenLayers WMS",
                        "http://vmap0.tiles.osgeo.org/wms/vmap0", {layers: 'basic'} );
    
                vlayer = new OpenLayers.Layer.Vector( "Editable" );	
				var container = document.getElementById("panel");
				//----------
                
				
				//--------

				map = new OpenLayers.Map( 'map', {
                    controls: [
                        new OpenLayers.Control.PanZoom()
						
                    ]
                });
				//--------add measure--
				map.addControl(new OpenLayers.Control.LayerSwitcher());
				//-------------
				map.addControl(new OpenLayers.Control.MousePosition());
				// style the sketch fancy
				var sketchSymbolizers = {
					"Point": {
						pointRadius: 4,
						graphicName: "square",
						fillColor: "white",
						fillOpacity: 1,
						strokeWidth: 1,
						strokeOpacity: 1,
						strokeColor: "#333333"
					},
					"Line": {
						strokeWidth: 3,
						strokeOpacity: 1,
						strokeColor: "#666666",
						strokeDashstyle: "dash"
					},
					"Polygon": {
						strokeWidth: 2,
						strokeOpacity: 1,
						strokeColor: "#666666",
						fillColor: "white",
						fillOpacity: 0.3
					}
				};
				var style = new OpenLayers.Style();
				style.addRules([
					new OpenLayers.Rule({symbolizer: sketchSymbolizers})
				]);
				var styleMap = new OpenLayers.StyleMap({"default": style});
				 // allow testing of specific renderers via "?renderer=Canvas", etc
				var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
				renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;

				measureControls = {
					line: new OpenLayers.Control.Measure(
						OpenLayers.Handler.Path, {
							persist: true,
							handlerOptions: {
								layerOptions: {
									renderers: renderer,
									styleMap: styleMap
								}
							}
						}
					),
					polygon: new OpenLayers.Control.Measure(
						OpenLayers.Handler.Polygon, {
							persist: true,
							handlerOptions: {
								layerOptions: {
									renderers: renderer,
									styleMap: styleMap
								}
							}
						}
					)
				};
				var control;
				for(var key in measureControls) {
					
					control = measureControls[key];
					control.events.on({
						"measure": handleMeasurements,
						"measurepartial": handleMeasurements
					});
					map.addControl(control);
				}
            //alert("here4");
            
            //map.setCenter(new OpenLayers.LonLat(0, 0), 3);
            
            document.getElementById('noneToggle').checked = true;
		
			//-----------add another layer
			var gmap = new OpenLayers.Layer.Google(
                "Google Streets", // the default
                {numZoomLevels: 20}
                );	
			var gwc = new OpenLayers.Layer.WMS(
                    "Global Imagery",
                    "http://maps.opengeo.org/geowebcache/service/wms",
                    {layers: "bluemarble"},
                    {tileOrigin: new OpenLayers.LonLat(-180, -90)}
                );
				//-------add markers-
				markers = new OpenLayers.Layer.Markers( "Markers" );
				map.addLayer(markers);
				//----------add tool------
				panel = new EditingToolbarWh(vlayer, {div: container});
				map.addControl(panel);
				//---------------------------
                


				/*var size = new OpenLayers.Size(10,10);
				var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
				var icon = new OpenLayers.Icon('http://www.openlayers.org/dev/img/marker.png', size, offset);
				markers.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(0,0),icon));
				markers.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(5,40),icon.clone()));*/
				//-----------add finish---

				//-----add cluster-----------------------------------------------------------------------
				var clusterStyle = new OpenLayers.Style({
                    pointRadius: "${radius}",
                    fillColor: "#ffcc66",
                    fillOpacity: 0.8,
                    strokeColor: "#cc6633",
                    strokeWidth: "${width}",
                    strokeOpacity: 0.8
                }, {
                    context: {
                        width: function(feature) {
                            return (feature.cluster) ? 2 : 1;
                        },
                        radius: function(feature) {
                            var pix = 2;
                            if(feature.cluster) {
                                pix = Math.min(feature.attributes.count, 7) + 2;
                            }
                            return pix;
                        }
                    }
                });
				strategy = new OpenLayers.Strategy.Cluster();

                clusters = new OpenLayers.Layer.Vector("Clusters", {
                    strategies: [strategy],
                    styleMap: new OpenLayers.StyleMap({
                        "default": clusterStyle,
                        "select": {
                            fillColor: "#8aeeef",
                            strokeColor: "#32a8a9"
                        }
                    })
                });
                
                var select = new OpenLayers.Control.SelectFeature(
                    clusters, {hover: true}
                );
				map.addControl(select);
                select.activate();
                clusters.events.on({"featureselected": displayCluster});
				
                resetCluster();
                document.getElementById("resetCluster").onclick = resetCluster;
				//-----add cluster finish
				map.addLayers([layer,vlayer,gwc,gmap,clusters]);
                map.setCenter(new OpenLayers.LonLat(lon, lat), zoom);
            }//end of init
			
			
			
			
		//----------------measure functions--------------	
       function handleMeasurements(event) {
            var geometry = event.geometry;
            var units = event.units;
            var order = event.order;
            var measure = event.measure;
            var element = document.getElementById('output');
			//alert("handleMeasurements:"+element);
            var out = "";
            if(order == 1) {
                out += "measure: " + measure.toFixed(3) + " " + units;
            } else {
                out += "measure: " + measure.toFixed(3) + " " + units + "<sup>2</" + "sup>";
            }
            element.innerHTML = out;
        }

        function toggleControl(element) {
            for(key in measureControls) {
                var control = measureControls[key];
                if(element.value == key && element.checked) {
                    control.activate();
                } else {
                    control.deactivate();
                }
            }
        }
        
        function toggleGeodesic(element) {
            for(key in measureControls) {
                var control = measureControls[key];
                control.geodesic = element.checked;
            }
        }
        
        function toggleImmediate(element) {
            for(key in measureControls) {
                var control = measureControls[key];
                control.setImmediate(element.checked);
            }
        }	
		//--------cluster functions-----------	
		function resetCluster() {
				//alert("step1");
                var distance = parseInt(document.getElementById("distance").value);
				//alert("step2"+distance);
                var threshold = parseInt(document.getElementById("threshold").value);
				//alert("step3"+threshold);
                strategy.distance = distance || strategy.distance;
                strategy.threshold = threshold || strategy.threshold;
                document.getElementById("distance").value = strategy.distance;
                document.getElementById("threshold").value = strategy.threshold || "null";
				//alert("step4");
                clusters.removeFeatures(clusters.features);
				//alert("step5");
                clusters.addFeatures(features);
				//alert("step6");
            }
         //-display cluster-   
        function displayCluster(event) {
				//alert("here1");
                var f = event.feature;
				//alert("here2");
                var el = document.getElementById("clusterOutput");
				//alert("here3");
                if(f.cluster) {
					//alert("here3.1");
                    el.innerHTML = "cluster of " + f.attributes.count;
                } else {
					//alert("here3.2");
                    el.innerHTML = "unclustered " + f.geometry;
                }/**/
            }
		