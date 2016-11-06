//additional functions for mu

if (!self.mu) var mu = {}; //create namespace if it doesn't exist

mu.stripeTable = function (id, className) { //limitations- rowspan, nested tables
	var obj= mu.get(id);
	if (obj) {
		var rows = obj.getElementsByTagName('tr');
		for ( var i=0; i<rows.length; i=i+2 )
			rows[i].className += " " + className;
	 }
};
	
mu.getWindowHeight= function () {
	var windowHeight=0;
	if (typeof(window.innerHeight)=='number') {
		windowHeight=window.innerHeight;
	}
	else {
		if (document.documentElement&&document.documentElement.clientHeight)
			windowHeight= document.documentElement.clientHeight;
		else {
		if (document.body&&document.body.clientHeight) 
			windowHeight=document.body.clientHeight;
		}
	}
	return windowHeight;
};
	
mu.getWindowTop = function () { //get scroll position
	var scrollY = 0;
	if ( document.documentElement && document.documentElement.scrollTop ){
		scrollY = document.documentElement.scrollTop;
	}else if ( document.body && document.body.scrollTop ){
		scrollY = document.body.scrollTop;
	}else if ( window.pageYOffset ){
		scrollY = window.pageYOffset;
	}else if ( window.scrollY ){
		scrollY = window.scrollY;
	}
	return scrollY;
};
	
mu.getViewPortDimensions = function() {
	 //get viewport dimensions
	if ( typeof( window.innerWidth ) == 'number' ){
		_width  = window.innerWidth;
		_height = window.innerHeight;
	}else if ( document.documentElement &&
			 ( document.documentElement.clientWidth ||
			   document.documentElement.clientHeight ) ){
		_width  = document.documentElement.clientWidth;
		_height = document.documentElement.clientHeight;
	}
	else if ( document.body &&
			( document.body.clientWidth || document.body.clientHeight ) ){
		_width  = document.body.clientWidth;
		_height = document.body.clientHeight;
	}
	return {width: _width, height: _height};
};
	
mu.getHTMLDimensions = function() {
	var docHeight= 0;
	var docWidth= 0;
	if (document.documentElement && typeof(document.documentElement.scrollHeight) == 'number') 
		docHeight= document.documentElement.scrollHeight;
	else if (document.body)
		docHeight= document.body.offsetHeight;
	if (document.documentElement && typeof(document.documentElement.scrollWidth) == 'number') 
		docWidth= document.documentElement.scrollWidth;
	else if (document.body)
		docWidth= document.body.offsetHeight;
	return {width: docWidth, height: docHeight};
};
	
	
mu.setWait= function () { //assign to onsubmit
	window.onbeforeunload = null; //allows them to exit page
	//create a mask that hides the body
	var body = document.getElementsByTagName("body")[0];
	var mask= document.createElement("div");
	mask.id= "WaitMask";
	mask.className= "WaitMask";
	body.appendChild(mask);
	//create a div with class WaitMsg and text (not localized)
	var msg= document.createElement("div");
	msg.id= "WaitMsg";
	msg.className= "WaitMsg";
	var Message= "Please wait..."; //extract from hidden field for localization
	if (document.createTextNode) {
		var tn= document.createTextNode(Message);
		msg.appendChild(tn);
	} else {
		msg.innerText= Message;
	}
	body.appendChild(msg);
	/*note all styles below can be moved to css*/
	var style= mask.style;
	style.position= "absolute";
	style.top= 0;style.left = 0;
	style.width= mu.getHTMLDimensions().width + "px";
	style.height= mu.getHTMLDimensions().height + "px";
	style.backgroundColor="#aaa";
	style.opacity= "0.7";style.filter= "alpha(opacity=70)";
	style= msg.style;
	style.position= "absolute";
	style.top= (mu.getViewPortDimensions().height/3) + mu.getWindowTop() + "px";style.left= "30%";
	style.width= "30%";style.fontSize= "1.5em";
	style.backgroundColor="#000";style.color="#fff";
	return true;
};
	
mu.stopWait= function () { //use this if you cancel submit
	var body = document.getElementsByTagName("body")[0];
	var o = document.getElementById('WaitMsg');
	body.removeChild(o);
	o = document.getElementById('WaitMask');
	body.removeChild(o);
};

//select all options (should be multiselect)
mu.selectAll= function (id) {
	var obj= mu.get(id);
	for (var i=0; i< obj.options.length; i++) {
		obj.options[i].selected= true; //select all
	}
};
	
//add an option (string or ref to a textfield). text and value the same
mu.addOption = function (id, value) {
	var obj = mu.get(id);
	var v;
	if (typeof (value) == 'string') { //a simple value
		v = value;
	} else { //value could be ref to a textfield
		if (value.options) { //selectbox
			for (var i= 0; i< value.options.length; i++) {  
				if (value.options[i].selected) {
					v= value.options[i];
					obj.options[obj.options.length] = new Option(v.text, v.value);
				}
			}
			return;
		} //rest if textbox...
		v = mu.getValue(value);
		mu.setValue(value, ''); //clear it
	}
	//clean any empty values
	for (var i= obj.options.length-1; i>= 0; i--) { 
		if (obj.options[i].text== '') obj.options[i] = null;
	} 
	obj.options[obj.options.length] = new Option(v, v);
};
	
//remove an option (single string as argument, or all selected options with no argument)
mu.removeOption = function (id, value) {
	var obj = mu.get(id);
	if (typeof (value) == 'string') { //specific value
		for (var i=obj.options.length-1; i>= 0; i--) {  
			if (obj.options[i].value== value) obj.options[i] = null;
		}
	} else { //all selected
		for (var i=obj.options.length-1; i>= 0; i--) {  
			if (obj.options[i].selected) obj.options[i] = null;
		}
	}
};