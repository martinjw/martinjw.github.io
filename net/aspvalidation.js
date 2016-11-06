var aspValidomatic = {
isAsp2 : true, //include asp2 attributes
numInt : 0, //max number of integers)
numScale : 0, //scale (number after dp)
result : 10, //max number (1^num of integers)
decorate : true, //include html formatting
minLength : 0, //min length for a varchar
maxLength : 4000, //max length for a varchar
control: "TextBox1", //controlToValidate
open : "&lt;",
close : "&gt;",

showValidation: function () {
	var obj= document.getElementById("type");
	out= document.getElementById("output");
	this.isAsp2= document.getElementById("isAsp2").checked;
	var value= obj.options[obj.selectedIndex].value;
	if (value == "") value= obj.options[obj.selectedIndex].text; //IE
	
	out.innerHTML= "";
	mu.hideMe("precisionscale");
	mu.hideMe("stringlength");
	if (value == "varchar") {
		mu.showMe("stringlength");
		this.getMaxLength();
	}
	if (value == "numeric/decimal") {	//using default 18 digit precision- adjust scale as required!!
		 mu.showMe("precisionscale");
		 this.result= this.findPrecision();
	}
	out.innerHTML= this.writeOut(value);
},
getMaxLength: function () {
	var j= parseInt(mu.getValue("MaxLength"))
	if (!isNaN(j)) this.maxLength = j;
},
writeOut : function (value, isRequired) {
	var s = "";
	if(arguments.length == 2) {
		if(isRequired == true) s = this.addRequiredValidator();
	}
	switch (value.toLowerCase()) {
		case "char":
			this.minLength = this.maxLength; //fixed length
		case "text": //translate to sql type
		case "string": //translate to sql type
		case "varchar":
			return s + this.addRegexLengthValidator();
			break;
		case "datetime":
			return s + this.addRangeValidator("1753/01/01","9999/12/31","Date");
			break;
		case "smalldatetime":
			return s + this.addRangeValidator("1900/01/01","2079/06/06","Date");
			break;
		case "bigint":
			return s + this.addRangeValidator("-9223372036854775808","9223372036854775807", "Currency");
			break;
		case "int":
			return  s + this.addCompareValidator("Integer");
			//if (value=="int") addRangeValidator("-2147483648","2147483647", "Integer");
			break;
		case "smallint":
			return s + this.addRangeValidator("-32768","32767", "Integer");
			break;
		case "tinyint":
			return s + this.addRangeValidator("0","255", "Integer");
			break;
		case "money":
			return s + this.addRangeValidator("-922337203685477.5808","922337203685477.5807","Currency");
			break;
		case "smallmoney":
			return s + this.addRangeValidator("- 214748.3648","214748.3647","Currency");
			break;
		case "numeric/decimal":	//using default 18 digit precision- adjust scale as required!!
			return s + this.addRangeValidator(-this.result,this.result,"Currency") +
				   this.addComment("NB: regex is not culture aware (or aware of ',' groups)") +
				   this.addRegexValidator();
			break;
	}
	return s;
},
findPrecision: function () {
 var p= mu.get("precision");
 var s= mu.get("scale");
 var ip = parseInt(p.value);
 var is= parseInt(s.value);
 if (isNaN(ip)) {
    p.value= "38";
    ip = 38;
 }
 if (isNaN(is)) {
    s.value= "0";
    is = 0;
 }
 if ((is + ip) > 38) {
	ip = 38- is;
	p.value= ip;
 }
 if (is> ip) {
	is= ip;
      s.value= ip;
 }
 return this.setPrecisionScale( ip, is );
},
setPrecisionScale: function (prec, scale) {
 this.numInt = prec - scale;
 this.numScale = scale;
 var result = "";
 for (var i= 0; i< this.numInt; i++) result+= "9";
 result+=".";
 for (var i= 0; i< this.numScale; i++) result+= "9";
 return parseInt(result);
},
addComment: function (t) {
	var s= this.open + "!--" + t + "--"+ this.close + this.br();
	return s;
},
openSpan: function (t) {
	if(this.decorate) {
		return "<span class=\"" + t + "\">";
	}
	return "";
},
closeSpan: function () {
	if(this.decorate) {
		return "<\/span>";
	}
	return "";
},
br: function () {
	if(this.decorate) {
		return "<br\/>";
	}
	return "\n";
},
addRequiredValidator: function (t) {
	var erm= "Must be entered" ;
	var s = this.open + this.openSpan("e1") + "asp:RequiredFieldValidator" + this.closeSpan() + " ";
	s+= this.addAttribute("id",this.control + "RequiredVal1") + this.addAttribute("ControlToValidate",this.control);
	if(this.isAsp2) s+=this.addAttribute("SetFocusOnError","true");
	s+=this.br();
	s+= this.addAttribute("Text","*") + this.addAttribute("ErrorMessage",erm) + this.addAttribute("ToolTip",erm) + this.br();
	s+= this.addAttribute("Display","Dynamic") + this.addAttribute("runat","server") + "/" + this.close + this.br();
	return s;
},
addRegexValidator: function (t) {
	var erm= "Must be a number with a maximum of "+ this.numScale + " decimal places" ;
	var s = this.open + this.openSpan("e1") + "asp:RegularExpressionValidator" + this.closeSpan() + " ";
	s+= this.addAttribute("id",this.control + "RegexVal1") + this.addAttribute("ControlToValidate",this.control);
	if(this.isAsp2) s+=this.addAttribute("SetFocusOnError","true");
	s+=this.br();
	s+=this.addAttribute("ValidationExpression","^(-)?\\d{0," + this.numInt + "}(\\.\\d{0," + this.numScale + "})?$") + this.br();
	s+= this.addAttribute("Text","*") + this.addAttribute("ErrorMessage",erm) + this.addAttribute("ToolTip",erm) + this.br();
	s+= this.addAttribute("Display","Dynamic") + this.addAttribute("runat","server") + "/" + this.close + this.br();
	return s;
},
addRegexLengthValidator: function (t) {
	if(this.maxLength<1) return ""; //0
	var erm,s;
	if (this.minLength == this.maxLength) { //fixed length
		erm= "Must be "+ this.maxLength + " characters long";
	} else if (this.minLength> 0) { //min and max
		erm= "Must be between "+ this.minLength + " and "+ this.maxLength + " characters long";
	} else { //0 to max
		erm= "Must be a maximum of "+ this.maxLength + " characters long";
	}
	s = this.open + this.openSpan("e1") + "asp:RegularExpressionValidator" + this.closeSpan() + " ";
	s+= this.addAttribute("id",this.control + "RegexVal1") + this.addAttribute("ControlToValidate",this.control);
	if(this.isAsp2) s+=this.addAttribute("SetFocusOnError","true");
	s+=this.br();
	s+=this.addAttribute("ValidationExpression","^[\\S\\s]{"+this.minLength +"," + this.maxLength + "}$") + this.br();
	s+= this.addAttribute("Text","*") + this.addAttribute("ErrorMessage",erm) + this.addAttribute("ToolTip",erm) + this.br();
	s+= this.addAttribute("Display","Dynamic") + this.addAttribute("runat","server") + "/" + this.close + this.br();
	return s;
},
addCompareValidator: function (t) {
	var erm= "Must be a "+ t;
	if (t=="Integer") erm= "Must be an integer";
	var s = this.open + this.openSpan("e1") + "asp:CompareValidator" + this.closeSpan() + " ";
	s+= this.addAttribute("id",this.control + "Compare1") + this.addAttribute("ControlToValidate",this.control);
	if(this.isAsp2) s+=this.addAttribute("SetFocusOnError","true");
	s+=this.br()+this.addAttribute("Type",t) + this.br();
	s+=this.addAttribute("Operator","DataTypeCheck")+this.br();
	s+= this.addAttribute("Text","*") + this.addAttribute("ErrorMessage",erm) + this.addAttribute("ToolTip",erm) + this.br();
	s+= this.addAttribute("Display","Dynamic") + this.addAttribute("runat","server") + "/" + this.close + this.br();
	return s;
},
addRangeValidator: function (min, max, t) {
	var erm= "Must be between "+ cleanDate(min) + " and "+ cleanDate(max);
	var s= this.open + this.openSpan("e1") + "asp:RangeValidator" + this.closeSpan() + " ";
	s+= this.addAttribute("id",this.control + "Range1") + this.addAttribute("ControlToValidate",this.control);
	if(this.isAsp2) s+=this.addAttribute("SetFocusOnError","true");
	s+=this.br()+ this.addAttribute("MinimumValue",min) + this.br();
	s+= this.addAttribute("MaximumValue",max) + this.br();
	s+= this.addAttribute("Type",t) + this.br();
	s+= this.addAttribute("Text","*") + this.addAttribute("ErrorMessage",erm) + this.addAttribute("ToolTip",erm) + this.br();
	s+= this.addAttribute("Display","Dynamic") + this.addAttribute("runat","server") + "/" + this.close + this.br();
	return s;
		function cleanDate(f) {
		var s = f.toString();
		if (s.indexOf("/")>0) return s.substring(0,s.indexOf("/"));
		return s;
		}
},
addAttribute: function (attribute, value) {
 return this.openSpan("attr") + attribute + this.closeSpan() + "=\"" + this.openSpan("attv") + value + this.closeSpan() + "\" ";
}
}