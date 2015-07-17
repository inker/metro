!function t(e,n,r){function a(i,s){if(!n[i]){if(!e[i]){var u="function"==typeof require&&require;if(!s&&u)return u(i,!0);if(o)return o(i,!0);var l=new Error("Cannot find module '"+i+"'");throw l.code="MODULE_NOT_FOUND",l}var c=n[i]={exports:{}};e[i][0].call(c.exports,function(t){var n=e[i][1][t];return a(n?n:t)},c,c.exports,t,e,n,r)}return n[i].exports}for(var o="function"==typeof require&&require,i=0;i<r.length;i++)a(r[i]);return a}({1:[function(t,e,n){"use strict";var r=function(){function t(t,e,n){var r=L.control.UniForm(e,n||null,{collapsed:!1,position:"topright"});r.addTo(t.getMap()),r.renderUniformControl()}return t}();n.LayerControl=r;var a=function(){function t(t){var e=t.getOverlay(),n=t.getMap(),r=new L.Polyline([],{color:"red"});r.addTo(n);var a=new L.CircleMarker([60,30]);e.addEventListener("click",function(t){if(t.shiftKey){var e=n.containerPointToLatLng(new L.Point(t.x,t.y));r.addLatLng(e).redraw(),a.on("mouseout",function(t){return a.closePopup()}),a.addTo(n);var o=r.getLatLngs();if(o.length>1){for(var i=0,s=1;s<o.length;++s)i+=o[s-1].distanceTo(o[s]);L.popup().setLatLng(e).setContent("Popup").openOn(n)}}})}return t}();n.Measurement=a},{}],2:[function(t,e,n){"use strict";{var r=t("./metro-map"),a=function(){return new L.TileLayer("https://{s}.tiles.mapbox.com/v3/inker.mlo91c41/{z}/{x}/{y}.png",{minZoom:9,id:"inker.mlo91c41",bounds:null,attribution:'Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://mapbox.com">Mapbox</a>'})}(),o=function(){return new L.TileLayer("http://openmapsurfer.uni-hd.de/tiles/roads/x={x}&y={y}&z={z}",{minZoom:9,attribution:'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'})}();new r("map-container","json/graph.json",{Mapbox:a,OpenMapSurfer:o})}!function(){var t=["Plan metro Sankt-Peterburga","Pietarin metron hankesuunnitelma","St Petersburg metro plan proposal"],e=0;setInterval(function(){return document.title=t[++e%t.length]},3e3)}(),console.log("user: "+navigator.userLanguage),console.log("language: "+navigator.language),console.log("browser: "+navigator.browserLanguage),console.log("system: "+navigator.systemLanguage)},{"./metro-map":3}],3:[function(t,e,n){"use strict";var r=window.L,a=t("./svg"),o=t("./util"),i=t("./addons"),s=function(){function t(t,e,n){var a=this,o=this.fetch(e),s=this.fetch("json/hints.json");this.map=new r.Map(t,{layers:n.Mapbox||n[Object.keys(n).toString()],center:new r.LatLng(60,30),zoom:11,minZoom:9,inertia:!1}).addControl(new r.Control.Scale({imperial:!1})),new i.LayerControl(this,n),console.log("map should be created by now"),this.addOverlay(),this.addListeners(),o.then(function(t){return a.handleJSON(t)}).then(function(){return s}).then(function(t){return a.appendHintsToGraph(t)}).then(function(){return a.redrawNetwork()})["catch"](function(t){return alert(t)})}return t.prototype.getMap=function(){return this.map},t.prototype.getOverlay=function(){return this.overlay},t.prototype.addOverlay=function(){this.overlay=document.getElementById("overlay"),this.overlay.id="overlay",this.overlay.style.fill="white",this.overlay.style.zIndex="10"},t.prototype.addListeners=function(){var t=this,e=this.map.getPanes().mapPane;this.map.on("movestart",function(e){return t.map.touchZoom.disable()}),this.map.on("move",function(n){return t.overlay.style.transform=e.style.transform}),this.map.on("moveend",function(n){t.map.touchZoom.enable();var r=o.parseTransform(e.style.transform);t.overlay.style.transform=e.style.transform="translate("+r.x+"px, "+r.y+"px)"}),this.map.on("zoomstart",function(e){t.map.dragging.disable(),t.overlay.style.opacity="0.5"}),this.map.on("zoomend",function(e){t.redrawNetwork(),t.overlay.style.opacity=null,t.map.dragging.enable()})},t.prototype.fetch=function(t){return new Promise(function(e,n){var r=new XMLHttpRequest;r.onreadystatechange=function(){4===r.readyState&&(200===r.status?e(r.responseText):n("couldn't fetch "+t+": "+r.status+": "+r.statusText))},r.open("GET",t,!0),r.setRequestHeader("X-Requested-With","XMLHttpRequest"),r.send()})},t.prototype.handleJSON=function(t){this.graph=JSON.parse(t),this.extendBounds(),this.map.setView(this.bounds.getCenter(),11,{pan:{animate:!1},zoom:{animate:!1}})},t.prototype.appendHintsToGraph=function(t){this.graph.hints=JSON.parse(t),console.log(this.graph.hints)},t.prototype.refillSVG=function(){for(var t=void 0;t=this.overlay.firstChild;)this.overlay.removeChild(t);var e=a.createSVGElement("defs");e.id="defs",e.appendChild(a.makeDropShadow()),this.overlay.appendChild(e);var n=a.createSVGElement("g");n.id="origin",["paths","transfers","station-circles","station-plate","dummy-circles"].forEach(function(t){var e=a.createSVGElement("g");e.id=t,n.appendChild(e)}),this.overlay.appendChild(n);var r=document.getElementById("station-circles");r.classList.add("station-circle");var o=document.getElementById("station-plate");o.style.display="none",o.innerHTML='<line id="pole" class="plate-pole"/>\n            <g>\n                <rect id="plate-box" class="plate-box" filter="url(#shadow)"/>\n                <text id="plate-text" fill="black" class="plate-text"><tspan/><tspan/><tspan/></text>\n            </g>'},t.prototype.extendBounds=function(){var t=this,e=this.graph.platforms[0].location;this.bounds=new r.LatLngBounds(e,e),this.graph.platforms.forEach(function(e){return t.bounds.extend(e.location)})},t.prototype.showPlate=function(t){var e=t.target,n=o.getSVGDataset(e),r=document.getElementById(n.platformId||n.stationId),i=a.changePlate(r);i.style.display=null,e.onmouseout=function(t){i.style.display="none",e.onmouseout=null}},t.prototype.posOnSVG=function(t,e){var n=this.map.latLngToContainerPoint(e);return n.subtract(t.min)},t.prototype.updatePos=function(){var t=this.bounds.getNorthWest(),e=this.bounds.getSouthEast(),n=new r.Bounds(this.map.latLngToContainerPoint(t),this.map.latLngToContainerPoint(e)),a=o.parseTransform(this.overlay.style.transform),i=n.getSize(),s=n.min.subtract(a).subtract(i);this.overlay.style.left=s.x+"px",this.overlay.style.top=s.y+"px";var u=i,l=document.getElementById("origin");l.style.transform="translate("+u.x+"px, "+u.y+"px)";var c=i.multiplyBy(3);this.overlay.style.width=c.x+"px",this.overlay.style.height=c.y+"px"},t.prototype.redrawNetwork=function(){var t=this,e=this;this.refillSVG(),this.updatePos();for(var n={"station-circles":document.createDocumentFragment(),"dummy-circles":document.createDocumentFragment(),transfers:document.createDocumentFragment(),paths:document.createDocumentFragment()},i=new Array(this.graph.platforms.length),s=this.map.getZoom(),u=this.bounds.getNorthWest(),l=this.bounds.getSouthEast(),c=new r.Bounds(this.map.latLngToContainerPoint(u),this.map.latLngToContainerPoint(l)),p=12>s?function(t){return e.posOnSVG(c,e.graph.stations[t.station].location)}:function(t){return e.posOnSVG(c,t.location)},d=this.graph.platforms.map(p),h=.5*(s-7),g=12>s?1.25*h:h,f=.4*g,m=h,y=new Set,v=function(r){var u=t.graph.stations[r],l=o.findCircle(t.graph,u),c=[];if(u.platforms.forEach(function(t){var o=e.graph.platforms[t],u=d[t];if(s>9){var p=a.makeCircle(u,g);a.convertToStation(p,"p-"+t,o,f),p.setAttribute("data-station",r.toString());var h=a.makeCircle(u,2*g);h.classList.add("invisible-circle"),h.setAttribute("data-platformId",p.id),h.onmouseover=e.showPlate,n["station-circles"].appendChild(p),n["dummy-circles"].appendChild(h)}if(2===o.spans.length)!function(){var n=[u,u],r=[0,0],a=e.graph.spans[o.spans[0]];a.source===t&&o.spans.reverse();for(var s=0;2>s;++s){var l=e.graph.spans[o.spans[s]],c=l.source===t?l.target:l.source,p=(e.graph.platforms[c],d[c]);r[s]=u.distanceTo(p),n[s]=u.add(p).divideBy(2)}var h=n[1].subtract(n[0]).multiplyBy(r[0]/(r[0]+r[1])),g=n[0].add(h),f=u.subtract(g);i[t]=n.map(function(t){return t.add(f)})}();else if(3===o.spans.length){for(var m=[],v=[],b=0;3>b;++b){var x=e.graph.spans[o.spans[b]];if(x.source===t){var w=(e.graph.platforms[x.target],d[x.target]);m.push(w)}else{var w=(e.graph.platforms[x.source],d[x.source]);v.push(w)}}var S=1===v.length?v[0]:v[0].add(v[1]).divideBy(2),L=1===m.length?m[0]:m[0].add(m[1]).divideBy(2),C=u.distanceTo(S),A=u.distanceTo(L),T=u.add(S).divideBy(2),B=u.add(L).divideBy(2),E=B.subtract(T).multiplyBy(C/(C+A)),P=T.add(E),O=u.subtract(P);i[t]=[T.add(O),B.add(O)]}else i[t]=[u,u];l&&l.indexOf(o)>-1&&(c.push(u),y.add(t))}),s>11&&l){var p=o.getCircumcenter(c),h=p.distanceTo(c[0]),v=a.makeRingWithBorders(p,h,m,f);n.transfers.appendChild(v)}},b=0;b<this.graph.stations.length;++b)v(b);s>11&&this.graph.transfers.forEach(function(t){if(!y.has(t.source)||!y.has(t.target)){var r=e.graph.platforms[t.source],o=e.graph.platforms[t.target],i=[e.posOnSVG(c,r.location),e.posOnSVG(c,o.location)],s=a.makeTransfer(i[0],i[1],m,f);n.transfers.appendChild(s)}});for(var x=0;x<this.graph.spans.length;++x){var w=this.graph.spans[x],S=w.source,L=w.target,C=(this.graph.platforms[S],this.graph.platforms[L],a.makeCubicBezier([d[S],i[S][1],i[L][0],d[L]])),A=w.routes.map(function(t){return e.graph.routes[t]}),T=A[0].line.match(/[MEL](\d{1,2})/);C.style.strokeWidth=h.toString(),T&&C.classList.add(T[0]),C.classList.add(A[0].line.charAt(0)+"-line"),n.paths.appendChild(C)}Object.keys(n).forEach(function(t){return document.getElementById(t).appendChild(n[t])})},t}();e.exports=s},{"./addons":1,"./svg":4,"./util":5}],4:[function(t,e,n){"use strict";function r(t,e){var n=u("circle");return n.setAttribute("r",e.toString()),n.setAttribute("cy",t.y.toString()),n.setAttribute("cx",t.x.toString()),n}function a(t,e,n,r){t.id=e,t.style.strokeWidth=r+"px",h.setSVGDataset(t,{lat:n.location.lat,lng:n.location.lng,ru:n.name,fi:n.altName})}function o(t){if(4!==t.length)throw new Error("there should be 4 points");var e=u("path"),n=t.map(function(t){return t.x+","+t.y});return n.unshift("M"),n.splice(2,0,"C"),e.setAttribute("d",n.join(" ")),e}function i(t,e,n,a){var o=u("g");o.classList.add("transfer");var i=.5*a;return[n+i,n-i].forEach(function(n){var a=r(t,e);a.style.strokeWidth=n+"px",o.appendChild(a)}),o}function s(t,e,n,r){var a=u("g");a.classList.add("transfer");var o=.5*r;return[n+o,n-o].forEach(function(n){var r=u("line");r.setAttribute("x1",t.x.toString()),r.setAttribute("y1",t.y.toString()),r.setAttribute("x2",e.x.toString()),r.setAttribute("y2",e.y.toString()),r.style.strokeWidth=n+"px",a.appendChild(r)}),a}function u(t){return document.createElementNS("http://www.w3.org/2000/svg",t)}function l(){var t=u("filter");return t.id="shadow",t.setAttribute("width","200%"),t.setAttribute("height","200%"),t.innerHTML='\n        <feOffset result="offOut" in="SourceAlpha" dx="0" dy="2" />\n        <feGaussianBlur result="blurOut" in="offOut" stdDeviation="2" />\n        <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />\n    ',t}function c(t,e){var n=document.getElementById("plate-box"),r=12,a=e.reduce(function(t,e){return t.length<e.length?e:t}),o=new d.Point(10+6*a.length,6+r*e.length);n.setAttribute("width",o.x.toString()),n.setAttribute("height",o.y.toString());var i=t.subtract(o);n.setAttribute("x",i.x.toString()),n.setAttribute("y",i.y.toString());for(var s=document.getElementById("plate-text"),u=0;u<e.length;++u){var l=t.subtract(new d.Point(3,o.y-(u+1)*r)),c=s.children[u];c.setAttribute("x",l.x.toString()),c.setAttribute("y",l.y.toString()),c.textContent=e[u]}for(;u<s.children.length;++u)s.children[u].textContent=null}function p(t){var e=document.getElementById("station-plate"),n=e.children[0],r=new d.Point(Number(t.getAttribute("cx")),Number(t.getAttribute("cy"))),a=Number(t.getAttribute("r")),o=Math.trunc(a),i=new d.Point(4+o,8+o),s=new d.Bounds(r,r.subtract(i));n.setAttribute("x1",s.min.x.toString()),n.setAttribute("y1",s.min.y.toString()),n.setAttribute("x2",s.max.x.toString()),n.setAttribute("y2",s.max.y.toString());var u=h.getSVGDataset(t),l=u.ru,p=u.fi,g=p?"fi"===h.getUserLanguage()?[p,l]:[l,p]:[l];return l in h.englishStationNames&&g.push(h.englishStationNames[l]),c(s.min,g),e}var d=window.L,h=t("./util");n.makeCircle=r,n.convertToStation=a,n.makeCubicBezier=o,n.makeRingWithBorders=i,n.makeTransfer=s,n.createSVGElement=u,n.makeDropShadow=l,n.changePlate=p},{"./util":5}],5:[function(t,e,n){"use strict";function r(){return(navigator.userLanguage||navigator.language).slice(0,2).toLowerCase()}function a(t){var e=t.match(/translate(3d)?\((-?\d+).*?,\s?(-?\d+).*?(,\s?(-?\d+).*?)?\)/i);return e?new p.Point(Number(e[2]),Number(e[3])):new p.Point(0,0)}function o(t,e){if(3!==e.platforms.length)return null;var n=e.platforms.map(function(e){return t.platforms[e]});return n.every(function(t){return 2===t.transfers.length})?n:null}function i(t){if(3!==t.length)throw new Error("must have 3 vertices");console.log(t[1]);var e=t[1].subtract(t[0]),n=t[2].subtract(t[0]),r=e.x*e.x+e.y*e.y,a=n.x*n.x+n.y*n.y;return new p.Point(n.y*r-e.y*a,e.x*a-n.x*r).divideBy(2*(e.x*n.y-e.y*n.x)).add(t[0])}function s(t){if(t.dataset)return t.dataset;for(var e=t.attributes,n={},r=0;r<e.length;++r){var a=e[r].name;a.startsWith("data-")&&(n[a.slice(5)]=t.getAttribute(a))}return n}function u(t,e){Object.keys(e).forEach(function(n){return t.setAttribute("data-"+n,e[n])})}function l(t,e){return t.x*e.x+t.y*e.y}function c(t,e){return l(t,e)/t.distanceTo(e)}var p=window.L;n.getUserLanguage=r,n.parseTransform=a,n.findCircle=o,n.getCircumcenter=i,n.getSVGDataset=s,n.setSVGDataset=u,n.englishStationNames={"Centraľnyj voxal":"Central Raiway Station",Aeroport:"Airport"},n.dot=l,n.angle=c},{}]},{},[2]);