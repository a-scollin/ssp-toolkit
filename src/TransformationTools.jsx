
import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import Moveable from "react-moveable";
import 'react-reflex/styles.css'
import { black } from "ansi-colors";
import Slider from '@mui/material/Slider';

import {
    ReflexContainer,
    ReflexSplitter,
    ReflexElement
  } from 'react-reflex'
import { ThemeProvider } from "react-bootstrap";
import { getCheckboxUtilityClass } from "@mui/material";


export default class TransformationTools extends Component {
  constructor(props) {
    super(props);
    this.state = {selected_graphdata : null, selection : null, type : null, options : []};
    this.GraphRef = React.createRef()
    this.valdict = {}
    this.targetval = 0
   console.log("INIT")
  
  }

  componentDidUpdate(prevProps){

console.log("tramsupdate")
console.log(prevProps)
console.log(this.props)
console.log(this.state)

    if(this.props.selected_graphdata != null && this.props.transformationselection != prevProps.transformationselection && this.props.transformationselection != {}){
      
        this.setState({selected_graphdata : this.props.selected_graphdata, displayed : this.props.selected_graphdata, selection : this.props.transformationselection['selected'], type : this.props.transformationselection['type'], cell : this.props.transformationselection['cell']},() => {
            if (this.props.transformationselection != {}){
                this.setup()
            }else{
                this.setState({options : []})
            }
        });
    

    }
     
  }

decompose(event){
    console.time('decomp')
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = (event) => {
      // The file's text will be printed here
      
    try {
        var json_data = JSON.parse(event.target.result);
    } catch (e) {
        alert("Please enter a JSON file");
        return;
    }
    
        var subGraph = json_data;

        if(!subGraph.hasOwnProperty("oracles") || !subGraph.hasOwnProperty("graph")){        
            alert("Please ensure subgraph file is correct!")
            return
        }


        var in_edges = 0;
              
        var out_edges = 0;
        
        var match = false

        for(var edge in this.state.cell.edges){
        
          if(this.state.cell.edges[edge].target.value == this.state.cell.value){
        
             match = false

            for(var in_edge in subGraph.oracles){

                if(subGraph.oracles[in_edge][1] == this.state.cell.edges[edge].value || subGraph.oracles[in_edge][1].split("_{")[0] == this.state.cell.edges[edge].value.split("_{")[0]){
                    match = true
                    break
                }

            }

            if (!match){
                alert("Please ensure in_edges match") 
            }else{
                in_edges++;
            }
            
            
          }else{
        
            // match = false

            // for(var pack_out in subGraph.graph){

            //     for(var edge_out in subGraph.graph[pack_out]){

            //         if(subGraph.oracles[in_edge][1] == this.state.cell.edges[edge].value || subGraph.oracles[in_edge][1].split("_{")[0] == this.state.cell.edges[edge].value.split("_{")[0]){
            //             match = true
            //             break
            //         }

            //     }

              

            // }

            // if (!match){
            //     alert("Please ensure in_edges match") 
            // }else{
                out_edges++;
            // }
            

            
        
          }
        
        }
    

        var out = 0;
        for(var node in subGraph.graph){
            for(var edge in subGraph.graph[node]){
                if (subGraph.graph[node][edge][0] == ""){
                    out++;
                }
            }
        }

        if (out != out_edges){
            alert("Please ensure out_edges match") 
            return
        }

        var newGraph = JSON.parse(JSON.stringify(this.state.selected_graphdata));

        var isOraclePack = false;

        for( var oracle in newGraph.oracles){

            if (newGraph.oracles[oracle][0] == this.state.cell.value){
                isOraclePack = true
            }
        
        }


        var edges_for_removal = []

        // Resolve ingoing edges, Realising now that this is actually wrong if theres a decomposition to be done on a package that has an oracle

        if (isOraclePack){
            console.log("ISORACLE")
            for(var edge in newGraph.oracles){
                if (newGraph.oracles[edge][0] == this.state.cell.value) {
                    for (var subedge in subGraph.oracles) {
                        if (subGraph.oracles[subedge][1] == newGraph.oracles[edge][1]){
                            newGraph.oracles[edge][0] = subGraph.oracles[subedge][0]

                        }
                    }
                }
            }
        }else{
            console.log("ISntORACLE")

        for(var pack in newGraph.graph){
            
            if (pack != this.state.cell.value) { 

                for (var edge in newGraph.graph[pack]){

                    if(newGraph.graph[pack][edge][0] == this.state.cell.value){

                        for (var oracle in subGraph.oracles){
                            if(subGraph.oracles[oracle][1].split("_{")[0] == newGraph.graph[pack][edge][1].split("_{")[0]){
                                if(subGraph.oracles[oracle][1] == newGraph.graph[pack][edge][1]){
                                    newGraph.graph[pack][edge][0] = subGraph.oracles[oracle][0]        
                                }else{
                                    if (subGraph.oracles[oracle][1].split("_{")[0] == newGraph.graph[pack][edge][1].split("_{")[0]){
                                        edges_for_removal.push(newGraph.graph[pack][edge])
                                    }
                                    newGraph.graph[pack].push([subGraph.oracles[oracle][0],subGraph.oracles[oracle][1]])
                                }
                                
                            }
                    }
        
            }

        }
    }
}
        }



            // Resolve outgoing edges
            for (var pack in subGraph.graph){
                for (var sub_edge in subGraph.graph[pack]){
                    for(var edge in newGraph.graph[this.state.cell.value]){
                    if (subGraph.graph[pack][sub_edge][1] == newGraph.graph[this.state.cell.value][edge][1] || subGraph.graph[pack][sub_edge][1].split("*")[0] == newGraph.graph[this.state.cell.value][edge][1].split("}")[0]){
                        subGraph.graph[pack][sub_edge][0] = newGraph.graph[this.state.cell.value][edge][0]
                    }
                }
                }

            }

        // for(var pack in newGraph.graph){
        //     if newGraph.graph[]
        // }

        delete newGraph.graph[this.state.cell.value]; 

        for(var subgraph in subGraph.graph){
            newGraph.graph[subgraph] = subGraph.graph[subgraph]
        }

        console.log("edges_for_removal")
        console.log(edges_for_removal)

        for(var pack in newGraph.graph){
            newGraph.graph[pack] = newGraph.graph[pack].filter(item => !edges_for_removal.includes(item))
        }

        this.setState({displayed : newGraph}, ()=>{
        this.updateGraph(false)
    });

}
    
    reader.readAsText(file);

    console.timeEnd('decomp')

}
  
findchain(graph, node){

   var longestchain = []

    if (graph[node].length == 0){
        return [node]
    }

    for(var edge in graph[node]){

        if(graph[node][edge][0].split('...').length == 2){
                
                var newchain = this.findchain(graph,graph[node][edge][0])

                if (newchain.length > longestchain.length) {
                    longestchain = newchain
                }
        
            }
    }

    return [node, ...longestchain]
    
            
    }




  setup(){

    var option_pairs = []

    var options = []

    if (this.state.type == "expand"){

        for (var node in this.state.selected_graphdata.graph){
         for(var edge in this.state.selected_graphdata.graph[node]){  
            if (this.state.selected_graphdata.graph[node][edge][0].split("...").length == 2 && this.state.selected_graphdata.graph[node][edge][1].split("#").length != 2){
                
                option_pairs.push(this.findchain(this.state.selected_graphdata.graph, node))

            }
        }
        }

        console.log(option_pairs)

        var remove_pair = []

        for (var pair in option_pairs){
            for (var otherpair in option_pairs){
                if (option_pairs[otherpair] != option_pairs[pair] && option_pairs[otherpair].length > option_pairs[pair].length && option_pairs[pair].every(element => option_pairs[otherpair].includes(element))){

                    remove_pair.push(option_pairs[pair])

                }
            }

        } 
      
        option_pairs = option_pairs.filter(item => !remove_pair.includes(item))

        option_pairs = Array.from(new Set(option_pairs.map(JSON.stringify)), JSON.parse)

        console.log("option_pairs")
        console.log(option_pairs)


        for(var pair in option_pairs){
            options.push(<ReflexElement flex={0.8} key={option_pairs[pair]}>{option_pairs[pair]}
                <div key={option_pairs[pair]} reference={option_pairs[pair]} className="boxpad">
                <Slider style={{opacity : 1}}
  aria-label="Temperature"
  defaultValue={30}
  valueLabelDisplay="auto"
  step={1}
  marks
  min={1}
  max={10}
  name={option_pairs[pair]}
  onChange={ (e, val) => this.expand(e.target)}  />
</div>
                </ReflexElement>)
                options.push(<ReflexSplitter/>)
        }

        options.pop()

        console.log("HERE")
        console.log(options)


        this.setState({options : options});
        
    }else if (this.state.type == "decompose"){
        options.push(<ReflexElement flex={0.8} key={node}>{node}
                  <form>
  <label>
    Subgraph input:
    <input type="file" onChange={this.decompose.bind(this)} name="graph_file" />
  </label>
  <input type="submit" value="Reset" />
</form>
            </ReflexElement>)

            this.setState({options : options})
    }

}

expand(target){
  
var newGraph = this.state.selected_graphdata;

if(this.targetval == target.value){
    return 
}

this.targetval = target.value

var chain = target.name

var expandable = target.name.slice(1)

var expandable_names = expandable.map(x => x.split('_{')[0])

var to_expand = {}

console.log("expandable_names")
console.log(expandable_names)
var prev_pack = chain[0]

var const_edges_to_add = {}

var dyn_edges_to_add = {}

var newGraph = JSON.parse(JSON.stringify(this.state.selected_graphdata))

for(var pack in expandable){

    if(expandable[pack].split('...').length != 2){
        alert("WRONG!")
        return
    }

    var name = expandable[pack].split('_{')[0]

    var base = expandable[pack].split('...')[0]

    base = base.charAt(base.length - 1)

    to_expand[expandable[pack]] = {"name" : name, "base" : base}

    for(var edge in this.state.selected_graphdata.graph[prev_pack]){

        
        if(expandable.includes(this.state.selected_graphdata.graph[prev_pack][edge][0]) && this.state.selected_graphdata.graph[prev_pack][edge][1].split("...").length == 2){
        
            if (const_edges_to_add.hasOwnProperty(prev_pack)){
                
                var edge_base = this.state.selected_graphdata.graph[prev_pack][edge][1].split("...")[0]
                
                edge_base = edge_base.charAt(edge_base.length - 1)

                const_edges_to_add[prev_pack].push({'name_to' : this.state.selected_graphdata.graph[prev_pack][edge][0], 'base' : edge_base, 'edge_name_base' : this.state.selected_graphdata.graph[prev_pack][edge][1].split("_{")[0]})
            
            }else{
                
                var edge_base = this.state.selected_graphdata.graph[prev_pack][edge][1].split("...")[0]

                edge_base = edge_base.charAt(edge_base.length - 1)

                const_edges_to_add[prev_pack] = [{'name_to' : this.state.selected_graphdata.graph[prev_pack][edge][0], 'base' : edge_base, 'edge_name_base' : this.state.selected_graphdata.graph[prev_pack][edge][1].split("_{")[0]}]
            }
    
        }

        if(prev_pack != chain[0]){

        if(expandable_names.includes(this.state.selected_graphdata.graph[prev_pack][edge][0].split("_{")[0]) && this.state.selected_graphdata.graph[prev_pack][edge][1].split("*").length == 2){
            
            var edge_base = this.state.selected_graphdata.graph[prev_pack][edge][1].split("*")[0]

            edge_base = edge_base.charAt(edge_base.length - 1)

            var name_to = this.state.selected_graphdata.graph[prev_pack][edge][0]

            var re = new RegExp(/^\d+/);

            if(this.state.selected_graphdata.graph[prev_pack][edge][0].split("...").length != 2){
                
                for(var match in expandable){
                    if(expandable[match].split("_{")[0] == this.state.selected_graphdata.graph[prev_pack][edge][0].split("_{")[0]){
                        name_to = expandable[match]

                        break
                    }
                }

            }
                
                if (dyn_edges_to_add.hasOwnProperty(prev_pack)){
                    if(dyn_edges_to_add[prev_pack].hasOwnProperty(name_to)){
                        console.log("HUFFLEPUFF")
                        console.log(re.exec(this.state.selected_graphdata.graph[prev_pack][edge][0].split("_{")[1])[0])
                        dyn_edges_to_add[prev_pack][name_to].push({'pack_base' : re.exec(this.state.selected_graphdata.graph[prev_pack][edge][0].split("_{")[1])[0], 'base' : edge_base, 'edge_name_base' : this.state.selected_graphdata.graph[prev_pack][edge][1].split("_{")[0]})
                    }else{
                        dyn_edges_to_add[prev_pack][name_to] = [{'pack_base' : re.exec(this.state.selected_graphdata.graph[prev_pack][edge][0].split("_{")[1])[0], 'base' : edge_base, 'edge_name_base' : this.state.selected_graphdata.graph[prev_pack][edge][1].split("_{")[0]}]
                    }
                }else{
                    dyn_edges_to_add[prev_pack] = {}
                    dyn_edges_to_add[prev_pack][name_to] = [{'pack_base' : re.exec(this.state.selected_graphdata.graph[prev_pack][edge][0].split("_{")[1])[0],'base' : edge_base, 'edge_name_base' : this.state.selected_graphdata.graph[prev_pack][edge][1].split("_{")[0]}]
                }
        
            }

        }else{

            // TODO RESOLVE CONSTATNT EDGES FOR ORACLES HERE 

           
        }

    }

    prev_pack = expandable[pack]

}

    console.log(dyn_edges_to_add)
    console.log(const_edges_to_add)
    console.log("KEEMAN")

    for(var pack in to_expand){
        
        for(var i = 0; i < target.value; i++){

            var num = parseInt(to_expand[pack]['base'])

            var name_base = to_expand[pack]['name']

            var new_package = name_base+'_{' +(num+i).toString()+'}'

            newGraph.graph[new_package] = []

        }
        
    }

        
    for(var pack in const_edges_to_add){

        for(var edge in const_edges_to_add[pack]){

            var num = parseInt(to_expand[const_edges_to_add[pack][edge]['name_to']]['base'])

            var name_base = to_expand[const_edges_to_add[pack][edge]['name_to']]['name']

            var edge_num = parseInt(const_edges_to_add[pack][edge]['base'])
                
            var edge_name_base = const_edges_to_add[pack][edge]['edge_name_base']

            for(var i = 0; i < target.value; i++){

                var new_package = name_base+'_{' +(num+i).toString()+'}'

                var new_edge = edge_name_base+'_{' + (edge_num+i).toString()+'}'

                newGraph.graph[pack].push([new_package,new_edge])
                
            }

        }

    }

    console.log("JUBILIYJEAKF")
    console.log(dyn_edges_to_add)

    for(var pack in dyn_edges_to_add){

        for(var linking in dyn_edges_to_add[pack]){

            for(var edge in dyn_edges_to_add[pack][linking]){

            var num = parseInt(dyn_edges_to_add[pack][linking][edge]['pack_base'])

            var name_base = to_expand[linking]['name']

            var edge_num = parseInt(dyn_edges_to_add[pack][linking][edge]['base'])
                
            var edge_name_base = dyn_edges_to_add[pack][linking][edge]['edge_name_base']

            var pack_base = to_expand[pack]['name']
            
            var pack_num = parseInt(to_expand[pack]['base'])

            for(var i = 0; i < target.value; i++){

                var new_linking_package = name_base+'_{' +(num+i).toString()+'}'

                var new_edge = edge_name_base+'_{' + (edge_num+i).toString()+'}'

                var new_pack = pack_base+'_{' + (pack_num+i).toString()+'}'

                console.log(new_pack)

                newGraph.graph[new_pack].push([new_linking_package,new_edge])
                
            }

        }

    }

}

var rm = []

for(var pack in expandable){

    for(var edge in newGraph.graph[chain[0]]){

        if(newGraph.graph[chain[0]][edge][0] == expandable[pack]){
            rm.push(newGraph.graph[chain[0]][edge])
        }

    }

    delete newGraph.graph[expandable[pack]];

}

newGraph.graph[chain[0]] = newGraph.graph[chain[0]].filter(x => !rm.includes(x))

    this.setState({displayed : newGraph}, () => {
    this.updateGraph(false)
    })

    

// Expansion almost fully working YEEEHAWWWW! 

// TODO :
//  Add oracle suppourt for constant edges (scripted edges dont make sense for oracles)
//  Think about edge cases with cycles and write explicit rules
//  Add support for the # edges.. should be easy just add any edges at end to the package name, also add the ... 
//  ... dth package at end when deleting.. 







//     if(!this.valdict.hasOwnProperty(target.name)){
//         this.valdict[target.name] = target.value
//     }
    
//     if(this.valdict[target.name] != target.value){
//         this.valdict[target.name] = target.value

//         var newGraph = this.state.selected_graphdata;

//         for(var node in newGraph.graph){
//             if(node == target.name){
//                 console.log(node)
//                 break 
//             }
//         }

//     this.setState({selected_graphdata : newGraph}, ()=>{
//         this.udpateGraph(false)
//     })
    
// }
    
}

  updateGraph(fin){
      if(this.state.selection != null){
        this.props.update(this.state.displayed, fin);
        if (fin){
        this.setState({selected_graphdata : null, displayed : null, selection : null, type : null, options : []});
        this.valdict = {};
    }
}
      
  }

  render() {

    var save_tool =  this.state.selection != null ? <button onClick={() => this.updateGraph(true)}>Save</button> : <></>
  
      return (
        <ReflexContainer orientation="vertical"> 
        <ReflexElement flex={0.8}>
        <ReflexContainer orientation="vertical">
            {this.state.options}
        </ReflexContainer>
            </ReflexElement>
            <ReflexSplitter/>
            <ReflexElement className="panel panel--empty">{save_tool}</ReflexElement>
          </ReflexContainer>
    
    
        

      );
   
}

}