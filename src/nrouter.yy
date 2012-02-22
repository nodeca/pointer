%start pattern

%%

pattern
  : route EOF { return $1 }
  ;

route
  : parts { $$ = $1; }
  | "" { $$ = []; }
  ;

parts
  : part { $$ = [$1]; }
  | parts part { $1.push($2); $$ = $1; }
  ;

part
  : OPEN_OPTIONAL route CLOSE_OPTIONAL { $$ = new yy.OptionalGroupNode($2); }
  | OPEN_PARAM param_name CLOSE_PARAM { $$ = new yy.ParamNode($2); }
  | STRING { $$ = new yy.StringNode($1); }
  ;

param_name
  : PARAM
  | param_name PARAM { $$ = $1 + $2; }
  ;
