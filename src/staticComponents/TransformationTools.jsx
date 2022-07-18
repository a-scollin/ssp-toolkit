
import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import Moveable from "react-moveable";
import 'react-reflex/styles.css'
import { black } from "ansi-colors";
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';

import GraphView from "./GraphView.jsx";
import {
    ReflexContainer,
    ReflexSplitter,
    ReflexElement
  } from 'react-reflex'
import { ListGroup, ThemeProvider } from "react-bootstrap";
import { getCheckboxUtilityClass, getTableHeadUtilityClass, toggleButtonGroupClasses, touchRippleClasses } from "@mui/material";
import { useThemeWithoutDefault } from "@mui/system";
import CodeEditor from "../reusableComponents/CodeEditor.jsx";
import { inflateGetHeader } from "pako/lib/zlib/inflate.js";
import { toJS } from "draft-js/lib/DefaultDraftBlockRenderMap";


import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

import FormLabel from '@mui/material/FormLabel';

import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';

import CustomIconButton from "../reusableComponents/IconButton.jsx";
import Stack from '@mui/material/Stack';


import Select from 'react-select'
import { V } from "mathjax-full/js/output/common/FontData";
import { RANGES } from "mathjax-full/js/core/MmlTree/OperatorDictionary";
import { resolveInput } from "../lib/import_helper.js";


import { CustomPopup } from "../reusableComponents/Popup.jsx";

import { buildIncoming, decompose, compose, findAllExpandableChains, expand, substitute, reduce } from '../lib/transformation_helper.js'
import { ThirtyFpsSelect, ThirtyFpsTwoTone } from "@mui/icons-material";

export default class TransformationTools extends Component {
  constructor(props) {
    super(props);
    this.state = {selected_graphdata : null, input_data : null, selected_equiv : "", selection : null, type : null, bitstring : "b", partial : false,  ghost : false, packagename : "Composed\nPackage", options : [], equiv_lhs : null, equiv_rhs : null};
    this.GraphRef = React.createRef()
    this.valdict = {}
    this.packSelection = null
    this.targetval = 0
    this.targetdict = {}
    this.input_data = null 

  }


  componentDidUpdate(prevProps){
    
    console.log(this.props.base)
    try {
    this.incomingGraph = buildIncoming(this.props.base)
    }catch (e){
        console.log(e)
        alert("error building incoming")
        return 
    }
    
    if(this.props.type !== prevProps.type || this.props.node !== prevProps.node){
        
        if(this.props.type == 'expand'){
            this.expandableChains = findAllExpandableChains(this.incomingGraph)
        }else{
            this.expandableChains = null
        }

        this.setState({allGraphData : this.props.allGraphData, selected_graphdata : this.props.base, type : this.props.type, selected_node : this.props.node},() => {
            switch(this.props.type){
                case "reduce":
                    this.newReduction(this.props.node, this.state.bitstring);
                    break;
                    
                    case "compose" : 
                    this.newCompose(this.props.node, this.state.packagename);                    
                    break;
                }
                if (this.props.type != null){
                    return
                }
            });
    }


     
  }

newSubstitute(lhs,rhs, partial){
    
if(partial == null){
    partial = this.state.partial 
}

    // const [ lhs, rhs ] = this.state.selected_equiv
    
    // const [ lhs, rhs ] = [{
    //     "oracles": [
    //         [
    //             "AKEYS",
    //             "GETA^{in},GETINA^{in}"
    //         ],
    //         [
    //             "AKEYS",
    //             "GETA^{out}"
    //         ],
    //         [
    //             "BITS",
    //             "SETBIT"
    //         ],
    //         [
    //             "BITS",
    //             "GETBIT"
    //         ]
    //     ],
    //     "graph": {
    //         "AKEYS": [
    //             [
    //                 "BITS",
    //                 "CHECK"
    //             ]
    //         ],
    //         "BITS": [],
    //     }, 
        
    // },{
    //     "oracles": [
    //         [
    //             "KEYS",
    //             "GETA^{in},GETINA^{in}"
    //         ],
    //         [
    //             "KEYS",
    //             "GETA^{out}"
    //         ],
    //         [
    //             "KEYS",
    //             "SETBIT"
    //         ],
    //         [
    //             "KEYS",
    //             "GETBIT"
    //         ]
    //     ],
    //     "graph": {
    //         "KEYS": []
    //     }
    // }]

    try {
        var newGraphData = substitute(this.incomingGraph,this.state.selected_graphdata,lhs,rhs,partial)

    } catch (e) {
        console.log(e)
        alert(e)
        return
    }
    
    this.updateGraph(false,newGraphData)

    return 
    
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

    // console.log(matchingpack)
    // console.log(lhs_edges)
    for(var edge in incoming_graph[matchingpack].incoming){

        var eq = (element) => JSON.stringify(element) == JSON.stringify(['',incoming_graph[matchingpack].incoming[edge][1].split('_[')[0]])

        if(lhs_packs.includes(incoming_graph[matchingpack].incoming[edge][0].split('_[')[0]) && !visited.includes(incoming_graph[matchingpack].incoming[edge][0])){

            packs.push(incoming_graph[matchingpack].incoming[edge][0])


            // I think I need to add the edges in this case no ? 

        }else if (lhs_edges.some(eq)){

            lhs_matched_edges.push([incoming_graph[matchingpack].incoming[edge][0],matchingpack,incoming_graph[matchingpack].incoming[edge][1]])
            
        }
     
    }
    
    for(var edge in incoming_graph[matchingpack].outgoing){

        var eq = (element) => JSON.stringify(element) == JSON.stringify(['',incoming_graph[matchingpack].outgoing[edge][1].split('_[')[0]])
       
       // console.log(incoming_graph.graph[matchingpack].outgoing[edge])

        if(lhs_packs.includes(incoming_graph[matchingpack].outgoing[edge][0].split('_[')[0] && !visited.includes(incoming_graph[matchingpack].incoming[edge][0]))){

            packs.push(incoming_graph[matchingpack].outgoing[edge][0])

        }else if(lhs_packs.includes(incoming_graph[matchingpack].outgoing[edge][0].split('_[')[0])){

          //      console.log("EFHAIEHFIAEHFI")
            lhs_matched_edges.push([matchingpack,...incoming_graph[matchingpack].outgoing[edge]])

        }else if (lhs_edges.some(eq)){

            lhs_matched_edges.push(matchingpack,...incoming_graph[matchingpack].outgoing[edge])


        }

    }

    var more_packs = []
    var more_lhs_matched_edges = []

    visited.push(matchingpack)

    for(var pack in packs){
        if(packs[pack] != matchingpack){

            if(!visited.includes(packs[pack])){
            
            if(packs[pack] != ""){

            var [packs_returned, lhs_matched_edges_returned, visited_returned] = this.recurs_get_all(incoming_graph,packs[pack],visited,lhs_edges,lhs_packs,false)
                
            // console.log("RETURNED")
            // console.log(packs_returned)
            // console.log(visited_returned)
            // console.log(lhs_matched_edges_returned)

            more_packs.push(...packs_returned)
            more_lhs_matched_edges.push(...lhs_matched_edges_returned)
            // console.log(more_lhs_matched_edges)
            visited = visited_returned
        
            }

        }
        }
    }

    packs.push(...more_packs)
    lhs_matched_edges.push(...more_lhs_matched_edges)

    // console.log("RETURN")


    // console.log(packs)
    // console.log(visited)

    // console.log(lhs_matched_edges)
    
    return [packs, lhs_matched_edges, visited]

}

check_complete(incoming_graph,matchingpack,lhs_packs_in,lhs_edges_in){

    var lhs_packs = JSON.parse(JSON.stringify(lhs_packs_in))

    var lhs_edges = JSON.parse(JSON.stringify(lhs_edges_in))

    // console.log('matchingpack')
    // console.log(matchingpack)

    // console.log(lhs_packs)

    var [packs, lhs_matched_edges, visited] = this.recurs_get_all(incoming_graph,matchingpack,[],lhs_edges,lhs_packs,true)

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

    return [true,packs, lhs_matched_edges, visited]


}

newExpand(passedchain, value, ghost){

    // the expand function also needs to be able to take multiple values for multiple chains 

    if(ghost == null){
        ghost = this.state.ghost
    }

    if(this.targetval === value){
        return
    }

    this.targetval = value

    this.targetdict[passedchain] = value

    var newGraph = JSON.parse(JSON.stringify(this.state.selected_graphdata))


    for(var chain in this.targetdict){

        try{

        newGraph = expand(this.incomingGraph, newGraph, chain.split(','), this.targetdict[chain], ghost)
    
        } catch (e) { 
    
            console.log(e)
            return
    
        }

    }   
    
    this.updateGraph(false,newGraph)

}

copyTransformation(){

    var text = ""

    switch(this.state.type){
        
        case "decompose":
            text = '\t"type" : "decompose",\n\t"target" : "'+ this.state.selected_node + '",\n\t "subgraph" : ' + JSON.stringify(this.input_data) 
        break;        
        case "expand" : 
            text = '\t"type" : "expand",\n\t"expandable_package" : "'+ this.expandableChains[Object.keys(this.expandableChains)[0]][0] + '",\n\t "value" : ' + this.targetval.toString() + ',\n\t "ghost" : ' + this.state.ghost.toString()
        break;
        case "reduce":
            text = '\t"type" : "reduce",\n\t"reduction" : "'+ this.state.selected_node + '",\n\t "bitstring : "' + this.state.bitstring.toString() + '"'
        break;
        case "compose" : 
            text = '"type" : "compose",\n\t"packages" : ['
            
            for (var node in this.state.selected_node){
                text += '"' + node + '",'
            }
            
            if(this.state.selected_node.length > 0){
                text = text.slice(0, -1)
            }

            text += '],\n\t "package_name" : "' + this.state.packagename + '"'
        
        break;
        
        case "equiv":
            text = '\t"type" : "substitute",\n\t"lhs" : '+ JSON.stringify(this.state.lhs) + ',\n\t "rhs" : '+JSON.stringify(this.state.lhs)+',\n\t "partial" : ' + this.state.partial.toString()
        break;
    }    

    navigator.clipboard.writeText(text)

}

  updateGraph(fin, displayed=null){

    if(displayed != null){
        this.displayed = displayed
    }

    console.log(this.displayed)
    
        this.props.update(this.displayed, fin);
        if (fin){
        this.setState({selected_graphdata : null, type : null, options : []});
        this.displayed = null
        this.valdict = {};
    }
}
   
newCompose(packs, packagename){
    
    try{
        var newGraph = compose(this.incomingGraph,this.state.selected_graphdata,packs, packagename)
    } catch(e) {
        console.log(e)
        alert(e)
        return 
    }

    this.updateGraph(false,newGraph)

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
        alert(e)
        return 
    }

    this.updateGraph(false,newGraph)

}

renderExpand(){

    var options = []

    for(var chain in this.expandableChains){
        options.push(<ReflexElement flex={0.8} key={this.expandableChains[chain]}>{this.expandableChains[chain].join(",\n")}
            <div key={this.expandableChains[chain].join(",\n")} reference={this.expandableChains[chain]} className="boxpad">
            <Slider style={{opacity : 1}}
aria-label="Temperature"
defaultValue={1}
valueLabelDisplay="auto"
step={1}
marks
min={1}
max={10}
name={this.expandableChains[chain]}
onChange={ (e, val) => this.newExpand(e.target.name,val, this.state.ghost)}  />
</div>
            </ReflexElement>)
            options.push(<ReflexSplitter/>)
    }

    options.pop()

    options.push(<ReflexSplitter/>)
    options.push(<ReflexElement minSize="50" flex={0.25}><Stack direction="row" spacing={1}>   
    <CustomIconButton type={['ghost']} func={() => this.setState({ghost:!this.state.ghost})} tip='Add Ghost Edges'/>
 </Stack></ReflexElement>)

    return options
}
  
renderDecompose(){
    var options = []
                options.push(<ReflexElement flex={0.2} key={'save'}>
                                        <Stack direction="row" spacing={1}>
                                        <input type="file" style={{'display': 'none'}} ref={input => this.decompUpload = input} onChange={(event) => resolveInput(event.target.files[0], (json_data) => {
                                            if(this.state.selected_node != null){
                                                this.newDecompose(this.state.selected_node,json_data)
                                            }else{
                                            this.setState({input_data : json_data});
                                            }})} name="decomp_input"/>
                                        <CustomIconButton type={['import']} func={() => this.decompUpload.click()} tip='Import new graph'/>
                                        <CustomIconButton type={['list']} func={() => this.setState({select_from_list : true})} tip='Choose graph from imported'/>
                                        <CustomPopup
                                        open={this.state.selected_node == null ? true : false}
                                        onChoice={(choice) => {
                                            this.decompUpload.value = null
                                            if(this.state.input_data != null){
                                                this.newDecompose(choice, this.state.input_data)
                                            }
                                            this.setState({selected_node : choice })}}
                                        items={Object.keys(this.state.selected_graphdata.graph)}
                                        title="Choose package to decompose:"
                                        />
                                        <CustomPopup
                                        open={this.state.select_from_list}
                                        onChoice={(packchoice) => {
                                            if(this.state.selected_node != null){
                                                this.newDecompose(this.state.selected_node,this.state.allGraphData.modular_pkgs[packchoice])
                                                this.setState({input_data : this.state.allGraphData.modular_pkgs[packchoice], select_from_list : false})
                                            }else{
                                                this.setState({input_data : this.state.allGraphData.modular_pkgs[packchoice], select_from_list : false});
                                            }
                                           }}
                                        items={Object.keys(this.state.allGraphData.modular_pkgs)}
                                        title={"Choose subgraph to fit:"}
                                        />
                                        </Stack>
                    </ReflexElement>)
                if(this.state.input_data != null){
                    options.push(<ReflexSplitter/>)
                    options.push(<ReflexElement className="workboard" minSize="50" flex={0.5}><GraphView update={() => {}} toolbarRef={null}  allow_editing={false} selected={""} triggerTransformationProp = {() => {}} transform={true} selected_graphdata={this.state.input_data}/></ReflexElement>)
                }
                
                if(this.state.selected_node != null){
                    options.push(<ReflexSplitter/>)
                    options.push(<ReflexElement flex={0.3}><p>{this.state.selected_node}</p><CustomIconButton type={['delete']} func={() => this.setState({selected_node : null })} tip='Remove selected'/>
                    </ReflexElement>)
                }
            return options
}

renderCompose(){
    var options = []
                options.push(<ReflexElement flex={0.4} key={'save'}>
                                        <Stack direction="row" spacing={1}>
                                        <input type="file" style={{'display': 'none'}} ref={input => this.decompUpload = input} onChange={(event) => resolveInput(event.target.files[0], (json_data) => {
                                            if(this.state.selected_node != null){
                                                this.newDecompose(this.state.selected_node,json_data)
                                            }else{
                                            this.setState({input_data : json_data});
                                            }})} name="decomp_input"/>
                                    <CustomIconButton type={['add']} func={() => this.setState({select_from_list : true})} tip='Choose package'/>

                                        <CustomPopup
                                        open={this.state.select_from_list}
                                        onChoice={(packchoice) => {
                                            
                                                this.newCompose([packchoice,...this.state.selected_node],this.state.packagename)                                            
                                                this.setState({selected_node : [packchoice,...this.state.selected_node], select_from_list : false});
                                            
                                           }}
                                        items={Object.keys(this.state.selected_graphdata.graph)}
                                        title={"Choose package to compose:"}
                                        />
                                        </Stack>
                    </ReflexElement>)
                    options.push(<ReflexSplitter/>)
                    options.push(<ReflexElement flex={0.4} key={'save'}>
                        <TextField
                        style={{'margin-top' : '25px','margin-left' : '25px'}}
                        id="outlined-name"
                        label="Package name"
                        value={this.state.packagename}
                        onChange={(e) => {
                            
                            this.newCompose(this.state.selected_node,e.target.value)  
                            this.setState({packagename : e.target.value})
                        }}
                      /></ReflexElement>)
                if(this.state.selected_nodes != []){
                    for (var node in this.state.selected_node){
                        options.push(<ReflexSplitter/>)
                        options.push(<ReflexElement key={this.state.selected_node[node]}><p>{this.state.selected_node[node]}</p><CustomIconButton type={['delete']} value={this.state.selected_node[node]} func={(v) => this.setState((prevProps) =>{
                    
                            var selected_node = [...prevProps.selected_node]
                            const index = selected_node.indexOf(v);
                            if (index > -1) {
                                selected_node.splice(index, 1); // 2nd parameter means remove one item only
                            }
                            return {selected_node}

                        })} tip='Remove selected'/>
                        </ReflexElement>)

                    }
                }
            return options
}

newReduction(selected, bitstring){

    if(bitstring == null){
        bitstring = this.state.bitstring
    }

    var newgraph = reduce(this.state.selected_graphdata, selected, bitstring)

    this.updateGraph(false,newgraph)

}


renderReduction(){
    var options = []
                options.push(<ReflexElement flex={0.4} key={'save'}>
                                        <Stack direction="row" spacing={1}>
                                    <CustomIconButton type={['add']} func={() => this.setState({select_from_list : true})} tip='Choose package'/>

                                        <CustomPopup
                                        open={this.state.select_from_list}
                                        onChoice={(packchoice) => {
                                            
                                                this.newReduction([packchoice,...this.state.selected_node], this.state.bitstring)                                            
                                                this.setState({selected_node : [packchoice,...this.state.selected_node], select_from_list : false});
                                            
                                           }}
                                        items={Object.keys(this.state.selected_graphdata.graph)}
                                        title={"Choose package to reduce:"}
                                        />
                                        </Stack>
                    </ReflexElement>)

options.push(<ReflexSplitter/>)
options.push(<ReflexElement flex={0.4} key={'save'}>
    <TextField
    style={{'margin-top' : '25px','margin-left' : '25px'}}
    id="outlined-name"
    label="Bitstring"
    value={this.state.bitstring}
    onChange={(e) => {
        
        this.newReduction(this.state.selected_node,e.target.value)  
        this.setState({bitstring : e.target.value})
    }}
  /></ReflexElement>)

                if(this.state.selected_nodes != []){
                    for (var node in this.state.selected_node){
                        options.push(<ReflexSplitter/>)
                        options.push(<ReflexElement key={this.state.selected_node[node]}><p>{this.state.selected_node[node]}</p><CustomIconButton type={['delete']} value={this.state.selected_node[node]} func={(v) => 
                            this.setState((prevProps) =>{
                    
                            var selected_node = [...prevProps.selected_node]
                            const index = selected_node.indexOf(v);
                            if (index > -1) {
                                selected_node.splice(index, 1); // 2nd parameter means remove one item only
                            }
                            return {selected_node}

                        }, (e) => {
                            console.log(e)
                            this.newReduction(this.state.selected_node)                                            

                        })
                          
                        } tip='Remove selected'/>
                        </ReflexElement>)

                    }
                }
            return options
}

renderEquiv(){
    var options = []
    const packages = Object.keys(this.state.selected_graphdata.graph).map((x) => {
        return({ 'value' : x, 'label' : x })})

options.push()
options.push(
 <ReflexElement flex={0.5} key="ui">
<CustomIconButton type={['import']} func={() => alert("Error")} tip='Import LHS'/>
<CustomIconButton type={['list']} func={() => this.setState({select_from_list_l : true})} tip='Choose LHS'/>
<CustomPopup
                                        open={this.state.select_from_list_l}
                                        onChoice={(choice) => {
                                        if(this.state.equiv_rhs != null){
                                            this.newSubstitute(this.state.allGraphData.modular_pkgs[choice], this.state.equiv_rhs, this.state.partial)
                                        }    
                                        this.setState({equiv_lhs : this.state.allGraphData.modular_pkgs[choice], select_from_list_l : false})}}
                                        items={Object.keys(this.state.allGraphData.modular_pkgs)}
                                        title="Choose graph for LHS of equivalence :"
                                        />
</ReflexElement>
)
if(this.state.equiv_lhs != null){
        options.push(<ReflexSplitter/>)
        options.push(<ReflexElement className="workboard" minSize="50" flex={0.25}><GraphView update={() => {}} toolbarRef={null}  allow_editing={false} selected={""} triggerTransformationProp = {() => {}} transform={true} selected_graphdata={this.state.equiv_lhs}/></ReflexElement>)
}
options.push(<ReflexSplitter/>)
options.push(
    <ReflexElement flex={0.5} key="ui">
   <CustomIconButton type={['import']} func={() => alert("Error")} tip='Import RHS'/>
   <CustomIconButton type={['list']} func={() => this.setState({select_from_list_r : true})} tip='Choose RHS'/>
   <CustomPopup
                                           open={this.state.select_from_list_r}
                                           onChoice={(choice) => {
                                           if(this.state.equiv_lhs != null){
                                               this.newSubstitute(this.state.equiv_lhs, this.state.allGraphData.modular_pkgs[choice], this.state.partial)
                                           }    
                                           this.setState({equiv_rhs : this.state.allGraphData.modular_pkgs[choice], select_from_list_r : false})}}
                                           items={Object.keys(this.state.allGraphData.modular_pkgs)}
                                           title="Choose graph for LHS of equivalence :"
                                           />
   </ReflexElement>
   )
   if(this.state.equiv_rhs != null){
           options.push(<ReflexSplitter/>)
           options.push(<ReflexElement className="workboard" minSize="50" flex={0.25}><GraphView update={() => {}} toolbarRef={null}  allow_editing={false} selected={""} triggerTransformationProp = {() => {}} transform={true} selected_graphdata={this.state.equiv_rhs}/></ReflexElement>)
   }
   options.push(<ReflexSplitter/>)
   options.push(<ReflexElement minSize="50" flex={0.25}><Stack direction="row" spacing={1}>   
   <CustomIconButton type={['partial']} func={() => this.setState({partial : !this.state.partial})} tip='Partial Matching'/>
</Stack></ReflexElement>)
   


return options


}

  render() {

    var save_tool =  this.state.type != null ? <CustomIconButton type={['save']} func={() => this.updateGraph(true)} tip='Save transformation'/>: <></>
  
    var copy_tool =  this.state.type != null ? <CustomIconButton type={['copy']} func={() => this.copyTransformation()} tip='Copy transformation'/>: <></>

    var transform_options = []

    switch(this.state.type){
        case "decompose":
            transform_options = this.renderDecompose();
        break;
        case "reduce":
            transform_options = this.renderReduction();
        break;
        case "expand" : 
            transform_options = this.renderExpand();                    
        break;
        case "compose" : 
            transform_options = this.renderCompose();                    
        break;
        case "equiv":
            transform_options = this.renderEquiv();
        break;
    }

      return (
        <ReflexContainer orientation="vertical"> 
        <ReflexElement flex={0.8}>
        <ReflexContainer orientation="vertical">
            {transform_options}
        </ReflexContainer>
            </ReflexElement>
            <ReflexSplitter/>
            <ReflexElement className="panel panel--empty">                                        
                <Stack direction="row" spacing={1}>
                    {save_tool} 
                    {copy_tool}
                </Stack>
            </ReflexElement>
          </ReflexContainer>
    
    
        

      );
   
}

}