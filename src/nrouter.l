%x PARAM

%%

[^\x00]*?/("{")               {
                                if (yytext.slice(-1) !== "\\") this.begin("PARAM");
                                if (yytext) return 'CONTENT';
                              }
[^\x00]+                      { return 'CONTENT'; }
<PARAM>"{"                    { return 'OPEN_PARAM'; }
<PARAM>[^}]+/"}"              { return 'PARAM_NAME'; }
<PARAM>"}"                    { this.popState(); return 'CLOSE_PARAM'; }
<INITIAL,PARAM><<EOF>>        { return 'EOF'; }
