//I started writing this in 1997 (just vb6 and asp then) so this isn't pretty

//general utilities
function trim(s)
{
   return s.replace(/^\s*|\s*$/g,"");
}
if (!Array.prototype.filter) {
  Array.prototype.filter = function(fun /*, thisp*/) {
    var len = this.length >>> 0;
    if (typeof fun != "function")
      throw new TypeError();

    var res = new Array();
    var thisp = arguments[1];
    for (var i = 0; i < len; i++) {
      if (i in this) {
        var val = this[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, this))
          res.push(val);
      }
    }
    return res;
  };
}


//the huge object that generates everything
function generate() {
	//our output is two arrays which we shall join
    var locals= [];
    var props= [];
	var ado = {fill:[], parall:[], parpk:[], val:[], init: []};
	var sql = {sqlCols:[], sqlPKeys: [], sqlTypes: [], sqlPKTypes: []};
	var open = "<"; //"&lt;"
	var close = ">"; //"&gt;"
	var sclass;
	var isDirtyName, tableName, hbm;
	var useINPC = false;
	var identityColumn = ""; //there can only be one identity column
	var primaryKeyNames = ""; //used by AspGridView
	var primaryKeyName = "";
	var primaryKeyType = "";
	
    var input= document.getElementById("Input").value;
    var lang= mu.getSelect("Language");
    var out= document.getElementById("Output");
	var useTemplate = document.getElementById("UseTemplate").checked;
	tableName = document.getElementById("TableName").value;
	
	if (lang== "C#inpc") useINPC = true;
	if (lang== "SQL") useTemplate = false;
	if (useTemplate) {
		if (lang== "C#C") lang="C#"; //templates aren't concise, sorry
		if (lang== "C#inpc") lang="C#"; //c# template includes INotifyPropertyChanged
		useINPC = true;
		isDirtyName = document.getElementById("IsDirty").value;
		createLocal(lang, isDirtyName, BooleanByLang(lang));
		switch(lang) {
		    case "VB6":
				createPropVB6(isDirtyName, BooleanByLang(lang));
                break;
            case "VB":
				createPropVB(isDirtyName, BooleanByLang(lang));
                break;
            case "C#":
				createPropC(isDirtyName, BooleanByLang(lang));
		}
	}
    var lines= input.split('\n');
	if (lang == "ASP3") {
		locals[locals.length]= open+ 'form action=\"' + open + '%= Request.ServerVariables(\"Script_Name\")%' + close + '\" method=\"post\"' + close;
		locals[locals.length]= open+"!--#include file=\"PageInclude.asp\"--" + close;
	}
	if (lang == "ASPX") {
		aspValidomatic.decorate = false;
		aspValidomatic.minLength = 0;
		aspValidomatic.open = open;
		aspValidomatic.close = close;
	}
	if (lang == "DATATABLE") locals[locals.length] = "DataTable dt = new DataTable();";
	
	var columnCount = -1;
    for (var i=0; i< lines.length; i++) {
        var item = lines[i].replace(/[\s><"]/gi," "); //remove tabs, quotes
        item = trim(item); //and remove leading spaces
        if (item == "") continue;
		if (item.indexOf("CREATE TABLE") != -1) continue; //this is ddl
		if (item.indexOf("ON [PRIMARY]") != -1) continue; //this is ddl
		columnCount++;
		var isPKey = false; //asterisk anywhere in line= primary key
		if (item.indexOf("*") != -1) {
			isPKey = true;
			item = item.replace(/\*/gi, "");
		}
		var isRequired = false; // NOT NULL anywhere in line = mandatory
		if (item.toUpperCase().indexOf(" NOT NULL") != -1) {
			isRequired = true;
		}
		var maxLength = 0, maxLengthHtml = "";
		
		//work out the column name
		item = item.replace(/ bytes/i, "");
        var splitted= item.split(" ");
        var name= splitted[0]; //maybe spaces-chars after
		name = fixName(name);
		while(name=="" && splitted.length>1) {
			splitted.shift(); //get rid of the first bit and start looking
			name = fixName(splitted[0]);
		}
		
		if (item.toUpperCase().indexOf(" IDENTITY(") != -1) {
			identityColumn = name;
			isPKey = true;
		}
		
		//work out the column type
        var type= "";
        if (splitted.length>1) {
			var typebit= splitted[1].toLowerCase();
			//[quoted]
			if(typebit.indexOf("[")!= -1) typebit = typebit.replace(/\[/,"");
			if(typebit.indexOf("]")!= -1) typebit = typebit.replace(/\]/,"");
			//alert(typebit );
	        type= getType(typebit, lang);
			if (type.toLowerCase()=="string") {
				maxLength= getLength(typebit);
				if (maxLength>0) maxLengthHtml = "maxlength=\"" + maxLength + "\" ";
			}
        } else {
			type= StringByLang(lang);
        }
        if (isPKey) {
            primaryKeyName = name;
            primaryKeyType = type;
        }
        
		createLocal(lang, name, type);
		//for the template, get all the sql as well
		if (useTemplate) createPropSql(name, type, isPKey);
		
        switch(lang) {
            case "ASPGRIDVIEW":
                if (isPKey) {
                    if (primaryKeyNames.length > 0) primaryKeyNames + ", " + name;
                    else primaryKeyNames = name;
                } else {
                    var boundField = "\t\t\t<asp:BoundField HeaderText=\"" + name + "\" DataField=\"" + name + "\"";
                    if (type.toLowerCase() == "datetime")
                    {
                        boundField += " DataFormatString=\"{0:dd/MM/yyyy}\" HtmlEncode=\"False\"";
                    }
                    boundField += " />";
                    props[props.length] = boundField;
                }
                break;
            case "DATATABLE":
                props[props.length]= "dt.Columns.Add(\"" + name + "\", typeof(" + type + "));";
				break;
			case "HBM":
				hbm = "\t\t<property ";
				if(isPKey) hbm = "\t\t<id ";
				hbm += "name=\"" + name + "\" column=\"`" + name + "`\" type=\"" + type + "\" ";
				if(isPKey) {
					if (type.toLowerCase()=="int")
						hbm += "unsaved-value=\"0\">\n\t\t\t<generator class=\"native\" />\n\t\t</id>";
					else
						hbm += "unsaved-value=\"\">\n\t\t\t<generator class=\"assigned\" />\n\t\t</id>";
				} else {
					if(maxLength > 0) hbm+= "length=\"" + maxLength + "\" ";
					if(isRequired) hbm+= "not-null=\"true\" ";
					hbm += "/>";
				}
                props[props.length]= hbm;
				break;
			case "SQL":
				createPropSql(name, type, isPKey);
				break;
            case "DIV":
				props[props.length]= ""; //blank line
                props[props.length]= tag("div") + createPropHtmlLabel(name);
				props[props.length]= createPropHtmlInput(name, type, maxLengthHtml, "") + tag("/div");
                break;
            case "HTML":
				props[props.length]= ""; //blank line
                props[props.length]= tag("tr") + tag("td") + createPropHtmlLabel(name) + tag("/td");
                props[props.length]= tag("td") + createPropHtmlInput(name, type, maxLengthHtml, "") + tag("/td") + tag("/tr");
                break;
            case "ASP3":
				props[props.length]= ""; //blank line
                props[props.length]= tag("tr") + tag("td") + createPropHtmlLabel(name) + tag("/td");
				props[props.length]= tag("td") + createPropHtmlInput(name, type, maxLengthHtml, open+"%=Page.Value(\"" + name + "\") %"+close) + tag("/td") + tag("/tr");
                break;
			case "ASPX":
				props[props.length]= ""; //blank line
                props[props.length]= tag("tr") + tag("td") + open + "asp:Label runat=\"server\" ID=\"lab" + name + "\" AssociatedControlID=\"txt" + name + "\" Text=\"" + name + "\"/" + close + tag("/td");
				aspValidomatic.control = "txt" + name;
				aspValidomatic.maxLength = maxLength;
                props[props.length]= tag("td") + open + "asp:TextBox runat=\"server\" ID=\"txt" + name + "\" Text=\"\" " + maxLengthHtml + "/" + close + aspValidomatic.writeOut(type, isRequired) + tag("/td") + tag("/tr");
                break;
			case "RZR":
				props[props.length]= ""; //blank line
				if(isPKey) {
					props[props.length]= "   @Html.HiddenFor(m =" + close + " m." + name + ")";
				} else {
					props[props.length]= "  " + tag("div");
					props[props.length]= "   @Html.LabelFor(m =" + close + " m." + name + ")";
					props[props.length]= "   @Html.EditorFor(m =" + close + " m." + name + ")";
					props[props.length]= "   @Html.ValidationMessageFor(m =" + close + " m." + name + ")";
					props[props.length]= "  " + tag("/div");
				}
                break;
			case "VB6":
				createPropVB6(name, type, isRequired, maxLength);
				if (useTemplate) {
					adoInitVB6(name, type);
					ado.parall[ado.parall.length]= adoParVB6(name, type);
					if(isPKey) ado.parpk[ado.parpk.length]= adoParVB6(name, type);
					createFillVB6(name, type);
				}
                break;
            case "VB":
				createPropVB(name, type, isRequired, maxLength);
				if (useTemplate) {
					adoInitVB(name, type);
					ado.parall[ado.parall.length]= adoParVB(name, type);
					if(isPKey) ado.parpk[ado.parpk.length]= adoParVB(name, type);
					createFillVB(name, type, columnCount);
				}
                break;
            case "VIEWSTATE":
				props[props.length]= ""; //blank line
                props[props.length]= "///<summary>\n///" + name + "\n///</summary>";
                props[props.length]= "public " + type + " " + name + " {";
                props[props.length]= "\tget\n\t{\n\t\tobject o = ViewState[\"" + name +"\"];";
				props[props.length]= "\t\tif (o != null && o is " + type + ")";
				props[props.length]= "\t\t\treturn (" + type + ")o; //exists";
				props[props.length]= "\t\treturn default(" + type + "); //not exists, default";
				props[props.length]= "\t}";
                props[props.length]= "\tset{ViewState[\"" + name +"\"] = value;}";
                props[props.length]= "}";
				break;
            case "C#C":
				props[props.length]= ""; //blank line
                props[props.length]= "///<summary>\n///" + name + "\n///</summary>";
                props[props.length]= "public " + type + " " + name + " {";
                props[props.length]= "\tget{return " + camelName(name) +";}";
                props[props.length]= "\tset{" + camelName(name) +" = value;}";
                props[props.length]= "}";
				break;
            case "C#inpc":
				createPropC(name, type, isRequired, maxLength, useINPC);
            default:
				createPropC(name, type, isRequired, maxLength, useINPC);
				if (useTemplate) {
					adoInitC(name, type);
					if(!isPKey)
						ado.parall[ado.parall.length]= adoParC(name, type);
					if(isPKey) ado.parpk[ado.parpk.length]= adoParC(name, type);
					createFillC(name, type, columnCount);
				}
        }
    }
	if (lang == 'HTML' || lang == "ASP3" || lang == "ASPX") {
		props.unshift(open+'table'+close); //inserts at start of array
		props[props.length]= open+'/table'+close;
	}
	if (lang == "RZR") {
		props.unshift("  @Html.ValidationSummary(true)");
		props.unshift("@using (Html.BeginForm()) {");
		props[props.length]= "";
		props[props.length]= "  " + tag("div");
		props[props.length]= "    " + open + "input type=\"submit\" value=\"Save\" /" + close;
		props[props.length]= "  " + tag("/div");
		props[props.length]= "}";
	}
	if (lang == "SQL") {
		locals = sqlAssembly(sql, identityColumn);
	}
	if (lang == "HBM") {
		locals[locals.length] = "<?xml version=\"1.0\" encoding=\"utf-8\"?>";
		locals[locals.length] = "<hibernate-mapping xmlns=\"urn:nhibernate-mapping-2.2\" namespace=\"Northwind\" assembly=\"Northwind\">";
		locals[locals.length] = "\t<class name=\"" + tableName + "\" table=\"`" + tableName + "`\">";
	}
	if (lang == "ASPGRIDVIEW") {
	    var gridView = "\t<asp:GridView ID=\"gridView1\" runat=\"server\" AutoGenerateColumns=\"false\" ";
	    if (primaryKeyNames != "")
	        gridView += "DataKeyNames=\"" + primaryKeyNames + "\">";
	    gridView += "/>";
	    locals[locals.length] = gridView;
	    locals[locals.length] = "\t\t<Columns>";
	}
	var s = locals.join("\n") + "\n" + props.join("\n");
	if (lang == "HBM") {
		s += "\n\t</class>\n</hibernate-mapping>";
	}
	if (lang == "ASPGRIDVIEW") {
	    s += "\n\t\t</Columns>\n\t</asp:GridView>";
	}
	if (useTemplate) s = fillTemplate(identityColumn);
    out.value= s; //set a value of textarea, as innerHtml is normalized by IE into no line breaks...
	//end of function
   
    //nested functions
	function fillTemplate(identityColumn) {
		var s;
		if (lang == "VB6") 
			s = mu.getValue("VB6Template");
		else if (lang == "VB") 
			s = mu.getValue("VBTemplate");
		else 
			s = mu.getValue("CTemplate");
		var o = createSql(sql, identityColumn);
		if(ado.parpk.length == 0) InventPrimaryKey();
		s = s.replace(/\%TABLE\%/g, tableName);
		s = s.replace(/\%LOCALS\%/g, locals.join("\n"));
		s = s.replace(/\%PROPS\%/g, props.join("\n"));
		s = s.replace(/\%INIT\%/g, ado.init.join("\n"));
		s = s.replace(/\%VALID\%/g, ado.val.join("\n"));
		s = s.replace(/\%ADOALLPARAMETERS\%/g, ado.parall.join("\n"));
		s = s.replace(/\%ADOPKPARAMETERS\%/g, ado.parpk.join("\n"));
		s = s.replace(/\%ADOFILL\%/g, ado.fill.join("\n"));
		s = s.replace(/\%SELECTSQL\%/g, o.selectSql);
		s = s.replace(/\%INSERTSQL\%/g, o.insertSql);
		s = s.replace(/\%UPDATESQL\%/g, o.updateSql);
		s = s.replace(/\%DELETESQL\%/g, o.deleteSql);
		s = s.replace(/\%PKTYPE\%/g, primaryKeyType);
		s = s.replace(/\%PKNAME\%/g, primaryKeyName);

		var readIdentity = '';
		var adoPkOrIdentity = ado.parpk.join("\n");
		if (identityColumn != '')  {
		    if (lang == "VB6") {
		        //not supported
		    } else if (lang == "VB") {
		        adoPkOrIdentity = 'DbParameter id = cmd.CreateParameter()\n\t\t\tid.ParameterName = "@' + primaryKeyName + '"\n\t\t\tid.Direction = ParameterDirection.Output\n\t\t\tid.DbType = DbType.Int32\n\t\t\tcmd.Parameters.Add(id)';
		        readIdentity = primaryKeyName + " = id.Value As Integer";
		    } else {
		        adoPkOrIdentity = 'DbParameter id = cmd.CreateParameter();\n\t\t\tid.ParameterName = "@' + primaryKeyName + '";\n\t\t\tid.Direction = ParameterDirection.Output;\n\t\t\tid.DbType = DbType.Int32;\n\t\t\tcmd.Parameters.Add(id);';
		        readIdentity = primaryKeyName + " = (int)id.Value;";
		    }
		}
		s = s.replace(/\%ADOPKORIDENTITYPARAMETER\%/g, adoPkOrIdentity);
		s = s.replace(/\%READIDENTITY\%/g, readIdentity);
		return s;
	}
	
	//no primary key, so just take the first thing and use that
	function InventPrimaryKey() {
		var name = sql.sqlCols[0];
		var type = sql.sqlTypes[0];
		if (lang == "VB6") {
			ado.parpk[ado.parpk.length]= adoParVB6(name, type);
			ado.val[ado.val.length] = "\tIf (LenB(m_" + name + ") = 0) Then l_IsValid = False";
		}
		else if (lang == "VB") {
			ado.parpk[ado.parpk.length]= adoParVB(name, type);
			ado.val[ado.val.length] = "\tIf (String.IsNullOrEmpty(_" + name +")) Then _IsValid = False";
		}
		else {
			ado.parpk[ado.parpk.length]= adoParC(name, type);
			if(type == "string")
				ado.val[ado.val.length] = "\tif(String.IsNullOrEmpty(" + camelName(name) +"))  _isValid = false;";
			else //assume int but could be guid
				ado.val[ado.val.length] = "\tif(" + camelName(name) +" == 0)  _isValid = false;";
		}
	}
	
	//write an html label
	function createPropHtmlLabel(name) {
		return open+"label for=\"" + name + "\"" + close + name + tag("/label");
	}
	
	//write an html input tag
	function createPropHtmlInput(name, type, maxLengthHtml, value) {
		return open+"input type=\"text\" name=\"" + name + "\" id=\"" + name + "\" value=\"" + value + "\" " + maxLengthHtml + addClass(type) + "/" + close;
	}
	   
   //write an html tag
   function tag(element) {
		return open + element + close;
   }
   
   //for html add a classname
   function addClass(type) {
		//use classes to tell formValidation.js the type- only Date or Numeric
		if (type=="DateTime") return "class=\"Date\"";
		if (type=="long") return "class=\"Numeric\"";
		if (type=="int") return "class=\"Numeric\"";
		if (type=="decimal") return "class=\"Numeric\"";
		return "";
   }
	
	/* VB6 functions ******************************************/
	//initialize a private member variable (empty string, null)
	function adoInitVB6(name, type) {
		var value = "\"\""; //string- double quote
		switch(type) {
			case "Boolean":
				value = "False";
				break;
			case "Date":
				value = "CDate(0)";
				break;
			case "Integer":
			case "Long":
			case "Currency":
				value = "0"; //all numbers become 0
				break;
			//more here if needed
		}
		ado.init[ado.init.length] = "\tm_" + name +" = " + value;
	}
	
	//add parameters to an ADO command in VB6
	function adoParVB6(name, type) {
		var adotype = "adVarChar";
		var len = "Len(m_"+ name +")";
		var value = "m_" + name;
		switch(type) {
			case "Boolean":
				value = "IIf(m_" + name + ", \"Y\", \"N\")";
				len = "1";
				break;
			case "Date":
				value = "IIf(m_" + name + " = CDbl(0), Null, m_" + name + ")";
				len = "";
				adotype = "adDate";
				break;
			case "Integer":
				len = "";
				adotype = "adInteger";
				break;
			case "Long":
				len = "";
				adotype = "adNumeric";
				break;
			case "Currency":
				len = "";
				adotype = "adNumeric";
			//more here if needed
		}
		return "\t\t.Parameters.Append .CreateParameter(\"@" + name +"\",  " + adotype + ", adParamInput, " + len + ", " + value + ")";
	}
	
	//read from a VB6 recordset and fill private members
	function createFillVB6(name, type) {
		ado.fill[ado.fill.length]= "\t\tIf Not IsNull(rs!"+ name + ") Then";
		if(type == "Boolean") {
			ado.fill[ado.fill.length]= "\t\t\tIf rs!"+ name + " = \"Y\" Then m_" + name + " = True";
		} else {
			ado.fill[ado.fill.length]= "\t\t\tm_"+ name + " = rs!"+ name;
		}
		ado.fill[ado.fill.length]= "\t\tEnd If";
	}
	
	//create a getter/setter in VB6
	function createPropVB6(name, type, isRequired, maxLength) {
		props[props.length]= ""; //blank line
		props[props.length]= "'Property " + name + " --------------------------------";
		props[props.length]= "Public Property Let " + name + "(ByVal vData As " + type + ")";
		if (isRequired && type=="String") {
			props[props.length]= "\tIf (LenB(vData) = 0) Then Call Err.Raise(vbObjectError + 11, \"" + name + ".Let\", \"Argument must be entered\")";
			if (useTemplate) ado.val[ado.val.length] = "\tIf (LenB(m_" + name + ") = 0) Then l_IsValid = False";
		}
		if (maxLength > 0 && type=="String") {
			props[props.length]= "\tIf (Len(vData) > " + maxLength + ") Then Call Err.Raise(vbObjectError + 11, \"" + name + ".Let\", \"Argument over maximum length of " + maxLength + "\")";
			if (useTemplate) ado.val[ado.val.length] = "\tIf (Len(m_" + name + ") > " + maxLength + ") Then l_IsValid = False";
		}
		props[props.length]= "\tm_" + name + " = vData";
		if (useTemplate && name != isDirtyName) {
			props[props.length]= "\tm" + isDirtyName + " = True";
		}
		props[props.length]= "End Property";
		props[props.length]= ""; //blank line
		props[props.length]= "Public Property Get " + name + "() As " + type;
		props[props.length]= "\t" + name + " = m_" +name;
		props[props.length]= "End Property";
		props[props.length]= "'End Property " + name + " -------";
	}
	
	/* VB.Net functions ******************************************/
	//initialize a private member variable (empty string, null)
	function adoInitVB(name, type) {
		var value = "\"\""; //string- double quote
		switch(type) {
			case "Boolean":
				value = "False";
				break;
			case "Date":
				value = "DateTime.MinValue";
				break;
			case "Integer":
			case "Long":
			case "Currency":
				value = "0"; //all numbers become 0
				break;
			//more here if needed
		}
		ado.init[ado.init.length] = "\tm_" + name +" = " + value;
	}
		
	function adoParVB(name, type) {
		var adotype = "NVarChar";
		var value = "_" + name;
		switch(type) {
			case "Boolean":
				value = "(_" + name + ")? \"Y\" : \"N\"";
				break;
			case "Date":
				value = "(_" + name + " = DateTime.MinValue)? DBNull.Value : _" + name ;
				adotype = "DateTime";
				break;
			case "Integer":
				adotype = "Int";
				break;
			case "Decimal":
				adotype = "Decimal";
			//more here if needed
		}
		//return "\t\t\t\tcmd.Parameters.Add(New SqlParameter(\"@" + name +"\", SqlDbType." + adotype + ").Value = " + value + ")";
		return "\t\t\t\tcmd.Parameters.AddWithValue(\"@" + name +"\", " + value + ") 'SqlDbType." + adotype;
	}
	
	//read from a .Net datareader and fill private members
	function createFillVB(name, type, counter) {
		var tabs = "\t\t\t\t";
		var s = "If (Not dr.IsDBNull(" + counter + ")) Then _" + name + " = dr.GetString(" + counter + ")";
		switch(type) {
			case "Boolean":
				ado.fill[ado.fill.length]= tabs + "If (Not dr.IsDBNull(" + counter + ")) Then";
				ado.fill[ado.fill.length]= tabs + "\tIf (dr.GetString(" + counter + ") == \"Y\") Then _" + name + " = True";
				s = "End If";
				break;
			case "Date":
				s = "If (Not r.IsDBNull(" + counter + ")) Then _" + name + " = dr.GetDateTime(" + counter + ")";
				break;
			case "Integer":
				s = "If (Not dr.IsDBNull(" + counter + ")) Then _" + name + " = dr.GetInt32(" + counter + ")";
				break;
			case "Decimal":
				s = "If (Not dr.IsDBNull(" + counter + ")) Then _" + name + " = dr.GetDecimal(" + counter + ")";
			//more here if needed
		}
		ado.fill[ado.fill.length]= tabs + s;
	}

	//create a getter/setter in VB.Net
	function createPropVB(name, type, isRequired, maxLength) {
		props[props.length]= ""; //blank line
		props[props.length]= "'''" + open + "summary" + close + name + open + "/summary" + close;
		props[props.length]= "Public Property " + name + " As " + type;
		props[props.length]= "\tGet\n\t\tReturn _" + name +"\n\tEnd Get";
		props[props.length]= "\tSet(ByVal Value As " + type + ")";
		if (isRequired && type=="String") {
			props[props.length]= "\t\tIf(String.IsNullOrEmpty(Value)) Then Throw New ArgumentNullException(\"value\", \"Must not be null\")";
			if (useTemplate) ado.val[ado.val.length] = "\tIf (String.IsNullOrEmpty(_" + name +")) Then _IsValid = False";
		}
		if (maxLength > 0 && type=="String") {
			props[props.length]= "\t\tIf (Not Value Is Nothing) Then";
			props[props.length]= "\t\tIf (Value.Length > " + maxLength + ") Then Throw New ArgumentOutOfRangeException(\"value\", \"Over maximum length of " + maxLength + "\")";
			props[props.length]= "\t\tEnd If";
			if (useTemplate) {
				ado.val[ado.val.length] = "\t\tIf (Not _" + name +" Is Nothing) (String.IsNullOrEmpty(_" + name +")) Then _IsValid = False";
				ado.val[ado.val.length] = "\t\t\tIf (_" + name +".Length > " + maxLength + ") Then  _IsValid = False";
				ado.val[ado.val.length] = "\t\tEnd If";
			}
		}
		props[props.length]= "\t\t_" + name +" = Value"
		if (useTemplate && name != isDirtyName) {
			props[props.length]= "\t_" + isDirtyName + " = True";
		}
		props[props.length]= "\tEnd Set";
		props[props.length]= "End Property";
	}
	
	/* C#.Net functions ******************************************/
	//initialize a private member variable (empty string, null)
	function adoInitC(name, type) {
		var value = "\"\""; //string- double quote
		switch(type) {
			case "bool":
				value = "false";
				break;
			case "DateTime":
				value = "DateTime.MinValue";
				break;
			case "int":
			case "long":
			case "decimal":
				value = "0"; //all numbers become 0
				break;
			//more here if needed
		}
		ado.init[ado.init.length] = "\t\t\t" + camelName(name) +" = " + value + ";";
	}
	
	//add parameters to an ADO command in C#
	function adoParC(name, type) {
		var adotype = "NVarChar";
		var value = camelName(name);
		switch(type) {
			case "bool":
				value = "(" + camelName(name) + ")? \"Y\" : \"N\"";
				break;
			case "DateTime":
				value = "(" + camelName(name) + " == DateTime.MinValue)? DBNull.Value : (object)" + camelName(name) ;
				adotype = "DateTime";
				break;
			case "int":
				adotype = "Int";
				break;
			case "decimal":
				adotype = "Decimal";
			//more here if needed
		}
		//return "\t\t\t\tcmd.Parameters.Add(new SqlParameter(\"@" + name +"\", SqlDbType." + adotype + ").Value = " + value + ");";
		return "\t\t\t\tcmd.Parameters.AddWithValue(\"@" + name +"\", " + value + "); //SqlDbType." + adotype;
	}
	
	//read from a .Net datareader and fill private members
	function createFillC(name, type, counter) {
		var tabs = "\t\t\t\t";
		var s = "if (!dr.IsDBNull(" + counter + ")) " + name + " = dr.GetString(" + counter + ");";
		switch(type) {
			case "bool":
				s = "if (!dr.IsDBNull(" + counter + ")) " + name + " = (dr.GetString(" + counter + ") == \"Y\") ? true : false ;";
				break;
			case "DateTime":
				s = "if (!dr.IsDBNull(" + counter + ")) " + name + " = dr.GetDateTime(" + counter + ");";
				break;
			case "int":
				s = "if (!dr.IsDBNull(" + counter + ")) " + name + " = dr.GetInt32(" + counter + ");";
				break;
			case "decimal":
				s = "if (!dr.IsDBNull(" + counter + ")) " + name + " = dr.GetDecimal(" + counter + ");";
			//more here if needed
		}
		ado.fill[ado.fill.length]= tabs + s;
	}
	
	//create a getter/setter in C#
	function createPropC(name, type, isRequired, maxLength, useINPC) {
		props[props.length]= ""; //blank line
		props[props.length]= "///" + open + "summary" + close + "\n///" + name + "\n///" + open + "/summary" + close;
		props[props.length]= "public virtual " + type + " " + name + "\n{";
		props[props.length]= "\tget\n\t{\n\t\treturn " + camelName(name) +";\n\t}";
		props[props.length]= "\tset\n\t{";
		if (isRequired && type=="string") {
			props[props.length]= "\t\tif(String.IsNullOrEmpty(value)) throw new ArgumentNullException(\"value\", \"Must not be null\");";
			if (useTemplate) ado.val[ado.val.length] = "\tif(String.IsNullOrEmpty(" + camelName(name) +"))  _isValid = false;";
		}
		if (maxLength > 0 && type=="string") {
			props[props.length]= "\t\tif(value != null) {";
			props[props.length]= "\t\t\tif(value.Length > " + maxLength + ") throw new ArgumentOutOfRangeException(\"value\", \"Over maximum length of " + maxLength + "\");";
			props[props.length]= "\t\t}";
			if (useTemplate) {
				ado.val[ado.val.length]= "\t\tif(" + camelName(name) +" != null && " + camelName(name) +".Length > " + maxLength + ")  _isValid = false;";
				//ado.val[ado.val.length]= "\t\t}";
			}
		}
		props[props.length]= "\t\t" + camelName(name) +" = value;";
		if(useINPC) {
			props[props.length]= "\t\tPropertyChangedEventHandler handler = PropertyChanged;";
			props[props.length]= "\t\tif (handler != null) handler(this, new PropertyChangedEventArgs(\"" + name + "\"));";
		}
		if (useTemplate && name != isDirtyName) {
			props[props.length]= "\t\t" + isDirtyName + " = true;";
		}
		props[props.length]= "\t}";
		props[props.length]= "}";
	}

	/* SQL functions ******************************************/
	//store array of column names and types
	function createPropSql(name, type, isPKey) {
		sql.sqlCols[sql.sqlCols.length] = name;
		sql.sqlTypes[sql.sqlTypes.length] = type;
		if (isPKey) {
			sql.sqlPKeys[sql.sqlPKeys.length] = name;
			sql.sqlPKTypes[sql.sqlPKTypes.length] = type;
		}
	}
	
   //calls createSql  to generate the sql commands from the sql arrays, and puts them in one big array
   function sqlAssembly(sql, identityColumn) {
		var br = "\n";
		var o = createSql(sql, identityColumn);
		var locals = o.selectSql + br + br + o.insertSql + br + br + o.updateSql + br + br + o.deleteSql + br + br;
		//join parameters to put the @ at front
		locals += "--primary key parameters" + br + o.pks;
		locals += br + "--parameters" + br + o.pars;

		return locals.split(br); //return an array we'll put back together
   }
   //using the sql object, generate the sql commands (plus parameters)
   function createSql(sql, identityColumn) {
		var br = "\n";
		if (sql.sqlPKeys.length == 0) { //no primary keys- just use first one
			sql.sqlPKeys[0] = sql.sqlCols[0];
			sql.sqlPKTypes[0] = sql.sqlTypes[0];
		}
		var where = [];
		for (var i = 0; i < sql.sqlPKeys.length; i++) {
			where[where.length] = "[" + sql.sqlPKeys[i] + "] = @" + sql.sqlPKeys[i];
		}
		var selectSql = "SELECT \n\t" + "[" + sql.sqlCols.join("], \n\t[") + "]" + br + " FROM [" + tableName + "]\n WHERE \n\t" + where.join(" AND \n\t");
		var cols, values, scopeIdentity;
		if(identityColumn.length > 0) {
			//identity columns should not be inserted- other primary keys are
			var cols2 = sql.sqlCols.filter(function(element){return element != identityColumn});
			cols  = "[" + cols2.join("], \n\t[") + "]";
			values = cols2.join(", \n\t@");
			scopeIdentity = ";\nSET @" + identityColumn + " = SCOPE_IDENTITY();";
		} else {
			cols  = "[" + sql.sqlCols.join("], \n\t[") + "]";
			values = sql.sqlCols.join(", \n\t@");
		}
		var insertSql = "INSERT INTO [" + tableName + "] (\n\t" + cols + "\n) "+br + "VALUES (\n\t@" + values + "\n)" + scopeIdentity;
		
		var updateSql = "UPDATE [" + tableName + "] SET \n\t";
		var update = [];
		for (var i = 0; i < sql.sqlCols.length; i++) {
			var col = sql.sqlCols[i];
			if(col == identityColumn) continue; //don't update identity
			var isPrimaryKey = false; //primary keys should be immutable (usually!)
			for (var j = 0; j < sql.sqlPKeys.length; j++) {
				if(col == sql.sqlPKeys[j]) {
					isPrimaryKey = true;
					break;
				}
			}
			if(isPrimaryKey) continue;
			update[update.length] = "[" + col + "] = @" + col;
		}
		updateSql += update.join(", \n\t");
		updateSql += br + " WHERE \n\t" + where.join(",\n\t");
		var deleteSql = "DELETE FROM [" + tableName + "] \n\tWHERE " + where.join(" AND \n");
		var pars = [];
		for (var i = 0; i < sql.sqlCols.length; i++) {
			pars[pars.length] = sql.sqlCols[i] + " " + sql.sqlTypes[i];
		}
		var pkpars = [];
		for (var i = 0; i < sql.sqlPKeys.length; i++) {
			pkpars[pkpars.length] = sql.sqlPKeys[i] + " " + sql.sqlPKTypes[i];
		}
		return {selectSql: selectSql,
				insertSql: insertSql,
				updateSql: updateSql,
				deleteSql: deleteSql,
				pks: "@" + pkpars.join(","+br+"@"),
				pars: "@" + pars.join(","+br+"@")
				};
		}
	
	/* General functions ******************************************/
	function camelName(name) {
		var camel = "_" + name.substring(0, 1).toLowerCase();
		if(name.length> 1) camel += name.substring(1);
		return camel;
	}
	
	//create the locals array (private members by language)
	function createLocal(lang, name, type) {
	        switch(lang) {
	            case "ASPGRIDVIEW":
	                break;
	            case "DATATABLE":
					break;
				case "HBM":
					break;
				case "SQL":
					break;
	            case "DIV":
	                break;
	            case "HTML":
	                break;
	            case "ASP3":
	                break;
				case "ASPX":
	                break;
				case "RZR":
	                break;
	            case "VB6":
	                locals[locals.length]= "Private m_"+name+ " \tAs " + type;
	                break;
	            case "VB":
	                locals[locals.length]= "Private _" + name + " As " + type;
	                break;
	            case "C#C":
	                locals[locals.length]= "private " + type + " " + camelName(name) +";";
					break;
	            case "VIEWSTATE":
	                break;
	            default:
	                locals[locals.length]= "private " + type + " " + camelName(name) +";";
	        }
		}
	
	//capitalize the name
    function fixName(name) {
        name= name.replace(/\W/g, ""); //remove non-alphanumeric (allow underscore)
		if (name.length==0) return ""; //empty string?
        var initial = name.substring(0,1);
        if (/\d/.test(initial)) {
            //if firstchar numeric, just add A and rationalize manually
            name= "A" + name;
            initial = "A";
        }
        //if all uppercase, make capitalized
        if (name == name.toUpperCase())
            name= initial + name.substring (1).toLowerCase();
        //if firstchar not uppercase, capitalize
        if (initial == initial.toLowerCase()) {
            initial = initial.toUpperCase();
            name= initial + name.substring(1);
            if (name == name.toUpperCase()) //was aUPPER, make AUpper
                name= name.substring(0,2) + name.substring(2).toLowerCase();
        }
        if (/_[a-z]/.test(name)) {//capitalize after underscore
            name= name.replace(/_[a-z]/g, function (str,p1,offset,s) { //lambda
                return str.toUpperCase();
                }
            );
        }
		return name;
   }
	function getLength(item) {
		var f= item.search(/[0-9+]/);
		if (f == -1) return 0;
		return parseInt(item.substring(f));
	}
    //from input work out what sort of type it could be
    //for simple dbs only
    function getType(type, lang) {
		if (lang == "SQL") {
			return type=="" ? "varChar2(4000)": type;
		}
        if (type=="") {
			return StringByLang(lang);
        }
		//booleans or likely booleans (depends on SQL DBAs conventions)
        if (type == "char(1)") return BooleanByLang(lang); //probably boolean although oracle doesn't have them
        if (type == "varchar2(1)") return BooleanByLang(lang);  //probably boolean although oracle doesn't have them
 		if (type.substring(0,3) == "bit") return BooleanByLang(lang); 
 		if (type.substring(0,3) == "boo") return BooleanByLang(lang); 
		//strings
        if (type.substring(0,4) == "nvar") //unicode varchar
			return StringByLang(lang);
        if (type.substring(0,3) == "var") //ascii varchar
			return StringByLang(lang);
        if (type.substring(0,3) == "cha") //fixed length
			return StringByLang(lang);
        if (type.substring(0,4) == "ncha") //fixed length
			return StringByLang(lang);
		//number types
        if (type.substring(0,3) == "mon") //money
			return DecimalByLang(lang);
        if (type.substring(0,3) == "dec") //decimal
			return DecimalByLang(lang);
		if (type.substring(0,3) == "int") {
			if (lang== "VB6" || lang=="VB")
				return "Integer";
			else
				return "int"; //System.Int32
		}
		if (type.substring(0,3) == "num") { //number/numeric
            var start= type.indexOf("(");
            if (start != -1) { //oracle number(precision, scale)
                var end = type.indexOf(",", start);
                var precision= type.substring(start+1,end);
                start= end+1;
                end= type.indexOf(")", start);
                var scale= type.substring(start, end);
                if (scale > 0)
                    return DecimalByLang(lang);
                if (precision > 5) {
					if (lang== "VB6" || lang=="VB")
						return "Long";
					else
						return "long"; //System.Long
					}
            }
            return "int";
        }
		//date
        if (type.substring(0,3) == "dat") {
			if (lang== "VB6")
				return "Date";
			else
				return "DateTime"; //system.DateTime
		}
        return type; //default what they put in
		
		function DecimalByLang(lang) {
			if (lang== "VB6")
				return "Currency";
			else if (lang== "VB")
				return "Decimal";
			else
				return "decimal";
		}
    }
	
	//datatypes in different langauges
	function BooleanByLang(lang) {
		if (lang== "VB6" || lang=="VB")
			return "Boolean";
		else
			return "bool";
	}
	
	function StringByLang(lang) {
		if (lang== "VB6" || lang== "VB")
			return "String";
		else if (lang == "SQL")
			return "nvarchar2(4000)";
		else
			return "string";
	}
}

//global functions
//button to split from CSV into lines
function commaSplit() {
    document.getElementById("Input").value = document.getElementById("Input").value.split(",").join("\n");
}
//changing the langauge dropdown- show or hide additional operations by language
function LangChange() {
	var lang = mu.getSelect("Language");
	if (lang == "SQL" || lang == "HBM") {
		mu.showMe("SQLTemplates");
	} else {
		mu.hideMe("SQLTemplates");
	}
	switch (lang) {
		case "VB6":
		case "VB":
		case "C#":
		case "C#inpc":
		case "C#C":
			mu.showMe("UseTemplateQ");
			break;
		default:
			mu.hideMe("UseTemplateQ");
			document.getElementById("UseTemplate").checked = false;
	}
}
//show the templates
function showTemplates() {
	if(mu.isHidden("Templates")) {
		mu.showMe("Templates");
		document.getElementById("ShowTemplates").value = "Hide Templates";
	}
	else {
		mu.hideMe("Templates");
		document.getElementById("ShowTemplates").value = "Show Templates";
	}
}
//show more details about how to use this page
function toggleDetails() {
	if(mu.isHidden("Details")) {
		mu.showMe("Details");
		document.getElementById("ShowDetails").value = "Hide Details";
	}
	else {
		mu.hideMe("Details");
		document.getElementById("ShowDetails").value = "More";
	}
}
mu.addEvent(window, "load", LangChange); //initialize screen