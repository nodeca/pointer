%x

//  AVAILABLE TOKENS: OPEN_GROUP, OPEN_PARAM, PARAM_NAME, CLOSE, STRING, EOF
//
//  Example: /foo/{bar}(.{baz})
//           STRING         /foo/
//           OPEN_PARAM     {
//           PARAM_NAME     bar
//           CLOSE          }
//           OPEN_GROUP     (
//           STRING         .
//           OPEN_PARAM     {
//           PARAM_NAME     baz
//           CLOSE          }
//           CLOSE          )
//           EOF

// TODO: implement tokenizer
// TODO: remove dbg once tokenizer finished

%{
  function dbg(k) { console.log(k + ': "' + yytext + '"'); }
%}

%%

<INITIAL><<EOF>>              { return 'EOF'; }
