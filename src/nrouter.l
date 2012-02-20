%x ESCAPED MACROS

%%

[^\x00]*?/[{()}]            {
                              if (yytext.slice(-1) !== "\\")
                                this.begin("MACROS");

                              if (yytext.slice(-1) === "\\")
                                yytext = yytext.substr(0, yyleng-1),
                                this.begin("ESCAPED");

                              if (yytext)
                                return "STRING";
                            }

[^\x00]+                    { return "STRING"; }

<ESCAPED>[^\x00]+?/[{()}]   { this.popState(); return "STRING"; }

<MACROS>"{"                 { return "OPEN_PARAM"; }
<MACROS>[a-zA-Z_.$-]+?/"}"  { return "PARAM_NAME"; }
<MACROS>"}"                 { this.popState(); return "CLOSE"; }

<MACROS>"("                 { this.popState(); return "OPEN_OPTIONAL"; }
<MACROS>")"                 { this.popState(); return "CLOSE"; }

<INITIAL><<EOF>>            { return 'EOF'; }
