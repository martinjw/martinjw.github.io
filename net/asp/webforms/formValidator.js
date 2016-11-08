//************************************************************************
//Form validation
//************************************************************************
var Validator = new function()
{
    var _Me = this; //this can be incorrect for an inner function
    var _ThouSeparator = ",";
    var _DecimalPoint = ".";
    var _DateSeparator = "/";
    var _isDayFirst = true;
	
    //***********************************************************************
    //Public functions for localization- date format (default is UK) and number format (default UK/US)
	//Thousands separator is okay for US/UK (default, 1,000), most of Europe (1.000) and Sweden (1 000)
	//but not okay for other systems (Hindi is 2/3 digit groups- 12,34,567)
    //***********************************************************************
    this.getDateSeparator = function() {return _DateSeparator;}
    this.setDateSeparator = function(s) { _DateSeparator = s;}
    this.getDecimalPoint = function() {return _DecimalPoint;}
    this.setDecimalPoint = function(s) { _DecimalPoint = s;}
    this.getThouSeparator = function() {return _ThouSeparator;}
    this.setThouSeparator = function(s) { _ThouSeparator = s;}
	//dates
    this.getIsDayMonth = function() {return _isDayFirst;}
    this.setIsDayMonth = function(b) { _isDayFirst = b;}

    //a compound locale thing, taking ISO codes. Expand as required, or use the properties above
	this.locale = function(s) {
		switch (s.toLowerCase()) {
			case 'en-us': //usa 1,234.56 12/31/2004
				_ThouSeparator = ",";
				_DecimalPoint = ".";
				_DateSeparator = "/";
				_isDayFirst = false;
				break;
			case 'en-gb': //uk 1,234.56 31/12/2004
				_ThouSeparator = ",";
				_DecimalPoint = ".";
				_DateSeparator = "/";
				_isDayFirst = true;
				break;
			default: //european 1.234,56 31.12.2004
				_ThouSeparator = ".";
				_DecimalPoint = ",";
				_DateSeparator = ".";
				_isDayFirst = true;
			}
	}

    //***********************************************************************
    //Public functions- assign these as onchange events to date and number fields
    //***********************************************************************
    this.addHandlers = function() {
        var inputs = document.getElementsByTagName("input");
        for (var i = 0; i< inputs.length; i++) {
            var obj = inputs[i];
            if (obj.type == "text") {
                if (obj.className.indexOf("Numeric") != -1) {
                    _Me.addEvent(obj, "change", _Me.numberChange);
                }
                if (obj.className.indexOf("Date") != -1) {
                    _Me.addEvent(obj, "change", _Me.dateChange);
                }
                if (obj.className.indexOf("Mandatory") != -1) {
                    _Me.addEvent(obj, "change", _Me.mandChange);
                }
			}
        } //for
		var selects = document.getElementsByTagName("select");
        for (var i = 0; i< selects.length; i++) {
			var obj = selects[i];
			if (obj.className.indexOf("Mandatory") != -1) {
				_Me.addEvent(obj, "change", _Me.mandChange);
			}
		}
    }
	
	this.isValid = function(e) {
		var result= true; //assume valid
		cleanErrorList();
		var o;
		var firstInvalid = null;
        var inputs = document.getElementsByTagName("input");
        for (var i = 0; i< inputs.length; i++) {
            o = inputs[i];
            if (o.type == "text") {
                if (o.className.indexOf("Numeric") != -1) {
                    if(validateNumber(o.value) == 'NaN') {
						addClass(o, "Error");
						result = false;
						addErrorMessage(cleanId(o.id) + ' must be a number');
						if(firstInvalid == null) firstInvalid= o;
					}
                }
                if (o.className.indexOf("Date") != -1) {
                    if(dateValidate(o.value) == '?') {
						addClass(o, "Error");
						result = false;
						addErrorMessage(cleanId(o.id) + ' must be a date');
						if(firstInvalid == null) firstInvalid= o;
					}
                }
                if (o.className.indexOf("Mandatory") != -1) {
                    if (o.value == '') {
						addClass(o, "Error");
						result = false;
						addErrorMessage(cleanId(o.id) + ' must be entered');
						if(firstInvalid == null) firstInvalid= o;
					}
                }
			}
        } //for
		var selects = document.getElementsByTagName("select");
        for (var i = 0; i< selects.length; i++) {
			o = selects[i];
			if (o.className.indexOf("Mandatory") != -1) {
				if (getSelect(o)=='') {
						addClass(o, "Error");
						result = false;
						addErrorMessage(cleanId(o.id) + ' must be entered');
						if(firstInvalid == null) firstInvalid= o;
				}
			}
		}
		var selects = document.getElementsByTagName("select");
        for (var i = 0; i< selects.length; i++) {
			o = selects[i];
			if (o.options.length == 0) {
				if (o.style.display != "none") {
						addClass(o, "Error");
						result = false;
						addErrorMessage(cleanId(o.id) + ' must be entered');
						if(firstInvalid == null) firstInvalid= o;
				}
			}
		}
		//EventListener has no return value but an event parameter - so use Event.preventDefault to cancel it
		if (!result) {
			if (e && e.preventDefault) e.preventDefault();
			else if (window.event) window.event.returnValue = false;
			//mask left by  mu.setWait submit  - remove them
			if (self.mu != null) if (mu.stopWait) mu.stopWait();
		}
		if (firstInvalid != null) firstInvalid.focus();
		return result;
	}
	
	function cleanId(s) {
		return s.replace(/[_]/, " ");
	}
	function addErrorMessage(msg) {
		var hook= getErrorList('ErrorList');
		var li= document.createElement('li');
		var txt= document.createTextNode(msg);
		li.appendChild(txt);
		hook.appendChild(li);
	}	
	function getErrorList() {
		var hook= document.getElementById('ErrorList');
		if (hook == null) {
			hook= document.createElement('ul');
			hook.id= 'ErrorList';
			hook.className= "Error";
			var frm = document.forms[0];
			frm.insertBefore(hook, frm.firstChild);
		}
		return hook;
	}
	function cleanErrorList() {
		var hook= document.getElementById('ErrorList');
		if (hook != null)  { //remove existing items
			for (var i= hook.childNodes.length-1; i>= 0; i--) {
				hook.removeChild(hook.childNodes[i]);
			}
		}
	}
	function getSelect(o) {
        var value="";
		if(o.selectedIndex!=-1) value= o.options[o.selectedIndex].value;
        return value;
    }
    //onchange="Validator.mandChange(this)"
    this.mandChange = function(o){
        if (o.target) o= o.target; //moz
        if (!o) o= this;
        if (o.srcElement) o= o.srcElement;
		var v= o.value;
		if(o.selectedIndex) v=getSelect(o);
        if (v=='') {//for inputs and select
            addClass(o, "Error");
        } else {
            removeClass(o, "Error");
        }
    }
	
    //onchange="Validator.dateChange(this)"
    this.dateChange = function(o){
        if (o.target) o= o.target; //moz
        if (!o) o= this;
        if (o.srcElement) o= o.srcElement;
        if (o.value=='') return;
        var s= dateValidate(o.value);
        if (s== "?") {
            addClass(o, "Error");
            return;
        } else {
            removeClass(o, "Error");
        }
        o.value=s;
    }

    //onchange="Validator.numberChange(this)"
    this.numberChange = function(o) {
        if (o.target) o= o.target; //moz
        if (!o) oInput= this;
        if (o.srcElement) o= o.srcElement;
        if (o.value == '') return;
        var s = validateNumber(o.value);
        if (s ==  "NaN") {
            addClass(o, "Error");
            return;
        } else {
            removeClass(o, "Error");
            o.value = s;
        }

    }
     //******************************************************************************
    //Private nethods
    //******************************************************************************
   //reformat a date. Returns ? if not a valid date, or the date (possibly beautified)
    function dateValidate(str, future) {
        //calls getLocale();
        if (str == "") return "";
        //find first non-numeric character- this is the separator
        if (typeof str != "string") str= new String(str);
        var _InputSeparator = str.charAt(str.search(/\D/));
        var now= new Date();
		var yy,mm,dd,y,m,d,s;

        if (_InputSeparator  ==  "") {
            //no separator
            dd = str.substring(0, 2);// day
            mm = str.substring(2, 4);// month
            yy = str.substring(4, 8);// year
            if (mm=="") {
                mm = now.getMonth()+1;
            }
            if (yy=="") yy = now.getFullYear();
            if (_isDayFirst  ==  false) {
				s = mm; mm = dd;dd = s; //swap ddmm to mmdd
			}
        } else {
            //separator given
            //a single non-numeric will default to today's date
            if (str.length == 1) { //today's date
                if (_isDayFirst) {
                    str = now.getDate() + _DateSeparator + (now.getMonth()+1) + _DateSeparator + now.getFullYear();
                } else {
                    str = (now.getMonth()+1) + _DateSeparator + now.getDate() + _DateSeparator + now.getFullYear();
                }
                _InputSeparator = _DateSeparator;
            }
            arr = str.split(_InputSeparator);
            if (arr.length == 2) { //only entered day/month?
                arr[2] = now.getFullYear();
            }
            if (arr.length  != 3) return "?"; //must be 3 parts
            yy = arr[2];mm = arr[1];dd = arr[0];
            if (_isDayFirst  ==  false) {mm = arr[0];dd = arr[1];} //US mmddyy
            if (dd.length == 4) { //it's in yyyy-mm-dd
                yy = arr[0];dd = arr[2]; //month is same
                }
        }
        d = parseInt(dd,10);m = parseInt(mm,10);y = parseInt(yy,10);
        if (y < 100) {
            var _CurrentYear = now.getFullYear();
            if (future) {y+= 2000;}
            else {
                y+= 1900;
                while (_CurrentYear-y > 75) {
                    y = y + 100; //2000
                }
            }
        }
		if (m > 12) {
			s = m; m = d;d = s; //swap ddmm to mmdd
			dd = d; mm = m;
		}
        if (y < 1000 || y > 2200) return "?"; //assume no dark ages or 200 years in future
        if (!validDateE(y, m-1, d)) return "?"; //months are 0 based
        if (d<10) dd = "0" + d; if (m<10) mm = "0" + m; //days and months may have leading zero
		if (_isDayFirst) {
            str = dd + _DateSeparator + mm + _DateSeparator + y;
        } else {
            str = mm + _DateSeparator + dd + _DateSeparator + y;
        }
        return str;

        function validDateE(y, m, d)
         { with (new Date(y, m, d)) return ((getFullYear() == y) && (getMonth() == m)) }
    } //end function

	//validates a string as a number. Returns a string- either "NaN" or the number as a string (extra characters removed, thousands groups added)
    function validateNumber(s) {
        if (s == "") return "";
		var isDecimal = false;
		//uncomment below for conditional use of thousands
        //var ShowGroup= false;
		//if (s.indexOf(_ThouSeparator)) ShowGroup = true;
		//remove all characters except number & decimal point (includes currency, thousands, etc)
		var _RegExp = new RegExp('[^0-9\-' + _DecimalPoint + ']','g');
		s= s.replace(_RegExp, "");
		//if non-UK/US decimal pont, standardize it for the parse
		if (_DecimalPoint != "." && s.indexOf(_DecimalPoint)) {
			var _RegExp  = new RegExp('['+_DecimalPoint+']', 'g');
            s= s.replace(_RegExp, ".");
			isDecimal = true;
		}
        var nbr = parseFloat(s);
        if (isNaN(nbr)) {
            s = "NaN";
        } else {
            s = nbr.toString();
        }
		//reformat string. NB: the server side code may have to massage the numbers back
		if (isDecimal) {
			var _RegExp  = new RegExp('[.]');
			s = s.replace(_RegExp, _DecimalPoint);
		}
        s= addCommas(s);
        return s;
    }

    //******************************************************************************
    //uses thousands separator.
    //******************************************************************************
    function addCommas( s ) {
        var _RegExp  = new RegExp('(-?[0-9]+)([0-9]{3})');
        //check for match to search criteria
        while(_RegExp.test(s)) {
           //replace original string with first group match,
           //a comma, then second group match
           s = s.replace(_RegExp, '$1' + _ThouSeparator + '$2');
        }
      return s;
    }

    //******************************************************************************
    //could also use mu object or any other version of addEvent
    //******************************************************************************
    this.addEvent= function( obj, type, fn ) {
        if ( obj.addEventListener ) {
            obj.addEventListener( type, fn, false );
        }
        else if ( obj.attachEvent ) {
            var eProp = type + fn;
            obj["e"+eProp] = fn;
            obj[eProp] = function() { obj["e"+eProp]( window.event ); };
            obj.attachEvent( "on"+type, obj[eProp] );
        }
        else {
            obj['on'+type] = fn;
        }
    }
    function addClass(obj, className) {
        removeClass(obj, className); //remove it if already there
        obj.className+= " " + className;
    }
    function removeClass(obj, className) {
        var re = new RegExp(" " + className, "g");
        var str= new String(obj.className);
        obj.className = str.replace(re, '');
    }

}

Validator.addEvent(window, 'load', Validator.addHandlers);
