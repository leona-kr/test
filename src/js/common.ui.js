//# sourceURL=common.ui.js

'use strict';

(function($ , undefined) {

/*
 * ajax loader UI
 */
var loading = {
	classLoaderOverlay : "loader-overlay",
	classLoaderIcon : "loader-icon",
	show : function($ele){
		var _loader = '.'+this.classLoaderOverlay,
			$loader = $('<div />')
				.addClass(this.classLoaderOverlay),
			$loaderIcon = $('<div />')
				.addClass(this.classLoaderIcon)
				.appendTo($loader),
			$container = (arguments.length > 0) ? $ele : $('body');

		if($container.selector == 'body'){
			$loader.css('position','fixed');
		}

		if( $('.page-modal-area').is(':visible') ){
			var _z = parseInt( $('.page-modal-area:visible').css('z-index') );
			$loader.css('z-index',_z+100);
		}
		if( $('.jqx-window').is(':visible') ){
			var _z = parseInt( $('.jqx-window:visible').css('z-index') );
			$loader.css('z-index',_z+100);
		}

		if( $container.find(_loader).size() >0 ){
			$container.find(_loader).remove();
		}
		$container.append($loader);
	},
	hide : function($ele){
		var _loader = '.'+this.classLoaderOverlay,
		$container = (arguments.length > 0) ? $ele : $('body');

		$container.find(_loader).remove();
	}
};
window.loading = loading;


/*
 * ajax data request
 */
	var requestData = function(){
		this.defaultOption = {
			type : 'post',
			async : true,
			callback : null,
			beforeSend : null,
			afterSend : null,
			displayLoader : false
		}

		this.request = function(element, url, requestData, options){
			var $contentArea = $(element),
			startLoading = function() {
				loading.show($contentArea);
			},
			stopLoading = function() {
				loading.hide($contentArea);
			},

			option = this.option = $.extend({}, this.defaultOption, options);

			if(url != undefined){
				$.ajax({
					type : option.type,
					dataType : 'json',
					contentType : 'application/json; charset=UTF-8',
					async : option.async,
					url: url,
					data : JSON.stringify(requestData),
					beforeSend: function(){
						if(option.beforeSend != null){
							option.beforeSend();
						}
						if(option.displayLoader){
							startLoading();
						}
					},
					success: function(resp, status, jqxhr){
						var code = resp.result_cd,
							msg = resp.result_msg;

						if(code.indexOf('ERR') != -1 && msg == ''){
							msg = "일시적인 장애가 발생하였습니다.<br>잠시후에 다시 실행해 주세요"
						}

						//if(code.indexOf(RESULT_CODE.ERR) != -1){
						//	if( code == RESULT_CODE.ERROR_AUTH){
						//		var t = (resp.result_msg != null) ? resp.result_msg : "권한이 없습니다";
						//		_alert(t);
						//	} else if ( code == RESULT_CODE.ERROR_DB){
						//		var t = (resp.result_msg != null) ? resp.result_msg : "DB접속에 실패하였습니다.\n잠시후에 다시 실행해 주세요";
						//		_alert(t);
						//	}
						//	console.log("[Error code] %c"+code,'color:red');

						//} else if (code === RESULT_CODE.SUCCESS){
							if(option.callback != null){
								 var result = (resp.data != undefined) ? resp.data : {};//var result =  $.extend({}, {result : 1}, resp.data);
								option.callback(result, code, msg);
							}
						//}
					},
					complete: function(){
						if(option.afterSend != null){
							option.afterSend();
						}
						if(option.displayLoader){
							stopLoading();
						}
					},
					error: function(xhr, desc, err) {
						console.error([{'desc':desc, 'error':err, 'xhr':xhr}]);
					}
				});
			} else {
				console.log("Error!");
			}
		}
	};
	$.requestData = new requestData();

	$.fn.requestData = function(url, requestData, options){
		$.requestData.request(this, url, requestData, options);
	}



/*
 * top menu and draw mymenu area
 */
	var GnbMenu = function(){
		this.classMenu = "group-menu";
		this.classNavGlobal = "nav-global";
		this.classNavLocal = "nav-local";
		this.classSubmenu = "submenu";
		this.classMymenu = "group-mymenu";
		this.classAside = "group-aside";
		this.classItemMenu = "item-menu";
		this.classMenuText = "menu-text";
		this.classMenuTitle = "title";
		this.classMenuIcon = "menu-icon";
		this.classBtnDelete = "btn-delete";
		this.classHover = "link-hover";
		this.classPrev = "link-prev";
		this.classOpen = "open";
		this.classSelected = "selected";

		this.setClose;
	}
	GnbMenu.prototype = {
		init : function(element, data, group_key, page_title){
			this.element = element;
			this.data = data;
			this.group_key = group_key;
			this._menu = $(this.element).find('.'+this.classMenu);
			this._btnLocal = $(this.element).find('.'+this.classMenuText);
			this._btnGlobal = $(this.element).find('.'+this.classMenuIcon);
			this._gnav = $(this.element).find('.'+this.classNavGlobal);
			this._lnav = $(this.element).find('.'+this.classNavLocal);

			if(typeof group_key == 'string' && group_key !=''){
				var self = this,
					currMenu,
					getMenu = function(d){
						for(var i=0;i<d.length;i++){
							if(d[i].group_key === group_key){
								if(d[i].child.length>0){
									getMenu(d[i].child);
								} else {
									currMenu = d[i];
								}
							} else {
								if(d[i].child.length>0){
									getMenu(d[i].child);
								}
							}
						}
					};

				getMenu(data);
	
				if(currMenu == undefined) return false;

				this.currMenu = currMenu;
				this.href = (currMenu.menu_param == null)? currMenu.menu_url : currMenu.menu_url+"?"+currMenu.menu_param;

				this.updateTitle(currMenu.menu_nm, currMenu.group_key, currMenu.p_group_key);
				this.loadMenu( currMenu.group_key );
			}else if(page_title !=''){
				this.updateTitle( page_title );
				this.loadMenu();
			}else{
				this._menu.hide();
			}
		},
		updateTitle : function(menu_name, menu_key, menu_pkey){
			if(arguments.length > 1){
				this._btnLocal.find('.'+this.classMenuTitle).text(menu_name);
				this._btnLocal.attr({
					'data-key' : menu_key,
					'data-pkey' : menu_pkey
				});
			} else if(arguments.length === 1){
				this._btnLocal.prop('disabled',true);
				this._btnLocal.find('.'+this.classMenuTitle).text(menu_name);
			}
		},
		loadMenu : function(key){
			var data = this.data,
			self = this,
			$nav = this._gnav.empty(),
			submenu = this.classSubmenu,
			menuWidth = this._menu.width(),
			depth = 0,
			loopDom = function(data, $ul){
				if( data.menu_hide == true ) return false;

				var d = data,
				href = (d.menu_param == null)? d.menu_url : d.menu_url+"?"+d.menu_param,
				text = (d.child.length == 0)? d.menu_nm : d.menu_nm+'<i class="icon-chevron-right"></i>',
				$li = $('<li />')
					.appendTo($ul),
				$link = $('<a />')
					.attr({
						'href' : href,
						'data-key' : d.group_key,
						'data-pkey' : d.p_group_key,
						'data-id' : d.menu_id
					})
					.html(text)
					.appendTo($li);

				// 3D 대시보드
				if(d.menu_id === 271){
					$link.attr('target','_blank');
				}

				if(depth === 0){
					$li.append('<span class="menu-title">'+text+'</span>');

					if(d.menu_id === 1){			//대시보드 그룹
						$li.addClass('list-upper');
					} else if(d.menu_id === 3){	//모니터링 그룹
						$li.addClass('list-lower');
					}
				}

				if(d.group_key == key){
					$li.addClass(self.classSelected);
					$li.parents('li').addClass(self.classSelected);
				}

				if( d.child.length >0){
					var $sub = $('<ul />')
						.attr({
							'data-pkey' : d.group_key,
							'data-url' : href,
							'data-text' : d.menu_nm
						})
						.addClass(submenu)
						.appendTo($li),
					child = d.child;

					depth++;
					for(var j=0, len = child.length; j<len; j++){
						loopDom(child[j], $sub);
					}
				}
			},
			$ul = $('.'+this.classNavGlobal);

			for(var i =0, len = data.length; i< len; i++){
				depth = 0;
				loopDom(data[i], $ul);
			}

			$ul.appendTo($nav);
			this.loadEventMenu();
		},
		loadEventMenu : function(){
			var self = this;

			//local button
			var renderLocalmenu = function($ele, key, pkey){
				var $target = $(self.element).find('[data-key="'+ key +'"]').parents('ul:eq(0)'),
				$clone = $target.clone().html();

				var vpkey = self._gnav.find('[data-key='+pkey+']')
					.data('pkey');

				if( key != pkey ){
					$clone = '<li class="'+self.classPrev+'"><button type="button" data-key="'+pkey+'" data-pkey="'+vpkey+'"><i class="icon-chevron-left"></i> '+$target.data('text')+'</button></li>' + $clone;
				}
				return $clone;
			},
			attachPrevEvent = function(self){
				self._lnav.find('.'+self.classPrev+' button').on('click' ,function(){
					var $clone = renderLocalmenu($(this), $(this).data('key'), $(this).data('pkey'));
					self._lnav.html($clone).show();
					attachPrevEvent(self);
					self.eventOpen(self._lnav);
				});
			};


			//set mymenu size
			var menuWidth = self._menu.outerWidth(),
				menuLeft = parseInt(self._menu.css('left'));

			$('.'+self.classMymenu).css({
				left : menuWidth + menuLeft + 'px',
				right : $('.'+self.classAside).width() + 'px'
			});

			self._btnLocal.on('mouseleave',function(){
				$(this).removeClass(self.classHover);

				clearTimeout(self.setClose);
				self.eventClose();

			}).on('mouseenter',function(){
				$(this).addClass(self.classHover);
				$('.'+self.classMenuIcon).removeClass(self.classOpen).blur();

				if(self._gnav.is(':visible')){
					self._gnav.hide();
				}

				var key = $(this).data('key'),
					pkey = $(this).data('pkey'),
					$clone = renderLocalmenu($(this), key, pkey);

				self._lnav.html($clone).show();

				if(key != pkey ){
					attachPrevEvent(self);
				}

				$(this).addClass(self.classOpen);
				self._menu.addClass(self.classOpen);
				self.eventOpen(self._lnav);
			});

			//global button
			self._btnGlobal.on('mouseenter',function(){
				$(this).addClass(self.classHover);

			}).on('mouseleave',function(){
				$(this).removeClass(self.classHover);

				clearTimeout(self.setClose);
				self.eventClose();

			}).on('click',function(){
				if(self._lnav.is(':visible')) self._lnav.hide();

				if( $(this).hasClass(self.classOpen) ){
					self._gnav.hide();
					$(this).removeClass(self.classOpen);
					self._menu.removeClass(self.classOpen);
				} else {
					self._gnav.show();
					$(this).addClass(self.classOpen);
					self._menu.addClass(self.classOpen);
					self.eventOpen(self._gnav);
				}
			});
		},
		eventOpen : function($nav){
			var self = this,
			hover = self.classHover,
			_w, _h =0;

			//set global nav size
			if($nav.hasClass(self.classNavGlobal)){

				if( $('.'+self.classNavGlobal+' > li.list-upper').size()>0 
						&& $('.'+self.classNavGlobal+' > li.list-lower').size()>0
						&& $('.'+self.classNavGlobal+' > li').size()>2){

					var _child = $nav.find('> li:not(.list-upper)');
					var _upper_h = $('.'+self.classNavGlobal+' > li.list-upper').outerHeight();

					$('.'+self.classNavGlobal+' > li.list-upper').css('float','none');
					$('.'+self.classNavGlobal+' > li.list-lower').css('padding-top','10px');

					_w = _child.size() * _child.width();

					$.each(_child, function(index){
						if(_h < $(this).outerHeight()) _h = $(this).outerHeight();
					});

					if(_h > $('.'+self.classNavGlobal+' > li.list-upper').height() + $('.'+self.classNavGlobal+' > li.list-lower').height() ){
						var _lower_h = _h - _upper_h;
					} else {
						var _lower_h = _h;
					}
					$('.'+self.classNavGlobal+' > li.list-lower').css({
						'height': _lower_h +'px'
					});

					$('.'+self.classNavGlobal+' > li:not(.list-upper):not(.list-lower)').css({
						'height': _h+'px',
						'margin-top': _upper_h*-1 +'px'
					});
				} else {
					var _child = $nav.find('> li');

					_w = _child.size() * _child.width();
					$.each(_child, function(index){
						if(_h < $(this).outerHeight()) _h = $(this).outerHeight();
					});

					$('.'+self.classNavGlobal+' > li').css({
						'height': _h+'px'
					});
				}
			}

			//set local nav size
			else if($nav.hasClass(self.classNavLocal)){
				_w = $('.'+this.classMenu+' .'+this.classMenuText).outerWidth();
				$nav.find(' > li > .'+self.classSubmenu).css('left',_w+"px");
				$nav.find(' > li').attr('style','');
				$nav.css('min-width', (_w+2)+'px');
			}

			//set layer size
			$nav.css({
				'width':_w+2+'px',
				'left':'-1px'
			});

			$nav.find('li').each(function(){
				$(this).on('mouseenter',function(){
					var $submenu = $(this).find('.'+self.classSubmenu).eq(0);
					$(this).addClass(hover);

					if($nav.hasClass(self.classNavLocal)){
						$submenu.show().css('left', $(this).parent().width()+'px');
					}
				}).on('mouseleave',function(){
					var $submenu = $(this).find('.'+self.classSubmenu).eq(0);
					$(this).removeClass(hover);

					if($nav.hasClass(self.classNavLocal)){
						$submenu.hide();
					}
				});
			});

			$nav.on('mouseleave',function(){
				clearTimeout(self.setClose);
				self.eventClose();
			});
		},
		eventClose : function(){
			var self = this;
			self.setClose = setTimeout(function(){
				if( self._menu.find('.'+self.classHover).size() < 1){
					self._menu.removeClass(self.classOpen);
					self._btnLocal.removeClass(self.classOpen);
					self._btnGlobal.removeClass(self.classOpen);

					if(self._lnav.is(':visible')) self._lnav.fadeOut(200);
					if(self._gnav.is(':visible')) self._gnav.fadeOut(200);
				}
			},400);
		}
	}
	$.fn.gnbMenu = function(data, group_key, page_title){
		if(data == undefined || group_key == undefined) return false;
		$.gnbMenu.init(this, data, group_key, page_title);
	}
	$.gnbMenu = new GnbMenu();


/*
 * load page expand
 */
	var ExpandPage = function(){
		this.defaultOption = {
			maxHeight : null,
			speed : 200,
			effect : "slide",			//slide(default) | show
			type: 'get',
			data: null,
			displayLoader: true
		};

		this.classPageInner = "page-expand-inner";
		this.classArea = "page-expand-area";
		this.classAreaAside = "expand-aside-area";
		this.classAreaContent = "expand-content-area";
		this.classOpen = "open";
		this.classBtnClose = "btn-close";
		this.classTitle = 'section-title';
		this.classTitleGroup = 'title-group';
		this.classContent = 'section-content';
	};
	ExpandPage.prototype={
		setArrow : function(){
			$('#style-expand-page').remove();

			var t = this.option.speed + 100;
			setTimeout(function(){
				var $btn = $('.section-header .area-settings .btn-aside.open');
				if($btn.size()==0) return false;
				var pos = $btn.offset().left + $btn.width()*.5,
				style = $('<style />')
					.attr('id','style-expand-page')
					.html('.page-expand-area .page-expand-inner:before{left:'+pos+'px}')
					.appendTo($('head'));
			},t);
		},
		removeArror : function(){
			$('#style-expand-page').remove();
		},
		loadPage : function(element,url,options){
			var that = this,
			after = function(){
				//$(element).addClass("open");
				$(that.btnClose).on("click",function(){
					$("[data-expand-button=true]").removeClass("open");
					that.collapsing(that);
				});

				slui.attach.init('.'+that.classArea);
			}

			that.option = $.extend({}, that.defaultOption, options);
			that.element = element;

			if(that.option.displayLoader){
				loading.show();
			}

			that.render();
			that.expanding(url, after);
			that.setArrow();

			window.addEventListener("resize", function(){
				clearTimeout(that.st);
				that.st = setTimeout(function(){
					that.setArrow();
				},30);
			});
		},
		destroyPage : function(){
			var that = this;
			that.collapsing();
			//window.removeEventListener("resize", that.eventResetArrow);
		},
		render : function(){
			var element = this.element,
			 option = this.option;
			 //isLimited = option.maxHeight != null? true : false;

			var basicHtml = '<div id="expandinner" class="'+this.classPageInner+'">'+
				'<div id="expandAside" class="'+this.classAreaAside+'"><button type="button" class="'+this.classBtnClose+'"><i class="icon-times"></i></button></div>'+
				'<div id="expandcontent" class="'+this.classAreaContent+'" data-page-body="true"></div>' +
				//'<div id="expandScrollBar" class="jqx-clear jqx-position-absolute" style="left: 0; top: 0; "></div>' +
				'</div>';

			element.innerHTML = basicHtml;

			this.header = $(element).find("#expandAside");
			this.content = $(element).find("#expandcontent");
			this.btnClose = $(element).find("."+this.classBtnClose);

			if( option.effect === "show" ){
				$(element).find("."+this.classPageInner).height("");
			} else {		//default is slide
				$(element).height("0px");
			}

			//var verticalScrollBar = $(element).find("#expandScrollBar");
			//if (this.vScrollBar) {
			//	this.vScrollBar.jqxScrollBar('destroy');
			//}

			//if(isLimited){
			//	this.vScrollBar = verticalScrollBar.jqxScrollBar({ 'vertical': true, _triggervaluechanged: false });
			//	this.vScrollBar.css('visibility', 'hidden');

			//	this.vScrollInstance = $.data(this.vScrollBar[0], 'jqxScrollBar').instance;
			//}
		},
		expanding : function(url, after){
			var that = that !=null ? that : this,
			 content = that.content,
			 option = that.option,
			 $container = $(that.element);

			if(option == undefined) return false;

			$.ajax({
				url: url,
				dataType: 'text',
				type: option.type,
				data: option.data,
				beforeSend:function(xhr){
					/*if(option.displayLoader){
						loading.show($container);
					}*/
				},
				success: function(data){
					var jsonData = null;
					if(data.charAt(0) == '{') {
						try {
							jsonData = $.parseJSON(data);
						}
						catch(e) {
							console.log(e.message);
						}
						
						if(jsonData && jsonData.result_msg) {
							_alert(jsonData.result_msg);
							that.collapsing(that);
							return;
						}
					}
					
					$(content).html(data);

					var height = option.maxHeight != null? option.maxHeight : $(content).outerHeight(),
					 isLimited = option.maxHeight != null? true : false,
					 $innercontainer = $container.find("."+that.classPageInner);

					$container.css({
						"overflow-y":"",
						"min-height": ""
					});

					if( option.effect === "show" ){
						$innercontainer.show(0, function(){
							$container.addClass(that.classOpen);

							//if( isLimited ){
							//	$(this).css({
							//		"height" : height + "px",
							//		"min-height" : height+"px"
							//	});
							//}else{
								$(this).height('');
							//}
							that.contentOverlay(true);
						});

					} else {		//default value "slide"
						$container.animate({
							height : height+"px"
						}, option.speed, function(){
							$(this).addClass(that.classOpen);

							//if( isLimited ){
							//	$(this).css({
							//		"height" : height + "px",
							//		"min-height" : height+"px"
							//	});
							//}else{
								$(this).css("min-height","")
									.height("")
							//}
							that.contentOverlay(true);

							if(option.displayLoader){
								loading.hide();
							}
						});
					}

					if($innercontainer.find('.'+that.classTitle).size()>0){
						var $title = $innercontainer.find('.'+that.classTitle);
						$title.attr('data-page-head', true);
						$title.addClass(that.classTitleGroup).removeClass(that.classTitle);
						$title.prependTo( $innercontainer.find('.'+that.classContent+':eq(0)'));
					}

					//if( isLimited ){
					//	that.updateScroll(height);
					//}

					$innercontainer.find("[data-layer-close=true]").hide();
				},
				complete: function(){
					after();

					/*if(option.displayLoader){
						loading.hide();
					}*/
				},
				fail: function(){
					that.destroyPage();
					console.log("%c[Error on page load]","color:red;background:#ffffc9;");
				}
			});

			$(window).resize();		//set gap in grid scroll
		},
		contentOverlay : function(isOpen){
			var that = this,
				$container = $('.container'),
				classLayerBlank = 'blank-overlay-content';

			if( isOpen ){
				$container.append('<div class="'+classLayerBlank+'"></div>');

				// bind close event
				$('.'+classLayerBlank)
					.css('cursor','pointer')
					.on('click',function(){
						if($(this).hasClass('disabled')) return;

						$("[data-expand-button=true]").removeClass("open");
						that.collapsing(that);
					})
					.on('mouseenter',function(){
						$(that.element).find('[class^=icon-]').addClass('hover');
					})
					.on('mouseleave',function(){
						$(that.element).find('[class^=icon-]').removeClass('hover');
					});

				$(that.element).append(
					$('<span/>').addClass('icon-chevron-up').one('mouseup',function(){
						$('.'+classLayerBlank).trigger('click');
					})
				);
			} else {
				$('.'+classLayerBlank).remove();
			}
		},
		collapsing : function(that){
			var that = that !=null ? that : this,
			 element = that.element,
			 content = that.content,
			 option = that.option;

			if(option == undefined) return false;
			 var isLimited = option.maxHeight != null ? true : false;

			var $container = $(element),
			 $innercontainer = $(element).find("."+that.classPageInner);

			if( option.effect === "show" ){
				$container.css("min-height","").hide(0, function(){
					$(this).removeClass(that.classOpen)
						.css({ height:"", display: "" })
						.empty();
				});
				that.contentOverlay();
			} else {
				$container.css("min-height","").animate({
					height:0
				}, option.speed-50, function(){
					$(this).removeClass(that.classOpen)
						.css({ height:"", display: "" })
						.empty();
					that.contentOverlay();
				});
			}

			$(window).resize();		//set gap in grid scroll
		},
		updateScroll : function(height){
			var that = this,
				 $container = $(that.element),
				 $innercontainer = $(that.element).find("."+that.classPageInner);

			var pdt = parseInt( $innercontainer.css("padding-top") ),
				pdb = parseInt( $innercontainer.css("padding-bottom") ),
				pdl = parseInt( $innercontainer.css("padding-left") ),
				pdr = parseInt( $innercontainer.css("padding-right") ),
				scrollWidth = 8;

			$innercontainer.css({
				"padding-top":0,
				"padding-bottom":0,
				"height": height+"px"
			});
			var $scrollDiv = $("<div />")
					.css({
						"position" : "absolute",
						"top": pdt+"px",
						"left": pdl+"px",
						"right": pdr+scrollWidth+"px",
						"bottom": pdb+"px"
					})
					.appendTo($innercontainer);

			$scrollDiv.append( that.header )
						.append( that.content );

			setTimeout(function(){

			var scrollVisibility = that.vScrollBar[0].style.visibility,
				innerHeight = parseInt( that.header.outerHeight() +that.content.outerHeight() );
			if(scrollVisibility == "hidden"){
				that.vScrollBar.css('visibility', 'visible').css("left", $container.width() - scrollWidth -3+"px");
				that.vScrollBar.jqxScrollBar({ min: 0, max: innerHeight + pdb + pdt, width: scrollWidth, height: height });

				that.vScrollInstance.valueChanged = function (params) {
					var top = (height - innerHeight) * this.value/innerHeight;
					$scrollDiv.css("top", top+"px");
				}
			}
			},100);
		}
	}

	$.fn.expandPage = function(mode, value1, value2){
		if(this.length === 0){
			return this;
		}

		switch(mode){
			case "loadPage":
				return this.each(function() {
					$.expandPage.loadPage(this,value1,value2);
				});
				break;
			case "destroyPage":
				return this.each(function() {
					$.expandPage.destroyPage();
				});
				break;
		}
	};
	$.expandPage = new ExpandPage();

	$.fn.togglePage = function(url,option){
		$(this).off().on("click",function(){
			var $btn = $(this);
			if($btn.hasClass("open") ){
				$("[data-expand-content=true]").expandPage('destroyPage');
				$btn.removeClass("open");
			}else{
				$('#style-expand-page').remove();
				$('.blank-overlay-content').remove();

				$("[data-expand-button=true]").removeClass("open");
				$btn.addClass("open");
				$("[data-expand-content=true]").expandPage('loadPage',url,option);
			}
		});
	};


/*
 * load modal popup
 */
	var ModalPopup = function(url,options){
		//validation
		if( !url || url == undefined){
			_alert('호출 대상 페이지가 없습니다');
			return false;
		}

		//default set
		var that = this;
		that.defaultOption = {
			width : 600,
			height : null,
			zIndex : null,
			draggable : true,
			effect : 'fade',			//fade | show
			speed : 200,				//fade speed
			onOpen : null,
			onClose : null,			//저장후 닫을때만 실행
			onDestroy : null,		//닫을때 항상 실행
			onInit : null,
			type: 'get',
			data: null,
			displayLoader: true,
			setScroll : false
		}
		that.classContainerpopup = 'blank-overlay-body';
		that.classLayer = 'page-modal-area';
		that.classLayerhead = 'modal-head';
		that.classLayerbody = 'modal-body';
		//that.classLayerfoot = 'modal-foot';
		that.classBtnclose = 'btn-close';

		that.option = $.extend({}, that.defaultOption, options);
		that.url = url;
		that.close = function(){
			that.destroy(that.$container, true);
		}

		//process
		if( $('body > .'+that.classContainerpopup).size()>0 ){
			$('.'+that.classContainerpopup).remove();
		}

		if(that.option.onInit != null){
			that.option.onInit().promise.done(function(){
				that.markup();
			});
		} else {
			that.markup();
		}
	}
	ModalPopup.prototype = {
		markup : function(){
			var that = this;
			var _zindex = that.option.zIndex;
			var
			$container = $('<div />')
				.addClass(that.classContainerpopup)
				.css('display','none')
				.appendTo($('body')),
			$popup = $('<div />')
				.addClass(that.classLayer)
				.css('width',that.option.width+'px')
				.appendTo($container),
			$popuphead = $('<div />')
				.addClass(that.classLayerhead)
				.attr('data-page-head','true')
				.appendTo($popup),
			$popupbody = $('<div />')
				.addClass(that.classLayerbody)
				.attr('data-page-body','true')
				.appendTo($popup),
			//$popupfoot = $('<div />')
			//	.addClass(that.classLayerfoot)
			//	.appendTo($popup),
			$btnClose = $('<button />')
				.attr('type','button')
				.html('<i class="icon-times"></i>')
				.addClass(that.classBtnclose)
				.appendTo($popuphead);

			if( $('.jqx-window').is(':visible') ){
				var _z = parseInt( $('.jqx-window:visible').css('z-index') );
				$container.css('z-index',_z);
				$popup.css('z-index',_z+1);
			} else if(_zindex != null){
				$container.css('z-index',_zindex);
				$popup.css('z-index',_zindex+1);
			}

			if(that.option.height !=null || that.option.setScroll){
				$popup.height(that.option.height +'px');
			}

			that.$header = $popuphead;
			that.$container = $container;

			that.show($container);
			that.load($popupbody, $container);
			that.$popup = $popup;

			// window scroll 방지, modal scoll만 허용
			slui.event.unitWheel( $container );

			$btnClose.one( 'click' ,function(e){
				if(that.option.effect == 'show'){
					that.destroy($container, true);
					$container.remove();
				} else {
					$container.fadeOut(that.option.speed,function(){
						that.destroy($container, true);
					});
				}
			});
		},
		show : function($container){
			var that = this,
			$popup = $container.find('.'+that.classLayer),
			setPosition = function(recheck, top, left){
				var _left = ( $(window).width() - $popup.outerWidth() ) * .5,
				_top = ( $(window).height() - $popup.outerHeight() ) * .5;

				if(recheck){
					if( _top != top){
						$popup.animate({
							top: _top+'px'
						},200);
					}
				} else {
					if( $popup.height() > $(window).height() ){
						$popup.css({
							'top':'10px',
							'bottom':'10px',
							'height':''
						});
						$container.css('overflow-y','scroll');
						$('body').css('overflow-y','hidden');
					} else {
						$popup.css({
							'top': _top+'px'
						});
						$container.css('overflow-y','');
						$('body').css('overflow-y','');
					}
	
					if( $popup.outerWidth() > $(window).width() ){
						$popup.css({
							'left':0,
							'right':0,
							'max-width':'100%'
						});
						$container.css('overflow-x','scroll');
						$('body').css('overflow-x','hidden');
					} else {
						$popup.css({
							'left':_left+'px'
						});
						$container.css('overflow-x','');
						$('body').css('overflow-x','');
					}
				}
			};

			if(that.option.effect == 'show'){
				$container.show();
				setPosition( true, parseInt($popup.css('top')), parseInt($popup.css('left')) );
			} else {
				$container.fadeIn(that.option.speed, function(){
					setPosition( true, parseInt($popup.css('top')), parseInt($popup.css('left')) );
				});
			}

			if(that.option.displayLoader){
				loading.show( $popup );
			}

			if(that.option.draggable){
				var $handle = $popup.find('.'+that.classLayerhead);
				$handle.css('cursor','move');
				$popup.draggable({
					handle : $handle,
					containment : 'body',	// '.'+that.classContainerpopup,
					scroll: false
				});
			}

			setPosition();

			window.addEventListener('resize',setPosition);
		},
		destroy : function($container, isStatic){
			$container.remove();
			$('body').css('overflow','');
			if(this.option.onClose != null && !isStatic){
				this.option.onClose();
			}
			if(this.option.onDestroy != null){
				this.option.onDestroy();
			}
			if( $('#exmodal').is(':visible') ){
				$('#exmodal').remove();
			}
		},
		load : function($area, $container){
			var that = this;
			$.ajax({
				url: that.url,
				type: that.option.type,
				data: that.option.data,
				dataType: 'text',
				beforeSend:function(xhr){
					//if(that.option.displayLoader){
					//	loading.show($area);
					//}
				},
				success: function(data){
					var jsonData = null;
					if(data.charAt(0) == '{') {
						try {
							jsonData = $.parseJSON(data);
						}
						catch(e) {
							console.log(e.message);
						}
						
						if(jsonData && jsonData.result_msg) {
							_alert(jsonData.result_msg);
							that.destroy($container, true);
							return;
						}
					}
					
					$area.html(data);

					$area.find("[data-layer-close=true]").one( 'click' ,function(event){
						if(event.originalEvent == undefined){
							that.destroy( $('.'+that.classContainerpopup) );
						} else {
							that.destroy( $('.'+that.classContainerpopup), true );
						}
					});

					var contentHeight = that.$popup.height() - $('.'+that.classLayerhead).height();
					if(that.option.setScroll == false){
						$area.wrap('<div class="nano-ready" style="position:relative;min-height:'+(that.option.height - that.$header.outerHeight())+'px"><div class="nano-content"></div></div>');
					} else {
						$area.wrap('<div class="nano-ready nano" style="position:relative;height:'+contentHeight+'px"><div class="nano-content"></div></div>');
					}

					if( $area.find('.section-title').size() > 0){
						$area.find('.section-title').appendTo( that.$header );
					}

					if(that.option.setScroll == false){
						if($area.parents('.nano-content').outerHeight() > $area.parents('.nano-ready').outerHeight()){
							$area.parents('.nano-ready').height(contentHeight+'px').addClass('nano');
							$area.parents('.nano:eq(0)').nanoScroller();
						}
					}else{
						setTimeout(function(){
							$area.parents('.nano:eq(0)').nanoScroller();
						},1000);
					}
					slui.event.unitWheel( $area.parents('.nano-content') );
				},
				complete: function(){
					slui.attach.init('.'+that.classLayer);

					if(that.option.onOpen != null){
						that.option.onOpen( $container.find('.'+that.classLayer) );
					}

					if(that.option.displayLoader){
						loading.hide();
					}
				},
				fail: function(){
					that.destroy($container, true);
					console.log("%c[Error on page load]","color:red;background:#ffffc9;");
				}
			});
		}
	}
	window.ModalPopup = ModalPopup;


/*
 * load exmodal popup
 */
	var ExModalPopup = function(){
		//default set
		this.defaultOption = {
			width : 400,
			height : 300,
			//zIndex : null,		무조건 modalpopup + 10
			draggable : true,
			backSelectable : true,
			onOpen : null,
			onClose : null,			//저장후 닫을때만 실행
			onDestroy : null,		//닫을때 항상 실행
			onInit : null,
			type : 'get',
			data : null,
			displayLoader: true,
			setScroll : false
		}
		//this.idLayer= 'exmodal';
		this.classLayer = 'page-exmodal-area';
		this.classLayerhead = 'modal-head';
		this.classLayerbody = 'modal-body';
		this.classBtnclose = 'btn-close';
		this.classBlank = 'page-exmodal-transparent';
		this.classTitle = 'section-title';
	}
	ExModalPopup.prototype = {
		init : function(element,url,options){
			var option = $.extend({}, this.defaultOption, options);

			var that = this;
			//validation
			if( !url || url == undefined){
				console.error('호출 대상 페이지가 없습니다!');
				return false;
			}

			//that.url = url;

			$(element).off().on('click',function(){
				if( $('body > .'+that.classLayer).size()>0 ){
					$('.'+that.classLayer).remove();
				}

				if(option.onInit != null){
					option.onInit().promise.done(function(){
						that.markup( $(element), url, option );
					});
				} else {
					that.markup( $(element), url, option );
				}

			});
		},
		markup : function( $element, url, option ){
			var that = this;
			if(option.backSelectable){
				that.makeTransparent(option);
			}

			var $popup = $('<div />')
				.addClass(that.classLayer)
				//.attr('id',that.idLayer)
				.css('display','none'),
			$popuphead = $('<div />')
				.addClass(that.classLayerhead)
				.attr('data-page-head','true')
				.appendTo($popup),
			$popupbody = $('<div />')
				.addClass(that.classLayerbody)
				.attr('data-page-body','true')
				.appendTo($popup),
			$btnClose = $('<button />')
				.attr('type','button')
				.html('<i class="icon-times"></i>')
				.addClass(that.classBtnclose)
				.appendTo($popuphead);

			this.$popup = $popup;
			this.$header = $popuphead;

			if(option.backSelectable){
				$popup.appendTo($('.'+that.classBlank));
			} else {
				$popup.appendTo($('body'));
			}
			this.show($element, option);
			this.load($popupbody, $popup, url, option);

			//event
			$btnClose.one( 'click' ,function(){
				$popup.fadeOut(200,function(){
					that.destroy($popup, option, true);
				});
			});
		},
		show : function($element, option){
			var that = this;

			that.$popup.width(option.width+'px');
			that.$popup.height(option.height+'px');

			var setSize = function(){
				var posTop = $element.offset().top + $element.outerHeight(),
					posLeft = $element.offset().left + $element.outerWidth();
				that.posLeft = posLeft;
				that.posTop = posTop;

				that.$popup.css({
					'top' : that.posTop +'px',
					'left' : that.posLeft - that.$popup.width() +'px',
					'display' : 'block'
				});
			};

			if(option.displayLoader){
				loading.show(that.$popup);
			}

			if( $('.page-modal-area').is(':visible') ){
				var _z = parseInt($('.page-modal-area:visible').css('z-index'));
				that.$popup.css('z-index',parseInt+11);
			}

			if(option.draggable){
				var $handle = that.$popup.find('.'+that.classLayerhead);
				$handle.css('cursor','move');
				that.$popup.draggable({
					handle : $handle,
					containment : 'body', 		//'.'+that.classContainerpopup,
					scroll: false
				});
			}

			setSize();

			window.addEventListener('resize',setSize);
		},
		destroy : function($container, option, isStatic){
			$container.parent('.'+this.classBlank).remove();

			if(option.onClose != null && !isStatic){
				option.onClose();
			}

			if(option.onDestroy != null){
				option.onDestroy();
			}
		},
		makeTransparent : function(option){
			$('body').append('<div class="'+this.classBlank+'"></div>');
			if( $('.page-modal-area').is(':visible') ){
				var _z = parseInt($('.page-modal-area:visible').css('z-index'));
				$('.'+this.classBlank).css('z-index',parseInt+10);
			}
			slui.event.unitWheel( $('.'+this.classBlank) );
		},
		load : function($area, $container, url, option){
			var that = this;

			$.ajax({
				url: url,
				dataType: 'text',
				type: option.type,
				data: option.data,
				beforeSend:function(xhr){
					//if(option.displayLoader){
					//	loading.show($area);
					//}
				},
				success: function(data){
					$area.html(data);

					if(option.onOpen != null){
						option.onOpen();
					}
					$area.find("[data-layer-close=true]").one( 'click' ,function(event){
						var $container = $(this).parents('.'+that.classLayer);
						if(event.originalEvent == undefined){
							that.destroy( $container, option );
						} else {
							that.destroy( $container, option, true );
						}
					});
					
					var contentHeight = that.$popup.height() - $('.'+that.classLayerhead).height();
					if(option.setScroll == false){
						$area.wrap('<div class="nano-ready" style="position:relative;height:'+contentHeight+'px"><div class="nano-content"></div></div>');
					} else {
						$area.wrap('<div class="nano-ready nano" style="position:relative;height:'+contentHeight+'px"><div class="nano-content"></div></div>');
					}

					if( $area.find('.'+that.classTitle).size() > 0){
						$area.find('.'+that.classTitle).appendTo( that.$header );
					}

					if(option.setScroll == false){
						if($area.parents('.nano-content').outerHeight() > $area.parents('.nano-ready').outerHeight()){
							$area.parents('.nano-ready').addClass('nano');
							$area.parents('.nano:eq(0)').nanoScroller();
						}
					}else{
						setTimeout(function(){
							$area.parents('.nano:eq(0)').nanoScroller();
						},1000);
					}
					slui.event.unitWheel( $area.parents('.nano-content') );
				},
				complete: function(){
					slui.attach.init('.'+that.classLayer);

					if(option.displayLoader){
						loading.hide(that.$popup);
					}
				},
				fail: function(){
					that.destroy($container, option, true);
					console.log("%c[Error on page load]","color:red;background:#ffffc9;");
				}
			});
		}
	}
	$.fn.exModalPopup = function(url,options){
		if(this.length === 0){
			return this;
		}

		return this.each(function() {
			$.exModalPopup.init(this,url,options);
		});
	};
	$.exModalPopup = new ExModalPopup();



/*
 * load additional page in modal popup
 */
	var AddModalPage = function(){
		//default set
		this.defaultOption = {
			onLoad : null,
			onUnload : null,
			type : 'get',
			data : null,
			displayLoader: true
		}
		this.classBtnPrev = 'btn-prev';
		this.classBodyPrev = 'page-loaded-prev';
		this.classBodyLoaded = 'page-loaded-body';
		this.classTitle = 'section-title';
		this.classTitleGroup = 'title-group';
		this.classContent = 'section-content';
		this.classTitlePrev = 'title-prev';
		this.classTitleLoaded = 'title-loaded';
		this.classPageModal = 'page-modal-area';
		this.classPageExmodal = 'page-exmodal-area';
		this.classPageSlide = 'page-expand-area';
	}
	AddModalPage.prototype = {
		init : function(element, url, options){
			var that = this,
				$pageParents = $(element).parents('[class^=page-]'),
				isModal = $pageParents.hasClass(that.classPageModal),
				isExmodal = $pageParents.hasClass(that.classPageExmodal),
				isExpand = $pageParents.hasClass(that.classPageSlide);

			that.option = $.extend({}, that.defaultOption, options);
			that.isExpand = isExpand;

			that.url = url;

			$(element).on('click',function(){
				that.load(element);
			});
		},
		load : function(element){
			var that = this,
			option = that.option,
			$body = $(element).parents('[data-page-body=true]')
				.wrapInner('<div class="'+that.classBodyPrev+'"></div>'),

			$div = $('<div />')
				.addClass(that.classBodyLoaded)
				.appendTo($body);

			if(option.displayLoader){
				loading.show($div);
			}

			var $parent = $div.parents('[class^=page-]');

			$.ajax({
				url: that.url,
				dataType: 'text',
				type: option.type,
				data: option.data,
				beforeSend:function(xhr){
					//if(option.displayLoader){
					//	loading.show($div);
					//}
				},
				success: function(data){
					$div.html(data);

					var $head = $parent.find('[data-page-head=true]'),

					destroy = function(event){
						$div.remove();
						
						var prevHtml = $parent.find('.'+that.classBodyPrev).html();
						$body.html(prevHtml);

						$head.find('.'+that.classTitlePrev).removeClass(that.classTitlePrev);
						$head.find('.'+that.classTitleLoaded).remove();
						$parent.find('.'+that.classBtnPrev).remove();
						$parent.find('.'+that.classBodyPrev).remove();

						slui.attach.init('body');

						if(that.option.onUnload !=null & event.originalEvent == undefined){
							that.option.onUnload();
						}
					},
					create = function(){
						var title = $div.find('.'+that.classTitle).size()>0 ? $div.find('.'+that.classTitle).text().trim() : '';
						$head.append('<button type="button" class="'+that.classBtnPrev+'"><i class="icon-arrow-left"></i></button>');
						$head.find('.'+that.classTitle+' h2').addClass(that.classTitlePrev);
						$head.find('.'+that.classTitle).append('<h2 class="'+that.classTitleLoaded+'">'+title+'</h2>');
						$parent.find('.nano').nanoScroller();


						var $slidep = $parent.find('.'+that.classBodyLoaded);
						if(that.isExpand && $slidep.find('.'+that.classTitle).size()>0){
							var $title = $slidep.find('.'+that.classTitle);
							$title.attr('data-page-head', true);
							$title.addClass(that.classTitleGroup).removeClass(that.classTitle);
							$title.prependTo( $slidep.find('.'+that.classContent));
							$parent.find('.'+that.classBtnPrev).appendTo($title);
						}
					};

					create();
					if(that.option.onLoad!=null){
						that.option.onLoad();
					}
					slui.attach.init('.'+that.classBodyLoaded);

					$div.find('[data-layer-close=true]').one('click',function(event){
						destroy(event);
					});
					$parent.find('.'+that.classBtnPrev).one('click',function(event){
						destroy(event);
					});
				},
				complete: function(){
					if(option.displayLoader){
						loading.hide($div);
					}
				},
				fail: function(){
					var prevHtml = $parent.find('.'+that.classBodyPrev).html();
					$div.remove();
					$body.html(prevHtml);
					console.log("%c[Error on page load]","color:red;background:#ffffc9;");
				}
			}).done(function(data){
				$parent.find('.nano').nanoScroller({ scroll: 'top' });
				slui.attach.init('.'+ $parent.attr('class'));
			});
		}
	}
	$.fn.addModalPage = function(url,options){
		if(this.length === 0){
			return this;
		}

		return this.each(function() {
			$.addModalPage.init(this,url,options);
		});
	};
	$.addModalPage = new AddModalPage();


/*
 * layer alert confirm
 */
	var Alerts = function(){
		this.defaultOption = {
			title : '확인',
			textConfirm : '확인',
			textCancel : '취소',
			onAgree : null,
			onDisagree : null,
			zIndex : 20000		//related with css
		};
		this.classModal = 'modal-alert';
		this.classHead = 'area-head';
		this.classBody = 'area-body';
		this.classClose = 'btn-close';
		this.classMsg = 'message';
		this.classBtns = 'btns';
		this.classConfirm = 'btn-confirm';
		this.classCancel = 'btn-cencel';
	}
	Alerts.prototype = {
		init : function(message, options, isConfirm){
			if( $('.'+this.classModal).size()>0 ){
				$('.'+this.classModal).remove();
			}
			$('#transprencyAlerts').remove();

			isConfirm ? this.isConfirm = isConfirm : this.isConfirm = true;

			this.option = $.extend({}, this.defaultOption, options);
			this.message = message.replace('\n','<br>');
			this.markup(isConfirm);
			this.showMessage();
		},
		markup : function(isConfirm){
			var structure = '<div class="'+this.classModal+'" style="z-index:'+Number(this.option.zIndex+1)+'">'+
				'<div class="'+this.classHead+'">'+
					'<span>'+this.option.title+'</span>'+
					'<button type="button" class="'+this.classClose+'"><i class="icon-times"></i></button>'+
				'</div>'+
				'<div class="'+this.classBody+'">'+
					'<div class="'+this.classMsg+'"><span>'+this.message+'</span></div>'+
					'<div class="'+this.classBtns+'">'+
						'<button type="button" class="btn-basic '+this.classConfirm+'">'+this.option.textConfirm+'</button>';

			if( isConfirm ){
				structure +='<button type="button" class="btn-basic '+this.classCancel+'">'+this.option.textCancel+'</button>';
			}
			structure +='</div></div></div>';

			this.structure = structure;
		},
		showMessage : function(){
			$('body').append(this.makeBackground());
			$('body').append(this.structure);

			$('.'+this.classModal+' .'+this.classConfirm).focus();
			$('.'+this.classModal).css({
				'margin-top': $('.'+this.classModal).height() * -.5 +'px'
			});
			this.loadEvents();
		},
		makeBackground : function(){
			var _z = this.option.zIndex;
			if( $('.page-modal-area').is(':visible') ){
				_z = parseInt( $('.page-modal-area:visible').css('z-index') );
			}
			if( $('.jqx-window').is(':visible') ){
				_z = parseInt( $('.jqx-window:visible').css('z-index') );
			}

			var $bg = $('<div />')
				.attr('id','transprencyAlerts')
				.css({
					'position':'fixed',
					'left':0,
					'top':0,
					'right':0,
					'bottom':0,
					'background-color':'rgba(0,0,0,.3)',
					'z-index':_z
				});
			this.$bg = $bg;
			return $bg;
		},
		loadEvents : function(){
			var that = this,
				$btnClose = $('.'+that.classModal).find('.'+that.classClose),
				$btnConfirm = $('.'+that.classModal).find('.'+that.classConfirm).data('type',0),
				events = 'keyup keydown mouseup';

			if(that.isConfirm){
				var $btnCancel = $('.'+this.classCancel).data('type',1);
			}

			var handle = function(event){
				if(event.type === 'keydown'){
					var code = event.which || event.keyCode;
					switch(code){
						case 32:
						case 27:
							that.destroy(that);
							break;
						case 39:
							$btnCancel.focus();
							break;
						case 37:
							$btnConfirm.focus();
							break;
					}
					return false;

				} else  if(event.type === 'keyup'){
					var code = event.which || event.keyCode;
					if(code === 13){
						that.destroy(that, $(this).data('type'));
					}
					return false;
				}

				that.destroy(that, $(this).data('type'));
			};

			$btnClose.on(events,handle);
			$btnConfirm.on(events,handle);
			if(that.isConfirm){
				$btnCancel.on(events,handle);
			}

			// prevent body mousewheel
			slui.event.unitWheel( that.$bg );
			slui.event.unitWheel( $('.'+this.classModal) );
		},
		destroy : function(that, type){
			that.$bg.remove();
			$('.'+that.classModal).remove();

			if(type === 0){
				if(that.option.onAgree != undefined){
					that.option.onAgree();
				}
			}else if(type === 1){
				if(that.option.onDisagree != undefined){
					that.option.onDisagree();
				}
			}
		}
	}

	$.alerts = new Alerts();


/*
 * design select
 */
	var transformSelect = function(){
		this.classSelectOuter = 'form-select-outer',
		this.classSelect = "tform-select";
		this.classSelectInner = "tform-select-inner";
		this.classOptionWrap = "tform-select-options";
		this.classOptionItem = "tform-select-option";
		this.classOpen = "tform-select-open";
		this.classText = "tform-select-t";
		this.classIcon = "tform-select-i";
		this.classDisabled = "disabled";
		this.classSelected = "selected";
		this.classNoborder = "noborder";
		this.classSmall = "small";
		this.defaultOptionSize = 5;
	};

	transformSelect.prototype = {
		z : 1,
		markup : function(obj,index){
			var _this = this,
				$obj = obj,
				$p = $obj.parent()
					.css("position","relative"),
				//z = parseInt($p.css("z-index")),
				w = parseInt($p.width()),
				h = $p.height(),
				$options = $obj.find("option"),
				_selectedText = $obj.find("option:selected").text(),
				_size = $obj.find("option").size(),
				_maxSize = _this.defaultOptionSize;

			if( $obj.parents('[class^=page-]:eq(0)').size()>0 ){
				_this.z = parseInt($p.css("z-index")) + Number($obj.parents('[class^=page-]:eq(0)').css('z-index'));
			}

			if($obj.siblings("."+_this.classSelect)){
				$obj.siblings("."+_this.classSelect).remove();
			}

			var $containerSelect = $("<span />")
					.addClass(_this.classSelect)
					.css({
						width : w +"px",
						height : h + "px"
					})
					//.attr("id","ui-select"+index)
					.appendTo($p),
				$textSelected = $("<span />")
					.addClass(_this.classSelectInner)
					.attr('tabindex','0')
					.appendTo($containerSelect)
					.css({
						height : h + "px",
						lineHeight : h + "px"
					}),
				$textInner = $("<span />")
					.addClass(_this.classText)
					.text( _selectedText)
					.appendTo($textSelected),
				$ico = $("<span />")
					.addClass(_this.classIcon)
					.appendTo($textSelected),
				$listWrap = $("<span />")
					.addClass(_this.classOptionWrap)
					.css("top",h+"px")
					.appendTo($containerSelect),

				makeOptions = function($obj, isRefresh){
					var $options = $obj.find("option"),
						$listWrap = $obj.parent().find('.'+_this.classOptionWrap),
						$textInner = $obj.parent().find('.'+_this.classText);

					if($listWrap.find('.nano-content').size()>0){
						$listWrap = $listWrap.find(".nano-content");
					}

					if(isRefresh){
						$listWrap.empty();
						$textInner.text($options.eq(0).text());
					}

					for(var i=0;i<$options.size();i++){
						var $opt = $options.eq(i),
							$i = $("<span />")
								.addClass(_this.classOptionItem)
								.text($opt.text())
								.attr({
									"data-value" : $opt.attr("value"),
									"title" : $opt.text()
								})
								.data("value",$opt.attr("value"))
								.appendTo($listWrap)
								.on("mousedown",function(event){
									if(event.which!=1) return;

									event.preventDefault();
									_this.optionSelect($(this),_this);
								});
						if( $opt.prop("selected") ){
							$i.addClass("selected");
						}
					}
				};

			$listWrap.css("z-index",_this.z+200);

			$obj.attr({
				'tabindex' : '-1'
			}).css({
				position : "absolute",
				//left : w *-1 + "px", top : h *-1 + "px",
				left : "-9999px",
				top : "-9999px",
				opacity : 0,
				visibility : "hidden"
			});

			if( $obj.prop("disabled")){
				$containerSelect.addClass(_this.classDisabled);
			}

			if( h < 18 ){
				$containerSelect.addClass(_this.classSmall);
			}

			if($obj.data("size")){
				_maxSize = $obj.data("size");
			}
			if($obj.data("border") == false){
				$containerSelect.addClass(_this.classNoborder);
			}
			if($obj.data("scroll") != false && _size > _maxSize){
				var _h = _maxSize * 20;
				$listWrap.addClass("nano")
					.css("height",_h + "px")
					.append($("<div class=\"nano-content\" style=\"height:"+_h+"px;\"/>"));
				$listWrap = $listWrap.find(".nano-content");
			}

			makeOptions($obj);

			if($listWrap.hasClass("nano")){
				$listWrap.nanoScroller();
			}
			_this.eventToggle($textSelected,$p);

			$obj.on('change',function(){
				var rel = $obj.data('rel');
				if( rel != undefined){
					setTimeout(function(){
						makeOptions( $(rel), true );
					}, 10);
				}
			});
		},
		optionSelect : function($obj,_this){
			var text = $obj.text(),
				value = $obj.data("value");

			$obj.parents("."+_this.classSelect)
				.find("."+_this.classText)
				.text(text)
				.data("value",value);

			_this.closeSelect();

			$obj.parents("."+_this.classSelect).siblings("select")
				.find("option").eq($obj.index())
				.prop("selected",true)
				.change();
		},
		closeSelect : function(z){
			var _this =this;
			$("."+_this.classSelect).removeClass(_this.classOpen).css("z-index",z+1);
			$("."+_this.classSelect).parent().css("z-index",z);
		},
		eventToggle : function($t,$p){
			var _this = this,
			z = parseInt($t.parents("."+_this.classSelect).css('z-index')),
			_event = function($ele){
				var $parent = $ele.parents("."+_this.classSelect);
				if( $parent.hasClass(_this.classDisabled)) return false;

				var index = $p.find("option:selected").index();
				$p.find("."+_this.classOptionItem).eq(index)
					.addClass(_this.classSelected)
					.siblings().removeClass(_this.classSelected);

				$p.find('.'+_this.classOptionWrap).css('min-width', $t.width()+2+'px');			// add border width 2

				if( $parent.hasClass(_this.classOpen) ){
					$parent.removeClass(_this.classOpen);
					$p.find("."+_this.classSelect).css("z-index",z+1);
					//$p.css("z-index",z);
					$p.find('.'+_this.classOptionItem).attr('tabindex','-1');
					_eventOptions($p.find('.'+_this.classOptionItem),0);
				} else {
					_this.closeSelect(z);
					$parent.addClass(_this.classOpen);
					$p.find("."+_this.classSelect).css("z-index",z+11);
					//$p.css("z-index",z+10);
					$p.find('.'+_this.classOptionItem).attr('tabindex','0');
					_eventOptions($p.find('.'+_this.classOptionItem),1);

					if($('.chosen-container.chosen-with-drop').size()>0){
						$('.chosen-container a').click();
					}
				}

				$("."+_this.classSelect+' .nano').nanoScroller({ scrollTo: $('.selected') });
				$("."+_this.classSelect+' .nano-content').each(function(){
					slui.event.unitWheel( $(this) );
				});
				$("."+_this.classSelect+' .nano').nanoScroller();

				$(document).one("mousedown",function(event){
					var $target = $(event.target);
					if(! $target.parents().hasClass(_this.classSelect) ){
						_this.closeSelect(z);
					}
				});
			},
			_eventOptions = function($ele, mode){
				var _setSelect = function($e){
					$e.siblings().removeClass(_this.classSelected);
					$e.addClass(_this.classSelected);
				};

				if(mode == 0){
					$ele.off('focus').off('keydown');
				} else if(mode == 1){
					$ele.on('focus',function(){
						_setSelect($(this));
					}).on('keydown',function(event){
						if(event.keyCode == 13){
							var t = $(this).text(),
								v = $(this).data('value');
							
							_this.closeSelect(z);

							$(this).parents('.'+_this.classSelectOuter).find('.'+_this.classText).text(t);
							$(this).parents('.'+_this.classSelectOuter).find('select').val(v);
							$(this).parents('.'+_this.classSelectOuter).find('.'+_this.classSelectInner).focus();

						} else if(event.keyCode == 40 || event.keyCode == 38){
							var index = $p.find("option:selected").index(),
								size = $p.find('option').size();

							if(event.keyCode == 40 && index < size){
								index++;
							} else if(event.keyCode == 38 && index > 0){
								index--;
							}
							$p.find('.'+_this.classOptionItem+':eq('+index+')').addClass(_this.classSelected).focus();
						}
					});
				}
			};

			$t.on("click",function(event){
				event.stopPropagation();
				_event( $(this) );
			});

			$t.on("keydown",function(event){
				if( event.keyCode === 13){
					_event( $(this) );
				} else if(event.keyCode === 40){
					$t.siblings('.'+_this.classOptionWrap).find('.'+_this.classOptionItem+':eq(0)').focus();
					$t.parent().siblings('select').find('option:eq(0)').prop('selected',true);
				}
				event.stopPropagation();
			});
		},
		init : function(obj){
			var _this = this,
				$s = $(obj).find("select:visible");

			$s.each(function(index){
				if( $(this).data("ui") != false && $(this).attr('multiple') != 'multiple'){
					_this.markup($(this),index);
				}
			});
		}
	};

	$.fn.selectui = function(obj,options){
		if(this.length === 0){
			return this;
		}

		return this.each(function() {
			$.selectui.init(this);
		});
	};
	$.selectui = new transformSelect();


/*
 * design radio, checkbox
 */
	var FormDesign = function(param){
		this.classTransform = 'form-transform';
		this.classClone = 'form-clone';
	};
	FormDesign.prototype ={
		init : function(param){
			var _this = this;

			$(param).find("input").each(function(){
				if( $(this).data('ui')!=false && !$(this).siblings('span').hasClass(_this.classClone) ){
					var type = $(this).attr("type");

					if(type == 'checkbox' || type=="radio"){
						var $clone = $('<span />').addClass(_this.classClone);
						$(this).addClass(_this.classTransform);
						$(this).after($clone);

						var $ele = $(this);
						$clone.on('keydown',function(event){
							if( event.keyCode == 13){
								$ele.click();
							}
						});
					}
				}
			});
		}
	};

	$.fn.formDesign = function(obj){
		if(this.length === 0){
			return this;
		}

		return this.each(function() {
			$.formDesign.init(this);
		});
	};
	$.formDesign = new FormDesign();

})(window.jQuery);

/************************* 
 * layer alert, confirm
 ************************/
var _alert = function(message, options){
	$.alerts.init(message, options, false);
}

var _confirm = function(message, options){
	$.alerts.init(message, options, true);
}