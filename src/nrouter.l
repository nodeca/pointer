%x param optional

%%

<INITIAL,optional>.*?/[{(]      {
                                  var last_char = yytext.slice(-1),
                                      next_char = this.input();

                                  if (last_char === "\\")
                                    yytext = (yytext.substr(0, yyleng-2) + next_char),
                                    return "STRING";

                                  if (next_char === "{") this.begin("param");
                                  if (next_char === "(") this.begin("optional");

                                  yytext = (yytext.substr(0, yyleng-1),
                                  if (yytext) return "STRING";
                                }

.+                              { return "STRING"; }
<<EOF>>                         { return "EOF"; }

<param>.+?/"}"                  {
                                  return "PARAM_NAME";
                                }
<param>"}"                      {
                                  this.popState();
                                  return "CLOSE";
                                }
<optional>")"                   {
                                  this.popState();
                                  return "CLOSE";
                                }
