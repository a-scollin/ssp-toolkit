
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
import { ListGroup, ThemeProvider } from "react-bootstrap";
import { getCheckboxUtilityClass, getTableHeadUtilityClass, toggleButtonGroupClasses } from "@mui/material";
import { useThemeWithoutDefault } from "@mui/system";
import CodeEditor from "./uiComponents/CodeEditor.jsx";
import { inflateGetHeader } from "pako/lib/zlib/inflate.js";
import { toJS } from "draft-js/lib/DefaultDraftBlockRenderMap";

import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

import FormLabel from '@mui/material/FormLabel';

import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';

import CustomIconButton from "./uiComponents/CustomIconButton.jsx";
import Stack from '@mui/material/Stack';


import Select from 'react-select'
import { V } from "mathjax-full/js/output/common/FontData";
import { RANGES } from "mathjax-full/js/core/MmlTree/OperatorDictionary";
import { resolveInput } from "./helpers/import_helper.js";


import { CustomDecomposePopup } from "./uiComponents/CustomPopup.jsx";

import { buildIncoming, decompose } from './helpers/transformation_helper.js'

export default class TransformationTools extends Component {
  constructor(props) {
    super(props);
    this.state = {selected_graphdata : null, input_data : null, selected_equiv : "", ommited_equivs : [], selection : null, type : null, options : [], equivs : [], equiv_lhs : null, equiv_rhs : null};
    this.GraphRef = React.createRef()
    this.valdict = {}
    this.packSelection = null
    this.targetval = 0
    this.input_data = null 
   console.log("INIT")
  
  }


//   This is dumb ! 
  componentDidUpdate(prevProps){

    if(this.props.type !== prevProps.type || this.props.node !== prevProps.node){
      
        this.setState({selected_graphdata : this.props.base, type : this.props.type, equivs : this.props.equivs, selected_node : this.props.node},() => {
            if (this.props.type != null){
                this.setup()
                return
            }else{
                this.setState({options : []})
                return
            }
        });
    }

    if(this.state.equivs.length != this.props.equivs.length){

        this.setState({equivs : this.props.equivs}, () => {
            if (this.props.type != null){
                this.setup()
            }else{
                this.setState({options : []})
            }
            
        })
       
    }
     
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

    this.incomingGraph = buildIncoming(this.state.selected_graphdata)
    var options = []

  if (this.state.type == "equiv"){

        const packages = Object.keys(this.state.selected_graphdata.graph).map((x) => {
            return({ 'value' : x, 'label' : x })})

 options.push()
 options.push(
     <ReflexElement flex={0.3} key="ui">
 <button onClick={this.addEquiv.bind(this)}>+</button>
 <button onClick={() => {alert("Remove Selected Equiv")}}>-</button>
 <button onClick={() => {alert("Edit Selected Equiv")}}>Edit</button>
 <button onClick={this.substitute.bind(this)}>Swap</button>
 </ReflexElement>
 )
 options.push(<ReflexSplitter/>)
 options.push(<ReflexElement flex={0.7} key="equivs">
     <ReflexContainer orientation="vertical">
 <ReflexElement flex={0.5}>
 {this.equiv_to_option()}
 </ReflexElement>
 <ReflexElement flex={0.5}>
 <Select 
    isMulti
    name="Ommited Packages"
    options={packages}
    className="basic-multi-select"
    classNamePrefix="select"
 />
 </ReflexElement>
 </ReflexContainer>
 </ReflexElement>)


this.setState({options : options})

    }

    

}

substitute(){
    console.log("HFAEFIAEHF")

    this.allvisited = []

    var incoming_graph = this.build_incoming()

    // const [ lhs, rhs ] = this.state.selected_equiv

    const [ lhs, rhs, ext ] = [{
        "oracles": [
            [
                "AKEYS",
                "GETA^{in},GETINA^{in}"
            ],
            [
                "AKEYS",
                "GETA^{out}"
            ],
            [
                "BITS",
                "SETBIT"
            ],
            [
                "BITS",
                "GETBIT"
            ]
        ],
        "graph": {
            "AKEYS": [
                [
                    "BITS",
                    "CHECK"
                ]
            ],
            "BITS": [],
            "Adv_pkg": []
        }, 
        
    },{
        "oracles": [
            [
                "KEYS",
                "GETA^{in},GETINA^{in}"
            ],
            [
                "KEYS",
                "GETA^{out}"
            ],
            [
                "KEYS",
                "SETBIT"
            ],
            [
                "KEYS",
                "GETBIT"
            ]
        ],
        "graph": {
            "KEYS": []
        }
    },{
        "BITS" : "KEYS"
    }]
    
    const lhs_packs = Object.keys(lhs.graph)

    const rhs_packs = Object.keys(lhs.graph)

    var lhs_edges = []

    for(var pack in lhs.graph){

        for(var edge in lhs.graph[pack]){

            lhs_edges.push(lhs.graph[pack][edge])

        }

    }

    for(var oracle in lhs.oracles){

            lhs_edges.push(["",lhs.oracles[oracle][1]])

    }


    var rhsdict = {}

    for(var oracle in rhs.oracles){

        rhsdict[rhs.oracles[oracle][1]] = rhs.oracles[oracle][0]

    }

    alert(JSON.stringify(rhs))

    for(var pack in rhs.graph){

        for(var edge in rhs.graph[pack])

        rhsdict[rhs.graph[pack][edge][1]] = rhs.graph[pack][edge][0]

    }

    // Resovle ingoing edges

    console.log(this.state.selected_graphdata)

    var newGraphData = JSON.parse(JSON.stringify(this.state.selected_graphdata))

    for(var pack in this.state.selected_graphdata.graph){
        for(var outeredge in this.state.selected_graphdata.graph[pack]){

            var edgedest = this.state.selected_graphdata.graph[pack][outeredge][0].split('_[')[0]
            var edgename = this.state.selected_graphdata.graph[pack][outeredge][0].split('_[')[1]

            // Check that all edges from the destination package go to the correct edges as in the equiv, then for the destinaztions of those edges if they have ingoing edges (checked by looping over the lhs graph)
            // check in the main graph if that specific package has ingoing edges from the necesarry packages
            if(lhs_packs.includes(edgedest)){


                // console.log("PACL")
                // console.log(pack)

                var ret = this.check_complete(incoming_graph, this.state.selected_graphdata.graph[pack][outeredge][0],[...lhs_packs],[...lhs_edges])

                if(ret[0]){
                    
                    var [result, packs, lhs_matched_edges, visited, incoming_non_matched_edges,outgoing_non_matched_edges] = ret

                    console.log("ISEQUIV")
                    console.log(packs)
                    console.log(visited)
                    console.log(lhs_matched_edges)
                    console.log(incoming_non_matched_edges)
                    console.log(outgoing_non_matched_edges)
                    
                    for(var edge in lhs_matched_edges){

                        console.log(rhsdict)

                        if(rhsdict.hasOwnProperty(lhs_matched_edges[edge][2].split("_[")[0])){

                            var new_pkg_name = rhsdict[lhs_matched_edges[edge][2].split("_[")[0]]+ '_[' + lhs_matched_edges[edge][1].split("_[")[1]  

                            var for_removal = []

                            if(lhs_matched_edges[edge][0] == ""){
                            
                                newGraphData.oracles = [[new_pkg_name,lhs_matched_edges[edge][2]],...newGraphData.oracles.filter(x => JSON.stringify(x) != JSON.stringify([lhs_matched_edges[edge][1],lhs_matched_edges[edge][2]]))]
                            

                            }else{


                            newGraphData.graph[lhs_matched_edges[edge][0]] = [[new_pkg_name,lhs_matched_edges[edge][2]] ,...newGraphData.graph[lhs_matched_edges[edge][0]].filter(x => JSON.stringify(x) != JSON.stringify([lhs_matched_edges[edge][1],lhs_matched_edges[edge][2]]))]

                        }

                        if(!newGraphData.graph.hasOwnProperty(new_pkg_name)){
                            newGraphData.graph[new_pkg_name] = []
                        }

                        }

                    }


                    for(var edge in incoming_non_matched_edges){

                        var from = incoming_non_matched_edges[edge][0]
                        var to = incoming_non_matched_edges[edge][1]
                        var ename = incoming_non_matched_edges[edge][2]

                        if(!ext.hasOwnProperty(to.split("_[")[0])){
                            alert("NO")
                            return
                        }else{
                            var newname = ext[to.split("_[")[0]] + '_[' + to.split("_[")[1]

                            if(from == ""){

                                alert("oracle!")
                                return

                            }else{
                                    
                                newGraphData.graph[from] = [[newname,ename],...newGraphData.graph[from].filter(x => JSON.stringify(x) != JSON.stringify([to,ename]))] 
                            
                                if(!newGraphData.graph.hasOwnProperty(newname)){
                                    newGraphData.graph[newname] = []
                                }

                            }

                        }

                    }

                    for(var edge in outgoing_non_matched_edges){
                        alert("not done yet")
                        return
                        var from = outgoing_non_matched_edges[edge][0]
                        var to = outgoing_non_matched_edges[edge][1]
                        var ename = outgoing_non_matched_edges[edge][2]

                        if(!ext.hasOwnProperty(from.split("_[")[0])){
                            alert("NO")
                            return
                        }else{
                            var newname = ext[from.split("_[")[0]] + '_[' + from.split("_[")[1]

                            if(from == ""){

                                alert("oracle!")
                                return

                            }else{
                                    
                                newGraphData.graph[newname] = [[to,ename],...newGraphData.graph[from].filter(x => JSON.stringify(x) != JSON.stringify([from,ename]))] 
                            
                            }

                        }
                    }

                    for(var rmpack in visited){
                        delete newGraphData.graph[visited[rmpack]]
                    }


            }else{
                console.log("NO")
            }
        }
        }
    }

    console.log("PLEASE")    
    console.log(newGraphData)

    
    this.updateGraph(false,newGraphData)

    

}

build_incoming(){

    var graphData = JSON.parse(JSON.stringify())

    for(var node in graphData.graph){

        if(Array.isArray(graphData.graph[node])){

            var temp = graphData.graph[node]  
            graphData.graph[node] = {
                'outgoing' : temp,
                'incoming' : []
            }

        }
    }
    
    for(var oracle in this.state.selected_graphdata.oracles){

         graphData.graph[this.state.selected_graphdata.oracles[oracle][0]].incoming.push(["",this.state.selected_graphdata.oracles[oracle][1]])

    }

    for(var pack in this.state.selected_graphdata.graph){

        for(var edge in this.state.selected_graphdata.graph[pack]){

            var dest = this.state.selected_graphdata.graph[pack][edge][0]
            var edgename = this.state.selected_graphdata.graph[pack][edge][1]

            graphData.graph[dest].incoming.push([pack,edgename])


        }
    }


    return graphData
}
    
recurs_get_all(incoming_graph,matchingpack,visited_packs,lhs_edges,lhs_packs, is_first){


    if(is_first){
        var packs = [matchingpack]
    }else{
        var packs = []
    }
    
    var lhs_matched_edges = []

    var visited = visited_packs

    var incoming_non_matched_edges = []
    var outgoing_non_matched_edges = []

    // console.log(matchingpack)
    console.log(incoming_graph.graph)

    // console.log(lhs_edges)
    for(var edge in incoming_graph.graph[matchingpack].incoming){

        var eq = (element) => JSON.stringify(element) == JSON.stringify(['',incoming_graph.graph[matchingpack].incoming[edge][1].split('_[')[0]])

        if(lhs_packs.includes(incoming_graph.graph[matchingpack].incoming[edge][0].split('_[')[0]) && !visited.includes(incoming_graph.graph[matchingpack].incoming[edge][0])){

            packs.push(incoming_graph.graph[matchingpack].incoming[edge][0])


            // I think I need to add the edges in this case no ? 

        }else if (lhs_edges.some(eq)){

            lhs_matched_edges.push([incoming_graph.graph[matchingpack].incoming[edge][0],matchingpack,incoming_graph.graph[matchingpack].incoming[edge][1]])
            
        }else{

            incoming_non_matched_edges.push([incoming_graph.graph[matchingpack].incoming[edge][0],matchingpack,incoming_graph.graph[matchingpack].incoming[edge][1]])

        }
     
    }
    
    for(var edge in incoming_graph.graph[matchingpack].outgoing){

        var eq = (element) => JSON.stringify(element) == JSON.stringify(['',incoming_graph.graph[matchingpack].outgoing[edge][1].split('_[')[0]])
       
       // console.log(incoming_graph.graph[matchingpack].outgoing[edge])

        if(lhs_packs.includes(incoming_graph.graph[matchingpack].outgoing[edge][0].split('_[')[0] && !visited.includes(incoming_graph.graph[matchingpack].incoming[edge][0]))){

            packs.push(incoming_graph.graph[matchingpack].outgoing[edge][0])

        }else if(lhs_packs.includes(incoming_graph.graph[matchingpack].outgoing[edge][0].split('_[')[0])){

          //      console.log("EFHAIEHFIAEHFI")
            lhs_matched_edges.push([matchingpack,...incoming_graph.graph[matchingpack].outgoing[edge]])

        }else if (lhs_edges.some(eq)){

            lhs_matched_edges.push(matchingpack,...incoming_graph.graph[matchingpack].outgoing[edge])


        }else{

            outgoing_non_matched_edges.push([matchingpack,...incoming_graph.graph[matchingpack].outgoing[edge]])

        }

    }

    var more_packs = []
    var more_lhs_matched_edges = []
    var more_incoming_non_matched_edges = []
    var more_outgoing_non_matched_edges = []

    visited.push(matchingpack)

    for(var pack in packs){
        if(packs[pack] != matchingpack){

            if(!visited.includes(packs[pack])){
            
            if(packs[pack] != ""){

            var [packs_returned, lhs_matched_edges_returned, visited_returned, incoming_non_matched_edges_returned, outgoing_non_matched_edges_returned] = this.recurs_get_all(incoming_graph,packs[pack],visited,lhs_edges,lhs_packs,false)
                
            // console.log("RETURNED")
            // console.log(packs_returned)
            // console.log(visited_returned)
            // console.log(lhs_matched_edges_returned)

            more_packs.push(...packs_returned)
            more_lhs_matched_edges.push(...lhs_matched_edges_returned)
            // console.log(more_lhs_matched_edges)
            visited = visited_returned
            more_incoming_non_matched_edges.push(...incoming_non_matched_edges_returned)
            more_outgoing_non_matched_edges.push(...outgoing_non_matched_edges_returned)
        
            }

        }
        }
    }

    packs.push(...more_packs)
    lhs_matched_edges.push(...more_lhs_matched_edges)
    incoming_non_matched_edges.push(...more_incoming_non_matched_edges)
    outgoing_non_matched_edges.push(...more_outgoing_non_matched_edges)

    // console.log("RETURN")


    // console.log(packs)
    // console.log(visited)

    // console.log(lhs_matched_edges)



    
    return [packs, lhs_matched_edges, visited, incoming_non_matched_edges,outgoing_non_matched_edges]

}

check_complete(incoming_graph,matchingpack,lhs_packs_in,lhs_edges_in){

    var lhs_packs = JSON.parse(JSON.stringify(lhs_packs_in))

    var lhs_edges = JSON.parse(JSON.stringify(lhs_edges_in))

    // console.log('matchingpack')
    // console.log(matchingpack)

    // console.log(lhs_packs)

    var [packs, lhs_matched_edges, visited, incoming_non_matched_edges,outgoing_non_matched_edges] = this.recurs_get_all(incoming_graph,matchingpack,[],lhs_edges,lhs_packs,true)

    // console.log("PASSSED")

    // console.log(packs)
    // console.log(visited)
    // console.log(lhs_matched_edges)
    // console.log(incoming_non_matched_edges)
    // console.log(outgoing_non_matched_edges)

    var edge_to_match = []

    for(var edge in lhs_matched_edges){

        if(lhs_packs.includes(lhs_matched_edges[edge][0].split("_[")[0])){

            edge_to_match.push([lhs_matched_edges[edge][1].split('_[')[0],lhs_matched_edges[edge][2].split('_[')[0]])

        }else if(lhs_packs.includes(lhs_matched_edges[edge][1].split("_[")[0])){

            edge_to_match.push(["",lhs_matched_edges[edge][2].split('_[')[0]])

        }else{
            alert("WRONG")
            return
        }

    }

    // console.log("donesss")
    // console.log(edge_to_match)
    // console.log(lhs_edges)

    for(var edge in lhs_edges){
        var eq = (element) => JSON.stringify(element) == JSON.stringify(lhs_edges[edge])

        if(!edge_to_match.some(eq)){
            return [false]
        }

    }

    var eq = (element) => JSON.stringify(element) == JSON.stringify(visited)

    if(this.allvisited.some(eq)){
            return [false]
        }


    this.allvisited.push(visited)

    return [true,packs, lhs_matched_edges, visited, incoming_non_matched_edges,outgoing_non_matched_edges]



    // for(var edge in incoming_graph.graph[matchingpack].incoming){

    //     if(lhs_edges.includes(incoming_graph.graph[matchingpack].incoming[edge][1].split("_[")[0])){
            
    //         if(incoming_graph.graph[matchingpack].incoming[edge][0] != ""){


    //             if(this.check_complete(incoming_graph,incoming_graph.graph[matchingpack].incoming[edge][0],))

    //         }


    //         var index = lhs_edges.indexOf(incoming_graph.graph[matchingpack].incoming[edge][1].split("_[")[0])
    
    //         lhs_edges.splice(index, 1);
            



    //     }else{

    //         return false

    //     }
        
    // }

   
    // var edges_to_remove = []
    

    // for(var edge in incoming_graph.graph[matchingpack].outgoing){

    //     var theedge = incoming_graph.graph[matchingpack].outgoing[edge]

    //     if(lhs_edges.includes(theedge[1].split("_[")[0])){

    //         if(this.check_complete(incoming_graph,theedge[0].split("_[")[0],theedge[1].split("_[")[0],[...lhs_packs],[...lhs_edges])){



    //         }

    //         edges_to_remove.push(incoming_graph.graph[matchingpack].outgoing[edge][1].split("_[")[0])        

    //     }else{

    //         return false

    //     }

    // }

    // var index = lhs_packs.indexOf(matchingpack)
    
    // lhs_packs.splice(index, 1);


}

    // Resolve outgoing edges



    // Delete instance of lhs



    // Add instance of rhs



addEquiv(){

    console.log("BEANS")
    var equiv_options = []

    equiv_options.push(
    <ReflexElement flex={0.4} key="lhs">
    <CodeEditor text={"{}"} onSubmit={(newGraphData) => {this.setState({equiv_lhs : newGraphData})}}  getLineNumber ={() => {return 0}}/>
    </ReflexElement>)

    equiv_options.push(
        <ReflexElement flex={0.1} key="middle">
            <p style={{'text-align': 'center'}}>{'=>'}</p>
        </ReflexElement>
    )

    equiv_options.push(
    <ReflexElement flex={0.4} key="rhs">
    <CodeEditor text={"{}"} onSubmit={(newGraphData) => {this.setState({equiv_rhs : newGraphData})}}  getLineNumber ={() => {return 0}}/>
    </ReflexElement>)

    equiv_options.push(
    <ReflexElement flex={0.1} key="rhs">
     <button onClick={this.submit_equiv.bind(this)}>Save Equiv</button>
    </ReflexElement>
)

    var options = [...this.state.options]

    options.pop()

    options.push(<ReflexElement flex={0.7} key="equivs">
             <ReflexContainer orientation="vertical">
    {equiv_options}
    </ReflexContainer>
    </ReflexElement>)

    this.setState({options : options})
}


submit_equiv(){

    if(this.state.equiv_lhs == null || this.state.equiv_rhs == null){

        alert("Equivs are not saved!");
        return 

    }

    if(!this.state.equiv_lhs.hasOwnProperty("graph") || !this.state.equiv_rhs.hasOwnProperty("graph")){

        alert("JSON is not correct format")
        return 
    
    }

    if(Object.keys(this.state.equiv_lhs.graph).length == 0 && Object.keys(this.state.equiv_lhs.graph).length == 0){

        alert("Both graphs can't be empty")
        return
    }

    var newEquivs = [...this.state.equivs]

    newEquivs.push([this.state.equiv_lhs,this.state.equiv_rhs])

    this.setState({options : []}, () =>{
        this.props.updateEquivsProp(newEquivs)
    })

    

}

equiv_to_option(){

    var options = []

    for(var equiv in  this.state.equivs){
        
        
        options.push(<FormControlLabel key={equiv+"equiv"} value={JSON.stringify(this.state.equivs[equiv])} control={<Radio />} label={Object.keys(this.state.equivs[equiv][0].graph).toString() + " === " +  Object.keys(this.state.equivs[equiv][1].graph).toString()} />)
            
    }
    

    if(options.length == 0){

        return(<p>Create an equiv</p>)

    }

    this.setState({selected_equiv : JSON.stringify(this.state.equivs[0])})

    const handleChange = (event) => {
        this.setState({selected_equiv: event.target.value});
      };

    return (<FormControl>
        <FormLabel id="demo-radio-buttons-group-label">Equivs</FormLabel>
        <RadioGroup
          aria-labelledby="demo-radio-buttons-group-label"
          name="radio-buttons-group"
          value={JSON.stringify(this.state.equivs[0])}
          onChange={handleChange.bind(this)}>
        {options}
        </RadioGroup>
        </FormControl>)

  
}

expand(target){
  
var newGraph = this.state.selected_graphdata;

if(this.targetval == target.value){
    return 
}

this.targetval = target.value

var chain = target.name

var expandable = target.name.slice(1)

var expandable_names = expandable.map(x => x.split('_[')[0])

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

    var name = expandable[pack].split('_[')[0]

    var base = expandable[pack].split('...')[0]

    base = base.charAt(base.length - 1)

    to_expand[expandable[pack]] = {"name" : name, "base" : base}

    for(var edge in this.state.selected_graphdata.graph[prev_pack]){

        
        if(expandable.includes(this.state.selected_graphdata.graph[prev_pack][edge][0]) && this.state.selected_graphdata.graph[prev_pack][edge][1].split("...").length == 2){
        
            if (const_edges_to_add.hasOwnProperty(prev_pack)){
                
                var edge_base = this.state.selected_graphdata.graph[prev_pack][edge][1].split("...")[0]
                
                edge_base = edge_base.charAt(edge_base.length - 1)

                const_edges_to_add[prev_pack].push({'name_to' : this.state.selected_graphdata.graph[prev_pack][edge][0], 'base' : edge_base, 'edge_name_base' : this.state.selected_graphdata.graph[prev_pack][edge][1].split("_[")[0]})
            
            }else{
                
                var edge_base = this.state.selected_graphdata.graph[prev_pack][edge][1].split("...")[0]

                edge_base = edge_base.charAt(edge_base.length - 1)

                const_edges_to_add[prev_pack] = [{'name_to' : this.state.selected_graphdata.graph[prev_pack][edge][0], 'base' : edge_base, 'edge_name_base' : this.state.selected_graphdata.graph[prev_pack][edge][1].split("_[")[0]}]
            }
    
        }

        if(prev_pack != chain[0]){

        if(expandable_names.includes(this.state.selected_graphdata.graph[prev_pack][edge][0].split("_[")[0]) && this.state.selected_graphdata.graph[prev_pack][edge][1].split("*").length == 2){
            
            var edge_base = this.state.selected_graphdata.graph[prev_pack][edge][1].split("*")[0]

            edge_base = edge_base.charAt(edge_base.length - 1)

            var name_to = this.state.selected_graphdata.graph[prev_pack][edge][0]

            var re = new RegExp(/^\d+/);

            if(this.state.selected_graphdata.graph[prev_pack][edge][0].split("...").length != 2){
                
                for(var match in expandable){
                    if(expandable[match].split("_[")[0] == this.state.selected_graphdata.graph[prev_pack][edge][0].split("_[")[0]){
                        name_to = expandable[match]

                        break
                    }
                }

            }
                
                if (dyn_edges_to_add.hasOwnProperty(prev_pack)){
                    if(dyn_edges_to_add[prev_pack].hasOwnProperty(name_to)){
                        console.log("HUFFLEPUFF")
                        console.log(re.exec(this.state.selected_graphdata.graph[prev_pack][edge][0].split("_[")[1])[0])
                        dyn_edges_to_add[prev_pack][name_to].push({'pack_base' : re.exec(this.state.selected_graphdata.graph[prev_pack][edge][0].split("_[")[1])[0], 'base' : edge_base, 'edge_name_base' : this.state.selected_graphdata.graph[prev_pack][edge][1].split("_[")[0]})
                    }else{
                        dyn_edges_to_add[prev_pack][name_to] = [{'pack_base' : re.exec(this.state.selected_graphdata.graph[prev_pack][edge][0].split("_[")[1])[0], 'base' : edge_base, 'edge_name_base' : this.state.selected_graphdata.graph[prev_pack][edge][1].split("_[")[0]}]
                    }
                }else{
                    dyn_edges_to_add[prev_pack] = {}
                    dyn_edges_to_add[prev_pack][name_to] = [{'pack_base' : re.exec(this.state.selected_graphdata.graph[prev_pack][edge][0].split("_[")[1])[0],'base' : edge_base, 'edge_name_base' : this.state.selected_graphdata.graph[prev_pack][edge][1].split("_[")[0]}]
                }
        
            }

        }else{

            // TODO RESOLVE CONSTATNT EDGES FOR ORACLES HERE 

           
        }

    }

    prev_pack = expandable[pack]

}

// var for_loop_dict = {}


console.log(to_expand)
for(var pack in to_expand){
        
        // for_loop_dict[pack] = true

        // if(pack.split([;.split(';').length == 2){

        // }


        for(var i = 0; i < target.value; i++){

            var num = parseInt(to_expand[pack]['base'])

            var name_base = to_expand[pack]['name']

            var new_package = name_base+'_[' +(num+i).toString()+']'

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

                var new_package = name_base+'_[' +(num+i).toString()+']'

                var new_edge = edge_name_base+'_[' + (edge_num+i).toString()+']'

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

                var new_linking_package = name_base+'_[' +(num+i).toString()+']'

                var new_edge = edge_name_base+'_[' + (edge_num+i).toString()+']'

                var new_pack = pack_base+'_[' + (pack_num+i).toString()+']'

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

this.updateGraph(false,newGraph)


    

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

  updateGraph(fin, displayed=null){

    if(displayed != null){
        this.displayed = displayed
    }

        this.props.update(this.displayed, fin);
        if (fin){
        this.setState({selected_graphdata : null, type : null, options : []});
        this.displayed = null
        this.valdict = {};
    }
}
      
newDecompose(packSelection,subGraph){

    if(!subGraph.hasOwnProperty('graph')){
        alert('Please supply a valid sub graph')
        return
    }

    try{

        var newGraph = decompose(this.incomingGraph,this.state.selected_graphdata,packSelection,subGraph)

    } catch(e) {

        console.log(e)
        alert("Couldn't decompose!")
        return 

    }


    this.updateGraph(false,newGraph)

}
  

  render() {

    var save_tool =  this.state.type != null ? <CustomIconButton type={['save']} func={() => this.updateGraph(true)} tip='Save transformation'/>: <></>
  
    var options = []

    switch(this.state.type){
        case "decompose":
                options.push(<ReflexElement flex={0.8} key={'save'}>
                                        <Stack direction="row" spacing={1}>
                                        <input type="file" style={{'display': 'none'}} ref={input => this.decompUpload = input} onChange={(event) => resolveInput(event.target.files[0], (json_data) => {
                                            if(this.state.selected_node != null){
                                                this.newDecompose(this.state.selected_node,json_data)
                                            }else{
                                            this.setState({input_data : json_data});
                                            }})} name="decomp_input"/>
                                        <CustomIconButton type={['import']} func={() => this.decompUpload.click()} tip='Import graph'/>
                                        <CustomIconButton type={['write']} func={() => alert("beans")} tip='Write graph'/>
                                        <CustomDecomposePopup
                                        open={this.state.input_data != null ? true : false}
                                        onChoice={(choice) => {
                                            this.newDecompose(choice, this.state.input_data)
                                            this.decompUpload.value = null
                                            this.setState({input_data : null, selected_node : choice })}}
                                        packs={Object.keys(this.state.selected_graphdata.graph)}
                                        />
                                        </Stack>
                    </ReflexElement>)
                if(this.state.selected_node != null){
                    options.push(<ReflexSplitter/>)
                    options.push(<ReflexElement><p>{this.state.selected_node}</p><CustomIconButton type={['delete']} func={() => this.setState({selected_node : null })} tip='Remove selected'/>
                    </ReflexElement>)
                }
        break;
        case "expand":
            var option_pairs = []

                for (var node in this.state.selected_graphdata.graph){
                 for(var edge in this.state.selected_graphdata.graph[node]){  
                    if (this.state.selected_graphdata.graph[node][edge][0].split("...").length == 2 && this.state.selected_graphdata.graph[node][edge][1].split("#").length != 2){
                        
                        option_pairs.push(this.findchain(this.state.selected_graphdata.graph, node))
        
                    }
                }
                }
                
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
                break;
                    
    }

      return (
        <ReflexContainer orientation="vertical"> 
        <ReflexElement flex={0.8}>
        <ReflexContainer orientation="vertical">
            {options}
        </ReflexContainer>
            </ReflexElement>
            <ReflexSplitter/>
            <ReflexElement className="panel panel--empty">{save_tool}</ReflexElement>
          </ReflexContainer>
    
    
        

      );
   
}

}