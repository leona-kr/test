//# sourceURL=global.ui.js

'use strict';

var globalui = globalui || {};

globalui.attach = function() {
	var //container = (container != undefined)? container : 'body',
	init = function(container){
		var container = (container != undefined)? container : 'body';

		// attach datapicker
		setDatepicker(container);

		// transform ui
		setTransformSelect(container);

		// toggle layer 
		setToggleLayer(container);

		//checkbox, radio
		setTransforms(container);

		// nano scroller
		$(container+' .nano').nanoScroller();

		// switch button
		setSwitchToggle(container);

		// 폼에 input:text 하나일 경우 enter로 submit 방지
		preventSingleInputSubmit(container);

		// globalui tooltip
		tooltip(container);
	},
	setDatepicker = function(_container){
		var _container = (_container != undefined)? _container : 'body';

		if($(_container+' [data-datepicker=true]').size() > 0){
			$(_container+' [data-datepicker=true]').each(function(){
				$(this).datepicker({
					dateFormat: "yymmdd",
					showOtherMonths: true,
					selectOtherMonths: true
				});
			});
		}
	},
	setTransforms = function(_container){
		var _container = (_container != undefined)? _container : 'body';
		$(_container).formDesign();
	},
	setTransformSelect = function(_container){
		var _container = (_container != undefined)? _container : 'body';
		if( $(_container).find('select').size() > 0){
			setTimeout(function(){
				$(_container).selectui();
			},0);
		}
	},
	setToggleLayer = function(_container){
		var _container = (_container != undefined)? _container : 'body';
		if( $(_container+' [data-toggle-handle=true]').size() > 0){
			$(_container+' [data-toggle-handle=true]').each(function(){
				if( $(this).data('toggle-target') != undefined ){
					var target = $(this).data('toggle-target'),
						toggleclass = $(this).data('toggle-class') ? $(this).data('toggle-class') : '';

					$(this).off().on('click',function(){
						$(target).toggle();
						$(this).toggleClass(toggleclass);
						setDatepicker(target);
						setTransformSelect(target);
						if($(this).parents('.nano')) $(this).parents('.nano').nanoScroller();
					});
				}
			});
		}
	},
	setSwitchToggle = function(_container){
		var _container = (_container != undefined)? _container : 'body';
		$(_container).on("click","[data-switch-toggle=true]",function(event){
			var classOn = 'btn-switch-on',
				classOff = 'btn-switch-off',
				classCheck = 'btn-switch-check';
			
			if( $(this).hasClass(classOn) ){
				$(this).removeClass(classOn).addClass(classOff).val('0');
			} else {
				$(this).removeClass(classOff).addClass(classOn).val('1');
			}
			
			//btn change check
			if( $(this).hasClass(classCheck) ){
				$(this).removeClass(classCheck);
			}else{
				$(this).addClass(classCheck);
			}
			
			event.stopImmediatePropagation();
		});
	},
	tooltip = function(_container){
		var _container = (_container != undefined)? _container : 'body';

		if( $(_container+' [data-ui=tooltip]').size() < 1 ) return;

		if( !document.getElementById('globalui-tooltip') ){
			$('body').append('<div id="globalui-tooltip" class="globalui-tooltip"><div class="globalui-tooltip-text"></div></div>');
		}

		$(_container+' [data-ui=tooltip]').each(function(){
			var text = $(this).attr('data-text');
			if(!text) text = $(this).data('text');
			if( !text ) return;

			$(this).on('mousemove',function(event){
				var x = event.pageX+15, y = event.pageY+20;
				
				$('#globalui-tooltip').css({
					left : x+'px',
					top : y+'px',
					opacity : 100,
					visibility : 'visible',
					display : 'block'
				});
				$('#globalui-tooltip > div').html(text);
			}).on('mouseleave',function(){
				$('#globalui-tooltip').css({
					opacity : 0,
					visibility : 'hidden',
					display : 'none'
				});
				$('#globalui-tooltip > div').html('');
			});
		});
	},
	preventSingleInputSubmit = function(_container){
		var _container = (_container != undefined)? _container : 'body';
		if(!document.querySelector(_container).querySelector('form')) return false;

		var form = document.querySelector(_container).querySelector('form');
		if(form.querySelectorAll('input[type=text]').length === 1){
			form.setAttribute("onkeypress","return event.keyCode != 13;");
		}
	}

	return {
		init: init,
		setDatepicker: setDatepicker,
		setTransforms : setTransforms,
		setTransformSelect: setTransformSelect,
		setToggleLayer: setToggleLayer,
		setSwitchToggle: setSwitchToggle,
		tooltip: tooltip
	};
}();
Object.defineProperty( globalui, 'attach', {
	enumerable: false,			// for-in 반복에서 object[key]로 접근 됨
	writable: false,				// 읽기 전용 속성 설정
	configurable: false			// 속성을 변경할 수 있는 여부
});

globalui.event = function(){
	// prevent window mousewheel
	var unitWheel = function($ele){		// $ele : scroll이 발생하는 jquery객체
		if(!$ele) return;
		$ele.off('mousewheel DOMMouseScroll')			// DOMMouseScroll for firefox
			.on('mousewheel DOMMouseScroll',function(event){
				var node = event.target.nodeName.toLowerCase();
				if(!event.originalEvent) return;

				var hasPlugin = false;
				var parentclass = event.target.parentElement.className != '' ? event.target.parentElement.className : event.target.parentElement.parentElement.className;

				if( typeof parentclass =='object'){
					for(var i in parentclass){
						if(parentclass[i].indexOf('raphael') != -1) hasPlugin = true;		// fusionchart
					}
				} else if(typeof parentclass == 'string'){
					if( parentclass.indexOf('dynatree') == -1) hasPlugin = true; 		//dynatree
				}

				if( hasPlugin & node != 'option' & node != 'select' & node != 'textarea' ){
					event.preventDefault();

					var s = $ele.scrollTop();
					var e = event.originalEvent;
					var delta = e.detail? e.detail : e.wheelDelta;
					if(delta < 0){		//wheel down
						$ele.scrollTop( s+100 );
					} else {			//wheel up
						$ele.scrollTop( s-100 );
					}
				}
			});
	},

	// input에 숫자만 입력가능하도록
	formOnlyNumber = function($ele){
		$ele.on("keydown",function(event){
			var cd = (event.which) ? event.which : event.keyCode;
			if ( (cd >= 48 && cd <= 57) || (cd >= 96 && cd <= 105) || cd == 8 || cd == 46 || cd == 37 || cd == 39 ) 
				return;
			else
				return false;
		}).on("keyup",function(event){
			var event = event || window.event;
			var cd = (event.which) ? event.which : event.keyCode;
			if ( cd == 8 || cd == 46 || cd == 37 || cd == 39 ) 
				return;
			else
				event.target.value = event.target.value.replace(/[^0-9]/g, "");
		});
	};

	return {
		unitWheel : unitWheel,
		formOnlyNumber : formOnlyNumber
	} 
}();
Object.defineProperty( globalui, 'event', {
	enumerable: false,			// for-in 반복에서 object[key]로 접근 됨
	writable: false,				// 읽기 전용 속성 설정
	configurable: false			// 속성을 변경할 수 있는 여부
});


// dropdown 목록에 값을 쿠키로 관리할 경우 (jqxgrid, grid-table-group 등)
globalui.cookies = function(){}
globalui.cookies.prototype = {
	id : '',
	defaultValue : 10,
	prefix : "dd_",
	init : function( _id, _defaultValue){
		if(!_id) return;
		this.id = _id;

		if(_defaultValue) this.defaultValue = _defaultValue;

		var cookiename = this.prefix+this.id.replace('#','');

		if( $.cookie(cookiename) ){
			$.cookie(cookiename, $.cookie(cookiename), {expires:30});
		}
	},
	getValue : function(){
		var cookiename = this.prefix+this.id.replace('#','');
		return $.cookie(cookiename) ? $.cookie(cookiename) : this.defaultValue;
	},
	setValue : function(cookiename, newValue, defaultValue){
		if(newValue == defaultValue){
			$.cookie(cookiename, null);
			return;
		}

		if( !$.cookie(cookiename) | $.cookie(cookiename) != newValue){
			$.cookie(cookiename, newValue, {expires:30});
		}
	},
	changeEvent : function(){				// select 박스 형태의 element
		var id = this.id,
		prefix = this.prefix,
		defaultValue = this.defaultValue,
		setValue = this.setValue;

		// jqx-grid
		if( $(id).attr('class') != undefined && $(id).attr('class').indexOf('jqx-grid') != -1 ){
			$( id ).on("pagesizechanged", function (event){
				setValue( prefix+event.currentTarget.id, event.args.pagesize.toString(), defaultValue );
			});
		}
		// .grid-table-group로 만든 grid
		else if( $(id).attr('class') != undefined && $(id).attr('class').indexOf('grid-table-group') != -1 ) {
			var $select = $(id).siblings('.area-grid-table-head').find('select');
			if(!$select) return;

			$select.on('change',function(){
				setValue( prefix+id.replace('#',''), $(this).val(), defaultValue );
			});
		}
		// 그 외에 select 값을 쿠키에 저장할 경우
		else {
			if( !$(id).is('select') ) return false;

			$(id).on('change',function(){
				setValue( prefix+id.replace('#',''), $(this).val(), defaultValue );
			});
		}
	},
	eventToggle : function(){			// globalui.toggleLayer를 사용한 toggle버튼
		var id = this.id,
		prefix = this.prefix,
		defaultValue = this.defaultValue,
		setValue = this.setValue;

		var $toggleBtn = $('[data-toggle-target="'+id+'"]');
		var toggleClass = $toggleBtn.attr('data-toggle-class');

		$toggleBtn.on('click',function(){
			if( $(this).attr('class').indexOf(toggleClass) != -1){
				setValue( prefix+id.replace('#',''), 0, defaultValue );
			} else {
				setValue( prefix+id.replace('#',''), 1, defaultValue );
			}
		});
	}
};

globalui.headerlayer = function(){
	var _init = function(){
		$('header .group-aside button:not(.btn-setting)').each(function(){
			var target = '.'+$(this).data('hover-target');
			_load($(this), target);
		});
	},
	_load = function( $element, target ){
		var outTimer, inTimer,
		outTime = 400, inTime = 400,
		classActive = 'open';
		
		var show = function(){
			if($(target).hasClass('header-layer-licence')){
				var left = $element.offset().left + $element.outerWidth() - $(target).outerWidth();

				$(target).css({
					'left' : left +'px',
					'margin-left' : '0'
				});
			}else{
				var left = Math.ceil($element.offset().left + $element.outerWidth()* .5),
				margin = Math.ceil($(target).outerWidth() * -.5);

				$(target).css({
					'left' : left.toFixed(1) +'px',
					'margin-left' : margin +'px'
				});
			}

			$(target).siblings().hide();
			$(target).show();
		},
		hide = function(){
			$(target).hide();
			$element.removeClass(classActive);
		}

		$element.off().on('mouseenter',function(event){
			inTimer = setTimeout(show,inTime);
			event.stopPropagation();
		}).on('mouseleave',function(event){
			clearTimeout(inTimer);
			outTimer = setTimeout(hide,outTime);

			event.stopPropagation();
		});

		$(target).off().on('mouseenter',function(event){
			clearTimeout(outTimer);
			show();

			event.stopPropagation();
		}).on('mouseleave',function(event){
			clearTimeout(inTimer);
			outTimer = setTimeout(hide,outTime);;

			event.stopPropagation();
		});
	};

	return {
		init : _init
	}
}();

//실시간 경고알림 & 공지사항
globalui.notices = function() {
	var _ = {
		container : 'notice-container',
		danger : 'notice-danger',
		warning : 'notice-warning',
		attention : 'notice-attention',
		head : 'notice-head',
		body : 'notice-body',
		btnClose : 'btn-close'
	},
	_intervalTime,
	_init = function(){
		if($('.'+_.container).size()<1){
			var $div = $('<div />').addClass(_.container).appendTo($('body'));
		}
	},

	//경보알림 푸쉬
	pushalram = function(){
		_init();
		_call();
	},
	_call = function(){
		
		var callCount = 0,
		checkTotal = false,
		checkEvent = false,
		strHref = location.pathname,
		callbackTotalAlarm = function(data){
			checkTotal = true;
			if(data && data.length>0){
				if(!(gDISPLAY_ALARM == 'dashboard' && strHref.indexOf('dashboard') == -1)){
					_drawTotalItem(data);
					_appendTopLayer(data);
					callCount++;
				}else{
					_appendTopLayer(data);
				}
			}
			checkNoise();
		},
		callbackEventAlarm = function(data){
			checkEvent = true;
			if(data && data.length>0){
				if(!(gDISPLAY_ALARM == 'dashboard' && strHref.indexOf('dashboard') == -1)){
					_drawEventItem(data);
					callCount++;
				}
			}
			checkNoise();
		},
		checkNoise = function(){
			if(!checkTotal | !checkEvent) return false;

			if(callCount > 0) {
				var repeat = function(){
					setTimeout(function(){
						if( $('.notice-warning').size() + $('.notice-attention').size() >0 ){
							_makeNoise();
							repeat();
						}
					},4000)
				};

				_makeNoise();
				repeat();
				
				callCount = 0,
				checkTotal = false,
				checkEvent = false;
			}
		}
		
		var webSocket = new WebSocket("ws://"+location.host+"/main/alarm");
		
		webSocket.onmessage = function(message){
			var data = JSON.parse(message.data);
			
			callbackTotalAlarm(data.totalAlarmList);
			callbackEventAlarm(data.evtAlarmList);
		}
	},
	_drawTotalItem = function(data){
		var _maxsize = 3,
		time = _SL.formatDate(data[0].event_time, 'yyyyMMddHHmmss', 'yyyy-MM-dd HH:mm'),
		$container = $('.'+_.container),

		//make DOM
		$item = $('<div />')
			.addClass(_.warning+' notice-group')
			.css('display','none'),
		$head = $('<div />')
			.addClass(_.head)
			.append( '<i class="icon-exclamation-triangle"></i> 통합 경보 메세지<button type="button" class="'+_.btnClose+'"><i class="icon-times"></i></button>' )
			.appendTo($item),
		$body = $('<div />')
			.addClass(_.body)
			.appendTo($item),
		$time = $('<strong />')
			.addClass('date')
			.text(time)
			.appendTo($body);

		for(var i=0,len=data.length;i<len;i++){
			var msg = data[i].alarm_nm+' '+data[i].alarm_deco;

			if(data[i].info_page != ''){
				if(data[i].date_param == 'Y'){
					$body.append( (i+1)+'. <a href="'+data[i].info_page+'?start_time='+data[i].sdt+'&end_time='+data[i].ddt+'" target="_blank">'+msg+'</a><br>');
				}else{
					$body.append( (i+1)+'. <a href='+data[i].info_page+' target="_blank">'+msg+'</a><br>');
				}
			}else{
				$body.append( (i+1)+'. '+msg+'<br>' );
			}
		}

		if($container.find('.'+_.warning).size()>0){
			if($container.find('.'+_.attention).size()>0){
				$container.find('.'+_.attention).after($item);
			}else{
				$container.prepend($item);
			}
		}else{
			$container.append($item);
		}

		$item.fadeIn(250,function(){
			if($('.'+_.warning).size()>_maxsize){
				_removeItem( $('.'+_.warning).eq(_maxsize) );
			}

			//set event
			$(this).one('click','.'+_.btnClose,function(){
				_removeItem($item);
			});
		});
	},
	_drawEventItem = function(data){
		var _maxline = 100;
		if( $('.'+_.container+' .'+_.attention).size() == 0){
			var $container = $('.'+_.container),
			$item = $('<div />')
				.addClass(_.attention+' notice-group')
				.css('display','none')
				.prependTo($container),
			$head = $('<div />')
				.addClass(_.head)
				.append( '<i class="icon-file-info"></i> 실시간 이벤트 경보 메시지<button type="button" class="'+_.btnClose+'"><i class="icon-times"></i></button>' )
				.appendTo($item),
			$body = $('<div />')
				.addClass(_.body)
				.appendTo($item);
		}

		for(var i=0, len=data.length;i<len;i++){
			var msg = '['+_SL.formatDate(data[i].reg_time, 'yyyyMMddHHmmss', 'HH:mm:ss') +'] '+data[i].event_nm + ' '+data[i].level_nm+' 발생',
			link = '/event/search_event_list.html?start_time='+data[i].event_time+'&end_time='+_SL.formatDate.addMin(data[i].event_time,1)+'&s_event_nm='+data[i].event_nm+'&s_group_cd='+data[i].group_cd+'&s_event_cate_cd='+data[i].event_cate_cd+'&s_event_level='+data[i].event_level;
			$('.'+_.container+' .'+_.attention+' .'+_.body).prepend('<div><a href="'+link+'" target="_blank">'+msg+'</a></div>');

			if($('.'+_.container+' .'+_.attention+' .'+_.body+' > div').size()>_maxline){
				$('.'+_.container+' .'+_.attention+' .'+_.body+' > div').eq(_maxline).remove();
			}
			if(i > _maxline) break;
		}

		if( $('.'+_.container+' .'+_.attention).is(':hidden') ){
			var $item = $('.'+_.container+' .'+_.attention);
			$item.fadeIn(250,function(){
				$(this).one('click','.'+_.btnClose,function(){
					_removeItem($item);
				});
			});
		}
	},
	_removeItem = function($ele){
		$ele.animate({
			height:0
		},100,function(){
			$ele.remove();
		});
	},
	_makeNoise = function(){
		if( !document.getElementById('alarmNoise') ){
			var $audio = $('<audio />')
				.attr('src','/resources/wav/alarm.mp3')
				.attr('id','alarmNoise')
				.appendTo($('body'));
		}

		document.getElementById('alarmNoise').play();
	},
	_appendTopLayer = function(data){
		var $target = $('.header-layer-alarm');
		if($target.size()<1) return false;

		var str = '<dt>'+_SL.formatDate(data[0].event_time, 'yyyyMMddHHmmss', 'MM/dd HH:mm')+'</dt>';
		str += '<dd>';
		for(var i=0,len=data.length;i<len;i++){
			str += data[i].alarm_nm+' '+data[i].alarm_deco+'<br>';
		}
		str += '</dd>';

		var index = $target.find('dt:eq(2)').index()-1;
		$target.find('dl > *:gt('+index+')').remove();
		$target.find('dl').prepend(str);
	},

	//공지사항
	notice = function(){
		var $boardContainer = $('.notice-group.notice-board'),
		_boardItem = '.board-item-container',
		_btnLeft = 'icon-chevron-left',
		_btnRight = 'icon-chevron-right',
		_noticesize = 1,
		_remove = function(){
			$('.notice-group.notice-board').animate({
				height:0
			},500,function(){
				$(this).remove();
			})
		},
		_eventBtn = function(){
			$boardContainer.on('click','.btn-today',function(){
				$.cookie('stopNotice', 'Y', {expires:1, path:'/'});
				_remove();
			});
			$boardContainer.on('click','.btn-close',function(){
				_remove();
			});
		},
		_makePaging = function(){
			$(_boardItem).each(function(index){
				var $paging = $('<span class="area-paging" />'),
					$btnLeft = $('<button type="button" class="'+_btnLeft+'" />').appendTo($paging),
					$btnRight = $('<button type="button" class="'+_btnRight+'" />').appendTo($paging);
				$(this).find('.btn-today').after($paging);

				if(index===0){
					$btnLeft.prop('disabled',true);
				}else if(index===_noticesize-1){
					$btnRight.prop('disabled',true);
				}
			});
			_eventPaging();
		},
		_eventPaging = function(){
			var showIndex = function(index){
				$(_boardItem+':eq('+index+')').show();
				$(_boardItem+':eq('+index+')').siblings().hide();
			}

			$(_boardItem).each(function(){
				var index = $(this).index();
				$(this).find('.'+_btnLeft).on('mousedown',function(event){
					event.stopPropagation();
					showIndex(index-1);
				});
				$(this).find('.'+_btnRight).on('mousedown',function(event){
					event.stopPropagation();
					showIndex(index+1);
				});
			});
		};

		if($boardContainer.size()<0) return false;

		_init();
		$boardContainer.appendTo($('.'+_.container));

		_eventBtn();

		$(_boardItem).each(function(){
			var $body = $(this).find('.notice-body'),
			$innerBody = $(this).find('.notice-body-inner');
			if( $body.outerHeight() < $innerBody.outerHeight() ){
				$body.addClass('nano');
				$innerBody.addClass('nano-content');
				$body.nanoScroller();
			}
		});

		if( $(_boardItem).size() > 1){
			_noticesize = $(_boardItem).size();
			$(_boardItem+':gt(0)').hide();
			_makePaging();
		}
	},

	//라이선스 팝업
	licence = function(bLoginPage){
		_init();
		$('body').requestData('/common/license_check.json', {}, {callback : _licenceCont});
	},
	_licenceCont = function(rsJson){
		var
		 STATUS_VALID = 0,							// 유효한 License
		 STATUS_WARN_LOGIN_QUOTA = 1,	// 로그인 페이지에서 기간에 대한 주의 알림
		 STATUS_WARN_LOGIN_SIZE = 2,		// 로그인 페이지에서 사용량에 대한 주의 알림
		 STATUS_WARN_EVERY = 4,				// 모든 페이지에서 주의 알림
		 STATUS_BLOCK_LOGIN = 8,				// 기간 또는 사용량 초과로 로그인 제한
		 STATUS_INVALID = 16,					// 잘못된 License

		 conts = '', licenseInfo = '', title = '',
		 quota = rsJson.quota,
		 size = rsJson.size,
		 isLoginPage = location.href.indexOf("login.html") > -1;

		if(quota == 0){
			quota ="Unlimited";
		}
		
		if(size == 0){
			size ="Unlimited";
		}

		licenseInfo+="[ License Info ]<br>";
		licenseInfo+="- 발급번호 : " + rsJson.issueId + "<br>";
		licenseInfo+="- 발급일자 : " + _SL.formatDate(rsJson.issueDate+"000000", "yyyy-MM-dd") + "<br>";
		
		if(rsJson.quota == 0){
			licenseInfo+="- 만료일자 : " + quota + "<br>";
		}else{
			licenseInfo += "- 만료일자 : " + _SL.formatDate(rsJson.expireDate+"000000", "yyyy-MM-dd") + "(" + quota + "일)<br>";
		}
		
		if(rsJson.size == 0){
			licenseInfo+="- 사용량 : " + size + "<br>";
		}else{
			licenseInfo+="- 사용량 : " + size + "GB/일<br>";
		}
		
		if (isLoginPage) {
			if (rsJson.licStatus & STATUS_WARN_LOGIN_QUOTA) {
				title = "라이선스 기간 만료까지 " + rsJson.remainQuota + "일 남았습니다.<br>";
			}
			if (rsJson.licStatus & STATUS_WARN_LOGIN_SIZE ) {
				title += "라이선스 용량을 전일기준 " + rsJson.percentage + "%("+ rsJson.diskUsage +"GB/"+ rsJson.size +"GB) 사용 중입니다.<br>";
			}
		}
		
		if (rsJson.licStatus & STATUS_WARN_EVERY) {
			title +=" 라이선스 용량을 "+rsJson.repeatExceedDay+"일 연속 초과(전일 기준 "+ (rsJson.percentage)+"%) 사용 하였습니다.("+ rsJson.diskUsage +"GB/"+rsJson.size +"GB)<br>";
		}

		if(title.length > 0) {
			conts = licenseInfo
					+ "<br><span class='text-gray'>*라이선스 기간이 만료되거나 라이선스 용량이 "
					+ rsJson.LIMIT_PERCENTAGE + "%를 " + rsJson.LIMIT_EXCEED_DAY
					+ "일 연속 초과시 사용제한<strong class='text-danger'>(로그인 불가)</strong>됩니다.";

			_licenceMarkup(title, conts);
		}
	},
	_licenceMarkup = function(title, cont){
		var str = '<div class="notice-head">';
		str+= '<i class="icon-file-percent"></i>' +title;
		str+= '<button type="button" class="btn-close"><i class="icon-times"></i></button>';
		str+= '</div>';
		str+= '<div class="notice-body">'+cont;
		str+='</div>';

		var $item = $('<div />')
			.addClass(_.danger+' notice-group')
			.html(str);

		$('.'+_.container).append($item);
		$('.'+_.container).append('<div class="notice-background"></div>');
		
		$item.css({
			'margin-left' : $item.width() * -.5+'px',
			'margin-top' : $item.height() * -.5+'px',
		}).find('.'+_.btnClose).on('click',function(){
			$item.animate({
				height:0
			},250,function(){
				$item.remove();
				$('.notice-background').fadeOut(100,function(){
					$(this).remove();
				});
			});
		});
	}

	return {
		pushalram : pushalram,
		notice : notice,
		licence : licence
	}
}();

//LNB 검정 배경 영역
globalui.sectionCols = function(){
	var _init = function(){
		if( $('.container > .section-container > [class*="-cols"]').size()>0 || $('.page-popup-area > .section-container > [class*=-cols]').size()>0 ){
			_event();
			$(window).on('resize',function(){
				setTimeout(function(){
					_event();
				},500);
			})
		}
	},
	_event = function(){
		var $container = $('body > [class$=container]');

		if( $container.width() > $(window).width() ){
			$(window).on('scroll',_setColsStyle);
		}
	},
	_setColsStyle = function(){
		$('#cols-style').remove();
		var _size = $(window).scrollLeft() * -1;
		$('head').append('<style id="cols-style">.page-popup-area>.section-container .section-defined-cols:after,\
				.page-popup-area>.section-container .section-tree-cols:after,\
				.page-popup-area>.section-container .section-search-cols:after,\
				.container>.section-container .section-defined-cols:after,\
				.container>.section-container .section-tree-cols:after,\
				.container>.section-container .section-search-cols:after{left:'+_size+'px}</style>');
	},

	// make auto scroll in user defined list
	_userListScroll = function( _container ){
		if( $(_container).size() === 0 || !$(_container).hasClass('section-defined-cols') ) return false;

		var $listContainer = $(_container),
		$lists = $(_container+' .defined-list'),
		makeScroll = function(){
			var h = $(window).height() - $lists.offset().top;

			if($lists.find('nano').size() == 0){
				$lists.wrap('<div class="nano" style="height:'+h+'px;"></div>');
				$lists.addClass('nano-content');
			}

			$lists.parent('.nano').nanoScroller();
		},
		initScroll = function(){
			var listh = $lists.offset().top + $lists.outerHeight();
			if( listh > $(window).height() && listh > $lists.parents('.section-container').find('.section-content').outerHeight() ){
				makeScroll();
			}
		};

		if($lists.hasClass('nano-content')) return false;
		initScroll();

		var st;
		$(window).on('resize',function(){
			clearTimeout(st);
			st = setTimeout(function(){
				initScroll();
			},500);
		});
	};

	return {
		init : _init,
		userlist : _userListScroll
	}
}();

// fusionchart config default
globalui.chart = {
	chartConfig : {
		"alignCaptionWithCanvas": "0",
		"alternateHGridAlpha":"25",
		"alternateVGridAlpha":"25",
		"axisLineAlpha": "25",
		"baseFont": "tahoma",
		"baseFontSize": "11",
		"borderAlpha":"100",
		"bgAlpha": "100",
		"captionFontSize": "14",
		"canvasBgAlpha":"100",
		"canvasBorderAlpha":"100",
		"canvasBorderThickness":"0",
		"canvaspadding":"0",
		"divLineAlpha": "100",
		"labelAlpha":"100",
		"labelFontSize":"11",
		"legendBorderThickness": "0",
		"legendShadow":"0",
		"maxLabelHeight": "120",
		"outCnvBaseFont": "tahoma",
		"outCnvBaseFontSize": "11",
		"plotBorderAlpha": "53",
		"plotfillalpha":"100",
		"plotFillHoverAlpha": "90",
		"placeValuesInside": "1",
		"showAlternateHGridColor" : "1",
		"showAlternateVGridColor": "0",
		"showAxisLines": "1",
		"showBorder": "0",
		"showCanvasBase": "0",
		"showCanvasBorder": "0",
		"showHoverEffect":"1",
		"showPlotBorder":"1",
		"subcaptionFontSize": "12",
		"subcaptionFontBold": "0",
		"toolTipBgAlpha": "70",
		"toolTipBorderThickness": "0",
		"toolTipBorderRadius": "2",
		"toolTipPadding": "5",
		"usePlotGradientColor": "0",

		"alternatevgridcolor" : "#f2f2f2",
		"alternatehgridcolor" : "#f2f2f2",
		"baseFontColor": "#000000",
		"bgColor": "#ffffff",
		"borderColor" : "#f2f2f2",
		"canvasBgColor" : "#fefefe",
		"divLineColor" : "#f2f2f2",
		"legendBgColor" : "#fefefe",
		"outCnvBaseFontColor": "#000000",
		"plotBorderColor": "#000000",
		"toolTipColor": "#ffffff",
		"toolTipBgColor": "#000000",
		"paletteColors": "#00c0dd, #92d050, #ffc000, #ff812d, #aa80fd, #2293e5, #ff9999, #42b642, #feac72, #c6e700, #2dbda5, #ff87e8, #6144ff"
	}
};



$(document).ready(function(){
	globalui.attach.init('body');
	globalui.sectionCols.init();
});
