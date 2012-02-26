%x escape param optional

%%

<*>"\\"/[{}()]              { this.begin("escape"); }
<escape>[{}()]              { this.popState(); return "STRING"; }
<*>"\\"/![{}()]             { return "STRING"; }
<*>[^{}()\\]+               { return "STRING"; }


<*>"{"                      { this.begin("param"); return "OPEN_PARAM"; }
<*>"("                      { this.begin("optional"); return "OPEN_OPTIONAL"; }

<param>"}"                  { this.popState(); return "CLOSE"; }
<optional>")"               { this.popState(); return "CLOSE"; }

<INITIAL>"}"|")"            { return "STRING"; }
<INITIAL,optional><<EOF>>   { return 'EOF'; }
