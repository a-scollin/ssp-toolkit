export function buildIncoming(graphdata){

    var new_graph = {}

    for(var node in graphdata.graph){

        if(Array.isArray(graphdata.graph[node])){

            new_graph[node] = {
                'outgoing' : graphdata.graph[node]  ,
                'incoming' : []
            }

        }
    }

    
    for(var oracle in graphdata.oracles){

        new_graph[graphdata.oracles[oracle][0]].incoming.push(["ORACLE",graphdata.oracles[oracle][1]])

    }

    for(var pack in graphdata.graph){

        for(var edge in graphdata.graph[pack]){

            var dest = graphdata.graph[pack][edge][0]
            var edgename = graphdata.graph[pack][edge][1]

            new_graph[dest].incoming.push([pack,edgename])


        }
    }


    return new_graph
}

function buildGraphData(graphData){

    var new_graph = {'oracles' : [], 'graph' : {}}

    for(var pack in graphData){

        new_graph.graph[pack] = JSON.parse(JSON.stringify(graphData[pack].outgoing))

        for(var in_edge in graphData[pack].incoming){

            if(graphData[pack].incoming[in_edge][0] === "ORACLE"){

                new_graph.oracles.push([pack,graphData[pack].incoming[in_edge][1]])

            }

        }

    }

    return new_graph

}

export function getExapandableEdgeRange(edge){

    console.log(edge)

    var expand_range = '';
    var expand_range_start = 0; 
    var expand_range_end = 0; 
    

    expand_range = edge[1].split('_[')[1]
    
    if(edge[1].split('...').length != 2){
        
        expand_range = expand_range.substring(0, expand_range.length - 1);
        
        expand_range_start = /^-?\d+$/.test(expand_range) ? parseInt(expand_range) : Infinity
        
        return [expand_range_start, -1]
    }
    
    
    expand_range_start = expand_range.split('...')[0]
    
    expand_range_end = expand_range.split('...')[1]
    
    // Remove ']'
    expand_range_end = expand_range_end.substring(0, expand_range_end.length - 1);
    
    if(/^-?\d+$/.test(expand_range_start)){
        
        expand_range_start = parseInt(expand_range_start)
        
    }else{
        
        return [Infinity, Infinity]
        
    }
    
    if(/^-?\d+$/.test(expand_range_end)){
        
        expand_range_end = parseInt(expand_range_end)
        
    }else{
        
        return [expand_range_start, Infinity]
        
    }
    
    if(expand_range_start >= expand_range_end){

        throw edge[1] + " has a range that is not strictly increasing!"

    }

    console.log([expand_range_start, expand_range_end])
    alert("returns")
    return [expand_range_start, expand_range_end]

}

function indexOf2d(array,item) {
    // arrCoords is an array with previous coordinates converted to strings in format "x|y"
    var arrCoords = JSON.stringify(array.map(function(a){return a[0] + "|" + a[1]}));

    // now use indexOf to find item converted to a string in format "x|y"
    return arrCoords.indexOf(item[0] + "|" + item[1]);
}

export function decompose(graphData,graphData_with_oracles,nodeSelection,subGraph){


    if(!subGraph.hasOwnProperty("oracles") || !subGraph.hasOwnProperty("graph")){        
        throw "Please ensure subgraph file is correct!"
    }

    var expandable_edges = []
    var static_edges = []

    var newGraph = JSON.parse(JSON.stringify(graphData_with_oracles))

    delete newGraph.graph[nodeSelection]

    var to_remove = [];

    for(var oracle in newGraph.oracles){

        if(newGraph.oracles[oracle][0] === nodeSelection){

            to_remove.push(newGraph.oracles[oracle])

        }

    }

    newGraph.oracles = newGraph.oracles.filter(x => !to_remove.includes(x)) 

    for(var pack in newGraph.graph){

        to_remove = []

        for(var edge in newGraph.graph[pack]){

            if(newGraph.graph[pack][edge][0] === nodeSelection){

                to_remove.push(newGraph.graph[pack][edge])

            }

        }

        newGraph.graph[pack] = newGraph.graph[pack].filter(x => !to_remove.includes(x)) 

    }

    // Check incoming edges
    
    for(var edge in graphData[nodeSelection].incoming){

        if(graphData[nodeSelection].incoming[edge][1].split('...').length == 2){

            expandable_edges.push(graphData[nodeSelection].incoming[edge])

        }else{

            static_edges.push(graphData[nodeSelection].incoming[edge])

        }

    }

    var subGraphIncoming = [...subGraph.oracles]

    var match = 0;

    to_remove = []

    for(var edge in static_edges){

        match = 0 

        for(var in_edge in subGraphIncoming){

            if(subGraphIncoming[in_edge][1] == static_edges[edge][1] || static_edges[edge][1].split(']')[0] === subGraphOutgoing[in_edge][1].split('*')[0]){
                
                match += 1

                to_remove.push(subGraphIncoming[in_edge])

                if(static_edges[edge][0] == "ORACLE"){
                    newGraph.oracles.push([static_edges[edge][0],subGraphOutgoing[in_edge][1]])
                }else{
                    newGraph.graph[static_edges[edge][0]].push([static_edges[edge][0],subGraphOutgoing[in_edge][1]])
                }
            }
            
        }

        if(match < 1){
            throw static_edges[edge][1] + ' has no matching edge in subgraph!'
        }

        if(match > 1){
            alert(static_edges[edge][1] + ' has multiple matches to outgoing edges! It has been mapped ' + match.toString() + ' times!')
        }
         
    }

    subGraphIncoming = subGraphIncoming.filter(x => !to_remove.includes(x))

    var edge_ranges = {};
    var expand_range_start, expand_range_end;

    for(var edge in expandable_edges){

        [expand_range_start, expand_range_end] = getExapandableEdgeRange(expandable_edges[edge])

        if(expand_range_start == Infinity){
            throw expandable_edges[edge][1] + ' has a variable base, please ensure edges have static bases.'
        }

        if(expand_range_end == -1){
            throw "Error! do you have multiple ...'s in the same edge name?"
        }

        if(edge_ranges.hasOwnProperty(expandable_edges[edge][0])){

            if(edge_ranges[expandable_edges[edge][0]].hasOwnProperty(expandable_edges[edge][1].split('_[')[0])){

                throw "Multiple expandable edges of the same name from the same package."
            
            }else{

                edge_ranges[expandable_edges[edge][0]][expandable_edges[edge][1].split('_[')[0]] = [expand_range_start, expand_range_end]

            }

        }else{

            edge_ranges[expandable_edges[edge][0]] = {}

            edge_ranges[expandable_edges[edge][0]][expandable_edges[edge][1].split('_[')[0]] = [expand_range_start, expand_range_end]

        }

    }


    var matched = []

    console.log(subGraphIncoming)

    console.log(edge_ranges)

    for(var edge in subGraphIncoming){


        [expand_range_start, expand_range_end] = getExapandableEdgeRange(subGraphIncoming[edge])

        console.log(expand_range_start)
        console.log(expand_range_end)

        match = 0

        if(expand_range_end == -1){

            for(var pack in edge_ranges){

                for(var edgebase in edge_ranges[pack]){

                    if(subGraphIncoming[edge][1].split('_[')[0] === edgebase && edge_ranges[pack][edgebase][0] <=  expand_range_start && expand_range_start  <= edge_ranges[pack][edgebase][1]){

                        match += 1

                        if(pack == "ORACLE"){
                            newGraph.oracles.push(subGraphIncoming[edge])
                        }else{
                            newGraph.graph[pack].push(subGraphIncoming[edge])
                        }

                    }

                }
                
            }

        }else{

            if(expand_range_start == Infinity){
                throw subGraphIncoming[edge][1] + ' has a variable base, please ensure edges have static bases.'

            }

            for(var pack in edge_ranges){

                for(var edgebase in edge_ranges[pack]){

                    if(subGraphIncoming[edge][1].split('_[')[0] === edgebase && edge_ranges[pack][edgebase][0] <=  expand_range_start && expand_range_end  <= edge_ranges[pack][edgebase][1]){

                        match += 1

                        if(pack == "ORACLE"){
                            newGraph.oracles.push(subGraphIncoming[edge])
                        }else{
                            newGraph.graph[pack].push(subGraphIncoming[edge])
                        }

                    }

                }
                
                
            }


        }

        if(match < 1){
            console.log(subGraphIncoming[edge])
            throw subGraphIncoming[edge][1] + " is not in any expandable edge range!"
        }

        if(match > 1){
            alert(subGraphIncoming[edge][1] + " is in multiple expandable edge ranges! this edge has been mapped " + match.toString() + " times.")
        }

        matched.push(subGraphIncoming[edge])

    }

    if(JSON.stringify(matched) != JSON.stringify(subGraphIncoming)){
        throw "Incoming expandable edges do not match!"
    }

    console.log(newGraph)

    expandable_edges = []
    static_edges = []

    for(var edge in graphData[nodeSelection].outgoing){

        if(graphData[nodeSelection].outgoing[edge][1].split('...').length == 2){

            expandable_edges.push(graphData[nodeSelection].outgoing[edge])

        }else{

            static_edges.push(graphData[nodeSelection].outgoing[edge])

        }

    }

    var subGraphOutgoing = []

    
    for(var pack in subGraph.graph){
        
        to_remove = []

        for(var edge in subGraph.graph[pack]){

            if(subGraph.graph[pack][edge][0] === "" || subGraph.graph[pack][edge][0] === "terminal_pkg"){

                subGraphOutgoing.push([pack,subGraph.graph[pack][edge][1]])
                to_remove.push(subGraph.graph[pack][edge])

            }
        
        }

        subGraph.graph[pack] = subGraph.graph[pack].filter(x => !to_remove.includes(x)) 
    
    }

    for(var edge in static_edges){

        // static_edges[edge][0] new dest if

        match = 0

        for(var out_edge in subGraphOutgoing){

            if(static_edges[edge][1] === subGraphOutgoing[out_edge][1] || static_edges[edge][1].split(']')[0] === subGraphOutgoing[out_edge][1].split('*')[0]){

                match += 1

                subGraph.graph[subGraphOutgoing[out_edge][0]].push([static_edges[edge][0],subGraphOutgoing[out_edge][1]])

            }

        }

        if(match < 1){
            throw static_edges[edge][1] + ' has no matching edge in subgraph!'
        }

        if(match > 1){
            alert(static_edges[edge][1] + ' has multiple matches to outgoing edges! It has been mapped ' + match.toString() + ' times!')
        }
         

    }

    // NEED TO DO DYNAMIC EDGES AND COMMENT!

    newGraph.graph = {...subGraph.graph , ...newGraph.graph}

    return newGraph

}