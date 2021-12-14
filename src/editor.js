import React from "react";
import ReactDOM from "react-dom";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";

var myCompleter ={
    getCompletions: function(editor, session, pos, prefix, callback) {
            var completions = [];
            ["word1", "word2"].forEach(function(w) {
    
                completions.push({
                    value: w,
                    meta: "my completion",
    
                });
            });
            callback(null, completions);
        }
    }

const langTools = ace.acequire('ace/ext/language_tools');

langTools.addCompleter(myCompleter);

function TextEditor(props) {

  return (
<>      <AceEditor
        mode="json"
        theme="dreamweaver"
        onChange={(value, stat) => {
          console.log("onChange", value, stat);
        }}
        value={props.text}
        name="UNIQUE_ID_OF_DIV"
        editorProps={{ $blockScrolling: true }}
      />
 </>
  );
};

export default TextEditor;