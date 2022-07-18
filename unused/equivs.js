// // addEquiv(){

// //     console.log("BEANS")
// //     var equiv_options = []

// //     equiv_options.push(
// //     <ReflexElement flex={0.4} key="lhs">
// //     <CodeEditor text={"{}"} onSubmit={(newGraphData) => {this.setState({equiv_lhs : newGraphData})}}  getLineNumber ={() => {return 0}}/>
// //     </ReflexElement>)

// //     equiv_options.push(
// //         <ReflexElement flex={0.1} key="middle">
// //             <p style={{'text-align': 'center'}}>{'=>'}</p>
// //         </ReflexElement>
// //     )

// //     equiv_options.push(
// //     <ReflexElement flex={0.4} key="rhs">
// //     <CodeEditor text={"{}"} onSubmit={(newGraphData) => {this.setState({equiv_rhs : newGraphData})}}  getLineNumber ={() => {return 0}}/>
// //     </ReflexElement>)

// //     equiv_options.push(
// //     <ReflexElement flex={0.1} key="rhs">
// //      <button onClick={this.submit_equiv.bind(this)}>Save Equiv</button>
// //     </ReflexElement>
// // )

// //     var options = [...this.state.options]

// //     options.pop()

// //     options.push(<ReflexElement flex={0.7} key="equivs">
// //              <ReflexContainer orientation="vertical">
// //     {equiv_options}
// //     </ReflexContainer>
// //     </ReflexElement>)

// //     this.setState({options : options})
// // }
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
    // Resolve outgoing edges



    // Delete instance of lhs



    // Add instance of rhs

//    if(this.state.equivs.length != this.props.equivs.length){

    // this.setState({equivs : this.props.equivs}, () => {
//         if (this.props.type != null){
//             return
//         }
        
//     })
   
// } 
// // // options.push(<ReflexSplitter/>)
// // options.push(<ReflexElement flex={0.7} key="equivs">
// //  <ReflexContainer orientation="vertical">
// // <ReflexElement flex={0.5}>
// // {this.equiv_to_option()}
// // </ReflexElement>
// // <ReflexElement flex={0.5}>
// // <Select 
// // isMulti
// // name="Ommited Packages"
// // options={packages}
// // className="basic-multi-select"
// // classNamePrefix="select"
// // />
// // </ReflexElement>
// // </ReflexContainer>
// // </ReflexElement>)

// this.setState({options : []}, () =>{
//     this.props.updateEquivsProp(newEquivs)
// })


// equiv_to_option(){

//     var options = []

//     for(var equiv in  this.state.equivs){
        
//         options.push(<FormControlLabel key={equiv+"equiv"} value={JSON.stringify(this.state.equivs[equiv])} control={<Radio />} label={Object.keys(this.state.equivs[equiv][0].graph).toString() + " === " +  Object.keys(this.state.equivs[equiv][1].graph).toString()} />)
            
//     }
    

//     if(options.length == 0){

//         return(<p>Define an equivalence!</p>)

//     }

//     this.setState({selected_equiv : JSON.stringify(this.state.equivs[0])})

//     const handleChange = (event) => {
//         this.setState({selected_equiv: event.target.value});
//       };

//     return (<FormControl>
//         <FormLabel id="demo-radio-buttons-group-label">Equivs</FormLabel>
//         <RadioGroup
//           aria-labelledby="demo-radio-buttons-group-label"
//           name="radio-buttons-group"
//           value={JSON.stringify(this.state.equivs[0])}
//           onChange={handleChange.bind(this)}>
//         {options}
//         </RadioGroup>
//         </FormControl>)

  
// }


// submit_equiv(){

//     if(this.state.equiv_lhs == null || this.state.equiv_rhs == null){

//         alert("Equivs are not saved!");
//         return 

//     }

//     if(!this.state.equiv_lhs.hasOwnProperty("graph") || !this.state.equiv_rhs.hasOwnProperty("graph")){

//         alert("JSON is not correct format")
//         return 
    
//     }

//     if(Object.keys(this.state.equiv_lhs.graph).length == 0 && Object.keys(this.state.equiv_lhs.graph).length == 0){

//         alert("Both graphs can't be empty")
//         return
//     }

//     var newEquivs = [...this.state.equivs]

//     newEquivs.push([this.state.equiv_lhs,this.state.equiv_rhs])

// }


  // updateEquivs(newEquivs) {

  //   var newGraphdata = { ...this.state.graphdata }

  //   newGraphdata["equivs"] = newEquivs

  //   this.setState({ graphdata: newGraphdata })

  // }

      // if (this.state.graphdata.hasOwnProperty('equivs')) {
    //   var graphEquivs = this.state.graphdata['equivs']
    // } else {
    //   var graphEquivs = []
    // }