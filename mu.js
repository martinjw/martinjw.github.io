//general utilities, mu "namespace"
var mu= {
    //allows id or object reference itself
    get: function(obj) {
        if (typeof (obj) == 'string')
            obj = document.getElementById(obj);
        return obj;
    },
    //set the  value of *most* form fields
    getValue: function(id) {
        var obj= mu.get(id);
		if (!obj) return null;
		if(obj.type) {
	        if (obj.type == 'text' || obj.type == 'textarea' || obj.type == 'hidden')
					return obj.value;
			else if (obj.type == 'select-one')
					return (obj.selectedIndex == -1)?null :obj.options[obj.selectedIndex].value;
			else if (obj.type == 'select-multiple')
				return null;
			else if (obj.type == 'radio' ||  obj.type == 'checkbox') {
					return (obj.checked)? obj.value : null;
			}
		}
		return mu.getInnerText(obj);
    },
    //set the  value of *most* form fields
    setValue: function(id,value) {
        var obj= mu.get(id);
		if (!obj) return;
		if(obj.type) {
	        if (obj.type == 'text' || obj.type == 'textarea' || obj.type == 'hidden')
					obj.value = value;
			else if (obj.type == 'select-one' || obj.type == 'select-multiple')
					mu.setSelect(obj, value);
			else if (obj.type == 'radio' ||  obj.type == 'checkbox') {
					if (obj.value == value) obj.checked = true;
					else obj.checked = false;
			}
		} else 
			mu.setInnerText(obj, value);
    },
    //set the selected value of a select box
    setSelect: function(id,value) {
        var obj= mu.get(id);
		if (!obj) return;
        if (value== -1) obj.selectedIndex= -1;
        for (var i=0; i< obj.options.length; i++) {
            if (obj.options[i].value== value) obj.options[i].selected=true;
            }
    },
    //get the selected value of a select box
    getSelect: function (id) {
        var obj= mu.get(id);
		if (!obj) return;
        var value="";
        try {
			value=obj.options[obj.selectedIndex].value;
        } catch(e) {
        }
        return value;
    },
    getSelectText: function (id) {
        var obj= mu.get(id);
		if (!obj) return;
        var value="";
        try {
			value=obj.options[obj.selectedIndex].text;
        } catch(e) {
        }
        return value;
    },
	getInnerText: function(id) {
        var obj= mu.get(id);
		if (!obj) return;
        if (obj.textContent)
            return obj.textContent; //DOM3- FF
        if (obj.innerText)
            return obj.innerText; //IE, Safari
        if(obj.hasChildNodes) //this is just the 1st text
            return obj.childNodes[0].nodeValue;
    },
	setInnerText: function(id, value) {
        var obj= mu.get(id);
		if (!obj) return;
        if (obj.textContent) {
            obj.textContent = value; //DOM3- FF
			return;
		}
        if (obj.innerText) {
            obj.innerText = value; //IE, Safari
			return;
		}
        if(obj.hasChildNodes) //this is just the 1st text
            obj.childNodes[0].nodeValue = value;
    },
    addClass: function (id, className) {
        var obj= mu.get(id);
		if (!obj) return;
        mu.removeClass(obj, className); //remove it if already there
        obj.className+= " " + className;
    },
    removeClass: function (id, className) {
        var obj= mu.get(id);
		if (!obj) return;
        var re = new RegExp("(?:^|\\s+)" + className + "(?:\\s+|$)", "g");
        var str= new String(obj.className);
        obj.className = str.replace(re, '');
    },
    hasClass: function (id, className) {
        var obj= mu.get(id);
		if (!obj) return;
        var re = new RegExp("(?:^|\\s+)" + className + "(?:\\s+|$)", "g");
        var str= new String(obj.className);
        return re.test(str);
    },
    hideMe: function (id) {
        var obj= mu.get(id);
        if (obj) obj.style.display = 'none';
    },
    showMe: function (id) {
        var obj= mu.get(id);
        if (obj) obj.style.display = '';
    },
    isHidden: function (id) {
        var obj= mu.get(id);
        if (obj) if (obj.style.display != 'none') return false;
        return true;
    },
    toggle: function (id) { // mu.isHidden(id) ? mu.showMe(id) : mu.hideMe(id)
        var obj= mu.get(id);
        if (!obj) return;
		if (obj.style.display != 'none')
			obj.style.display = 'none';
		else
			obj.style.display = '';
    },
    readOnly: function (id) {
		//if (id== null)
		//	return mu.readOnlyAll();
        var obj= mu.get(id);
		if (!obj) return;
		obj.readOnly=true;
		if (obj.options) obj.disabled=true;
		if(obj.type) {
			if (obj.type == "checkbox") obj.disabled= true;
			if (obj.type == "radio") obj.disabled= true;
			if (obj.type == "button") obj.disabled= true;
		}
		mu.addClass(obj, "ReadOnly");
    },
    readWrite: function (id) {
        var obj= mu.get(id);
		if (!obj) return;
		obj.readOnly=false;
		if (obj.disabled) obj.disabled=false;
		mu.removeClass(obj, "ReadOnly");
    },
	trim: function (s) {
	   if(typeof s == 'string') return s.replace(/^\s*|\s*$/g,"");
	},
    each: function (func) {
		if(typeof func != "function") return;
		for (var i= 0; i< document.getElementsByTagName("input").length; i++) {
			var o = document.getElementsByTagName("input")[i];
			if(o.type=="button") continue; //exclude buttons
			func(o);
		}
		for (var i= 0; i< document.getElementsByTagName("select").length; i++) {
			var o = document.getElementsByTagName("select")[i];
			func(o);
		}
    },
	useEvents : false,
	addEvent : function ( obj, type, fn ) { //src: http://www.dustindiaz.com/rock-solid-addevent/
        obj= mu.get(obj); //we allow by id, otherwise standard interface
		if (obj.addEventListener) {
			obj.addEventListener( type, fn, false );
			mu.EventCache.add(obj, type, fn);
		}
		else if (obj.attachEvent) {
			obj["e"+type+fn] = fn; 
			obj[type+fn] = function() { obj["e"+type+fn]( window.event ); }
			obj.attachEvent( "on"+type, obj[type+fn] );
			mu.EventCache.add(obj, type, fn);
		}
		else
			obj["on"+type] = obj["e"+type+fn];
		if(!mu.useEvents) { //automatically unload
			mu.useEvents = true;
			mu.addEvent(window,'unload',mu.cleanUp);
		}
	},
	EventCache: function(){ //http://novemberborn.net/javascript/event-cache
		var listEvents = [];
		return {
			listEvents : listEvents,
			add : function(node, sEventName, fHandler){
				listEvents.push(arguments);
			},
			flush : function(){
				var i, item;
				for(i = listEvents.length - 1; i >= 0; i = i - 1){
					item = listEvents[i];
					if(item[0].removeEventListener)
						item[0].removeEventListener(item[1], item[2], item[3]);
					if(item[1].substring(0, 2) != "on")
						item[1] = "on" + item[1];
					if(item[0].detachEvent)
						item[0].detachEvent(item[1], item[2]);
					item[0][item[1]] = null;
				};
			}
		};
	}(),
    removeEvent: function ( obj, type, fn ) {
        obj= mu.get(obj); //we allow by id, otherwise standard interface
        if ( obj.removeEventListener )
            obj.removeEventListener( type, fn, false );
        else if ( obj.detachEvent )
            obj.detachEvent( "on"+type, fn );
        else
            obj['on'+type] = null;
    },
    addLoadEvent: function ( fn ) {
        this.addEvent(window, "load", fn);
    },
	cleanUp: function () { //call on window.unload 
		mu.EventCache.flush();
	}
};
