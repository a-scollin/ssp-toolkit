export function buildIncoming(graphdata){

    var new_graphdata = JSON.parse(JSON.stringify(graphdata))

    for(var node in new_graphdata.graph){

        if(Array.isArray(new_graphdata.graph[node])){

            var temp = new_graphdata.graph[node]  
            new_graphdata.graph[node] = {
                'outgoing' : temp,
                'incoming' : []
            }

        }
    }
    
    for(var oracle in graphdata.oracles){

        new_graphdata.graph[graphdata.oracles[oracle][0]].incoming.push(["",graphdata.oracles[oracle][1]])

    }

    for(var pack in graphdata.graph){

        for(var edge in graphdata.graph[pack]){

            var dest = graphdata.graph[pack][edge][0]
            var edgename = graphdata.graph[pack][edge][1]

            new_graphdata.graph[dest].incoming.push([pack,edgename])


        }
    }


    return new_graphdata
}