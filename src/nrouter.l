%x escape param optional

%{
  this.currState = function () {
    return this.conditionStack[this.conditionStack.length-1];
  };

  this.dbg = function (msg) {
    console.log(msg + ": " + yytext);
  };
%}

%%

<*>"\\"/[{}()]              { this.begin("escape"); }
<escape>[{}()]              {
                              this.popState();
                              return "param" === this.currState() ? "PARAM" : "STRING";
                            }

<*>"{"                      { this.begin("param"); return "OPEN_PARAM"; }
<param>"}"                  { this.popState(); return "CLOSE_PARAM"; }

<*>"("                      { this.begin("optional"); return "OPEN_OPTIONAL"; }
<optional>")"               { this.popState(); return "CLOSE_OPTIONAL"; }

<*>.+?                      {
                              return "param" === this.currState() ? "PARAM" : "STRING";
                            }

<INITIAL,optional><<EOF>>   { return 'EOF'; }
