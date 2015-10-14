var months,
    monthFormat = d3.time.format("%Y-%m-%d");

//Radius scale for map populations
var radiusPop = d3.scale.sqrt()
    .domain([0, 1e3])
    .range([0, 8]);

var widthPop = d3.scale.sqrt()
.domain([0, 1e3])
.range([0, 10]);

var heightPop = d3.scale.sqrt()
.domain([0, 1e3])
.range([0, 14]);

// Colormap for prevalence points
var colorScaleRDT = d3.scale.quantize()
            .domain([0, 0.7])
            .range(colorbrewer.OrRd[9]);

var colorScaleRMSE = d3.scale.quantize()
.domain([-0.03, 0.01])
.range(colorbrewer.RdYlGn[9]);

var colorScaleReinf = d3.scale.quantize()
.domain([-0.02, 0.5])
.range(colorbrewer.PuRd[9]);

var colorScaleHabsConst = d3.scale.quantize()
.domain([0.01, 14])
.range(colorbrewer.RdPu[9]);

var colorScaleHabsComb = d3.scale.quantize()
.domain([0.01, 5])
.range(colorbrewer.RdPu[9]);


var colorScaleHabsAll = d3.scale.quantize()
.domain([0, 3])
.range(colorbrewer.RdPu[9]);

function itn_level_2_ordinal(level)
{
	//alert(level)
	if (level == "ext_low")
		return 0;
		
	if (level == "very_low")
		return 2;
	
	if (level == "lowest")
		return 4;
		
	if (level == "low")
		return 6;
	
	if (level == "medium")
		return 8;
	
	if (level == "high")
		return 10;
	
	if (level == "data")
		return 12;
}

var colorScaleDrugCov = d3.scale.ordinal()
.domain([0.35, 0.55, 0.7])
.range(colorbrewer.RdYlBu[3]);

var colorScaleITNCov = d3.scale.ordinal()
.domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
.range(colorbrewer.Spectral[5]);

var margin_charts = { top: 50, right: 30, bottom: 20, left: 60 };

var cluster_select = '80202_6';
//var gazeteer_select = '4d_w_ITN_lowest_low_medium_high_drug_cov_0_35_0_55_0_7';
//var gazeteer_select = '4d_w_ITN_lowest_low_medium_high_drug_cov_0_35_0_55_0_7_prev_sort_and_weights'
//var gazeteer_select = 'multi_cat_calib';
var gazeteer_select = 'cc_trunc_ls_norm_categories_weather_pilot'
var rnd_select = 0;



// Month, year formatting of date axes
var customTimeFormat = d3.time.format.multi([
  ["%b", function (d) { return d.getMonth(); }],
  ["%Y", function () { return true; }]
]);

var map_display = null;

function generic_map(id)
{
	this.id = id;
	this.margin = { top: 20, right: 10, bottom: 20, left: 50 };
	this.width = 480 - this.margin.left - this.margin.right;
	this.height = 300 - this.margin.top  - this.margin.bottom;
    // center world map on Lake Kariba, Zambia
    this.projection = d3.geo.mercator()
    				.center([27.85, -16.7])
    				.scale(22000)
    				.translate([this.width / 2, this.height / 2]);
    this.path = d3.geo.path().projection(this.projection);
}

function basic_map_display(id, basic_topo_input, cl, title)
{
	id = typeof id !== 'undefined' ? id : "lake_kariba";
	basic_topo_input = typeof basic_topo_input !== 'undefined' ? basic_topo_input : "topolakes.json";
	cl = typeof cl !== 'undefined' ? cl : "lakes";
	title = typeof title !== 'undefined' ? title : "Lake Kariba";

	this.map = new generic_map(id);

	this.svg_maps = d3.select(".resourcecontainer.maps.svg")
	if(this.svg_maps == "")
	   this.svg_maps = d3.select(".resourcecontainer.maps").append("svg");

	var path = this.map.path;
    var svg_maps = this.svg_maps; 
    
    svg_maps
	        .attr("width", this.map.width + this.map.margin.left + this.map.margin.right)
	        .attr("height", this.map.height + this.map.margin.top + this.map.margin.bottom)
	        .attr("id", id);
	

    // TODO: lat/lon axes (clip to margins)
    // TODO: topology raster 
    // TODO: switch to underlying map like Google/Bing/OpenLayers to avoid site-specific topojson?
    // TODO: map scale legend

    d3.json(basic_topo_input, function (error, topo) {
         svg_maps.selectAll("."+cl)
            //.data(topojson.feature(topo, topo.objects.lakes).features)
              .data(topojson.feature(topo, topo.objects[cl]).features)
          .enter().append("path")
            .attr("class", cl)
            .attr("d", path);
    });
    
    svg_maps.append("g")
    .append("text")
      .attr("class", "chart_title")
      .attr("transform", "translate(" + (this.map.width-this.map.margin.left) + "," + this.map.height + ")")
      .style("font-weight", "bold")
      .text(title);
    
}


function hhs_map_display(id, hhs_topo_input, cl, title)
{
	id = typeof id !== 'undefined' ? id : "households";
	hhs_topo_input = typeof hhs_topo_input !== 'undefined' ? hhs_topo_input : "hhs.json";
	cl = typeof cl !== 'undefined' ? cl : "hhs";
	title = typeof title !== 'undefined' ? title : "Households";
	
  	set_map_display(id, title);
	this.display = map_display;
  	var svg_maps = this.display.svg_maps;
  	var projection = this.display.map.projection;
	d3.json(hhs_topo_input, function (collection) {
	        var focus = svg_maps.append("g")
	            .attr("transform", "translate(-100,-100)")
	            .attr("class", "focus");
	        focus.append("text")
	            .attr("y", -10);
	        svg_maps.append("g")
	            .attr("class", "bubble")
	          .selectAll("circle")
	            .data(collection)
	          .enter().append("circle")
	            .attr("transform", function (d) {
	                return "translate(" + projection([d.Longitude, d.Latitude]) + ")";
	            })
	            .attr("opacity", 0.9)
	            .attr("fill", function (d) {
	                var c = 'blue'
	                return c;
	            })
	            .attr("r", function (d) { return 1; });   // TODO: bubble legend?
	    });	
  	
}


function hfcas_map_display(id, hfca_topo_input, cl, title)
{
	id = typeof id !== 'undefined' ? id : "hfcas";
	hfca_topo_input = typeof hfca_topo_input !== 'undefined' ? hfca_topo_input : "hfcas.json";
	cl = typeof cl !== 'undefined' ? cl : "hfcas";
	title = typeof title !== 'undefined' ? title : "HFCAs";
	set_map_display(id, title);
	this.display = map_display;

    //var color = d3.scale.category10()
    var svg_maps = this.display.svg_maps;
	var path = this.display.map.path;
    d3.json(hfca_topo_input, function (error, hfcas) {
    	svg_maps.selectAll("."+cl)
            .data(hfcas.features)
          .enter().append("path")
            .attr("class", cl)
            .attr("d", path)
        	.attr("fill-opacity", 0.4)
            //.style("fill", function (d,i) { color(i) })
        	//.style("fill", "grey")
        	.attr("stroke", "#222")
    });
	
}


function clusters_map_display(id, clusters_topo_input, cl, title)
{
	id = typeof id !== 'undefined' ? id : "clusters";
	clusters_topo_input = typeof clusters_topo_input !== 'undefined' ? clusters_topo_input : "clusters_hulls.json";
	cl = typeof cl !== 'undefined' ? cl : "clusters";
	title = typeof title !== 'undefined' ? title : "Household clusters";
	
	set_map_display(id, title);
	this.display = map_display;
    //var color = d3.scale.category10()
	var svg_maps = this.display.svg_maps;
	var path = this.display.map.path;
    d3.json(clusters_topo_input, function (error, clusters) {
        svg_maps.selectAll("."+cl)
            .data(clusters.features)
          .enter().append("path")
            .attr("class", cl)
            .attr("d", path);
    });
	
}


function pop_bubbles_map_display(id, clusters_input, title, map_type, histogram, figure, rdt_obs, rmse, drug_cov, itns, reinf, habitats_const, habitats_temp, habitats_comb, rdt_sim)
{
	id = typeof id !== 'undefined' ? id : "clusters";
	clusters_input = typeof clusters_input !== 'undefined' ? clusters_input : "snapshot.json";
	title = typeof title !== 'undefined' ? title : "Population clusters";
	histogram = typeof histogram !== 'undefined' ? histogram : false;
	figure = typeof figure !== 'undefined' ? figure : false;
	rdt_obs = typeof rdt_obs !== 'undefined' ? rdt_obs : false;
	rdt_sim = typeof rdt_sim !== 'undefined' ? rdt_sim : false;
	rmse = typeof rmse !== 'undefined' ? rmse : false;
	itns = typeof itns !== 'undefined' ? itns : false;
	drug_cov = typeof drug_cov !== 'undefined' ? drug_cov : false;
	sim_reinf = typeof sim_reinf !== 'undefined' ? sim_reinf : false;
	obs_reinf = typeof obs_reinf !== 'undefined' ? obs_reinf : false;
	habitats_const = typeof habitats_const !== 'undefined' ? habitats_const : false;
	habitats_temp = typeof habitats_temp !== 'undefined' ? habitats_temp : false;
	habitats_comb = typeof habitats_comb !== 'undefined' ? habitats_comb : false;
	
	set_map_display(id, title);
	this.display = map_display; 
	
	var width = this.display.map.width
	var height = this.display.map.height
	
	
    //var color = d3.scale.category10()
    var svg_maps = this.display.svg_maps;
	var projection = this.display.map.projection;
	
	clusters_input = gazeteer_select + "_" + clusters_input;
	//alert(clusters_input)
	d3.json(clusters_input, function (collection) {
        // Let's give the little bubbles a chance to be moused over when they overlap big ones
		//alert(collection)
        collection.sort(function (a, b) { return b.Population - a.Population; });
        var focus = svg_maps.append("g")
            .attr("transform", "translate(-100,-100)")
            .attr("class", "focus");

        focus.append("text")
            .attr("y", -10);

        svg_maps.append("g")
            .attr("class", "bubble")
          .selectAll("circle")
            .data(collection)
          .enter().append("circle")
            .attr("class", function(d) {return 'f_' + d.FacilityName; })
            .attr("transform", function (d) {
                return "translate(" + projection([d.Longitude, d.Latitude]) + ")";
            })
            .attr("opacity", 0.7)
            .attr("fill", function (d) {
                var c = 'white'
                
                if(rdt_obs)
                {
                	var rdt_val = d.RDT_obs[rnd_select];
                	if (rdt_val >= 0) { c = colorScaleRDT(rdt_val); } // TODO: color legend?
                	else { c = 'gray'; }
                }
                if(rdt_sim)
                {
                	var rdt_val = d.RDT_mn_sim[rnd_select];
                	if (rdt_val >= 0) { c = colorScaleRDT(rdt_val); } // TODO: color legend?
                	else { c = 'gray'; }
                }
                if(rmse)
                {
                	var rmse_val = d.fit_value;
            		if (rmse_val >= 0) { c = colorScaleRMSE(-rmse_val); } // TODO: color legend?
                }
                if(drug_cov)
                {
                	var drug_cov_val = d.drug_coverage;
            		if (drug_cov_val >= 0) { c = colorScaleDrugCov(drug_cov_val); } // TODO: color legend?
                }
                if(itns)
                {
                	var itn_cov_val = itn_level_2_ordinal(d.itn_level);
            		if (itn_cov_val >= 0) { c = colorScaleITNCov(itn_cov_val); } // TODO: color legend?
                }
                if(sim_reinf)
                {
            		var reinf_val = d.sim_avg_reinfection_rate;
            		if (typeof d.reinfection_rate == undefined) { c = 'gray' }
            		if (d.reinfection_rate == "nan") {c = 'gray'}
            		if (reinf_val >= 0) { c = colorScaleReinf(reinf_val); } // TODO: color legend?
                	
                }
                if(obs_reinf)
                {
            		var reinf_val = d.obs_avg_reinfection_rate;
            		if (typeof d.reinfection_rate == undefined) { c = 'gray' }
            		if (d.reinfection_rate == "nan") {c = 'gray'}
            		if (reinf_val >= 0) { c = colorScaleReinf(reinf_val); } // TODO: color legend?
                	
                }
                if(habitats_const)
                {
                	var const_h = d.const_h
                    if (const_h >= 0) { c = colorScaleHabsConst(const_h); }
                }
                if(habitats_temp)
                {
                	var temp_h = d.temp_h
                	if (temp_h >= 0) { c = colorScaleHabsAll(temp_h); }
                	
                }
                if(habitats_comb)
                {
                	var comb_h = d.temp_h * d.const_h
                	if (comb_h >= 0) { c = colorScaleHabsComb(comb_h); }
                	
                }

                return c;
            })
            .attr("r", function (d) { if(d.Population != -1000) return radiusPop(d.Population[rnd_select]); else return radiusPop(0);}) // TODO: bubble legend?
            .attr("id", function(d) { return 'f_' + d.FacilityName + '_' + map_type; })

            
            // TODO: provide persistent on(mousedown) focus/unfocus behavior?
            .on("mouseover", function (d){ mouseover_f(map_type, d, histogram, figure)})
            .on("mouseout", function (d){ mouseout_f(map_type, d) })
            .each(function(d){if(d.FacilityName == cluster_select){mouseover_f(map_type, d, true, true)}})
    	});
	
    svg_maps.append("g")
    .append("text")
      .attr("class", "chart_title")
      .attr("transform", "translate(" + (width-this.display.map.margin.left) + "," + height + ")")
      .style("font-weight", "bold")
      .text(title);
}


function pop_squares_map_display(id, clusters_input, title, map_type, habitats)
{
	id = typeof id !== 'undefined' ? id : "clusters";
	clusters_input = typeof clusters_input !== 'undefined' ? clusters_input : "snapshot.json";
	title = typeof title !== 'undefined' ? title : "Population clusters";
	habitats = typeof habitats !== 'undefined' ? habitats : false;

	set_map_display(id, title);
	this.display = map_display; 
	
	var width = this.display.map.width
	var height = this.display.map.height

    var svg_maps = this.display.svg_maps;
	var projection = this.display.map.projection;
	clusters_input = gazeteer_select + "_" + clusters_input;	
	
	d3.json(clusters_input, function (collection) {
        collection.sort(function (a, b) { return b.Population - a.Population; });
        var focus = svg_maps.append("g")
            .attr("transform", "translate(-100,-100)")
            .attr("class", "focus");

        focus.append("text")
            .attr("y", -10);

        
        var rectsSelection = svg_maps.append("g")
            .attr("class", "square")
          .selectAll("rect")
            .data(collection)
          .enter();
          rectsSelection.append("rect")
            .attr("class", function(d) { return 'f_' + d.FacilityName; })
            .attr("id", function(d) { return 'f_' + d.FacilityName + '_' + 'habitats'; })
            .attr("width",function (d) { return widthPop(d.Population); })
            .attr("height",function (d) { return heightPop(d.Population); })
            .attr("transform", function (d) {
            	return "translate(" + projection([d.Longitude, d.Latitude]) + ")";
            })
            .attr("opacity", 0.7)
            .attr("fill", function (d) {
                var c = 'white'
                if(habitats)
                {
                	var const_h = d.const_h
                	if (const_h >= 0) { c = colorScaleHabs(const_h); }
                }
                
                return c;
            })
            .on("mouseover", function (d){ mouseover_f(map_type, d, true, true)})
            .on("mouseout", function (d){ mouseout_f(map_type, d) })

          rectsSelection.append("rect")
            .attr("class", function(d) { return 'f_' + d.FacilityName; })
            .attr("id", function(d) { return 'f_' + d.FacilityName + '_' + 'habitats'; })
            .attr("width",function (d) { return widthPop(d.Population); })
            .attr("height",function (d) { return heightPop(d.Population); })
            .attr("transform", function (d) {
            	var point = projection([d.Longitude, d.Latitude])
            	pos = [point[0] + widthPop(d.Population), point[1]];
            	return "translate(" + pos + ")";
            	//return "translate(" + projection([d.Longitude, d.Latitude]).translate([widthPop(d.Population), 0]) + ")";
                
            })
            .attr("opacity", 0.7)
            .attr("fill", function (d) {
                var c = 'white'
                if(habitats)
                {
                	var temp_h = d.temp_h
                	if (temp_h >= 0) { c = colorScaleHabs(temp_h); } // TODO: color legend?
                	
                }
                
                return c;
            })
            .on("mouseover", function (d){ mouseover_f(map_type, d, true, true)})
            .on("mouseout", function (d){ mouseout_f(map_type, d) })
            .each(function(d){if(d.FacilityName == cluster_select){mouseover_f(map_type, d, true, true)}})
    	});
	
    svg_maps.append("g")
    .append("text")
      .attr("class", "chart_title")
      .attr("transform", "translate(" + (width-this.display.map.margin.left) + "," + height + ")")
      .style("font-weight", "bold")
      .text(title);
}



function load_scatter_habs(id, clusters_input)
{
	
	var margin = {top: 50, right: 20, bottom: 50, left: 40},
    width = 400 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

	// Set the ranges
	var x = d3.scale.linear().range([0, width]);
	var y = d3.scale.linear().range([height, 0]);
    
	// Scale the domain of the data
    x.domain([0,2]);
    y.domain([0,5]);
    	
	d3.select(".resourcecontainer.maps").select("#scatter_habs").remove();	
	var svg = d3.select(".resourcecontainer.maps").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("id", "scatter_habs")
   .append("g")
    	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	clusters_input = gazeteer_select + "_" + clusters_input;
	d3.json(clusters_input, function (collection) {
        collection.sort(function (a, b) { return b.Population - a.Population; });
        var focus = svg_maps.append("g")
            .attr("transform", "translate(-100,-100)")
            .attr("class", "focus");

        focus.append("text")
            .attr("y", -10);

        svg.append("g")
        .attr("class", "bubble")
      .selectAll("circle")
        .data(collection)
      .enter().append("circle")
        .attr("class", function(d) { return 'f_' + d.FacilityName; })
        .attr("cx", function(d) { return x(d.temp_h); })
	    .attr("cy", function(d) { return y(d.const_h*d.temp_h); })        
        .attr("opacity", 0.7)
        .attr("fill", function (d) {
            var c = 'white'
            var rdt_val = d.RDT_mn_sim[rnd_select];
            if (rdt_val >= 0) { c = colorScaleRDT(rdt_val); } // TODO: color legend?
            return c;
        })
        .attr("r", function (d) { return radiusPop(d.Population[rnd_select]); }) // TODO: bubble legend?
        .attr("id", function(d) { return 'f_' + d.FacilityName + '_' + id; })

        
        // TODO: provide persistent on(mousedown) focus/unfocus behavior?
        .on("mouseover", function (d){ mouseover_f(id, d, true, true)})
        .on("mouseout", function (d){ mouseout_f(id, d) })
        .each(function(d){if(d.FacilityName == cluster_select){mouseover_f(id, d, true, true)}})
	});
        
	// Define the axes
	var xAxis = d3.svg.axis().scale(x)
	    .orient("bottom").ticks(10);

	var yAxis = d3.svg.axis().scale(y)
	    .orient("left").ticks(10);
	   
    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(0," + height + ")")
      .append("text")
        .text("All habitats")
        .attr("x", 6)
        .attr("dx", ".71em")
        //.attr("class","axis_"+id);

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
       .append("text")
    	.text("Eff. constant habitat")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end");
	    
	        //.attr("class","axis_"+id);
}




function mouseover_f(map_type, data, histogram, figure)
{
	
    data_ps = d3.selectAll(".f_" + cluster_select)
    .classed("data_p--hover", false)

    data_ps.each(hide_text_f);

    d3.selectAll("path.f_" + cluster_select)
    .classed("cluster--hover", false);
	
	var facilityID = data.FacilityName;
	cluster_select = facilityID;
	
	if(figure)
	{
		display_figure(facilityID)
	}
	
	if(histogram)
	{
	    load_histogram("alt","alt","Altitude");
	    load_histogram("veg","veg","Vegetation");
        draw_histogram(facilityID, "alt", "hists/altitude_");
        draw_histogram(facilityID, "veg", "hists/vegetation_");
	}

	data_ps = d3.selectAll(".f_" + facilityID)
    	.classed("data_p--hover", true)
    
    
    data_ps.each(display_text_f);
    
	
	d3.selectAll("path.f_" + facilityID)
    	.classed("cluster--hover", true);
}

function cluster_signage()
{
	d3.select(".resourcecontainer.maps").select("#cluster_signage").remove();
	var signage_spot = d3.select(".resourcecontainer.maps") 
	signage_spot.append("text").text(cluster_select)
				.attr("id", "cluster_signage")
}


function mouseout_f(type, data)
{
	/*
	var facilityID = data.FacilityName;
	cluster_select = facilityID;

	
    data_ps = d3.selectAll(".f_" + cluster_select)
    .classed("data_p--hover", false)

    data_ps.each(hide_text_f);

    d3.selectAll("path.f_" + cluster_select)
    .classed("city--hover", false);
    */
}


function display_text_f(d) {
	var facilityID = this.__data__.FacilityName;
	var display_text = []
	
	if(this.id.indexOf("rdt_obs") != -1)
	{
	    var rdt = this.__data__.RDT_obs[rnd_select];
	    //alert(facilityID +  " " + rdt)
	    if (rdt < 0) { rdt = 'N/A'; }
	    else { rdt = d3.format('%')(rdt); }
	    display_text.push(facilityID);
	    display_text.push("RDT+: "+rdt);
	}
	else
	if(this.id.indexOf("rdt_sim") != -1)
	{
	    var rdt = this.__data__.RDT_mn_sim[rnd_select];
	    //alert(facilityID +  " " + rdt)
	    if (rdt < 0) { rdt = 'N/A'; }
	    else { rdt = d3.format('%')(rdt); }
	    display_text.push(facilityID);
	    display_text.push("RDT+: "+rdt);
	}
	else
	if(this.id.indexOf("rmse") != -1)
	{
		 var rmse = this.__data__.fit_value;
		 //alert(facilityID +  " " + rdt)
		 if (rmse < 0) { rmse = 'N/A'; }
		 display_text.push(facilityID);
		 display_text.push(" Residual:" + rmse.toPrecision(2));
	}
	else
	if(this.id.indexOf("population") != -1)
	{
		var pop = this.__data__.Population[rnd_select];
		display_text.push(facilityID + " : ");
		if(pop != -1000)
			display_text.push("Pop: "+pop);
		else
			display_text.push("Pop: N/A");
	}
	else
	if(this.id.indexOf("habitats_const") != -1)
	{
		var const_h = this.__data__.const_h;
		//alert(facilityID +  " " + rdt)
		if (temp_h < 0) { temp_h = 'N/A'; }
		
		display_text.push(facilityID);
		display_text.push("const: " + const_h.toPrecision(2));
		
	}
	if(this.id.indexOf("habitats_temp") != -1)
	{
		var temp_h = this.__data__.temp_h;
		//alert(facilityID +  " " + rdt)
		if (temp_h < 0) { temp_h = 'N/A'; }
		
		display_text.push(facilityID);
		display_text.push("All habs: " + temp_h.toPrecision(2));
		
	}
	if(this.id.indexOf("habitats_comb") != -1)
	{
		var temp_h = this.__data__.temp_h;
		var const_h = this.__data__.const_h;
		//alert(facilityID +  " " + rdt)
		if (const_h <= 0) { const_h = 'N/A'; }
		if (temp_h <= 0) { temp_h = 'N/A'; }
		
		display_text.push(facilityID);
		display_text.push("Eff. const: " + (temp_h*const_h).toPrecision(2));
		
	}
	else
	if(this.id.indexOf("drug_coverage") != -1)
	{
		var drug_cov = this.__data__.drug_coverage;
		
		//drug_coverages = ["0.35",0,"0.55",0, "0.7"];
		//drug_cov_val = drug_coverages[drug_cov]; 
		
		display_text.push(facilityID + " : MSaT cov.");		
		//display_text.push("per rnd: "+drug_cov_val);
		display_text.push("per rnd: "+drug_cov);
	}
	if(this.id.indexOf("itn_coverage") != -1)
	{
		var itn_level = itn_level_2_ordinal(this.__data__.itn_level);
		
		itn_levels = [0.25, 0, 0.35, 0, 0.45, 0, 0.6, 0, 0.7, 0, 0.85, 0, 0.75];
		itn_level_val = itn_levels[itn_level]; 
		
		display_text.push(facilityID + " : Cov. at rnd. 1, after ramp up");		
		display_text.push(""+itn_level_val);
	}
	if(this.id.indexOf("sim_reinfection") != -1)
	{
		var reinf = this.__data__.sim_avg_reinfection_rate;
		if (typeof this.__data__.sim_avg_reinfection_rate == undefined) { reinf = 'N/A'; }
		if (this.__data__.obs_avg_reinfection_rate == "nan") {reinf = 'N/A'}
		 
     	display_text.push(facilityID);
		display_text.push("MN Sim Reinfection:");
		display_text.push(function(){if (reinf != 'N/A') return reinf.toPrecision(2); else return reinf;});
	}
	
	if(this.id.indexOf("obs_reinfection") != -1)
	{
		var reinf = this.__data__.obs_avg_reinfection_rate;
		if (typeof this.__data__.obs_avg_reinfection_rate == undefined) { reinf = 'N/A'; }
		if (this.__data__.obs_avg_reinfection_rate == "nan") {reinf = 'N/A'}
		 
     	display_text.push(facilityID);
		display_text.push("Obs. Reinfection:");
		display_text.push(function(){if (reinf != 'N/A') return reinf.toPrecision(2); else return reinf;});
	}
		
    var svg_maps = this.parentNode.parentNode;
    var focus = d3.select(svg_maps).select('.focus');
    dt = focus.select("text")
    
    for (i = 0; i < display_text.length; i ++)
    	dt.append("tspan")
    	   .text(display_text[i])
    	   .attr("x",0)
    	   .attr("y", 12 + i*12);
    
    // TODO: more verbose info with <tspan>?
    focus.attr("transform", "translate(" + map_display.map.margin.left + "," + map_display.map.margin.top + ")");
}

function hide_text_f(d) {
    var svg_maps = this.parentNode.parentNode;
    var focus = d3.select(svg_maps).select('.focus');
    focus.select("text").text(null);
    focus.attr("transform", "translate(-100,-100)");
}


function display_bubble_text(d) {
	var facilityID = this.__data__.FacilityName;
	var display_text = ""
	if(this.id.indexOf("rdt") != -1)
	{
	    var rdt = this.__data__.RDT[0];
	    //alert(facilityID +  " " + rdt)
	    if (rdt < 0) { rdt = 'N/A'; }
	    else { rdt = d3.format('%')(rdt); }
	    display_text = facilityID + " RDT+ : " + rdt
	}
	else
	if(this.id.indexOf("rmse") != -1)
	{
		 var rmse = this.__data__.mse;
		 //alert(facilityID +  " " + rdt)
		 if (rmse < 0) { rmse = 'N/A'; }
		 display_text = facilityID + " Calib. Sim. Distance : " + rmse.toPrecision(2)
	}
	else
	{
		var pop = this.__data__.Population;
		display_text = facilityID + " : " + pop
	}
	
    var svg_maps = this.parentNode.parentNode;
    var focus = d3.select(svg_maps).select('.focus');
    focus.select("text").text(display_text); // TODO: more verbose info with <tspan>?
    focus.attr("transform", "translate(" + map_display.map.margin.left + "," + map_display.map.margin.top + ")");
}

//TODO: would this be better to do top-down, i.e. selectAll(svg.resourcecontainer.maps) and work down for each?
function display_bubble_text_rdt(d) {
	if(this.id.indexOf("population") != -1)
    var facilityID = this.__data__.FacilityName;
    var rdt = this.__data__.RDT[0];
    //alert(facilityID +  " " + rdt)
    if (rdt < 0) { rdt = 'N/A'; }
    else { rdt = d3.format('%')(rdt); }
    var svg_maps = this.parentNode.parentNode;
    var focus = d3.select(svg_maps).select('.focus');
    focus.select("text").text(facilityID + " RDT+ : " + rdt); // TODO: more verbose info with <tspan>?
    focus.attr("transform", "translate(" + map_display.map.margin.left + "," + map_display.map.margin.top + ")");
}

function display_bubble_text_rmse(d) {
    var facilityID = this.__data__.FacilityName;
    var rmse = this.__data__.mse[0];
    //alert(facilityID +  " " + rdt)
    if (rmse < 0) { rmse = 'N/A'; }
    var svg_maps = this.parentNode.parentNode;
    var focus = d3.select(svg_maps).select('.focus');
    focus.select("text").text(facilityID + " Calib. Sim. Distance : " + mse); // TODO: more verbose info with <tspan>?
    focus.attr("transform", "translate(" + map_display.map.margin.left + "," + map_display.map.margin.top + ")");
}


function hide_bubble_text(d) {
    var svg_maps = this.parentNode.parentNode;
    var focus = d3.select(svg_maps).select('.focus');
    focus.select("text").text(null);
    focus.attr("transform", "translate(-100,-100)");
}


function display_bubble_text_pop(d) {
    var facilityID = this.__data__.FacilityName;
    var pop = this.__data__.Population;
    var svg_maps = this.parentNode.parentNode;
    var focus = d3.select(svg_maps).select('.focus');
    focus.select("text").text(facilityID + " : " + pop); // TODO: more verbose info with <tspan>?
    focus.attr("transform", "translate(" + map_display.map.margin.left + "," + map_display.map.margin.top + ")");
}


function hide_bubble_text_pop(d) {
    var svg_maps = this.parentNode.parentNode;
    var focus = d3.select(svg_maps).select('.focus');
    focus.select("text").text(null);
    focus.attr("transform", "translate(-100,-100)");
}


function set_map_display(id, title)
{
   if(map_display == null)
   {
	   map_display = (new basic_map_display(id, "topolakes.json", "lakes", title));
	   //return (new basic_map_display(id, "topolakes.json", "lakes", title));
   }
   else
   {
	   map_display.id = id;
	   map_display.title = title;
	   //return map_display;
    }
} 

function load_chart_pop(tsv_input, chart_title, map_type, yaxis, yfunc) {
    var margin = margin_charts;
    var width  = 960 - margin.left - margin.right,
        height = 330 - margin.top - margin.bottom;

    var svg_charts = d3.select(".resourcecontainer.charts").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);
   

    var voronoi = d3.geom.voronoi()
        .x(function (d) { return x(d.date); })
        .y(function (d) { return y(d.value); })
        .clipExtent([[-margin.left, -margin.top],
                     [width + margin.right, height + margin.bottom]]);

    var line = d3.svg.line()
        .x(function (d) { return x(d.date); })
        .y(function (d) { return y(d.value);});
    
    
    d3.tsv(tsv_input, type, function (error, clusters) {
        x.domain(d3.extent(months));
        y.domain([0, d3.max(clusters, function (c) {
            var m = d3.max(c.values, function (d) {
                return d.value;
            });
            //console.log(m);
            return m;
        })]);//.nice(yaxis.nticks);
        
        svg_charts.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.svg.axis()
              .scale(x)
              .orient("bottom")
              );

        svg_charts.append("g")
            .attr("class", "axis axis--y")
            .call(d3.svg.axis()
              .scale(y)
              .orient("left"))
              //.ticks(yaxis.nticks, yaxis.style))
          .append("text")
            .attr("class", "chart_title")
            .attr("x", 4)
            .attr("dy", ".32em")
            .style("font-weight", "bold")
            .text(chart_title);

        svg_charts.append("g")
            .attr("class", "clusters")
          .selectAll("path")
            .data(clusters)
          .enter().append("path")
            .attr("d", function (d) { d.line = this; return  line(d.values); })
            .attr("class", function (d) { return 'f_' + d.name; });

        var focus = svg_charts.append("g")
            .attr("transform", "translate(-100,-100)")
            .attr("class", "focus");

        focus.append("circle")
            .attr("r", 3.5);

        focus.append("text")
            .attr("y", -10);

        /*
        var voronoiGroup = svg_charts.append("g")
            .attr("class", "voronoi");

        voronoiGroup.selectAll("path")
            .data(voronoi(d3.nest()
                .key(function (d) { return x(d.date) + "," + y(d.value); })
                .rollup(function (v) { return v[0]; })
                .entries(d3.merge(clusters.map(function (d) { return d.values; })))
                .map(function (d) { return d.values; })))
          .enter().append("path")
            .attr("d", function (d) { return "M" + d.join("L") + "Z"; })
            .datum(function (d) { return d.point; })
            .on("mouseover", function (d){ mouseover_f(map_type, d, true, true)})
            .on("mouseout", function (d){ mouseout_f(map_type, d) })
            .each(function(d){if(d.FacilityName == cluster_select){mouseover_f(map_type, d, true, true)}});
        */
        /*
        d3.select("#show-voronoi")
            .property("disabled", false)
            .on("change", function () { voronoiGroup.classed("voronoi--show", this.checked); });
           */
    });
}

function type(d, i) {
    if (!i) months = Object.keys(d).map(monthFormat.parse).filter(Number);
    var cluster = {
        name: d.name.replace(/ (msa|necta div|met necta|met div)$/i, ""),
        values: null
    };
    cluster.values = months.map(function (m) {
        return {
            cluster: cluster,
            date: m,
            value: d[monthFormat(m)]
        };
    });
    return cluster;
}


function load_scatter_pop(cluster_id)
{
	
	var margin = {top: 50, right: 20, bottom: 50, left: 40},
    width = 250 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;
	
	d3.select(".resourcecontainer.maps").select("#scatter").remove()
	
	var svg = d3.select(".resourcecontainer.maps").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("id", "scatter")
   .append("g")
    	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	

	// Parse the date / time
	var parseDate = d3.time.format("%m-%d-%Y").parse;

	// Set the ranges
	var x = d3.time.scale().range([0, width]);
	var y = d3.scale.linear().range([height, 0]);

	// Define the axes
	var xAxis = d3.svg.axis().scale(x)
	    .orient("bottom").ticks(5);

	var yAxis = d3.svg.axis().scale(y)
	    .orient("left").ticks(5);

	// Define the line
	var valueline = d3.svg.line()
	    .x(function(d) {  return x(d.date); })
	    .y(function(d) {  if (d.population != -1000) return y(d.population); else { return y(100)}});
	    
	// Get the data
	d3.csv("pops/"+cluster_id+".csv", function(error, data) {
	    data.forEach(function(d) {
	        d.date = parseDate(d.date);
	        d.population = +d.population;
	    });

	    // Scale the range of the data
	    x.domain(d3.extent(data, function(d) {  return d.date; }));
	    y.domain([0, d3.max(data, function(d) {  return d.population; })]);

	    // Add the valueline path.
	    /*
	    svg.append("path")
	        .attr("class", "line")
	        .attr("d", valueline(data));
		*/
	    // Add the scatterplot
	    svg.selectAll("dot")
	        .data(data)
	      .enter().append("circle")
	        .attr("r", 3.5)
	        .attr("cx", function(d) { return x(d.date); })
	        .attr("cy", function(d) { return y(d.population); });
	    	//.attr("class", "circle_"+id);

	    // Add the X Axis
	    svg.append("g")
	        .attr("class", "x axis")
	        .attr("transform", "translate(0," + height + ")")
	        .call(xAxis);
	        //.attr("class","axis_"+id);

	    // Add the Y Axis
	    svg.append("g")
	        .attr("class", "y axis")
	        .call(yAxis)
	       .append("text")
	    	.text("Population")
	        .attr("transform", "rotate(-90)")
	        .attr("y", 6)
	        .attr("dy", ".71em")
	        .style("text-anchor", "end");
	    
	        //.attr("class","axis_"+id);
	});
}


function load_histogram(id, type, label)
{
	var margin = {top: 50, right: 20, bottom: 50, left: 40},
	    width = 250 - margin.left - margin.right,
	    height = 200 - margin.top - margin.bottom;
	
	var x = d3.scale.ordinal()
	    .rangeRoundBands([0, width], .1);
	
	var y = d3.scale.linear()
	    .range([height, 0]);
	
	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom")
	    .ticks(10);
	
	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left")
	    .ticks(10, "%");
	
	d3.selectAll("#"+id).remove();
	d3.selectAll("."+id).remove();
	var svg = d3.select(".resourcecontainer.maps").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	    .attr("class", id)
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.attr("id", id);
	
	svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .append("text")
    .attr("y", 0)
    .attr("x", 9)
    .attr("dy", "4.4em")
    //.attr("transform", "rotate(90)")
    .attr("id", id+"_x")
    .style("text-anchor", "start")
    .text(label);
	
	svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
  .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
	  .attr("id", id+"_y")
	.text("Frequency");
}


function draw_histogram(cluster_id, hist_id, data_path)
{

	var margin = {top: 50, right: 20, bottom: 50, left: 40},
    width = 250 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;
	
	var x = d3.scale.ordinal()
	    .rangeRoundBands([0, width], .1);
	
	var y = d3.scale.linear()
	    .range([height, 0]);	
	
	var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left")
	    .ticks(10, "%");
		
	var svg = d3.select(".resourcecontainer.maps").selectAll("#"+hist_id);

	d3.select(".resourcecontainer.maps").selectAll("#"+hist_id).selectAll(".bar_"+hist_id).remove();

	d3.tsv(data_path+cluster_id+".tsv", type, function(error, data) {
		  x.domain(data.map(function(d) { if(hist_id == "alt") return d.altitude; else return d.vegetation;}));
		  //alert(data.length)
		  //alert(d3.max(data, function(d){ return d.frequency; }))
		  y.domain([0, d3.max(data, function(d){ return d.frequency; })]);
		  svg.selectAll(".bar_" + hist_id)
	      .data(data)
	    .enter().append("rect")
	      .attr("class", "bar_" + hist_id)
	      .attr("x", function(d) { if(hist_id == "alt") return x(d.altitude); else return x(d.vegetation);})
	      .attr("width", x.rangeBand())
	      .attr("y", function(d) { return y(d.frequency); })
	      .attr("height", function(d) { return height - y(d.frequency); });
	
	   
	   svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + height + ")")
	    .call(xAxis)
	  .selectAll("text")
	    .attr("y", 0)
	    .attr("x", 9)
	    .attr("dx", ".35em")
	    .attr("transform", "rotate(90)")
	    .style("text-anchor", "start");
	});
	   
	function type(d) {
		  d.frequency = +d.frequency;
		  return d;
		}
}

function load_chart(tsv_input, chart_title, yaxis, yfunc) {
    var margin = margin_charts;
    var width  = 960 - margin.left - margin.right,
        height = 330 - margin.top - margin.bottom;

    var svg_charts = d3.select(".resourcecontainer.charts").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var voronoi = d3.geom.voronoi()
        .x(function (d) { return x(d.date); })
        .y(function (d) { return y(d.value); })
        .clipExtent([[-margin.left, -margin.top],
                     [width + margin.right, height + margin.bottom]]);

    var line = d3.svg.line()
        .x(function (d) { return  x(d.date); })
        .y(function (d) { return  y(d.value); });

    d3.tsv(tsv_input, type, function (error, cities) {
        x.domain(d3.extent(months));
        y.domain([0, d3.max(cities, function (c) {
            var m = d3.max(c.values, function (d) {
                return d.value;
            });
            //console.log(m);
            return m;
        })]).nice(yaxis.nticks);

        svg_charts.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.svg.axis()
              .scale(x)
              .orient("bottom")
              .ticks(d3.time.months, 6)
              .tickFormat(customTimeFormat)
              );

        svg_charts.append("g")
            .attr("class", "axis axis--y")
            .call(d3.svg.axis()
              .scale(y)
              .orient("left")
              .ticks(yaxis.nticks, yaxis.style))
          .append("text")
            .attr("class", "chart_title")
            .attr("x", 4)
            .attr("dy", ".32em")
            .style("font-weight", "bold")
            .text(chart_title);

        svg_charts.append("g")
            .attr("class", "cities")
          .selectAll("path")
            .data(cities)
          .enter().append("path")
            .attr("d", function (d) { d.line = this; return line(d.values); })
            .attr("class", function (d) { return 'f_' + d.name; });

        var focus = svg_charts.append("g")
            .attr("transform", "translate(-100,-100)")
            .attr("class", "focus");

        focus.append("circle")
            .attr("r", 3.5);

        focus.append("text")
            .attr("y", -10);

        var voronoiGroup = svg_charts.append("g")
            .attr("class", "voronoi");

        voronoiGroup.selectAll("path")
            .data(voronoi(d3.nest()
                .key(function (d) { return x(d.date) + "," + y(d.value); })
                .rollup(function (v) { return v[0]; })
                .entries(d3.merge(cities.map(function (d) { return d.values; })))
                .map(function (d) { return d.values; })))
          .enter().append("path")
            .attr("d", function (d) { return "M" + d.join("L") + "Z"; })
            .datum(function (d) { return d.point; })
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);

        d3.select("#show-voronoi")
            .property("disabled", false)
            .on("change", function () { voronoiGroup.classed("voronoi--show", this.checked); });

        function mouseover(d) {
            var facilityID = d.city.name;
            d3.selectAll("circle.f_" + facilityID)
                .classed("bubble--hover", true)
                .each(display_bubble_text);
            d3.selectAll("path.f_" + facilityID)
                .classed("city--hover", true)
                .each(bring_to_front);
            focus.attr("transform", "translate(" + x(d.date) + "," + y(d.value) + ")");
            focus.select("text").text(facilityID);
        }

        function mouseout(d) {
            var facilityID = d.city.name;
            d3.selectAll("circle.f_" + facilityID)
                .classed("bubble--hover", false)
                .each(hide_bubble_text);
            d3.selectAll("path.f_" + facilityID)
                .classed("city--hover", false)
            focus.attr("transform", "translate(-100,-100)");
        }
    });
}




/*
function type(d, i) {
    if (!i) months = Object.keys(d).map(monthFormat.parse).filter(Number);
    var city = {
        name: d.name.replace(/ (msa|necta div|met necta|met div)$/i, ""),
        values: null
    };
    city.values = months.map(function (m) {
        return {
            city: city,
            date: m,
            value: d[monthFormat(m)]
        };
    });
    return city;
}
*/

function load_snapshots_list(snapshot)
{
	var snapshot_selection =  d3.select(".resourcecontainer.maps").append("select")
		.attr("size", 10);
	//alert(snapshot)
	d3.json("snapshots_collection.json", function(error, snapshots) {
		snapshot_selection.selectAll("option")
			.data(snapshots)
			.enter().append("option")
			 .attr("value", function (d) {
				 	return d.file; 
			 		})
			 .text(function (d) {
				 	return d.snapshot; 
			 	 })
			 .attr("selected", function(d){if (d.file == snapshot) return true;})
			 .on("click", function () {
                var snapshot_file = this.__data__.file;
                load_comparative_scatter_plots(snapshot_file);
            })
		});
}

function load_gazeteer(json_gazeteer, json_clusters, calib_params_names)
{
	
	d3.select(".resourcecontainer.buttons").selectAll(".gazeteer").remove();
	
	var gazeteer_selection =  d3.select(".resourcecontainer.buttons").append("ul").html("<li class = 'gazeteer_options_header'>" + calib_params_names + "</li>")
			.attr("class", "gazeteer");
	
				/* the usual  d3js append function call (below) produces bad html in the context of additionally apended list items binded to data (further below) */
	
				/*
				.append("li")
				.attr("class", "gazeteer_options_header")
				.html(calib_params_names);
				*/
			
	
	d3.json(json_gazeteer, function(error, gazeteer) {
		gazeteer_selection.selectAll("li.gazeteer_option")
			.data(gazeteer)
			.enter().append("li")
			 .attr("value", function (d) {
				 	return d.sweep_name; 
			 		})
			 .attr("class", function(d){if (d.sweep_name == gazeteer_select) return "gazeteer_option_selected"; else return "gazeteer_option";})
			 .on("click", function () {
                gazeteer_select = this.__data__.sweep_name;
                load_map_bubbles_hist_err_surf(json_clusters, json_gazeteer, "", "bubble_hist_err_surf");
            })
            .append("a")
            .html(function (d) {
				 	return d.name; 
			 	 })
		});
	
	
	d3.select(".resourcecontainer.buttons").selectAll(".rounds").remove()
	var rnd_selection = d3.select(".resourcecontainer.buttons").append("ul")
						.attr("class", "rounds");

	var rnds = [0, 1, 2, 3, 4, 5];

	rnd_selection.selectAll("li")
		.data(rnds)
		.enter().append("li")
		 .attr("value", function (d) {
			 	return d; 
		 		})
		 .text(function (d) {
			 	return "Round " + (d + 1); 
		 	 })
		 .attr("class", function(d){if (d == rnd_select) return "rnd_selected"; else return "rnd_option"})
		 .on("click", function (d) {
            rnd_select = d;
            load_map_bubbles_hist_err_surf(json_clusters, json_gazeteer, "", "bubble_hist_err_surf");
        });
}


function update_RDT_array_idx(idx) {
    d3.selectAll(".bubble circle")
    .attr("fill", function (d) {
    	//alert(this.__data__.RDT.length)
        var c = 'darkgray'; // for N/A
        if(idx < this.__data__.RDT.length) {
            var rdt = this.__data__.RDT[idx];
            if (rdt >= 0) { c = colorScaleRDT(rdt); }
        }
        return c;
    })
}


function bring_to_front(d) {
    this.parentNode.appendChild(this);
}

function load_alt_veg_img()
{
	var spatial_view = d3.select(".resourcecontainer.maps")
	spatial_view.append("img").attr("src", "alt.png").attr("width","240px")
	spatial_view.append("img").attr("src", "veg.png").attr("width","240px")
}


// REFACTOR NEEDED (THROUGHOUT)!!!
function display_figure(facilityID)
{
	//alert(facilityID);
	var figs = d3.select(".resourcecontainer.maps");
	figs.style("display", "block");
	figs.selectAll(".fig").remove();
	
	facilityID = typeof facilityID !== 'undefined' ? facilityID : false;
	if (facilityID)
	{
		//alert(gazeteer_select + "/err_surfaces/cluster_err_surface_"+facilityID+"_prev.png");
		//prev_err_surf_fig_src =  gazeteer_select + "/err_surfaces/prev/cluster_err_surface_"+facilityID+"_prev.png"
		//prev_calib_fig_src = gazeteer_select + "/calibs/prev/cluster_calib_"+facilityID+"_prev.png"
		
		//reinf_err_surf_fig_src =  gazeteer_select + "/err_surfaces/reinf/cluster_err_surface_"+facilityID+"_reinf.png"
		//reinf_calib_fig_src = gazeteer_select + "/calibs/reinf/cluster_calib_"+facilityID+"_reinf.png"
		
		err_surfs_fig_src =  gazeteer_select + "/err_surfaces/surf_"+facilityID+".png"
		cc_traces_fig_src = gazeteer_select + "/cc_traces/cc_trace_"+facilityID+".png"
		prev_traces_fig_src = gazeteer_select + "/prev_traces/prev_trace_"+facilityID+".png"
			
		
		var svg_img_container = figs.append("img")
		svg_img_container.attr("src", prev_traces_fig_src).attr("width","600px").attr("class", "fig");
		
		var svg_img_container = figs.append("img")
		svg_img_container.attr("src", cc_traces_fig_src).attr("width","600px").attr("class", "fig");

		var svg_img_container = figs.append("img")
		svg_img_container.attr("src", err_surfs_fig_src).attr("width","300px").attr("class", "fig");
		
		load_scatter_pop(facilityID);
			
	}
	else
		figs.append("svg")
		  .attr("class", "fig")
		  .style("width", "1200px");
}

function imageExist(image_url)
{

	//alert(image_url)
	var http = new XMLHttpRequest();
    try
    {
    	http.open('HEAD', image_url, false); 
    	http.send();
    }
    catch(e){}
    //alert(http.status)
    return http.status != 0;
}


function load_demographics()
{
	var demographics = d3.select(".resourcecontainer.charts")
	demographics.append("img").attr("src", "demographics.png")
}

function load_geographics()
{
	var demographics = d3.select(".resourcecontainer.charts")
	demographics.append("img").attr("src", "geographics.png")
    	
}

function load_single_node()
{
	var single_node = d3.select(".resourcecontainer.maps")
	single_node.append("text").text("50- and 20-year immunnization burnins (left and right)");
	single_node.append("br");
	single_node.append("img").attr("src", "single_node_50_years.png").style("float","left").attr("width","450px")
	single_node.append("img").attr("src", "single_node_20_years.png").style("float","left").attr("width","450px")
}

function load_sigmoid()
{
	var sigmoid = d3.select(".resourcecontainer.maps")
	sigmoid.append("text").text("Fitting x_habitat scale (reducing all larval habitats)");
	sigmoid.append("br");
	sigmoid.append("text").text("Constant habitat scale: 0.5");
	sigmoid.append("img").attr("src", "sigmoid_fit.png")
}

function load_shifting_sigmoid()
{
	var sigmoid = d3.select(".resourcecontainer.maps")
	sigmoid.append("text").text("Fitting x_habitat scale (reducing all larval habitats)");
	sigmoid.append("br");
	sigmoid.append("text").text("Constant habitat scale: varying [0.05, 0.5, 0.9]");
	sigmoid.append("img").attr("src", "shifting_sigmoid_fit.png")
}

function load_habitat_functions()
{	
	var habitat_functions = d3.select(".resourcecontainer.maps")
	habitat_functions.append("text").text("Some possible constant habitat functions (of altitude)");
	habitat_functions.append("br");
	habitat_functions.append("text").text("Increasing altitude index corresponds to increasing altitude").attr("size","small");
	habitat_functions.append("img").attr("src", "constant_habitat_func.png")
}

function load_simulation_videos()
{
	d3.select(".resourcecontainer.maps").html('<video width="960px" controls> <source src="zambia_spatial.mp4" type="video/mp4"></video>')
	d3.select(".resourcecontainer.maps").append("br")
	d3.select(".resourcecontainer.maps").append("br")
	d3.select(".resourcecontainer.maps").append("a").attr("href", "https://comps.idmod.org/#viz?simid=3e7a2ffd-fcd6-e411-93f9-f0921c16b9e7&channel=SpatialReport_New_Diagnostic_Prevalence&resolution=30&basemap=EsriWorldTopographic&renderer=circle&zoom=10&lon=3073548.433372005&lat=-1897051.2948686185&circlescale=2.5&gradient=true&colormap=Reds&border=true&zerobucket=gray&lastinterval=368&playbackspeed=1")
	.text("Constant scale step decrease w/ altitude")
}

function load_comparative_scatter_plots(snapshot)
{
	remove_slide_contents()
	//update_RDT_array_idx(0) //!!! CHAGNE this when the rest of the buttons are displayed
	//var basic_layer = new basic_map_display("lake_kariba_simulation", "topolakes.json", "lakes","Lake Kariba");
	//var hfca_layer = new hfcas_map_display("simulation", "hfcas.json", "hfcas", "Simulation");
	var cluster_bubbles_layer = new pop_bubbles_map_display("cluster_bubbles_simulation", snapshot, "Simulation", "rdt", true, true, true);
	
	map_display = null;
	//var basic_layer = new basic_map_display("lake_kariba_surveillance", "topolakes.json", "lakes","Lake Kariba");
	//var hfca_layer = new hfcas_map_display("surveillance", "hfcas.json", "hfcas", "Surveillance");
	var cluster_bubbles_layer = new pop_bubbles_map_display("cluster_bubbles_surveillance", "surveillance.json", "Surveillance", "rdt", true, true, true);

	load_snapshots_list(snapshot)
	
	load_histogram("alt","alt","Altitude");
	load_histogram("veg","veg","Vegetation");
}


function load_map_basic()
{
	var basic_layer = new basic_map_display("lake_kariba", "topolakes.json", "lakes","Lake Kariba");
}


function load_map_hhs(json_input, map_title, map_type)
{
	var hhs_layer = new hhs_map_display("hhs", json_input, map_type, map_title);
}


function load_map_clusters(json_input,json_input_hhs, json_input_hfcas, map_title, map_type)
{
	//var basic_layer = new basic_map_display("lake_kariba", "topolakes.json", "lakes","Lake Kariba");
	
	var hfca_layer = new hfcas_map_display("hfcas", json_input_hfcas, map_type, map_title);
	var cluster_hulls_layer = new clusters_map_display("cluster_hulls", json_input, map_type, map_title)
	var hhs_layer = new hhs_map_display("hhs", json_input_hhs, map_type, map_title);
	 
}


function load_map_hfcas(json_input, json_input_hhs, map_title, map_type)
{
	
	var hfca_layer = new hfcas_map_display("hfcas", json_input, map_type, map_title);
	var hhs_layer = new hhs_map_display("hhs", json_input_hhs, map_type, map_title);
}


function load_map_bubbles(json_input, json_input_hfcas, map_title, map_type) 
{
	var hfca_layer = new hfcas_map_display("hfcas", json_input_hfcas, map_type, map_title);
	var pop_bubbles_layer = new pop_bubbles_map_display("pop_bubbles", json_input, map_title, "population", false, false, false)
}


function load_map_bubbles_hist(json_input, json_input_hfcas, map_title, map_type)
{
	//var hfca_layer = new hfcas_map_display("hfcas", json_input_hfcas, map_type, map_title);
	var pop_bubbles_layer = new pop_bubbles_map_display("pop_bubbles", json_input, map_title, "rdt",  true, true, false, false)
}

function load_map_bubbles_hist_err_surf(json_input, json_input_gazeteer, map_title, map_type, gazeteer_select, cluster_select)
{
	this.svg_maps = d3.select(".resourcecontainer.maps");
	svg_maps.html("")
	
	var figs = d3.select(".resourcecontainer.preload");
	d3.json(json_input_gazeteer, function(gazeteer){
		for(i = 0; i < gazeteer.length; i++)
		{
			var gaz_i = gazeteer[i];
			
			d3.json(json_input, function (error,collection){ 
				
				figs.selectAll(".err_surfaces")
		        .data(collection)
		        	.enter().append("img")
		        		.attr("class", "err_surfaces")
		        		.attr("src", function(d) { return gaz_i.sweep_name + "/err_surfaces/surf_"+d.FacilityName+".png"; });
				
				
				figs.selectAll(".prev_traces")
		        .data(collection)
		        	.enter().append("img")
		        		.attr("class", "prev_traces")
		        		.attr("src", function(d) { return gaz_i.sweep_name + "/prev_traces/prev_trace_"+d.FacilityName+".png"; });
		        
			
				figs.selectAll(".cc_traces")
				.data(collection)
		    	.enter().append("img")
		    		.attr("class", "cc_traces")
		    		.attr("src", function(d) { return gaz_i.sweep_name + "/cc_traces/cc_trace_"+d.FacilityName+".png"; });		
			});
			
			d3.select(".resourcecontainer.preload").remove();
			
		}
	});
	
	json_input = "map.json";
	
	var calib_params_names = "";
	d3.json("gazetteer_header.json", function(error, gazeteer_header){
		calib_params_names = gazeteer_header;
		load_gazeteer(json_input_gazeteer, json_input, calib_params_names);
	});
	
	//calib_params_names = "ITN trajectory:<br />Temporary habitat scale:<br />Constant habitat scale:<br />Drug coverage per round:";
	
	//id, clusters_input, title, map_type, histogram, figure, rdt_obs, rmse, drug_cov, itns, reinf, habitats_const, habitats_temp, habitats_comb, rdt_sim
	
	map_display = null;
	//histogram, figure, rdt_obs, rmse, drug_cov, itns, reinf, habitats_const, habitats_temp, habitats_comb, rdt_sim
	var pop_bubbles_layer_rdt_obs = new pop_bubbles_map_display("pop_bubbles_rdt_obs", json_input, "RDT+ (srvlns.)", "rdt_obs",  true, true, true, false, false, false, false, false, false, false, false);

	map_display = null;
	var pop_bubbles_layer_rdt_sim = new pop_bubbles_map_display("pop_bubbles_rdt_sim", json_input, "RDT+ (sim)", "rdt_sim",  true, true, false, false, false, false, false, false, false, false, true);
	
	/*
	map_display = null;
	var pop_bubbles_layer_reinf = new pop_bubbles_map_display("pop_bubbles_reinf", json_input, "Reinfection (srvlns.)", "reinfection",  true, true, false, false, false, false, true, false, false, false, false);
	*/
	
	map_display = null;
	var pop_bubbles_layer_rmse = new pop_bubbles_map_display("pop_bubbles_rmse", json_input, "Residuals", "rmse",  true, true, false, true, false, false, false, false, false, false, false);
	
	map_display = null;
	//var pop_squares_layer_habs =  pop_squares_map_display("pop_squares_habs", json_input, "Hab. (RDT+ fit)", "habitats", true);
	var pop_bubbles_layer_const_habs =  pop_bubbles_map_display("pop_bubbles_habs_const", json_input, "Const.", "habitats_const",true, true, false, false, false, false, false, true, false, false, false);
	
	map_display = null;
	var pop_bubbles_layer_temp_habs =  pop_bubbles_map_display("pop_bubbles_habs_temp", json_input, "All habs", "habitats_temp", true, true, false, false, false, false, false, false, true, false, false);
	
	map_display = null;
	var pop_bubbles_layer_comb_habs =  pop_bubbles_map_display("pop_bubbles_habs_comb", json_input, "Effect. const", "habitats_comb", true, true, false, false, false, false, false, false, false, true, false);
	
	map_display = null;
	var pop_bubbles_layer_drug_cov = new pop_bubbles_map_display("pop_bubbles_drug_coverage", json_input, "Drugs", "drug_coverage",  true, true, false, false, true, false, false, false, false, false, false);
	
	map_display = null;
	var pop_bubbles_layer_itns = new pop_bubbles_map_display("pop_bubbles_itns", json_input, "ITNs", "itn_coverage",  true, true, false, false, false, true, false, false, false, false, false);
	
	load_scatter_habs("habitats_scatter", json_input)

	//load_chart_pop("cluster_pop_ts.tsv", "Population Timeseries", "pop_bubbles", yaxis={nticks:5, style:'%'})
	//load_chart_pop("New_Diagnostic_Prevalence.tsv", "Population Timeseries", "pop_bubbles", yaxis={nticks:5, style:'%'})
	//load_chart("New_Diagnostic_Prevalence.tsv", "Population Timeseries", "pop_bubbles", yaxis={nticks:5, style:'%'})
	//load_chart("cluster_pop_ts.tsv", "Population Timeseries", "pop_bubbles", yaxis={nticks:5, style:'%'})
	
	//display_figure(cluster_select);
}