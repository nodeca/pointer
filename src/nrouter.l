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
<*>"\\"/![{}()]             { return "param" === this.currState() ? "PARAM" : "STRING"; }
<*>[^{}()\\]+               { return "param" === this.currState() ? "PARAM" : "STRING"; }


<*>"{"                      { this.begin("param"); return "OPEN_PARAM"; }
<*>"("                      { this.begin("optional"); return "OPEN_OPTIONAL"; }

<param>"}"                  { this.popState(); return "CLOSE_PARAM"; }
<optional>")"               { this.popState(); return "CLOSE_OPTIONAL"; }

<INITIAL>"}"|")"            { return "STRING"; }
<INITIAL,optional><<EOF>>   { return 'EOF'; }
