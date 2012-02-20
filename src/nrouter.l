%x ESCAPED MACROS PARAM

%%

[^\x00]*?/[{()]           {
                            if (yytext.slice(-1) !== "\\")
                              this.begin("MACROS");

                            if (yytext.slice(-1) === "\\")
                              yytext = yytext.substr(0, yyleng-1),
                              this.begin("ESCAPED");

                            if (yytext)
                              return "STRING";
                          }

[^\x00]+                  { return "STRING"; }

<ESCAPED>[^\x00]+?/[{()]  { this.popState(); return "STRING"; }

<MACROS>"{"               { this.begin("PARAM"); return "OPEN_PARAM"; }
<PARAM>[^}]+?/"}"         { this.popState(); return "PARAM_NAME"; }
<MACROS>"}"               { this.popState(); return "CLOSE_PARAM"; }

<MACROS>"("               { this.popState(); return "OPEN_OPTIONAL"; }
<MACROS>")"               { this.popState(); return "CLOSE_OPTIONAL"; }

<INITIAL><<EOF>>          { return 'EOF'; }
