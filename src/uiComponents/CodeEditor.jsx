import React from "react";
import ReactDOM from "react-dom";
import AceEditor from "react-ace";

import ace from "ace-builds/src-noconflict/ace";
import 'ace-builds'
import 'ace-builds/webpack-resolver'
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import 'brace/ext/searchbox';
import langTools from "ace-builds/src-noconflict/ext-language_tools"
import "brace/mode/json";
 


function CodeEditor(props){
  
  var myCompleter ={
      getCompletions: function(editor, session, pos, prefix, callback) {
              var completions = [];
              ["\"expand\" : { ... }", "\"decompose\" : { ... }", "\"substitute\" : {\n\t\t\t\t\"lhs\" : {},\n\t\t\t\t\"rhs\" : {}\n\t\t\t\t}"].forEach(function(w) {
      
                  completions.push({
                      caption: w.split(":")[0],
                      value: w,
                      meta: "Transformation",
                      completer: {
                        insertMatch: function(editor, data) {
                            
                            editor.completer.insertMatch({value: data.value});
                            // Here you can get the position and set the cursor
                            var pos = editor.selection.getCursor(); //Take the latest position on the editor
                            
                            if (data.caption === "\"substitute\" "){
  
                              editor.gotoLine(pos.row-1, pos.column+9); //This will set your cursor in between the brackets
                              
                            }
  
                        }
                      }
                    
      
                  });
              });
  
              for(var elm in props.mon_packs){
                completions.push({
                  caption: props.mon_packs[elm],
                  value: props.mon_packs[elm],
                  meta: "Monolithic Package",
                  completer: {
                    insertMatch: function(editor, data) {
                        
                        editor.completer.insertMatch({value: data.value});

                  }
                }
              });
              }

              for(var elm in props.mod_packs){
                completions.push({
                  caption: props.mod_packs[elm],
                  value: props.mod_packs[elm],
                  meta: "Modular Package",
                  completer: {
                    insertMatch: function(editor, data) {
                        
                        editor.completer.insertMatch({value: data.value});
                        // Here you can get the position and set the cursor
                  }
                }
              });
              }
  
              ["\"graph\" : {\n \"\" : [\n[\"\",\"\"]\n] \n}", 
              "\"oracles\" : [\n[\"\",\"\"]\n]",
               "\"to_run\" : {\n\t\t\"GraphName\" : {\n\t\t\t\n\t\t}\n\t}",
                "\"history\" : [\n\t\t\n\t]"].forEach(function(w) {
      
                completions.push({
                    caption: w.split(":")[0],
                    value: w,
                    meta: "Graphdata Template",
                    completer: {
                      insertMatch: function(editor, data) {
                          
                          editor.completer.insertMatch({value: data.value});
                          // Here you can get the position and set the cursor
                          var pos = editor.selection.getCursor(); //Take the latest position on the editor
                          
                          if(data.caption === "\"oracles\" "){
                            editor.gotoLine(pos.row, pos.column + 1);  
                          }else{
                            editor.gotoLine(pos.row-2, pos.column + 1); //This will set your cursor in between the brackets
                      }
                    }
                  }
                });
            });
  
              callback(null, completions);
          }
      }
  var getLineNumber = props.getLineNumber
      var text = props.text
      var onSubmit = props.onSubmit

      console.log(props)

        var commands = [
          {
            name: "submit",
            bindKey: { win: "Ctrl-S", mac: "Command-S" },
            exec: (editor) => {
              console.log("bengbengbon")
              try {
              onSubmit(JSON.parse(editor.getValue()))
              } catch {
                alert("JSON is incorrectly formatted!")
              }
            } 
          },
          {
            name: "jump_to_selected",
            bindKey: { win: "Ctrl-J", mac: "Command-J" },
            exec: (editor) => {


              editor.resize(true);

              editor.setOptions({
                maxLines: 10000,
                autoScrollEditorIntoView: true,
            })

              editor.gotoLine(getLineNumber(),0);
              
            }
          }
        ];
        
        langTools.setCompleters([])
        langTools.addCompleter(myCompleter);
        
        return (
          <AceEditor
            mode="json"
            width="100%"
            height="inherit"
            id="editor"
            theme="textmate"
            value={text}
            commands={commands}
            setOptions={{
              enableLiveAutocompletion: true,
            }}
            highlightActiveLine={true}
            showPrintMargin={true}
            focus={true}
            minLines={100}
            maxLines={Infinity}
            showGutter={true}
          />
        );
      };


    


// CodeEditor.defaultProps = {
//   mainEditor: false
// };





export default CodeEditor;