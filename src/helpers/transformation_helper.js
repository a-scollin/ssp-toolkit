import { InputGroup } from "react-bootstrap"
import _ from 'lodash'
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

    console.log(new_graph)

    return new_graph

}

function findChain(graphData, node, visitedNodes = [], isBase = false){

    var chain = []

    var more_chain = []

    var visited = [node, ...visitedNodes]

    if(isBase){

        for(var edge in graphData[node].outgoing){

            if(!visited.includes(graphData[node].outgoing[edge][0])){
    
                if(graphData[node].outgoing[edge][0].split('...').length == 2){
                    
                    if(graphData[node].outgoing[edge][1].split('...').length != 2){
                        throw node + " connects to " + graphData[node].outgoing[edge][0] + " with a non expandable edge! ("+ graphData[node].outgoing[edge][1] +")";                     
                    }
    
                    [more_chain, visited] = findChain(graphData,graphData[node].outgoing[edge][0],visited)
                    
                    chain = [...more_chain, ...chain]
                    
    
                }
    
        }

        
    }
    return [[node, ...chain], visited]

}

    for(var edge in graphData[node].outgoing){

        if(!visited.includes(graphData[node].outgoing[edge][0])){

            if(graphData[node].outgoing[edge][0].split('...').length == 2){
                
                if(graphData[node].outgoing[edge][1].split('*').length != 2){
                    throw node + " connects to " + graphData[node].outgoing[edge][0] + " with a non encoding edge! ("+ graphData[node].outgoing[edge][1] +")"; 
                }

                [more_chain, visited] = findChain(graphData,graphData[node].outgoing[edge][0],visited)
                
                chain = [...more_chain, ...chain]
                

            }else if(graphData[node].outgoing[edge][1].split('*').length != 2){

                throw  node + " connects to " + graphData[node].outgoing[edge][0] + " with a non encoding edge! ("+ graphData[node].outgoing[edge][1] +")"; 

            }

    }

    }

    for(var edge in graphData[node].incoming){


        if(!visited.includes(graphData[node].incoming[edge][0])){

        if(graphData[node].incoming[edge][0].split('...').length == 2){

            if(graphData[node].incoming[edge][1].split('*').length != 2){

                throw graphData[node].incoming[edge][0] + " connects to " + node + " with a non encoding edge! ("+ graphData[node].incoming[edge][1] +")"; 

            }
                
                
                [more_chain, visited] = findChain(graphData,graphData[node].incoming[edge][0],visited)
                
                chain = [...more_chain, ...chain]

            

        }else if (graphData[node].incoming[edge][1].split('...').length == 2){
                    
            [more_chain, visited] = findChain(graphData,graphData[node].incoming[edge][0],visited,true)
                
            chain = [...more_chain, ...chain]            
                         
        }else{

            throw graphData[node].incoming[edge].toString() + " - Is an illegal edge into " + node
       
        }
        

    }
}


    // This is wrong assumes that there is only one chain for one package. 
    return [[...chain, node],visited] 
    
}

export function findAllExpandableChains(graphData){

    var chains = []


    console.log(graphData)
    var visited;
    var chain;
    var base_packs; 

    for(var pack in graphData){
        if(pack.split('...').length == 2){
            
            [chain, visited] = findChain(graphData,pack)

            if(chain.some(element => !visited.includes(element))){
                throw "Error 500"
            }
            
            [base_packs, chain] = _.partition(chain, element => element.split("...").length != 2)

            base_packs.sort()

            chain.sort()

            chains.push([...base_packs,...chain])

        }
    }

    var chains_to_remove = []

     for (var chain in chains){
        for (var otherchain in chains){
            if (chains[chain] !== chains[otherchain] && chains[otherchain].length > chains[chain].length && chains[chain].every(element => chains[otherchain].includes(element))){
                chains_to_remove.push(chains[chain])
            }
        }
    }

    var return_chains = chains.filter(element => !chains_to_remove.includes(element))

    return Array.from(new Set(return_chains.map(JSON.stringify)), JSON.parse)
   
}
function getEncodableEdgeNumber(edge){

    var number = edge.split("_[")[1].split("*")[0]

    if(/^-?\d+$/.test(number)){
        return parseInt(number)
    }else{

        throw "Encodable edge " + edge + " is not correctly formatted! Must be a numeric."
    
    }
}

function getNumber(edge){

    var number = edge.split("_[")[1].split("]")[0]

    if(/^-?\d+$/.test(number)){
        return parseInt(number)
    }else{

        throw edge + " is not correctly formatted! Must be a numeric."

    }
}

export function getExapandableRange(edge){

    console.log(edge)

    var expand_range = '';
    var expand_range_start = 0; 
    var expand_range_end = 0; 
    

    expand_range = edge.split('_[')[1]
    
    if(edge.split('...').length != 2){
        
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

        throw edge + " has a range that is not strictly increasing!"

    }

    console.log([expand_range_start, expand_range_end])
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

    // Build the new graph without any mention of the graph to be decomposed.

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

    // Build a list of the ingoing edges that need resolved
    
    for(var edge in graphData[nodeSelection].incoming){

        if(graphData[nodeSelection].incoming[edge][1].split('...').length == 2){

            expandable_edges.push(graphData[nodeSelection].incoming[edge])

        }else{

            static_edges.push(graphData[nodeSelection].incoming[edge])

        }

    }

    // Build a list of teh subgraphs incoming edges

    var subGraphIncoming = [...subGraph.oracles]

    // See what static edges (non-expandable) map to what incoming edge 

    var match = 0;

    to_remove = []

    for(var edge in static_edges){

        match = 0 

        for(var in_edge in subGraphIncoming){

            if(subGraphIncoming[in_edge][1] == static_edges[edge][1] || static_edges[edge][1].split(']')[0] === subGraphIncoming[in_edge][1].split('*')[0]){
                
                match += 1

                to_remove.push(subGraphIncoming[in_edge])

                if(static_edges[edge][0] == "ORACLE"){
                    newGraph.oracles.push(subGraphIncoming[in_edge])
                }else{
                    newGraph.graph[static_edges[edge][0]].push([static_edges[edge][0],subGraphIncoming[in_edge][1]])
                }
            }
            
        }

        if(match < 1){
            throw static_edges[edge][1] + ' has no matching incoming edge in subgraph!'
        }

        if(match > 1){
            alert(static_edges[edge][1] + ' has multiple matches to outgoing edges! It has been mapped ' + match.toString() + ' times!')
        }
         
    }

    // Remove from edges to check

    subGraphIncoming = subGraphIncoming.filter(x => !to_remove.includes(x))

    // See what expandable edges map to what incoming edge, we need to cover the case that there is an edge in subgraph that is extracted from the expandable range
    // Therefore we check what range that edge is in and map that edges source to the new incoming edge. To begin we build a dictionary of all the ranges, indexed
    // by their edge base name and source package.

    var edge_ranges = {};
    var expand_range_start, expand_range_end;

    for(var edge in expandable_edges){

        [expand_range_start, expand_range_end] = getExapandableRange(expandable_edges[edge][1])

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

    // We then check if the incoming edge maps to any expandable edge range

    var matched = []

    console.log(subGraphIncoming)

    console.log(edge_ranges)

    for(var edge in subGraphIncoming){


        [expand_range_start, expand_range_end] = getExapandableRange(subGraphIncoming[edge][1])

        console.log(expand_range_start)
        console.log(expand_range_end)

        match = 0

        // The edge in question is just a  number_[x] so we check what range that number sits in 

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

            // The edge in question is a range _[a...b] so we check what range that range sits in - note they are always strictly increasing therefore we only check 
            // start <= a && b <= end


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

    // we ensure that every incoming edge was mapped. 

    if(JSON.stringify(matched) != JSON.stringify(subGraphIncoming)){
        throw "Incoming expandable edges do not match!"
    }

    console.log(newGraph)

    // We now do the same for outgoing

    expandable_edges = []
    static_edges = []

    for(var edge in graphData[nodeSelection].outgoing){

        if(graphData[nodeSelection].outgoing[edge][1].split('...').length == 2){

            expandable_edges.push(graphData[nodeSelection].outgoing[edge])

        }else{

            static_edges.push(graphData[nodeSelection].outgoing[edge])

        }

    }


    // Build the outgoing edges

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

    // Resolve static edges

    to_remove = []

    for(var edge in static_edges){

        match = 0

        for(var out_edge in subGraphOutgoing){

            if(static_edges[edge][1] === subGraphOutgoing[out_edge][1] || static_edges[edge][1].split(']')[0] === subGraphOutgoing[out_edge][1].split('*')[0]){

                match += 1

                to_remove.push(subGraphOutgoing[out_edge])

                subGraph.graph[subGraphOutgoing[out_edge][0]].push([static_edges[edge][0],subGraphOutgoing[out_edge][1]])

            }

        }

        if(match < 1){
            throw static_edges[edge][1] + ' has no matching outgoing edge in subgraph!'
        }

        if(match > 1){
            alert(static_edges[edge][1] + ' has multiple matches to outgoing edges! It has been mapped ' + match.toString() + ' times!')
        }
         

    }

    subGraphOutgoing = subGraphOutgoing.filter(x => !to_remove.includes(x))
    
    // Get outgoing edge ranges
    
    var edge_ranges = {};
    var expand_range_start, expand_range_end;

    for(var edge in expandable_edges){

        [expand_range_start, expand_range_end] = getExapandableRange(expandable_edges[edge])

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


    // We then check if the incoming edge maps to any expandable edge range

    var matched = []

    for(var edge in subGraphOutgoing){


        [expand_range_start, expand_range_end] = getExapandableRange(subGraphOutgoing[edge])

        match = 0

        // The edge in question is just a number _[x] so we check what range that number sits in 

        if(expand_range_end == -1){

            for(var pack in edge_ranges){

                for(var edgebase in edge_ranges[pack]){

                    if(subGraphOutgoing[edge][1].split('_[')[0] === edgebase && edge_ranges[pack][edgebase][0] <=  expand_range_start && expand_range_start  <= edge_ranges[pack][edgebase][1]){

                        match += 1

                        subGraph.graph[subGraphOutgoing[edge][0]].push([pack,subGraphOutgoing[edge][1]])

                    }

                }
                
            }

        }else{

            if(expand_range_start == Infinity){
                throw subGraphOutgoing[edge][1] + ' has a variable base, please ensure edges have static bases.'

            }

            // The edge in question is a range _[a...b] so we check what range that range sits in - note they are always strictly increasing therefore we only check 
            // start <= a && b <= end


            for(var pack in edge_ranges){

                for(var edgebase in edge_ranges[pack]){

                    if(subGraphOutgoing[edge][1].split('_[')[0] === edgebase && edge_ranges[pack][edgebase][0] <=  expand_range_start && expand_range_end  <= edge_ranges[pack][edgebase][1]){

                        match += 1

                        subGraph.graph[subGraphOutgoing[edge][0]].push([pack,subGraphOutgoing[edge][1]])
                        

                    }

                }
                
                
            }


        }

        if(match < 1){
            console.log(subGraphOutgoing[edge])
            throw subGraphOutgoing[edge][1] + " is not in any expandable edge range!"
        }

        if(match > 1){
            alert(subGraphOutgoing[edge][1] + " is in multiple expandable edge ranges! this edge has been mapped " + match.toString() + " times.")
        }

        matched.push(subGraphOutgoing[edge])

    }

    // we ensure that every incoming edge was mapped. 

    if(JSON.stringify(matched) != JSON.stringify(subGraphOutgoing)){
        throw "Incoming expandable edges do not match!"
    }


    newGraph.graph = {...subGraph.graph , ...newGraph.graph}

    return newGraph

}

export function getChainsThatMention(expandable_chains, nodes_to_expand){

    for(var node in nodes_to_expand){

        if(nodes_to_expand[node].split("...").length != 2){

            throw nodes_to_expand[node] + " is not expandable!"

        } 
        
    }

    var chains = []

    for(var chain in expandable_chains){

        if(expandable_chains[chain].some(element => nodes_to_expand.includes(element))){

            chains.push(expandable_chains[chain])

        }

    }

    return chains 

}

function expandChain(graphData, graphData_with_oracles, chain, value){ 

    var newGraph = JSON.parse(JSON.stringify(graphData_with_oracles))
    
    var expandable;
    
    var base_packs;

    
    [base_packs, expandable] = _.partition(chain, element => element.split("...").length != 2)
        
    var to_expand = {}
    
    var base_name;
    
    var range_start;
    
    var range_end;
    
    var limiting = Infinity;
    
    var limiting_pack;
    
    // Index the expandable packages against their full name with their expand range and base name
    
    for(var pack in expandable){
        
        console.log(expandable[pack]);

        base_name = expandable[pack].split('_[')[0];
        
        [range_start, range_end] = getExapandableRange(expandable[pack]);
        
        if(range_start === Infinity){
            
            throw expandable[pack] + " has a variable base, please ensure edges have static bases."
            
        }
        
        if(range_end < value){
            limiting = range_end
            limiting_pack = expandable[pack]
        }
        
        to_expand[expandable[pack]] = {"base_name" : base_name, "range" : [range_start, range_end], "range_end_string": [expandable[pack].split('...')[1].split(']')[0]]}
        
    }

        
    if(limiting < value){
        
        alert("Warning! The chain you wish to expand is limited to expanding fully by " + limiting_pack)
        value = limiting
        
    }
    
    // Build the "constant" and "dynamic" edges to add
    // "Constant" edges are i:i 
    // "Dynamic" edges are base:base+i
    
    var in_edges_to_add = {}
    var dyn_edges_to_add = {}
    var out_edges_to_add = {}

    var to;
    var from;
    var edge_name; 
    var target_range;
    var target_range_end_string;

    var expandable_base_names = expandable.map(x => x.split('_[')[0])

    // Build all edges to add
    
    for(var pack in to_expand){
        
        // Build an index of edges coming into the chain
        for(var edge in graphData[pack].incoming){

            [from, edge_name] = graphData[pack].incoming[edge]
            
            if(base_packs.includes(from)){

                if(edge_name.split("...").length != 2){
                    throw "Base package " + from + " has a non-expandable edge to " + pack
                }

                [range_start, range_end] = getExapandableRange(edge_name)

                if(to_expand[pack].range[1] - to_expand[pack].range[0] !== range_end - range_start){
                    throw edge_name + " is not in range of " + pack 
                }

                if(!in_edges_to_add.hasOwnProperty(from)){

                    in_edges_to_add[from] = {}

                }
                    
                if(!in_edges_to_add[from].hasOwnProperty(pack)){
                    in_edges_to_add[from][pack] = []
                }

                in_edges_to_add[from][pack].push({"target_base_name" : pack.split("_[")[0], "edge_base_name" : edge_name.split("_[")[0], "edge_range" : [range_start,range_end]})                 
                
            }

        }

        // Build an index of the edges within the chain and leaving the chain
        for(var edge in graphData[pack].outgoing){

            [to, edge_name] = graphData[pack].outgoing[edge]

            if(expandable_base_names.includes(to.split("_[")[0])){

                if(to.split('...').length != 2){

                    target_range = [getNumber(to),-1]

                    for(var expandable_pack in to_expand){
                        if(to.split("_[")[0] === to_expand[expandable_pack]['base_name'] && to_expand[expandable_pack]['range'][1] > target_range[1]){
                            
                            target_range = [target_range[0],to_expand[expandable_pack]['range'][1]]
                            target_range_end_string = to_expand[expandable_pack]['range_end_string']

                        }
                    }

                    if(target_range[1] === -1){
                    
                        throw "Error 500! No matching expandable package for " + to  

                    }

                }else{
                    target_range = getExapandableRange(to)
                    target_range_end_string = to.split('...')[1].split(']')[0]
                }
            
                if(!dyn_edges_to_add.hasOwnProperty(pack)){

                    dyn_edges_to_add[pack] = {}

                }
                    
                if(!dyn_edges_to_add[pack].hasOwnProperty(to)){
                    dyn_edges_to_add[pack][to] = []
                }

                dyn_edges_to_add[pack][to].push({"target_base_name" : to.split("_[")[0], "target_range_end_string" : target_range_end_string, "target_range" : target_range, "edge_base_name" : edge_name.split("_[")[0], "edge_base_number" : getEncodableEdgeNumber(edge_name)})                 
                
            }else{

                if(!out_edges_to_add.hasOwnProperty(pack)){

                    out_edges_to_add[pack] = {}

                }
                    
                if(!out_edges_to_add[pack].hasOwnProperty(to)){
                    out_edges_to_add[pack][to] = []
                }

                out_edges_to_add[pack][to].push({"edge_base_name" : edge_name.split("_[")[0], "edge_base_number" : getEncodableEdgeNumber(edge_name)})

            }

        }

    }

    var new_package_name;        
    var target_base_name;
    var edge_base_name;
    var edge_base_number;
    var new_ghost_package_name;
    var range_end_string;

    for(var pack in to_expand){
                
        for(var i = 0; i < value; i++){

            [range_start, range_end] = to_expand[pack]['range']

            base_name = to_expand[pack]['base_name']

            // Create the new package

            new_package_name = base_name + '_[' + (range_start + i).toString() + ']'

            newGraph.graph[new_package_name] = []
        }

        // Delete old instances of the expandable packages and any edges they are mentioned in

        delete newGraph.graph[pack]

        for(var edge in graphData[pack].incoming){

            if(!expandable.includes(graphData[pack].incoming[edge][0])){

                if(graphData[pack].incoming[edge][0] === 'ORACLE'){
                    
                    newGraph.oracles = newGraph.oracles.filter(element => element[0] != pack)

                }else{

                    newGraph.graph[graphData[pack].incoming[edge][0]] = newGraph.graph[graphData[pack].incoming[edge][0]].filter(element => element[0] != pack)

                }
            }

        }

    }

    for(var pack in to_expand){
        
        [range_start, range_end] = to_expand[pack]['range']

        range_end_string = to_expand[pack]['range_end_string']
        
        base_name = to_expand[pack]['base_name']

        // Build the new packages and all edges going into and out of chain
        for(var i = 0; i < value; i++){

            for(var base_pack in in_edges_to_add){

                if(in_edges_to_add[base_pack].hasOwnProperty(pack)){
                    
                    for(var edge in in_edges_to_add[base_pack][pack]){

                        var {target_base_name,edge_base_name,edge_range} = in_edges_to_add[base_pack][pack][edge]

                        if(base_pack === "ORACLE"){
    
                            newGraph.oracles.push([target_base_name + '_[' + (range_start + i).toString() + ']',edge_base_name + '_[' + (edge_range[0] + i).toString() + ']'])
    
                        }else{

                            newGraph.graph[base_pack].push([target_base_name + '_[' + (range_start + i).toString() + ']',edge_base_name + '_[' + (edge_range[0] + i).toString() + ']'])

                        }

                        // Add ghost edges, this assumes ofc that in_edges of this type are one to one which is a valid assumption.
                        if(i === value - 1 && range_start + i + 1 < range_end){
                            if(base_pack === "ORACLE"){
    
                                newGraph.oracles.push([target_base_name + '_[' + (range_start + i + 1).toString() + '...' + range_end_string + ']',edge_base_name + '_[...]'])
        
                            }else{
    
                                newGraph.graph[base_pack].push([target_base_name + '_[' + (range_start + i + 1).toString() + '...' + range_end_string + ']',edge_base_name + '_[...]'])
    
                            }    
                        }

                    }
                }
            }

            new_package_name = base_name + '_[' + (range_start + i).toString() + ']'

            if(i === value - 1 && range_start + i + 1 < range_end){
                new_ghost_package_name = base_name + '_[' + (range_start + i + 1).toString() + '...' + range_end_string + ']'
            
                newGraph.graph[new_ghost_package_name] = []
            }

            // Add the dynamic edges
            if(dyn_edges_to_add.hasOwnProperty(pack)){
                for(var to_pack in dyn_edges_to_add[pack]){
                    // west sidee
                    for(var edge in dyn_edges_to_add[pack][to_pack]){
                        
                        ({target_base_name,target_range_end_string,target_range,edge_base_name,edge_base_number} = dyn_edges_to_add[pack][to_pack][edge])

                        newGraph.graph[new_package_name].push([target_base_name + '_[' + (target_range[0] + i).toString() + ']',edge_base_name + '_[' + (edge_base_number + i).toString() + ']'])

                        if(i === value - 1 && target_range[0] + i + 1 < target_range[1]){

                            if(newGraph.graph.hasOwnProperty(target_base_name + '_[' + (target_range[0] + i + 1).toString() + ']')){
                                newGraph.graph[new_ghost_package_name].push([target_base_name + '_[' + (target_range[0] + i + 1).toString() + ']', edge_base_name + '_[...]'])    
                            }else{
                                newGraph.graph[new_ghost_package_name].push([target_base_name + '_[' + (target_range[0] + i + 1).toString() + '...' + target_range_end_string + ']', edge_base_name + '_[...]'])
                            }

                        }

                    }

                }

            }

            // Add the outgoing edges
            if(out_edges_to_add.hasOwnProperty(pack)){
                for(var out_pack in out_edges_to_add[pack]){
                    for(var edge in out_edges_to_add[pack][out_pack]){

                        ({edge_base_name,edge_base_number} = out_edges_to_add[pack][out_pack][edge])

                        newGraph.graph[new_package_name].push([out_pack,edge_base_name + '_[' + (edge_base_number + i).toString() + ']'])

                        if(i === value - 1 && range_start + i + 1 < range_end){
                            newGraph.graph[new_ghost_package_name].push([out_pack, edge_base_name + '_[...]'])
                        }
                    }
                }
            }
        }
                
    }

    // The ranges for each edge and package is in each edge index so adding ghost edges should be easy 
    // @ i = value - 1 add package and edge for remaining range if needed ! can mark with something to make ghost edge invisible 

    console.log(newGraph)

    return newGraph

}

export function expand(graphData, graphData_with_oracles, chains, value = 3){

    var newGraph = JSON.parse(JSON.stringify(graphData_with_oracles))

    console.log(chains)

    for(var chain in chains){

        newGraph = expandChain(graphData, newGraph, chains[chain], value)
        
    }

    return newGraph

}