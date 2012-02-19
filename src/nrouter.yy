%start pattern

%%

pattern
  : route EOF { return $1 }
  ;

route
  : parts { $$ = [$1]; }
  | "" { $$ = '2'; }
  ;

parts
  : part { $$ = [$1]; }
  | parts part { $1.push($2); $$ = $1; }
  ;

part
  : OPEN_PARAM PARAM_NAME CLOSE_PARAM { $$ = new yy.ParamNode($2); }
  | CONTENT { $$ = new yy.StringNode($1); }
  ;
