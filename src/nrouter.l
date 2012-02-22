%x esc macros param inner

%%

<INITIAL,inner>[^\x00]*?/[{}()] {
                                  if (yytext.slice(-1) !== "\\")
                                    this.begin("macros");
                                  if (yytext.slice(-1) === "\\")
                                    yytext = yytext.substr(0, yyleng-1),
                                    this.begin("esc");
                                  if (yytext)
                                    return "STRING";
                                }
<esc>[^\x00]+?/[{}()]           {
                                  this.popState();
                                  return "STRING";
                                }
<macros>"{"                     {
                                  this.popState();
                                  this.begin("param");
                                  return "OPEN_PARAM";
                                }
<param>.+?/"}"                  {
                                  return "PARAM_NAME";
                                }
<param>"}"                      {
                                  this.popState();
                                  this.popState();
                                  return "CLOSE";
                                }
<macros>"("                     {
                                  this.popState();
                                  this.begin("inner");
                                  return "OPEN_OPTIONAL";
                                }
<inner>")"                      {
                                  this.popState();
                                  this.popState();
                                  return "CLOSE";
                                }
<INITIAL>[^\x00]+               { return "STRING"; }
<INITIAL><<EOF>>                { return 'EOF'; }
