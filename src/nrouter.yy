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
  : OPEN_GROUP parts CLOSE { $$ = new yy.OptionalGroupNode($2); }
  | OPEN_PARAM PARAM_NAME CLOSE { $$ = new yy.ParamNode($2); }
  | STRING { $$ = new yy.StringNode($1); }
  ;
