
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
import { getCheckboxUtilityClass, getTableHeadUtilityClass, toggleButtonGroupClasses, touchRippleClasses } from "@mui/material";
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


import { CustomPopup } from "./uiComponents/CustomPopup.jsx";

import { buildIncoming, decompose, findAllExpandableChains, expand, substitute } from './helpers/transformation_helper.js'

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


  componentDidUpdate(prevProps){

    if(this.props.type !== prevProps.type || this.props.node !== prevProps.node){
        
        this.incomingGraph = buildIncoming(this.props.base)

        if(this.props.type == 'expand'){
            this.expandableChains = findAllExpandableChains(this.incomingGraph)
            console.log(this.expandableChains)
        }else{
            this.expandableChains = null
        }

        this.setState({allGraphData : this.props.allGraphData, selected_graphdata : this.props.base, type : this.props.type, equivs : this.props.equivs, selected_node : this.props.node},() => {
            if (this.props.type != null){
                return
            }
        });
    }

    if(this.state.equivs.length != this.props.equivs.length){

        this.setState({equivs : this.props.equivs}, () => {
            if (this.props.type != null){
                return
            }
            
        })
       
    }
     
  }

newSubstitute(lhs,rhs){
    

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
        var newGraphData = substitute(this.incomingGraph,this.state.selected_graphdata,lhs,rhs)

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

        return(<p>Define an equivalence!</p>)

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

newExpand(chains, value){

    // This only works for one chain !!!! need to make chains stateful within this function.. 
    // the expand function also needs to be able to take multiple values for multiple chains 

    if(this.targetval === value){
        return
    }

    this.targetval = value



    try{

        var newGraph = expand(this.incomingGraph, this.state.selected_graphdata, chains, this.targetval)

    } catch (e) { 

        alert(e)
        return

    }

    this.updateGraph(false,newGraph)

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
        alert(e)
        return 

    }


    this.updateGraph(false,newGraph)

}

renderExpand(){

    var options = []

    for(var chain in this.expandableChains){
        options.push(<ReflexElement flex={0.8} key={this.expandableChains[chain]}>{this.expandableChains[chain]}
            <div key={this.expandableChains[chain]} reference={this.expandableChains[chain]} className="boxpad">
            <Slider style={{opacity : 1}}
aria-label="Temperature"
defaultValue={30}
valueLabelDisplay="auto"
step={1}
marks
min={1}
max={10}
name={this.expandableChains[chain]}
onChange={ (e, val) => this.newExpand([e.target.name],val)}  />
</div>
            </ReflexElement>)
            options.push(<ReflexSplitter/>)
    }

    options.pop()

    return options
}
  
renderDecompose(){
    var options = []
                options.push(<ReflexElement flex={0.8} key={'save'}>
                                        <Stack direction="row" spacing={1}>
                                        <input type="file" style={{'display': 'none'}} ref={input => this.decompUpload = input} onChange={(event) => resolveInput(event.target.files[0], (json_data) => {
                                            if(this.state.selected_node != null){
                                                this.newDecompose(this.state.selected_node,json_data)
                                            }else{
                                            this.setState({input_data : json_data});
                                            }})} name="decomp_input"/>
                                        <CustomIconButton type={['import']} func={() => this.decompUpload.click()} tip='Import new graph'/>
                                        <CustomIconButton type={['list']} func={() => this.setState({select_from_list : true})} tip='Choose graph from imported'/>
                                        <CustomIconButton type={['write']} func={() => alert("Not implemented yet")} tip='Write new graph'/>
                                        <CustomPopup
                                        open={this.state.input_data != null ? true : false}
                                        onChoice={(choice) => {
                                            this.decompUpload.value = null
                                            this.newDecompose(choice, this.state.input_data)
                                            this.setState({input_data : null, selected_node : choice })}}
                                        items={Object.keys(this.state.selected_graphdata.graph)}
                                        title="Choose package to decompose:"
                                        />
                                        <CustomPopup
                                        open={this.state.select_from_list}
                                        onChoice={(packchoice) => {
                                            if(this.state.selected_node != null){
                                                this.newDecompose(this.state.selected_node,this.state.allGraphData.modular_pkgs[packchoice])
                                                this.setState({select_from_list : false})
                                            }else{
                                                this.setState({input_data : this.state.allGraphData.modular_pkgs[packchoice], select_from_list : false});
                                            }
                                           }}
                                        items={Object.keys(this.state.allGraphData.modular_pkgs)}
                                        title={"Choose subgraph to fit:"}
                                        />
                                        </Stack>
                    </ReflexElement>)
                if(this.state.selected_node != null){
                    options.push(<ReflexSplitter/>)
                    options.push(<ReflexElement><p>{this.state.selected_node}</p><CustomIconButton type={['delete']} func={() => this.setState({selected_node : null })} tip='Remove selected'/>
                    </ReflexElement>)
                }
            return options
}


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


renderEquiv(){
    var options = []
    const packages = Object.keys(this.state.selected_graphdata.graph).map((x) => {
        return({ 'value' : x, 'label' : x })})

options.push()
options.push(
 <ReflexElement flex={0.3} key="ui">
<CustomIconButton type={['add']} func={() => this.setState({select_from_list : true, equiv_lhs : null, equiv_rhs : null})} tip='Define a new equivalence'/>
<CustomPopup
                                        open={this.state.select_from_list && this.state.equiv_lhs === null}
                                        onChoice={(choice) => {
                                        this.setState({equiv_lhs : this.state.allGraphData.modular_pkgs[choice]})}}
                                        items={Object.keys(this.state.allGraphData.modular_pkgs)}
                                        title="Choose graph for LHS of equivalence :"
                                        />
<CustomPopup
                                        open={this.state.select_from_list && this.state.equiv_lhs !== null}
                                        onChoice={(choice) => {
                                            this.newSubstitute(this.state.equiv_lhs, this.state.allGraphData.modular_pkgs[choice])
                                            this.setState({equiv_lhs : null, select_from_list : false })
                                            }}
                                        items={Object.keys(this.state.allGraphData.modular_pkgs)}
                                        title="Choose graph for RHS of equivalence:"
                                        />


</ReflexElement>
)
// options.push(<ReflexSplitter/>)
// options.push(<ReflexElement flex={0.7} key="equivs">
//  <ReflexContainer orientation="vertical">
// <ReflexElement flex={0.5}>
// {this.equiv_to_option()}
// </ReflexElement>
// <ReflexElement flex={0.5}>
// <Select 
// isMulti
// name="Ommited Packages"
// options={packages}
// className="basic-multi-select"
// classNamePrefix="select"
// />
// </ReflexElement>
// </ReflexContainer>
// </ReflexElement>)

return options


}

  render() {

    var save_tool =  this.state.type != null ? <CustomIconButton type={['save']} func={() => this.updateGraph(true)} tip='Save transformation'/>: <></>
  
    var transform_options = []

    switch(this.state.type){
        case "decompose":
            transform_options = this.renderDecompose();
        break;
    
        case "expand" : 
            transform_options = this.renderExpand();                    
        break;
        case "equiv":
            transform_options = this.renderEquiv();
    }

      return (
        <ReflexContainer orientation="vertical"> 
        <ReflexElement flex={0.8}>
        <ReflexContainer orientation="vertical">
            {transform_options}
        </ReflexContainer>
            </ReflexElement>
            <ReflexSplitter/>
            <ReflexElement className="panel panel--empty">{save_tool}</ReflexElement>
          </ReflexContainer>
    
    
        

      );
   
}

}