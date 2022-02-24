import _ from 'lodash'


export function buildIncoming(graphdata){

    var new_graph = {}

    for(var node in graphdata.graph){
        if(node === "Adv_pkg" || node === "terminal_pkg") {
            continue
        }
        if(Array.isArray(graphdata.graph[node])){

            new_graph[node] = {
                'outgoing' : graphdata.graph[node]  ,
                'incoming' : []
            }

        }
    }

    
    for(var oracle in graphdata.oracles){

        if(graphdata.oracles[oracle][0] === ""){
            throw "Can't have oracle with no destination! : " + graphdata.oracles[oracle]
        }

        new_graph[graphdata.oracles[oracle][0]].incoming.push(["ORACLE",graphdata.oracles[oracle][1]])

    }

    for(var pack in graphdata.graph){

        for(var edge in graphdata.graph[pack]){

            var dest = graphdata.graph[pack][edge][0]
            var edgename = graphdata.graph[pack][edge][1]

            if(dest !== ""){
                new_graph[dest].incoming.push([pack,edgename])
            }

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
    

    expand_range = edge.split('_[')

    if(expand_range.length != 2){
       throw "Please ensure packages are numbered! : " + edge 
    }

    expand_range = expand_range[1]
    
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

function getAllIncomingSubgraphEdges(graphData){

    var dict_in = {}

    var edges_in = []

    for(var pack in graphData){
        
        if(!dict_in.hasOwnProperty(pack)){
            dict_in[pack] = []
        }
        for(var edge in graphData[pack].incoming){

            if(graphData[pack].incoming[edge][0] === "ORACLE"){
       
                dict_in[pack].push(graphData[pack].incoming[edge][1])
                edges_in.push(graphData[pack].incoming[edge][1])

            }

        }

    }

    return [dict_in, edges_in]

}

function getAllOutgoingSubgraphEdges(graphData){

    var dict_out = {}

    var edges_out = []

    for(var pack in graphData){

        if(!dict_out.hasOwnProperty(pack)){
            dict_out[pack] = []
        }

        for(var edge in graphData[pack].outgoing){

            if(graphData[pack].outgoing[edge][0] === ""){      
                
                dict_out[pack].push(graphData[pack].outgoing[edge][1])
                edges_out.push(graphData[pack].outgoing[edge][1])

            }

        }

    }

    return [dict_out, edges_out]

}

function getAndCheckExternalEdges(lhs,rhs){
    
    var [lhs_in, lhs_edges_in] = getAllIncomingSubgraphEdges(lhs)
    var [rhs_in, rhs_edges_in] = getAllIncomingSubgraphEdges(rhs) 
    
    lhs_edges_in.sort()
    rhs_edges_in.sort()

    if(!_.isEqual(lhs_edges_in, rhs_edges_in)){
        throw "The left hand side oracles:\n" + lhs_in.toString() + "\ndo not match the right hand side oracles:\n" + rhs_in.toString()
    }
    
    var [lhs_out, lhs_edges_out] = getAllOutgoingSubgraphEdges(lhs)
    var [rhs_out, rhs_edges_out] = getAllOutgoingSubgraphEdges(rhs) 

    lhs_edges_out.sort()
    rhs_edges_out.sort()
    
    if(!_.isEqual(lhs_edges_out, rhs_edges_out)){
        throw "The left hand side outgoing edges:\n" + lhs_out.toString() + "\ndo not match the right hand side outgoing edges:\n" + rhs_out.toString()
    }
    
    return [lhs_in,lhs_out,rhs_in,rhs_out]
    
}

function checkComplete(graphData, node, lhs_packs, lhs, rhs, lhs_in, lhs_out, rhs_in_maps_to, rhs_out_maps_from, passedVisited = [], passedToAdd = [], passedToRemove = []){
    console.log("INSIDE")
    console.log(node)

    var visited = [node, ...passedVisited]

    var toRemove = [[node], ...passedToRemove]
    
    var toAdd = [...passedToAdd]

    var complete = false;

    var nodeSplit = node.split("_[")

    var packname, edgename;

    for(var edge in graphData[node].incoming){

        [packname, edgename] = graphData[node].incoming[edge]

        if(lhs_in[nodeSplit[0]].includes(edgename.split("_[")[0])){

            toRemove.push([packname, node, edgename])

            if(nodeSplit.length != 2){
                throw "Please ensure that packages are named using _[x]"
            }
    
            toAdd.push([node, packname, rhs_in_maps_to[edgename.split("_[")[0]] + '_[' + nodeSplit[1], edgename])

        }else if(lhs_packs.includes(packname.split("_[")[0]) && !visited.includes(packname)){


            if(!lhs[packname.split("_[")[0]].outgoing.some(element => element[0] === nodeSplit[0] && element[1] === edgename.split("_[")[0])){
                return [false, visited, [], []]
            }

            [complete, visited, toRemove, toAdd] = checkComplete(graphData, packname, lhs_packs, lhs, rhs, lhs_in, lhs_out, rhs_in_maps_to, rhs_out_maps_from, visited, toAdd, toRemove)

            if(!complete){
                return [false, visited, [], []]
            }

        }else{
            if(!visited.includes(packname)){
                return [false, visited, [], []]

            }
        }

    }

    for(var edge in graphData[node].outgoing){

        [packname, edgename] = graphData[node].outgoing[edge]

        if(lhs_out[nodeSplit[0]].includes(edgename.split("_[")[0])){
      

            // Redundant as we delete the node anyway.
            // toRemove.push([node, packname, edgename])

            if(nodeSplit.length != 2){
                throw "Please ensure that packages are named using _[x]"
            }

            toAdd.push([node, rhs_out_maps_from[edgename.split("_[")[0]] + '_[' + nodeSplit[1], packname , edgename])

        }else if(lhs_packs.includes(packname.split("_[")[0]) && !visited.includes(packname)){


            if(!lhs[nodeSplit[0]].outgoing.some(element => element[0] === packname.split("_[")[0] && element[1] === edgename.split("_[")[0])){
                return [false, visited, [], []]
            }

            [complete, visited, toRemove, toAdd] = checkComplete(graphData, packname, lhs_packs, lhs, rhs, lhs_in, lhs_out, rhs_in_maps_to, rhs_out_maps_from, visited, toAdd, toRemove)

            if(!complete){
                return [false, visited, [], []]
            }

        }else{ 
            if(!visited.includes(packname)){
                return [false, visited, [], []]
            }
        }

    }

    return [true, visited, toRemove, toAdd]
    
}

function invertGraphData(obj){

    var ret = {};
    var alerted = {}
  for(var key in obj){
    for(var elm in obj[key]){
        if(ret.hasOwnProperty(obj[key][elm])){
            if(!alerted.hasOwnProperty(obj[key][elm])){
                alerted[obj[key][elm]] = true
                alert(obj[key][elm] + " appears multiple times and will be mapped automatically!")
            }
        }

        ret[obj[key][elm]] = key;
    }
  }
  return ret;

}

export function substitute(graphData, graphData_with_oracles, lhs, rhs, partialMatches = false, include = []) {
    
    console.log(graphData)
    console.log(graphData_with_oracles)
    console.log(lhs)
    console.log(rhs)
    console.log(partialMatches)
    console.log(include)

    var visited = []

    var newGraphData = JSON.parse(JSON.stringify({graph : graphData_with_oracles.graph, oracles : graphData_with_oracles.oracles}))


    var [lhs_in,lhs_out,rhs_in,rhs_out] = getAndCheckExternalEdges(lhs, rhs)

    var rhs_in_maps_to = invertGraphData(rhs_in);

    var rhs_out_maps_from = invertGraphData(rhs_out);

    var lhs_in_maps_to = invertGraphData(lhs_in)
    
    var lhs_out_maps_from = invertGraphData(lhs_out)

    const lhs_packs = Object.keys(lhs)

    console.log(lhs)
    console.log(rhs)

    var complete, moreVisited, toRemove, toAdd

    var packagesToRemove, edgesToRemove;

    var newPackages;

    var counter_dict = {}

    var range;

    var increment;

    for(var packbase in rhs){

        if(!counter_dict.hasOwnProperty(packbase)){
            counter_dict[packbase] = 1
        }

        for(var pack in graphData){

            if(pack === "Adv_pkg" || pack === "terminal_pkg") {
                continue
            }

            range = getExapandableRange(pack)[0]

            if(counter_dict[packbase] < range[0] && packbase === pack.split("_[")[0]){

                if(range[0] === Infinity || range[1] === Infinity){
                    throw "Equivilance has a package with a variable base elsewhere in graph."
                }

                counter_dict[packbase] = range[0]

            }

        }

    }

    for(var node in graphData){

        if(include.length == 0 || include.includes(node)){
            
            if(lhs_packs.includes(node.split("_[")[0]) && !visited.includes(node)){

                [complete, moreVisited, toRemove, toAdd] = checkComplete(graphData, node, lhs_packs, lhs, rhs, lhs_in, lhs_out, rhs_in_maps_to, rhs_out_maps_from)
            
                visited = [...visited, ...moreVisited]

                if(complete){

                    [packagesToRemove, edgesToRemove] = _.partition(toRemove, element => element.length === 1)
                    

                    // Add another piece of input data, if all LHS packages are captured in to remove, then is full match
                    //  else can be a partial match! will need to omit some packages for rhs with > 2 pakcages tho
                    
                    
                    if(!partialMatches){

                        console.log(packagesToRemove)
                        console.log(lhs_packs)

                        if(!lhs_packs.every(element => packagesToRemove.map((x) => {return x[0].split("_[")[0]}).includes(element))){
                            console.log("fail1")
                            continue
                        }

                        if(!Object.keys(lhs_in_maps_to).every(edgeNameToMatch => toAdd.some(element => element[0].split("_[")[0] === lhs_in_maps_to[edgeNameToMatch] && element[3].split("_[")[0] === edgeNameToMatch))){
                            console.log("fail2")
                            continue
                        }

                        if(!Object.keys(lhs_out_maps_from).every(edgeNameToMatch => toAdd.some(element => element[0].split("_[")[0] === lhs_out_maps_from[edgeNameToMatch] && element[3].split("_[")[0] === edgeNameToMatch))){
                            console.log("fail3")
                            continue
                        }
                        
                        console.log("Found full match here!")
                        console.log(toRemove)
                        console.log(toAdd)

                    }

                    for(var edge in edgesToRemove){

                        if(edgesToRemove[edge][0] === "ORACLE"){
                            newGraphData.oracles = newGraphData.oracles.filter(element => element[0] !== edgesToRemove[edge][1] && element[1] !== edgesToRemove[edge][2])
                        }else{
                            newGraphData.graph[edgesToRemove[edge][0]] = newGraphData.graph[edgesToRemove[edge][0]].filter(element => element[0] !== edgesToRemove[edge][1] && element[1] !== edgesToRemove[edge][2])
                        }

                    }

                    packagesToRemove.forEach(element => delete newGraphData.graph[element])

                    newPackages = []

                    for(var edge in toAdd){

                        if(!newGraphData.graph.hasOwnProperty(toAdd[edge][1]) && toAdd[edge][1] !== "ORACLE"){

                            newGraphData.graph[toAdd[edge][1]] = []

                            newPackages.push(toAdd[edge][1])

                        }

                        if(!newGraphData.graph.hasOwnProperty(toAdd[edge][2])){

                            newGraphData.graph[toAdd[edge][2]] = []

                            newPackages.push(toAdd[edge][2])

                        }

                        if(toAdd[edge][1] === "ORACLE"){
                            
                            newGraphData.oracles.push([toAdd[edge][2],toAdd[edge][3]])
    
                        }else{
         
                            newGraphData.graph[toAdd[edge][1]].push([toAdd[edge][2],toAdd[edge][3]])
     
                        }

                    }

                    console.log(newGraphData);

                    [newGraphData, increment] = resolveInnerEdges(newGraphData, newPackages, rhs, rhs_in, rhs_out, counter_dict)

                    console.log(newGraphData);

                    for(var pack in increment){

                        counter_dict[pack]++;

                    }

                }else{
                    console.log("FAIL")
                }

            }

        }

    }

    console.log(newGraphData)
    return newGraphData


}

export function buildNonIndexedIncoming(graphData){

    var newpacks = []

    var newGraph = {"oracles" : [], "graph" : {}}

    var packbase;

    var neworacles = []

    for(var oracle in graphData.oracles){
        
        neworacles.push([graphData.oracles[oracle][0].split("_[")[0],graphData.oracles[oracle][1]])

    }

    newGraph.oracles = neworacles

    for(var pack in graphData.graph){
        
        packbase = pack.split("_[")[0]
        
        if(newGraph.graph.hasOwnProperty(packbase)){
            throw "Multiple similarly named packages with different index! : " + pack
        }
        
        newGraph.graph[packbase] = []

        for(var edge in graphData.graph[pack]){

            newGraph.graph[packbase].push([graphData.graph[pack][edge][0].split("_[")[0],graphData.graph[pack][edge][1]])

        }
    
    }

    console.log(newGraph)

    return buildIncoming(newGraph)

}

function resolveInnerEdges(newGraphData, newPackages,rhs, rhs_in, rhs_out, counter_dict){

    var increment = []

    var packageName; 

    var newGraph = JSON.parse(JSON.stringify(newGraphData))
    
    for(var packbase in rhs){

        if(newPackages.some(element => element.split("_[")[0] === packbase)){
            // Is an edge package
            for(var pack in newPackages){
                if(newPackages[pack].split("_[")[0] === packbase){
                    packageName = newPackages[pack]
                }
            }
            
            // Assert that it is an edge package
            if(rhs_in[packbase].length  != 0 || rhs_out[packbase].length != 0){
                for(var edge in rhs[packbase].outgoing){

                    if(rhs[packbase].outgoing[edge][0] === ""){
                        continue
                    }

                    console.log(rhs[packbase].outgoing[edge])
                    
                    console.log(rhs_out)
                    console.log(rhs_in)

                    if(newPackages.some(element => element.split("_[")[0] === rhs[packbase].outgoing[edge][0])){
                        //Is linking to an edge package
                        
                        
                        for(var pack in newPackages){
                            if(newPackages[pack].split("_[")[0] === rhs[packbase].outgoing[edge][0]){
                                console.log("ADDIT ?????")
                                newGraph.graph[packageName].push([newPackages[pack],rhs[packbase].outgoing[edge][1]])
                            }
                        }
    
                    }else if(rhs_in[rhs[packbase].outgoing[edge][0]].length  != 0 || rhs_out[rhs[packbase].outgoing[edge][0]].length != 0){
                        // this should be an outgoing or incoming edge but isn't in new packages so is skipped
                        console.log("skipped")
                        continue
                        
                    } else {
    
                        newGraph.graph[packageName].push([rhs[packbase].outgoing[edge][0] + "_[" + counter_dict[rhs[packbase].outgoing[edge][0]].toString() + "]", rhs[packbase].outgoing[edge][1]])
    
                    }
    
                }

            
            }else{
                throw "Error 500!"
            }

        }else if(rhs_in[packbase].length  != 0 || rhs_out[packbase].length != 0){
            // this should be an outgoing or incoming edge but isn't in new packages so is skipped
            continue
        
        }else{
                // Looking at an element inside the subgraph

            packageName = packbase + "_[" + counter_dict[packbase].toString() + "]"

            increment.push(packbase)

            if(newGraph.graph.hasOwnProperty(packageName)){
                throw "500! Package already exists!"
            }

            newGraph.graph[packageName] = []

            for(var edge in rhs[packbase].outgoing){

                console.log(rhs[packbase].outgoing[edge])
                
                if(newPackages.some(element => element.split("_[")[0] === rhs[packbase].outgoing[edge][0])){
                    //Is linking to an edge package
                    for(var pack in newPackages){
                        if(newPackages[pack].split("_[")[0] === rhs[packbase].outgoing[edge][0]){
                            newGraph.graph[packageName].push([newPackages[pack],rhs[packbase].outgoing[edge][1]])
                        }
                    }

                }else if(rhs_in[rhs[packbase].outgoing[edge][0]].length  != 0 || rhs_out[rhs[packbase].outgoing[edge][0]].length != 0){
                    // this should be an outgoing or incoming edge but isn't in new packages so is skipped
                    continue
                    
                } else {

                    newGraph.graph[packageName].push([rhs[packbase].outgoing[edge][0] + "_[" + counter_dict[rhs[packbase].outgoing[edge][0]].toString() + "]", rhs[packbase].outgoing[edge][1]])

                }

            }
        }
        
    }

    return [newGraph, increment]

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

function expandChain(graphData, graphData_with_oracles, chain, value, ghost){ 

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
                        if(i === value - 1 && range_start + i + 1 < range_end && ghost){
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

            if(i === value - 1 && range_start + i + 1 < range_end && ghost){
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

                        if(i === value - 1 && target_range[0] + i + 1 < target_range[1] && ghost){

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

                        if(i === value - 1 && range_start + i + 1 < range_end && ghost){
                            newGraph.graph[new_ghost_package_name].push([out_pack, edge_base_name + '_[...]'])
                        }
                    }
                }
            }
        }
                
    }

    // The ranges for each edge and package is in each edge index so adding ghost edges should be easy 
    // @ i = value - 1 add package and edge for remaining range if needed ! can mark with something to make ghost edge invisible 

    return newGraph

}

export function expand(graphData, graphData_with_oracles, chains, value = 3, ghost = true){

    var newGraph = JSON.parse(JSON.stringify(graphData_with_oracles))

    console.log(chains)

    for(var chain in chains){

        newGraph = expandChain(graphData, newGraph, chains[chain], value, ghost)
        
    }

    return newGraph

}