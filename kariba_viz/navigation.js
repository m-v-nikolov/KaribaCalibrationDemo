var slides_by_name = {
    "basic_map": 0,
    "hfcas": 1,
    "hhs": 2,
    "clusters_hulls": 3,
    "clusters_bubbles": 4,
    "forward_surveillance": 5,
    "back_intro": 6,
    "demographics": 7,
    "geographics": 8,
    "map_histograms": 14,
    "forward_single_node": 9,
    "back_surveillance": 10,
    "single_node": 11,
    "sigmoid": 12,
    "shifting_sigmoid": 13,
    "habitat_functions": 15,
    "forward_multinode": 9,
    "back_single_node": 23,
    "simulation_videos": 16,
    "comperative_scatter_plots": 17,
    "aggregate_per_facility": 18,
    "forward_to_do": 19,
    "back_multinode": 20,
    "to_do": 21,
    "the_end": 22, 
}

$(document).ready(function () {
    $(".cb").click(function () {
        var parent = $(this).parents('.switch');
        $('.cb', parent).removeClass('selected');
        $(this).addClass('selected');

        var nav = $(this).attr('for');
        
        remove_slide_contents()
        
        if(nav == 'basic_map')
        	load_map_basic();
        else
        if(nav == 'back_intro')
        {
        	load_map_basic();
        	d3.select("#intro").style("display","block");
        	d3.select("#surveillance").style("display","none");
        }
        else        	
        if(nav == 'hfcas')
        	load_map_hfcas("hfcas.json","hhs.json","HFCAs","hfcas");
        else
        if(nav == 'hhs')
            load_map_hhs("hhs.json","Households","hhs");
        else
        if(nav == 'clusters_hulls')
            load_map_clusters("clusters_hulls.json","hhs.json","hfcas.json","Clusters","clusters_hulls");
        else
        if(nav == 'clusters_bubbles')
            load_map_bubbles("snapshot.json","hfcas.json","Village populations","clusters_bubbles");
        else
        if(nav == 'forward_surveillance')
        {
        	d3.select("#surveillance").style("display","block");
    		d3.select("#intro").style("display","none");
    		load_demographics()
        }
    	else
    	if(nav == 'demographics')
    		load_demographics()
    	else
    	if(nav == 'back_surveillance')
    	{
    		d3.select("#surveillance").style("display","block");
			d3.select("#single_node").style("display","none");
            
			load_demographics()
    	}    
        else
        if(nav == 'geographics')	   
            load_geographics()
        else
        if(nav == 'map_histograms')
        {
            load_map_bubbles_hist("mod_surveillance.json","hfcas.json", "Cluster geography", "bubble_hist");
            load_alt_veg_img();
            load_histogram("alt","alt","Altitude");
            load_histogram("veg","veg","Vegetation");
        }
        else
        if(nav == 'forward_single_node')
        {	
        	d3.select("#single_node").style("display","block");
    		d3.select("#surveillance").style("display","none");
        	
            load_single_node()
        }
        else
        if(nav == 'single_node') 
        	load_single_node()
        else
        if(nav == 'back_single_node')
        {
        	d3.select("#single_node").style("display","block");
			d3.select("#multinode").style("display","none");
			load_single_node()
        }	
        if(nav == 'sigmoid')   
           load_sigmoid()
        else
        if(nav == 'shifting_sigmoid')           
           load_shifting_sigmoid()
        else
        if(nav == 'habitat_functions')
           load_habitat_functions()
        else
        if(nav == 'forward_multinode')
        { 	
           d3.select("#single_node").style("display","none");
		   d3.select("#multinode").style("display","block");
        	
		   load_comparative_scatter_plots('snapshot_backup.json')
        }
        else
        if(nav == 'simulation_videos')
        	load_simulation_videos();
        else
        if( nav == 'back_multinode')
        {
        	d3.select("#to_do").style("display","none");
 		    d3.select("#multinode").style("display","block");
 		    load_comparative_scatter_plots('snapshot_backup.json')
        }
        else
        if(nav == 'comparative_scatter_plots')
           load_comparative_scatter_plots('snapshot_backup.json')
        else
        if(nav == 'aggregate_per_facility')
           load_aggregate_per_facility()
        else
        if(nav == 'forward_to_do')
        {
        	d3.select("#to_do").style("display","block");
 		    d3.select("#multinode").style("display","none");
 		    
 		    load_to_do()
        }	
        if(nav == 'to_do')
           load_to_do()
        else
        if(nav == 'the_end')
           load_the_end()
        
        //update_RDT_array_idx(rounds_by_name[round]);
    });
});