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
  : OPEN_OPTIONAL route CLOSE { $$ = new yy.OptionalGroupNode($2); }
  | OPEN_PARAM substrings CLOSE { $$ = new yy.ParamNode($2); }
  | STRING { $$ = new yy.StringNode($1); }
  ;

substrings
  : STRING
  | substrings STRING { $$ = $1 + $2; }
  ;
