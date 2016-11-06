//contains effects modules- mu.Fade, mu.Drag, mu.MsgBox, mu.ToolTip, mu.Preview

if (!self.mu) var mu = {}; //create namespace if it doesn't exist

mu.Fade = {
    //eg mu.Fade.fadeIn("myImage"); mu.Fade.fadeOut("myImage");
    //original http://www.brainerror.net/scripts_js_blendtrans.php
	freeLock : function(id) {
		var o = document.getElementById(id);
		if (o == null) return; //been deleted since
		o.removeAttribute("fadeLock");
	},
	hasAttribute : function(o, attName) {
		if (o.hasAttribute) return o.hasAttribute(attName);
		return (o.getAttribute(attName) != null);
	},
    fadeIn : function(id, secs) {
		secs = secs || 1;
		var o = id;
		if (typeof (id) == 'string')
			o = document.getElementById(id);
        if (o == null) return false;
		//use a lock on the element so can't fade simultaneously
		if (mu.Fade.hasAttribute(o, 'fadeLock')) return false;
		o.setAttribute("fadeLock", true);
        if (o.style.display == 'none') { //if not displayed, make invisible and display
            this.setOpacity(id, 0);
            o.style.display = '';
        }
		var op = 0;
		var interval = Math.round(10/secs);
        for(timer = 1; timer <= (10 * secs); timer++) { //set a lot of timeouts, one very 1/10th second
			//set as a string, as need to pass arguments
			op = op + interval;
            if (op<= 100) setTimeout("mu.Fade.setOpacity('" + id + "'," + op + ")", (timer * 100));
        }
		setTimeout("mu.Fade.freeLock('" + id + "')", (timer * 100));
		return true;
    },
    fadeOut: function(id, secs) {
		secs = secs || 1;
		var o = id;
		if (typeof (id) == 'string')
			o = document.getElementById(id);
        if (o == null) return;
		//use a lock on the element so can't fade simultaneously
		if (mu.Fade.hasAttribute(o,'fadeLock')) return;
		o.setAttribute("fadeLock", true);
		var op = 100;
		var interval = Math.round(10/secs);
        for(timer = 1; timer <= (10 * secs); timer++) {
			op = op - interval;
            if (op>=0)setTimeout("mu.Fade.setOpacity('" + id + "'," + op + ")", (timer * 100));
        }
		setTimeout("mu.Fade.freeLock('" + id + "')", (timer * 100));
    },
    setOpacity : function (id, opacity) {
		var o = document.getElementById(id);
		if (o == null) return; //been deleted since
        var style = o.style;
        style.opacity = (opacity / 100);
        style.KhtmlOpacity = (opacity / 100);
        style.filter = "alpha(opacity=" + opacity + ")";
	}
};


mu.Drag = {
        //dependency on mu (GetObj, AddEvent, RemoveEvent)
        obj : null,

        //eg Drag.init("MyDialogBox"); //simple
        //   Drag.init("MyDialogBox", "MyDialogBoxTitleBar"); //with a handle
        init : function(id, handleId) {
			var dragObj = id;
			if (typeof (id) == 'string')
	            dragObj = document.getElementById(id);
			if (dragObj == null) return false;
            var handle = dragObj;
            if (handleId != null) {
                handle = handleId;
				if (typeof (handleId) == 'string')
					handle = document.getElementById(handleId);
            }
            //save what this handle is dragging- could be itself
            handle.dragObj= dragObj;
            mu.addEvent(handle, "mousedown", mu.Drag.start);
            return true;
        },

        start : function(e) {

          var handle = mu.Drag.getTarget(e);

          //what is being dragged
          mu.Drag.obj = handle.dragObj;
          var o = mu.Drag.obj;

          var position= mu.Drag.getMousePosition(e);

          var style= o.style;
          //make relative positioned
          if (style.position == "")
            style.position= "relative";

          // Save starting positions of cursor and obj.
          mu.Drag.cursorStartX = position.left;
          mu.Drag.cursorStartY = position.top;
          mu.Drag.startLeft  = parseInt(style.left, 10);
          mu.Drag.startTop   = parseInt(style.top,  10);
          if (isNaN(mu.Drag.startLeft)) mu.Drag.startLeft = 0;
          if (isNaN(mu.Drag.startTop)) mu.Drag.startTop = 0;

          // Capture mousemove and mouseup
          mu.addEvent(document, "mousemove", mu.Drag.move);
          mu.addEvent(document, "mouseup", mu.Drag.stop);
          mu.Drag.bubbling(e);

          //stop IE selecting text when dragged over
          mu.saveOnselectstart = document.body.onselectstart;
          document.body.onselectstart = function () { return false; };
        },

        move : function (e) {

          var position= mu.Drag.getMousePosition(e);
		  if(!mu.Drag.obj) return;
          var style= mu.Drag.obj.style;

          style.left = (mu.Drag.startLeft + position.left - mu.Drag.cursorStartX) + "px";
          style.top  = (mu.Drag.startTop  + position.top - mu.Drag.cursorStartY) + "px";

          mu.Drag.bubbling(e);
        },

        stop : function (event) {

          mu.removeEvent(document, "mousemove", mu.Drag.move);
          mu.removeEvent(document, "mouseup", mu.Drag.stop);
          //clear ref to this drag object
          mu.Drag.obj= null;

          //reset IE selecting text when dragged over
          document.body.onselectstart = mu.saveOnselectstart;
        },

        getMousePosition : function (e) { //from Quirksmode
	        var posx = 0;
	        var posy = 0;
	        if (!e) var e = window.event;
	        if (e.pageX || e.pageY) 	{
		        posx = e.pageX;
		        posy = e.pageY;
	        }
	        else if (e.clientX || e.clientY) 	{
		        posx = e.clientX + document.body.scrollLeft
			        + document.documentElement.scrollLeft;
		        posy = e.clientY + document.body.scrollTop
			        + document.documentElement.scrollTop;
	        }
           return {
                left: posx,
                top: posy
           };
        },

        bubbling : function (e) {
          e = e ? e : window.event;
	        if (e.stopPropagation) { //w3c
		        e.stopPropagation();
		        e.preventDefault();
	        } else if (e.cancelBubble) { //ie
		        e.cancelBubble = true;
		        e.returnValue  = false;
	        }
        },

        getTarget : function(e) {
            var target = e.target || e.srcElement
            while (target.dragObj == null) { //look up for handle
                target= target.parentNode;
            }
            return target;
        }
};


mu.msgBox = {
    getDimensions: function (element) {
        //orig from prototype
        if (element.style.display != 'none')
          return {width: element.offsetWidth, height: element.offsetHeight};

        // All *Width and *Height properties give 0 on elements with display none,
        // so enable the element temporarily
        var style = element.style;
        var originalVisibility = style.visibility;
        var originalPosition = style.position;
        style.visibility = 'hidden';
        style.position = 'absolute';
        style.display = '';
        var originalWidth = element.clientWidth;
        var originalHeight = element.clientHeight;
        style.display = 'none';
        style.position = originalPosition;
        style.visibility = originalVisibility;
        return {width: originalWidth, height: originalHeight};
      },

    center: function (obj){
        //orig from scriptaculous(?)
        var _width  = 0;
        var _height = 0;

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

        //get scroll position
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

        //get the size of object (incl not-shown)
        var objDimensions = this.getDimensions(obj);

        var setX = ( _width  - objDimensions.width  ) / 2;
        var setY = ( _height - objDimensions.height ) / 2 + scrollY;

        setX = ( setX < 0 ) ? 0 : setX;
        setY = ( setY < 0 ) ? 0 : setY;

        //absolutely position
        obj.style.position = 'absolute';
        obj.style.zIndex   = 99;

        obj.style.left = setX + "px";
        obj.style.top  = setY + "px";

        //obj.style.display  = 'block';
        mu.Fade.fadeIn(obj.id, 0.4);
    },

    counter: 0, //used to assign multiple messageboxes a unique id

    ieSelectFix: function(o) { //iframe behind it- http://tanny.ica.com/
        if (document.all&&document.getElementById && !window.Opera){
            //ie7 fixes this
            var iFrame=document.createElement('iframe');
	        if(document.location.protocol == "https:")
		        iFrame.src="//0";
	        else
		        iFrame.src="about:blank";
	        iFrame.scrolling="no";
	        iFrame.frameBorder="0";
	        //the containing block is styled with borders, which select boxes eat
	        //really should have a parent block
	        iFrame.style.width= o.offsetWidth-3+"px";
	        iFrame.style.height= o.offsetHeight-3+"px";
	        iFrame.style.position= "absolute";
	        iFrame.style.top= 0;
	        iFrame.style.left= 0;
	        iFrame.style.zIndex= -1;
	        o.insertBefore(iFrame, o.childNodes[0]);
	        o.style.zIndex= 101;
       }
    },

    createBox: function(title, str) {
        //generate a box with preset styles (MsgBox, MsgBoxTitle, MsgBoxClose)
        //here we also require an image called MsgBoxCloseButton.gif
        var box = document.createElement("div");
        box.style.display= "none";
        box.className= "MsgBox";
        box.id= "MsgBox" + this.counter; //only one allowed - used by close function
        this.counter++;
		var content = document.createElement("div");
        content.className= "MsgBoxContent";
        content.innerHTML = str; //insert the text (or html)
		box.appendChild(content)
        //the title bar
        var titleBar = document.createElement("div");
        titleBar.className= "MsgBoxTitle";
        //the close button
        var close = document.createElement("span");
        close.className= "MsgBoxClose";
        //close image (could do text here)
        var closeImg = document.createElement("img");
        closeImg.src = "MsgBoxCloseButton.gif";
        closeImg.alt = "Close window";
        close.appendChild(closeImg);
        //we could fadeOut here with a long timeout to remove it
        var func = "var child=document.getElementById('" + box.id + "');child.parentNode.removeChild(child);";
        close.onclick= new Function(func);
        //put them together (box must not be displayed to start)
        titleBar.innerHTML = title + " "; //can be styled with html
        titleBar.appendChild(close);
        box.insertBefore(titleBar, box.firstChild);
        document.body.appendChild(box);

        //show and make it draggable
        this.center(box); //centers and shows it
		//ie7 needs this
		if (document.all) titleBar.style.width = this.getDimensions(box).width + "px";

        //for ie 4-6 only select box problem
        this.ieSelectFix(box);
        //make it draggable (optional)
        mu.Drag.init(box, titleBar);
    },
    show: function(id, handleId) {
        //show an existing (display-noned) div
		var box = id;
		if (typeof (id) == 'string')
			box = document.getElementById(id);
        if (box == null) return false;
        this.center(box); //centers and shows it
        this.ieSelectFix(box);
        mu.Drag.init(box, handleId);
    }
};

mu.ToolTip = {
	show: function (id, message, secs) {
		if (secs!= 0) secs = secs || 4;
		var timeOutId;
		var o = id;
		if (typeof (id) == 'string')
			o = document.getElementById(id);
        if (o == null) return false;
		var ttId= o.id + "_tt"; //no ids= only one tooltip per page
		var tt = document.getElementById(ttId);
		if (tt != null) { //already exists
			//if (tt.hasAttribute('timeOutId')) { //not IE
			timeOutId = tt.getAttribute('timeOutId');
			if (timeOutId != '') clearTimeout(timeOutId);
			else  //probably in fade out- kill element and recreate
				mu.ToolTip.cleanUp(ttId);
		}
		if (tt == null) { //new or deleted
			tt = document.createElement('div');
			o.parentNode.appendChild(tt);
			tt.id= ttId;
			tt.className= 'ToolTip';
		}
		tt.innerHTML = message;
		var style= tt.style;
		style.position = 'absolute';

		var pos = mu.ToolTip.findPos(o);
		var left = pos.left + 2; //slight right-indent
		var top = pos.bottom; //be wary of overlaps with mouseovers
		style.left = left + "px";
		style.top = top + "px";
		if (secs > 0)
			timeOutId = setTimeout("mu.ToolTip.hide('" + ttId + "')", secs * 1000);
		tt.setAttribute('timeOutId', timeOutId);
		return ttId;
		},
	 findPos: function(obj) { //utility to find position (via ppk)
		var curLeft = curTop = curHeight = 0;
		if (obj.offsetParent) {
			curLeft = obj.offsetLeft;
			curTop = obj.offsetTop;
			curHeight = obj.offsetHeight;
			while (obj = obj.offsetParent) {
				curLeft += obj.offsetLeft;
				curTop += obj.offsetTop;
			}
		}
		curHeight += curTop;
		return {left:curLeft, top:curTop, bottom:curHeight };
		},
	hide: function(ttId) {
		var tt = ttId;
		if (typeof (ttId) == 'string')
			tt = document.getElementById(ttId);
		if (tt == null) return; //been deleted since
		if(tt.className != 'ToolTip') { //parent element?
			ttId = tt.id + "_tt";
			tt = document.getElementById(ttId);
			if (tt == null) return; //been deleted since
		}
		//clear the timeout (important if hiding manually)
		timeOutId = tt.getAttribute('timeOutId');
		if (timeOutId != '') clearTimeout(timeOutId);
		tt.removeAttribute('timeOutId');
		mu.Fade.fadeOut(ttId);
		//100ms after faded out, display none and delete it (fadeout could be canceled)
		setTimeout("mu.ToolTip.cleanUp('" + ttId + "')", 1100);
	},
	cleanUp: function(ttId) {
		var tt = ttId;
		if (typeof (ttId) == 'string')
			tt = document.getElementById(ttId);
		if (tt == null) return; //been deleted since
		tt.style.display = 'none';
		tt.parentNode.removeChild(tt);
		tt = null;
	}
};

mu.Preview = { //uses mu.ToolTip for image preview
	init: function () {
		//look for all imgs thumbnails (have Thumbnail class)
		var imgs = document.getElementsByTagName("img");
		for(var i= 0; i< imgs.length; i++) {
			if(imgs[i].className == "Thumbnail") {
				if (imgs[i].id == "") imgs[i].id= "img" + i; //tooltip uses id
				imgs[i].onmouseover = mu.Preview.showPreview;
				imgs[i].onmouseout = mu.Preview.hidePreview;
		}
		}
	},
	 showPreview : function(e) {
		e = e || event;
		var target = e.target || e.srcElement;
		var src= target.src; //+ "&b=1"; //change the src url for bigger image - here width is hardcoded
		mu.ToolTip.show(target, "<img src='" + src + "' alt='Preview' width='200' />", 10);
	},
	 hidePreview: function(e) {
		e = e || event;
		var target = e.target || e.srcElement;
		mu.ToolTip.hide(target);
	}
};
//mu.addLoadEvent(mu.Preview.init);