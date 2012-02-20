%x ESCAPED MACROS

%%

[^\x00]*?/[{(]            {
                            if (yytext.slice(-1) !== "\\") this.begin("MACROS");
                            if (yytext.slice(-1) === "\\") yytext = yytext.substr(0, yyleng-1), this.begin("ESCAPED");
                            if (yytext) return "STRING";
                          }

[^\x00]+                  { return "STRING"; }

<ESCAPED>[^\x00]+?/[{(]   { this.popState(); return "STRING"; }

<MACROS>"{"               { return "OPEN_PARAM"; }
<MACROS>"("               { this.begin("INNER"); return "OPEN_OPTIONAL"; }
<MACROS>[^}]+/"}"         { return "PARAM_NAME"; }
<MACROS>"}"               { this.popState(); return "CLOSE_PARAM"; }
<MACROS>")"               { this.popState(); return "CLOSE_OPTIONAL"; }

<INITIAL><<EOF>>          { return 'EOF'; }
