function showWait() {
    var worker = {
        imageSrc : "waiting.gif", //adjust location if required
        showWaiting: function() {
            if (typeof(Page_ClientValidate) == 'function')
                { if (Page_ClientValidate("") == false) return false;}

		    var mask= document.createElement("div");
	        mask.id = "WaitMask";
		    //mask.className= "WaitMask";
		    //we set  styles explictly
            mask.style.position = 'absolute';
            mask.style.top = 0;
            mask.style.left = 0;
	        mask.style.backgroundColor = "#eeeeee";
	        mask.style.opacity = .25;
	        mask.style.filter = "alpha(opacity='25')";
            mask.style.overflow = "hidden";
            mask.style.zIndex = 98;
            
		    //these styles have to be assigned dynamically
            var dim = worker.getHTMLDimensions();
            mask.style.width = dim.width + "px" ;
            mask.style.height =  dim.height + "px" ; 
	        document.body.appendChild(mask);

	        //create a div with class WaitMsg and text (not localized)
	        var msg= document.createElement("div");
	        msg.id= "WaitMsg";
	        //msg.className= "WaitMsg";
	        var ms = msg.style;
            ms.width = "400px";
            ms.padding = "10px";
            ms.textAlign = "center";
	        ms.fontSize = "large";
            ms.border = "2px solid #ddd";
	        ms.backgroundColor = "#ffffff";
	        ms.color = "#000000";
            ms.fontWeight = "bold";
            
            var waitImage = document.createElement("img");
            waitImage.src = worker.imageSrc;
            waitImage.alt = "Please wait";
            waitImage.id = "waitImage";
            waitImage.style.height = "16px";
            waitImage.style.width = "16px";
            msg.appendChild(waitImage);
                     
            msg.appendChild(document.createElement("br"));            

            var newtext = document.createTextNode("Please wait...");
            msg.appendChild(newtext);
            
	        document.body.appendChild(msg);
            
            worker.center(msg);       

            // IE has problems with gif animation so reload  after timeout
            setTimeout( function() {                       
                    var img = document.getElementById('waitImage'); 
                    img.src = img.src + "?" + new Date().getMilliseconds(); 
                }, 100);

            return true;
        },
        
         getHTMLDimensions: function() {
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
        },

         center: function(obj) { //from mufx.js
            var vp= worker.getViewPortDimensions();
            var objDim = worker.getDimensions(obj);

            var x = ( vp.width  - objDim.width  ) / 2;
            var y = ( vp.height - objDim.height ) / 2 + worker.getWindowTop();

            x = ( x < 0 ) ? 0 : x;
            y = ( y < 0 ) ? 0 : y;

            //absolutely position
            obj.style.position = 'absolute';
            obj.style.zIndex   = 99;

            obj.style.left = x + "px";
            obj.style.top  = y + "px";
        },
       
        getWindowTop : function () { //get scroll position
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
        },
        
        getViewPortDimensions : function() { //get viewport dimensions
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
        },
         getDimensions: function(element) {
            //orig from prototype
            if (element.style.display != 'none')
              return {width: element.offsetWidth, height: element.offsetHeight};

            // All *Width and *Height properties give 0 on elements with display none,
            // so enable the element temporarily
            var style = element.style;
            var origVisibility = style.visibility;
            var origPosition = style.position;
            style.visibility = 'hidden';
            style.position = 'absolute';
            style.display = '';
            var origWidth = element.clientWidth;
            var origHeight = element.clientHeight;
            style.display = 'none';
            style.position = origPosition;
            style.visibility = origVisibility;
            return {width: origWidth, height: origHeight};
          }
    };
    setTimeout(worker.showWaiting, 250); //show after 1/4 second
    return true;
}
