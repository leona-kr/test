//# sourceURL=log_search.js
'use strict';

_SL.nmspc("logsearch").manager = function(){
	//console.log("slapp.logsearch.manager exec.");
	var
	timeDiffFromServer,
	hiddenFrameName		= "hiddenFrame",
	hideMyLogsModeAttr	= "data-mylogs-mode",
	urlVisualTookit		= gCONTEXT_PATH + "jws/va_toolkit.do?dummy",
	urlLogSearch		= gCONTEXT_PATH + "monitoring/log_search.html",
	urlMylogsGroup = gCONTEXT_PATH + "monitoring/mylogs_group_form.html",
	
	init = function(serverTime, param) {
		/**
		 * 시간 정보 설정
		 */
		slapp.logsearch.searchTime = {
			isPreset	: true,
			to			: param.end_time,
			from		: param.start_time
		};

		timeDiffFromServer = _SL.formatDate.diff(_SL.formatDate("yyyyMMddHHmmss"), serverTime, "yyyyMMddHHmmss")/1000 | 0;

		if(gIsMyLogsMode) {
			$("[" + hideMyLogsModeAttr + "=hide]").hide();
		}
		
		slapp.logsearch.dnt.init();

		slapp.logsearch.query.init();
		
		slapp.logsearch.layer.init();

		slapp.logsearch.progressbar.init();
		
		slapp.logsearch.dynPaging.init();
		
		slapp.logsearch.contextmenu.init();
		
		slapp.logsearch.submit.init();

		slapp.logsearch.mysearch.init();

		slapp.logsearch.mylogsDlg.init();
		
		slapp.logsearch.dlgViewField.init();

		// 내 검색결과 관리
		$("#btnSettingMyLogs").togglePage(urlMylogsGroup);

		$("body").on("addkeyword.logsearch", function(event, key, value) {
			slapp.logsearch.query.addKeyword(key, value);
		});
		
		$(".btn-visual").on("click", function() {
			var refDynPaging = slapp.logsearch.dynPaging;
			
			submit(urlVisualTookit, {
					start_time		: refDynPaging.getStartTime(),
					end_time		: refDynPaging.getEndTime(), 
					expert_keyword	: refDynPaging.getQuery() 
			});
		});
		
		//node analysis 보기
		$(".btn-node").on("click", function(){
			var refDynPaging = slapp.logsearch.dynPaging;
			var query = refDynPaging.getQuery();
			if(query==""){
				query = "(src_ip:* OR dstn_ip:*)";
			}else{
				query += " AND (src_ip:* OR dstn_ip:*)";
			}
			
			window.open("/relationAnalysis/relation_analysis.html?start_time="+refDynPaging.getStartTime()+"&end_time="+refDynPaging.getEndTime()+"&query=" + query ,"boardPopup","toolbar=no,location=no,directory=no,status=no,menubar=no,height=700,width=1200,scrollbars=yes,resizable=yes")
		});
	},
	
	submit = function(strUrl, param, formAttrs) {
		var $form = $("<form>").attr($.extend({
			action : strUrl,
			method : "post"
		}, formAttrs || {}));
		
		for(var k in param) {
			$form.append(
				$("<input type='hidden'>").attr("name", k).val(param[k])
			);
		}
			
		$form
			.appendTo("body")
			.submit()
			.remove();
	},
	
	submitToFrame = function(strUrl, param) {
		if($("iframe").size() == 0) {
			$("<iframe>").attr("name", hiddenFrameName).css({display:"none", visibility:"hidden"}).appendTo("body");
		}
		
		submit(strUrl, param, {target:hiddenFrameName});
	},
	
	openSearch = function(pDatas) {
		var param = $.extend({}, gLogSearchParam, {expert_keyword : slapp.logsearch.dynPaging.getQuery(), template_id:"popup"}, pDatas);
		
		submit(urlLogSearch, param, {target : "logSearchWin_" + (new Date()).getTime()});
	};
	
	return {
		init : init,
		getServerTime : function(pattern){
			return _SL.formatDate.addSec(new Date(), timeDiffFromServer, pattern);
		},
		submit : submit,
		submitToFrame : submitToFrame,
		openSearch : openSearch,
	};
	
}();


/**
 * 기본 설정
 **/
slapp.logsearch.option = {
	textUserDefined : 'User Defined',
	textDefaultTime : 'Last 5 Min',
	valueDefaultTime : 5,
	isAuto : $.cookie('sl_sa') != null ? parseInt($.cookie('sl_sa')) : 1,
	closeDntAuto : true,
	closeDntAfterSearch : true,
	dntRecentYear : 3,
	dntTypes : ['year','month','day','hour','minute'],
	recentName : 'sl_sr',		// 최근검색어 쿠키 저장 이름
	assetName : 'sl_ss'			// 코드북/검색필드 쿠키 저장 이름
};


/**
 * 검색 액션
 **/
slapp.logsearch.submit = function(){
	var btnSearchSubmit = '#btnSearchSubmit',
	btnDnt = '#btnSearchTimes',
	textSearchTimes = '#textSearchTimes',

	textOvertime = '시작일이 종료일보다 큽니다',

	fromTime, toTime, //diff,

	init = function(){
		submitSearch();		//기본값으로 조회

		_eventSearch();		//이벤트
	},
	_eventSearch = function(){
		$(btnSearchSubmit).off().on('click',function(){
			if(_checkTimeVal()){
				submitSearch();
			}
		});
	},
	_checkTimeVal = function(){
		fromTime = slapp.logsearch.dnt.getSelectedTime('from');
		toTime = slapp.logsearch.dnt.getSelectedTime('to');

		var diff = _SL.formatDate.diff(fromTime, toTime, "yyyyMMddHHmm")/1000 | 0;

		if(diff<0){
			_alert(textOvertime);
		} else {
			return true;
		}
	},
	submitSearch = function(){
		// UI 및 Time 데이터 처리
		_setChangedTime();
		_uiTimeText();
		_completeSearch();

		if(slapp.logsearch.option.isAuto){
			slapp.logsearch.layer.hideLayer();
		}

		slapp.logsearch.dynPaging.search();
	},
	_completeSearch = function(){
		slapp.logsearch.recent.setSave();
		slapp.logsearch.recent.setLists();

		var diff = _SL.formatDate.diff(slapp.logsearch.searchTime.from, slapp.logsearch.searchTime.to, "yyyyMMddHHmm")/1000 | 0;
		slapp.logsearch.option.valueDefaultTime = parseInt(diff/60);

		if(slapp.logsearch.searchTime.isPreset && $('.sp-preset button[data-value='+parseInt(diff/60)+']').size()>0){
			var t = $('.sp-preset button[data-value='+parseInt(diff/60)+']').text();
		} else {
			var t = slapp.logsearch.option.textUserDefined;
			slapp.logsearch.searchTime.isPreset = false;
			slapp.logsearch.dnt.selectedTime.isPreset = false;
		}

		$(btnDnt).text(t);

		if(slapp.logsearch.option.closeDntAfterSearch){
			slapp.logsearch.dnt.hideLayer();
		}
	},
	_setChangedTime = function(){
		slapp.logsearch.searchTime.from = slapp.logsearch.dnt.getSelectedTime('from');
		slapp.logsearch.searchTime.to = slapp.logsearch.dnt.getSelectedTime('to');
		//slapp.logsearch.searchTime.isPreset = slapp.logsearch.dnt.isPreset();
		slapp.logsearch.searchTime.isPreset = slapp.logsearch.dnt.selectedTime.isPreset;
	},
	_uiTimeText = function(){
		var t_f = slapp.logsearch.searchTime.from,
		t_t = slapp.logsearch.searchTime.to,
		ts_f = [t_f.slice(0,4), t_f.slice(4,6), t_f.slice(6,8), t_f.slice(8,10), t_f.slice(10,12)],
		ts_t = [t_t.slice(0,4), t_t.slice(4,6), t_t.slice(6,8), t_t.slice(8,10), t_t.slice(10,12)],
		$from =$(textSearchTimes+' [data-time=from]'),
		$to =$(textSearchTimes+' [data-time=to]');

		$from.text(ts_f[0]+'-'+ts_f[1]+'-'+ts_f[2]+' '+ts_f[3]+':'+ts_f[4]);
		$to.text(ts_t[0]+'-'+ts_t[1]+'-'+ts_t[2]+' '+ts_t[3]+':'+ts_t[4]);
	}

	return {
		init : init,
		submitSearch : submitSearch
	}
}();

/**
 * 검색어
 */
slapp.logsearch.query = function() {
	var
	refMng = slapp.logsearch.manager,
	areaSearch = "#areaSearch",
	$areaSearch,
	
	init = function() {
		$areaSearch = $(areaSearch);

		_autoSize();
		$(window).on('resize',_autoSize);
	},
	
	_autoSize = function(){
		// textarea 사이즈 자동조절
		if( $areaSearch.height() != $('#areaMirror').height() ){
			$areaSearch.height( $('#areaMirror').height()+'px' );
		}
	},
	getQuery = function() {
		return $areaSearch.val();
	},
	
	setQuery = function(strQuery, onlyMirror){
		if($("#areaMylabel").is(":visible")){
			$('#areaMylabel').hide();
			$("#btnMyfilterSave").show();
		}

		if(!onlyMirror){
			$areaSearch.val(strQuery);
		}
		$('#areaMirror').text(strQuery);

		_autoSize();
	},
	
	addKeyword = function(key, value, operator) { //로그 검색결과를 클릭해서 keyword를 입력할때
		if(gIsMyLogsMode) {
			_addKeywordAtMyLogsMode(key, value);
			
			return;
		}

		var str;
		var strSYSVAR = 'SYSVAR';
		
		//마우스 커서의 앞 부분의 keyword를 체크,마지막에 검색연산자가(OR,AND,NOT,+) 없을때는 AND또는 OR검색연산자를 삽입
		var sPreText = _getInputPreSelection($areaSearch);
		var sRMText = _getInputremainingSelection($areaSearch);
			
		var regExp = /(?:\s*(OR|AND|NOT)\s*)$/;
		var regExpTest = regExp.test(sPreText);
			
		var regExp2 = /(?:\s*\+\s*)$/;
		var regExpTest2 = regExp2.test(sPreText);
		
		var bLSpace = true;
		var bRSpace = true;
		
		var _value = _SL.luceneValueEscape(value);
		if(value == "*") _value = value; 
		
		if(operator != undefined){
			//연산자를 수동으로 입력할 경우
			if(!regExp.test(operator)) return;
			str = operator + " " + key + ":" + _value;
		}else if(regExpTest || regExpTest2 || sPreText == "") {
			//1.(OR|AND|NOT)검색연산자가 keyword의 마지막일때
			//2.+로 끝날때
			//3.처음 추가할때
			//4.keyword를 전체선택한 후(드래그 or 세번클릭) 새 키워드 추가할때는 그냥삽입
			if(key.match(strSYSVAR))
				str = key;
			else
				str = key + ":" + _value;
			
			if(regExpTest2)	bLSpace = false;//+로 끝날때는 왼쪽 공백 삽입안함

		}else if(sRMText.indexOf(key) != -1 && sPreText.indexOf(key) != -1 ){
			//마우스 선택영역을 제외한 부분의 keyword에 같은 key가 있고 그 key가 선택영역의 앞쪽 keyword에 있을경우
			if(key.match(strSYSVAR))
				str = "OR " + key;
			else
				str = "OR " + key + ":" + _value;
		}else{
			//그 외에는 AND조건
			if(key.match(strSYSVAR))
				str = "AND " + key;
			else
				str = "AND " + key + ":" + _value;
		}
		
		replaceSelection(str, bLSpace, bRSpace);
	},
	
	_getInputPreSelection = function(elem){//커서 앞부분의 검색어 추출
		if(typeof elem != "undefined"){
			var s=elem[0].selectionStart;
			var e=elem[0].selectionEnd;
			
			return $.trim(elem.val().substring(0,s));
		}else{
		 	return '';
		}
	},
	
	_getInputremainingSelection = function(elem){//마우스 선택영역을 제외한 부분을 추출
		if(typeof elem != "undefined"){
			var s=elem[0].selectionStart;
			var e=elem[0].selectionEnd;
			var l=elem.val().length;
			
			return $.trim(elem.val().substring(0,s) + elem.val().substring(e,l));
		}else{
		 	return '';
		}
	},
	
	_addKeywordAtMyLogsMode = function(key, value) {
		var strQuery = getQuery();
		
		if(strQuery == "") strQuery = key + ":" + _SL.luceneValueEscape(value);
		else strQuery += " AND " + key + ":" + _SL.luceneValueEscape(value);
	
		refMng.openSearch({expert_keyword : strQuery, mylogs_id : ""});
	},
	
	addOperator = function(pOperator) {
		var strKeyword = $.trim($areaSearch.val());
		var bLSpace = false, bRSpace = false;
		
		if(pOperator == "") return;

		if(/AND|OR|NOT/.test(pOperator)) {
			bLSpace = bRSpace = true;
		}

		replaceSelection(pOperator, bLSpace, bRSpace);
	},
	
	replaceSelection = function(vText, bLeftSpace, bRightSpace) {
		var nSelStart, nSelEnd, strFull, strFront, strSel, strBack,
			oEl = $areaSearch[0];
			
		oEl.focus();

		if("selectionStart" in oEl) {
			strFull = oEl.value;

			//if(oEl.selectionStart == 0 && oEl.selectionEnd == 0) 
				//oEl.selectionStart = oEl.selectionEnd = strFull.length;
			
			nSelStart = oEl.selectionStart;
			nSelEnd = oEl.selectionEnd;
			strFront = strFull.substring(0, nSelStart);
			strSel = strFull.substring(nSelStart, nSelEnd);
			strBack = strFull.substring(nSelEnd);
			
			if(bLeftSpace && strFront.length > 0 && /\S$/.test(strFront)) {
				vText = " " + vText;
			}
			if(bRightSpace && /^\S/.test(strBack)) {
				vText += " ";
			}
			oEl.value = strFront + vText + strBack;
			oEl.selectionStart = oEl.selectionEnd = nSelEnd + vText.length - strSel.length;
			setQuery(oEl.value, true);
			return;
 		}
		else if (document.selection) {
			
			var range = document.selection.createRange();
			
			if (range && range.parentElement() == oEl) {
				range.text = bLeftSpace ? " " : "" + vText + bRightSpace + " " + "";
				setQuery(range.text, true);
				return;
			}
		}
		
		oEl.value(oEl.value + bLeftSpace ? " " : "" + vText + bRightSpace + " " + "");
		setQuery(oEl.value + bLeftSpace ? " " : "" + vText + bRightSpace + " " + "", true);
	}
	
	return {
		init			: init,
		getQuery		: getQuery,
		setQuery		: setQuery,
		addKeyword		: addKeyword,
		addOperator		: addOperator,
		replaceSelection : replaceSelection
	}
}();

/**
 * 진행바
 */
slapp.logsearch.progressbar = function() {
	var
	refDynPaging,
	
	areaProgress = '.section-search .area-progress',
	barState = '.bar-state',
	btnStop = '.btn-stop',
	
	$areaProgress = $(areaProgress),
	$barState = $(barState, areaProgress),
	
	init = function() {
		refDynPaging = slapp.logsearch.dynPaging;

		$(btnStop, $areaProgress).off().on("click", function() {
			refDynPaging.stopSearch();
		});
	},
	
	show = function(per){
		var setInit = function(){
			$barState.width('0px');
			$areaProgress.show();
		}
	
		if(per != undefined){
			if( $(areaProgress).is(':hidden') ){
				setInit();
			}

			$barState.width(Math.round(per) + '%');
		} else{
			setInit();
		}
	},
	
	hide = function(){
		$(areaProgress).hide();
	}
	
	return {
		init : init,
		show : show,
		hide : hide
	};
}();


/**
 * 레이어
 **/
slapp.logsearch.layer = function(){
	var
	refQuery,
	btnSearchToggle = '#btnSearchToggle',
	areaSearch = '#areaSearch',
	layerSearch = '#layerSearch',
	checkAuto = '#checkAuto',
	listSearchRecent = '#listSearchRecent',

	classBtnSearch = 'btn-search',
	//classBtnToggle = 'btn-toggle',
	classParentLayer = 'area-layer-module',
	classOpen = 'open',
	classBtnDnt = 'btn-dnt',
	classActive = 'active',
	classHover = 'hover',

	cAutoname = 'sl_sa',		// auto 체크 쿠키 저장 이름

	isAuto = slapp.logsearch.option.isAuto,
	isLayerActive = false,

	init = function(){
		refQuery = slapp.logsearch.query;
		
		// search form init
		_eventInit();

		slapp.logsearch.assets.init();

		slapp.logsearch.recent.setLists();

		$(checkAuto).prop('checked', isAuto);
		
		if(gIsMyLogsMode) {
			$("#log_search_container").hide();
			$("#bt_logs_save").hide();
			$(".log-action-bt img").hide();
			$("#export_btn").show();
		}
		
		if(gLogSelectable) $("#bt_proc_incd").show();
	},
	_eventInit = function(){
		$(btnSearchToggle).on('click',function(){
			if( isLayerActive ){
				hideLayer();
			} else {
				showLayer();
			}
		});

		$(areaSearch)
			.on('keyup',function(){
				slapp.logsearch.query.setQuery($(this).val(), true);
			})
			.on('focus',function(){
				if(isAuto && !isLayerActive){
					showLayer();
				}
			})
			.on('keydown',function(event){
				switch(event.keyCode){
					case 13:
						slapp.logsearch.submit.submitSearch();
						return false;
						break;
					case 40:
						_eventMove(0);
						break;
					case 38:
						_eventMove(1);
						break;
					case 27:
						_hideLayer();
						break;
				}
			});

		$(checkAuto).on('change',function(){
			if( $(this).prop('checked') ){
				isAuto = true;
				slapp.logsearch.option.isAuto = true;
				$.cookie(cAutoname,1,{expires:30});
				_addBodyEvent();
			} else {
				isAuto = false;
				slapp.logsearch.option.isAuto = false;
				$.cookie(cAutoname,0,{expires:30});
				_removeBodyEvent();
			}
		});

		//연산자 버튼들
		$(layerSearch+' .sp-ari button').each(function(){
			$(this).on('click',function(){
				refQuery.addOperator($(this).val());
			});
		});
	},
	_eventMove = function(direction){
		if( $(layerSearch).is(':hidden') ) return false;

		var $li = $(listSearchRecent+' li'),
			index = -1,
			max = $li.size();

		for(var i=0, len=max; i<len;i++){
			if($li.eq(i).hasClass(classActive)) index = i;
		}

		if(direction === 0 && index < max-1){
			index ++;
		} else if(direction === 1 && index > 0){
			index --;
		}

		$li.removeClass(classHover);
		$li.removeClass(classActive);
		$li.eq(index).addClass(classActive);
		slapp.logsearch.query.setQuery( $li.eq(index).text().trim() );
	},
	_showLayer = function(){
		$(btnSearchToggle).addClass(classOpen);
		isLayerActive = true;
		$(layerSearch).show();

		if(isAuto){
			_addBodyEvent();
		}
		slui.attach.setTransformSelect(layerSearch);
		$(layerSearch+' .nano').nanoScroller();
		$(layerSearch+' .nano-content').each(function(){
			slui.event.unitWheel($(this));
		})
	},
	_hideLayer = function(){
		$(btnSearchToggle).removeClass(classOpen);
		isLayerActive = false;
		$(layerSearch).hide();

		if(isAuto){
			_removeBodyEvent();
		}
	},
	_addBodyEvent = function(){
		document.querySelector('body').addEventListener('mousedown',_checkAutoClose);
	},
	_removeBodyEvent = function(){
		document.querySelector('body').removeEventListener('mousedown',_checkAutoClose);
	},
	_checkAutoClose = function(e){
		if(isLayerActive){
			var isOk = !$(e.target).hasClass(classParentLayer) && !$(e.target).parents().hasClass(classParentLayer)
					&& !$(e.target).hasClass(classBtnDnt) && !$(e.target).parents().hasClass(classBtnDnt)
					&& !$(e.target).hasClass(classBtnSearch) && !$(e.target).parents().hasClass(classBtnSearch)
					&& !$(e.target).parents().hasClass('modal-alert')
					&& !$(e.target).parents().hasClass('pop-items')
					&& !$(e.target).parents().hasClass('jqx-window')
					&& e.target.id != 'btnSearchToggle'
					&& !$(e.target).hasClass('field-value');

			if( isOk == true ){
				_hideLayer();
			}
		}
	},
	showLayer = function(){
		_showLayer();
	},
	hideLayer = function(){
		_hideLayer();
	}

	return {
		init: init,
		showLayer : showLayer,
		hideLayer : hideLayer
	};
}();


/**
 * 최근 검색어
 **/
slapp.logsearch.recent = function(){
	var areaSearch = '#areaSearch',
	listSearchRecent = '#listSearchRecent',

	classHover = 'hover',
	classActive = 'active',
	
	maxSize = 5,

	cname = slapp.logsearch.option.recentName,
	rlist = $.cookie(cname) != null ? $.cookie(cname).split(';') : [],

	setSave = function(){
		var q = $(areaSearch).val().trim();

		if( q !='' ){
			for(var i=0, len = rlist.length; i<len; i++){
				if(rlist[i] === q){
					rlist.splice(i,1);
					continue;
				}
			}

			rlist.unshift(q);

			if(rlist.length>maxSize){
				rlist.pop( maxSize-1 );
			}

			$.cookie(cname, rlist.join(';'),{expires:30});
		}
	},
	setLists = function(){
		if(rlist.length > 0){
			var $list = $(listSearchRecent).empty();

			for(var i=0,len=rlist.length; i <len;i++){
				if(i > maxSize-1) break;
				$list.append('<li>'+rlist[i]+'</li>');
			}

			$list.find('li').each(function(){
				$(this).off().on('click',function(){
					slapp.logsearch.query.setQuery( $(this).text() );
					slapp.logsearch.submit.submitSearch();

				}).on('mouseover',function(){
					$(this).addClass(classHover);
					$(listSearchRecent+' .'+classActive).removeClass(classActive);

				}).on('mouseout',function(){
					$(this).removeClass(classHover);
				});
			});
		}
	}

	return {
		setSave : setSave,
		setLists : setLists
	}
}();


/**
 * 검색필드 & 코드북
 **/
slapp.logsearch.assets = function(){
	var 
	refQuery = null,

	selectAsset = '#selectAsset',
	layerAsset = '#layerAsset',
	layerField = '#layerField',
	layerBook = '#layerBook',
	layerSysvar = '#layerVar',
	layerSearchfields = '#layerSearchfields',

	classList = 'list-default',
	classListEmpty = 'list-empty',
	classItemtitle = 'item-title',
	classActive = 'active',
	classHover = 'hover',

	assetcname = slapp.logsearch.option.assetName,

	originListField = [], originListBook = [], originListSysvar = [],
	
	searchField, searchBook, searchSysvar,

	init = function(mode){
		var _mode = mode;

		refQuery = slapp.logsearch.query;
		
		_initCodebookValue();

		searchField = new ListSearchUi();
		searchField.list = layerField+' ul';
		searchField.origin = originListField;

		searchBook = new ListSearchUi();
		searchBook.list = layerBook+' ul';
		searchBook.origin = originListBook;

		searchSysvar = new ListSearchUi();
		searchSysvar.list = layerSysvar+' ul';
		searchSysvar.origin = originListSysvar;

		if(_mode == undefined){
			_mode = $.cookie(assetcname) != null ? $.cookie(assetcname) : '0';
		}
		_setUi(_mode);

		$(selectAsset).val(_mode).on('change',function(){
			_setUi($(this).val(), true);
		});

		_search(parseInt(_mode));
		_eventInit();
	},
	_initCodebookValue = function() {
		var i, j, oCode,
			$layerBookUl = $(layerBook+" ul"),
			$wrapper = $(document.createDocumentFragment());
		
		for(i = 0, j = gCodebookList.length; i < j; i++) {
			oCode = gCodebookList[i];

			$layerBookUl.append(
				$("<li>")
					.attr("data-codeid", oCode.code_id)
					.attr("data-codetype", oCode.code_type)
					.text("[" + oCode.code_id + "] " + oCode.code_nm)
			);
		}
	},
	_setUi = function(mode, isEvent){
		var index = parseInt(mode);
		var text = $(selectAsset+' option[value="'+index+'"]').text();

		$(layerAsset+' .sp-list').hide();
		$(layerField+ ' .'+classListEmpty).hide();
		$(layerAsset+' .'+classActive).removeClass(classActive);
		
		$(layerAsset+' .sp-list').eq(index).show();
		$(layerAsset+' .sp-list').eq(index).nanoScroller();
		$(layerAsset).find('[type=text]').attr('placeholder', text).val('');

		if(isEvent){
			_search(index);
		}

		$.cookie(assetcname,mode,{expires:30});
	},
	_eventInit = function(){
		$(layerAsset+' .'+classList+' li:not(.'+classItemtitle+')').each(function(){
			var _content = $(this).text().trim(),
			_eventOver = function(){
				$(this).addClass(classHover);
			
				if($(layerBook).is(':visible')){
					$(this).siblings().removeClass(classActive);
					if( $(layerSearchfields).is(':visible') && $('.pop-select').data('jqx-id') != $(this).attr('id') ){
						$(layerSearchfields).fadeOut(200);
					}
				}
			},
			_eventOut = function(){
				$(this).removeClass(classHover);
			},
			_eventClick = function(event){
				event.stopPropagation();

				// 검색필드
				if( $(layerField).is(':visible') ){
					refQuery.replaceSelection($(this).attr('data-id') + ":", true, false);
				}
				// 코드북
				else if( $(layerBook).is(':visible') ){
					$(this).siblings().removeClass(classActive);
					$(this).addClass(classActive);

					_drawPopItem($(this), event);
				}
				// 시스템변수
				else if( $(layerSysvar).is(':visible') ){
					refQuery.addKeyword("SYSVAR("+$(this).text()+")");
				}
			};

			$(this).attr('data-ui','tooltip').data('text',_content);

			if( $(this).parents('.sp-list').attr('id') == layerField.replace('#','') ){
				originListField.push({
					'text' : $(this).text().toLowerCase()
				});
			}
			else if( $(this).parents('.sp-list').attr('id') == layerBook.replace('#','') ){
				originListBook.push({
					'text' : $(this).text().toLowerCase()
				});
			}
			else if( $(this).parents('.sp-list').attr('id') == layerSysvar.replace('#','') ){
				originListSysvar.push({
					'text' : $(this).text().toLowerCase()
				});
			}

			$(this).on('mouseover',_eventOver)
				.on('mouseout',_eventOut)
				.on('click keydown',_eventClick);
		});

		slui.attach.tooltip(layerAsset);
	},
	_search = function(index){
		var input = layerAsset+' [type=text]';

		switch(index){
			case 0:
			default:
				searchField.element = input;
				searchField.init();
				break;
			case 1:
				searchBook.element = input;
				searchBook.init();
				break;
			case 2:
				searchSysvar.element = input;
				searchSysvar.init();
				break;
		}
	},
	_drawPopItem = function(_ele, event){
		var codeId = $(_ele).attr("data-codeid");
		var codeType = $(_ele).attr("data-codetype");
		
		var list = gCodeTypeToFld[codeType];
		
		if(list != undefined || list.length >0){
			var $target = $(layerSearchfields).empty();
			for(var i=0, len=list.length; i < len; i++){
				$target.append(
					$('<span>')
						.attr('data-codeid', codeId)
						.attr('data-fieldnm', list[i])
						.text(gFieldCaptions[list[i]] + '(' + list[i] + ')')
				);
			}
			_eventPopItem(_ele, event);
		}
	},
	_eventPopItem = function( _this, event ){
		var bodyEvent = function(event){
			var target = event.target,
			isOk = $(target).attr('id') != layerSearchfields.split('#')[1] && $(target).parents().attr('id') != layerSearchfields.split('#')[1]
				&& $(target).attr('id') != layerBook.split('#')[1] && $(target).parents().attr('id') != layerBook.split('#')[1];

			if(isOk){
				$(layerSearchfields).fadeOut(200);
				$('body').off('mouseover',bodyEvent);
				$(layerBook+' .'+classActive).removeClass(classActive);
			}
		},
		posLeft = event.clientX + 10,
		posTop = _this.offset().top,
		$layerSearchfields = $(layerSearchfields); 

		if(event.type == 'keydown'){
			posLeft = $(event.target).offset().left + $(event.target).width() - 10;
		}
		$layerSearchfields.show();
		$layerSearchfields.offset({
			top: posTop,
			left: posLeft
		})
		.data('jqx-id', _this.attr('id'))
		.fadeIn(200, function(){

			$(this).find('span').off().on('click',function(){
				//검색어에 필드명:코드 입력				
				refQuery.addKeyword($(this).attr('data-fieldnm'), $(this).attr('data-codeid'));
			});

			$('body').on('mouseover',bodyEvent);
		});
		
		posTop = $layerSearchfields.offset().top;
	}

	return {
		init : init
	}
}();


/**
 * 내 검색조건
 **/
slapp.logsearch.mysearch = function(){
	var
	// Reference Modules
	refDynPaging,
	refQuery,
	
	listMysearch = '#listMysearch',
	inputMysearch = '#inputMysearch',
	btnImport = '#btnImportFilter',
	areaMylabel = '#areaMylabel',
	btnAddFilter = '#btnMyfilterSave',

	classItemtitle = 'item-title',
	classListEmpty = 'list-empty',
	classActive = 'active',
	classHover = 'hover',

	classDelete = 'btn-del',
	classSetting = 'btn-setting',
	classAdd = 'btn-add',
	classCancel = 'btn-cancel',

	textEmpty = '검색 결과가 없습니다',
	textDelete = '삭제 하시겠습니까?',
	textAdd = '추가 하시겠습니까?',
	textModify = '수정 하시겠습니까?',

	urlPATH		= gCONTEXT_PATH + "monitoring/",
	urlKeywords = urlPATH + "myfilter_keywords.json",
	urlDetail	= urlPATH + "myfilter_detail.json",
	urlInsert	= urlPATH + "myfilter_insert.do",
	urlUpdate	= urlPATH + "myfilter_update.do",
	urlDelete	= urlPATH + "myfilter_delete.do",
	urlShared = urlPATH + 'myfilter_share_list.json',
	urlImport = urlPATH + "myfilter_import.do",

	originList = [],
	
	init = function(){
		refDynPaging	= slapp.logsearch.dynPaging;
		refQuery		= slapp.logsearch.query;
		
		_eventList();
		_eventSetting();

		//검색조건 신규 저장
		$(btnAddFilter).on('click',function(){
			mDlgMyfilterForm.open();
		});

		mDlgImportFilter.init();
		mDlgMyfilterForm.init();
		
		var searchUI = new ListSearchUi();
		searchUI.element = inputMysearch;
		searchUI.list = listMysearch;
		searchUI.origin = originList;
		searchUI.init();
	},
	_eventList = function(){
		$(listMysearch+' li').each(function(){
			var _content = $(this).text().trim();
			$(this).attr('data-ui','tooltip')
				.attr('data-text',_content);

			$(this).on('click keydown',function(){
				var nm = $.trim($(this).text()),
					id = $(this).attr('data-id');

				var 
				rqdata = {myfilter_id: $(this).attr('data-id')},
				callback = function(data){
					refQuery.setQuery(data.keywords);
					
					if(data.view_fields) {
						refDynPaging.changeFieldCaption(data.view_fields.split(","), true);
					}
					
					refDynPaging.search();
					
					_showLabel(nm, id);
				}
				$('body').requestData(urlKeywords, rqdata, {callback : callback});

				$(inputMysearch).val(nm);
				$(listMysearch+' .'+classActive).removeClass(classActive);
				$(listMysearch+' li').show();

			}).on('mouseover',function(){
				$(this).addClass(classHover);
				$(listMysearch+' li.'+classActive).removeClass(classActive);

			}).on('mouseout',function(){
				$(this).removeClass(classHover);
			});

			originList.push({
				'text'	: $(this).text().toLowerCase()
			});
		});
		$(listMysearch).parents('.nano').nanoScroller();
		slui.attach.tooltip(listMysearch);
	},
	_eventSetting = function(){
		$(listMysearch+' li .'+classDelete).each(function(){
			$(this).off().on('click',function(event){
				var $p = $(this).parents('li');

				_confirm(textDelete,{
					onAgree : function(){
						var
						rqdata = {myfilter_id: $p.attr('data-id')},
						callback = function(data, rsCd, rsMsg){
							$p.remove();
							_eventList();
							_hideLabel();
							$(inputMysearch).val('');
						}
						$('body').requestData(urlDelete, rqdata, {callback : callback});
					}
				});
				event.stopPropagation();
			});
		});
		$(listMysearch+' li .'+classSetting).each(function(){
			$(this).off().on('click',function(event){
				var id = $(this).parents('li').attr('data-id');
				mDlgMyfilterForm.open(id);
				event.stopPropagation();
			});
		});
	},
	_showLabel = function(name, id){
		$(btnAddFilter).hide();
		$(areaMylabel).show().data('id',id);
		$(areaMylabel+' span').text(name);

		$(areaMylabel+' .'+classSetting).off().on('click',function(){
			mDlgMyfilterForm.open(id);
		});

		$(areaMylabel+' .'+classCancel).off().on('click',function(){
			_hideLabel();
		});
	},
	_hideLabel = function(){
		$(areaMylabel).hide().data('id','');
		$(areaMylabel+' span').text('');
		$(btnAddFilter).show();
		slapp.logsearch.query.setQuery('');
	},
	hideLabel = function(){
		_hideLabel();
	},
	
	mDlgImportFilter = function(){
		var $dlg,
		dlg = '#windowImportFilter',
		
		init = function(){
			$dlg = $(dlg);
			var $lists = $(dlg+' .area-lists ul');

			//설정창 세팅
			$dlg.jqxWindow({
				width: 450, height: 300, autoOpen: false,
				resizable: false, isModal: true, modalOpacity: 0.5,
				cancelButton : $(dlg+' .'+classCancel),
				initContent: function(){
					$(dlg+' .nano').nanoScroller();
				}
			}).on('open',function(){
				$lists.empty();

				$('body').requestData(urlShared,{"myfilter_type":"2"},{callback:function(data){
					if(data.length >0){
						for(var i=0,len=data.length;i<len;i++){
							var _d = data[i],
							$item = $('<li />')
								.data(_d)
								.appendTo($lists)
								.on('click',_dispKeywords),
							$check = $('<input />')
								.attr('type','checkbox')
								.attr('id','sharedFilter'+i)
								.appendTo($item),
							$label = $('<label />')
								.text(_d.myfilter_name)
								.attr('for','sharedFilter'+i)
								.appendTo($item);

							if(_d.duplicated_cnt > 0){
								$item.addClass('disabled');
								$check.prop('disabled',true)
									.prop('checked',true);
							}
						}
					} else {
						$lists.append('<li class="list-empty">공유된 검색조건이 없습니다</li>');
					}

					slui.attach.setTransforms(dlg);
				}});
			});

			//이벤트 세팅
			$(btnImport).on('click',function(){
				$dlg.jqxWindow('open');
			});
			$(dlg+' .'+classAdd).on('click',_importFilters);
		},
		_dispKeywords = function(){
			$(dlg+' .area-keyword').text($(this).data('keywords'));
		},
		_importFilters = function(){
			var _items = $(dlg+' .area-lists [type=checkbox]:not([disabled]):checked');
			if(_items.size()>0){
				var rqData = [];
				_items.each(function(){
					var _d = $(this).parent().data();
					rqData.push({
						myfilter_id : _d.myfilter_id,
						myfilter_type : _d.myfilter_type,
						myfilter_name : _d.myfilter_name,
						myfilter_desc : _d.myfilter_desc,
						share_yn : "N",
						page_name : _d.page_name
					});
				});
				_importMyfilter(rqData);
			}
		},
		_importMyfilter = function(rqData){
			$('body').requestData(urlImport, rqData, {callback:function(data, rsCd, rsMsg){
				for(var i=0,len=data.length; i<len; i++){
					mDlgMyfilterForm.insertElement(data[i]);
				}
				_eventList();
				_eventSetting();
				_alert(rsMsg, { onAgree : _close });
			}});
		},
		_close = function(){
			$dlg.jqxWindow('close');
		};

		return{
			init : init
		}
	}(),
	
	mDlgMyfilterForm = function() {
		var
		$dlg, $form,
		dlg = '#windowMylistSetting',
		urlUserList = gCONTEXT_PATH + "system/comuser_list_to_select.html",
		
		init = function() {
			$dlg = $(dlg);
			$form = $("form", $dlg);
			
			//설정 창 만들기
			$dlg.jqxWindow({
				width: 640, autoOpen: false,
				isModal: true, modalOpacity: 0.5,
				cancelButton : $(dlg+' .'+classCancel),
				initContent: function(){
					slui.attach.setTransformSelect(dlg);
				}
			}).on('open',function(){
				slui.attach.setTransformSelect(dlg);
				$(this).find(".jqx-window-content").css({height:"initial", overflow:"visible"});
			});

			$("[name=view_fields]", $form).chosen({
				width:"100%",
				search_contains : true,
				placeholder_text_multiple :"[선택하세요]",
				max_selected_options : 50
			});
			$("ul.chosen-choices", $form).sortable({cancel : ".search-field"}).disableSelection();

			// Bind Event
			$(' .'+classAdd, $dlg).on('click', _onClickSave);
			
			$form.on('click', ".btn-mini", function() {
				if($("[name=share_yn]:checked", $form).val() != "Y") return;
				
				var bPlusBtn = $(this).find("i").hasClass("icon-plus");
				var opt = $(this).closest("[data-opt]").attr("data-opt");
				
				if(bPlusBtn) 
					if(opt == "group")
						_addShareGroup();
					else {
						new ModalPopup(urlUserList, { width:900, height:600, draggable:true, onClose : _addShareUser });
					}
				else 
					$("[name=share_" + opt + "_list] option:selected", $form).remove();
			});
			
			$("[name=share_yn]", $form).on("change", _onChangeShare);
		},
		
		_addShareGroup = function() {
			var	val = $("[name=user_group_list]", $form).val();
			var txt = $("[name=user_group_list] :selected", $form).text();

			if(val == "") {
				_alert("기관을 선택하세요.");
				return;
			}
			
			if( $("[name=share_group_list] option", $form).is(
					function() {
						return this.value == val;
					}
			) ) {
				_alert("동일한 기관이 존재합니다.");
				return;
			}
				
			$("[name=share_group_list]", $form).append( new Option(txt, val) );	
		},
		
		_addShareUser = function() {
			var userSelList = slapp.user.listSel.getParam().userDataArr;
			var $shareUserList = $("[name=share_user_list]", $form);
			
			var curUserIds = {};
			
			$shareUserList.each(function() {
				curUserIds[$(this).val()] = $(this).text();
			});
			
			$.each(userSelList, function() {
				if(!curUserIds[this.user_id]) {
					$shareUserList.append(new Option(this.user_nm + " [" + this.user_id + "]", this.user_id));
				}
			});
		},
		
		open = function(id) {
			if(id) {
				$('body').requestData(urlDetail, {myfilter_id : id}, {callback : _setDataToForm});
			}
			else {
				_clearValue();
			}
 
			$dlg.jqxWindow('open');
		},
		
		_clearValue = function() {
			var initData = {
				myfilter_id : "",
				myfilter_name : "",
				myfilter_desc : "",
				view_fields : refDynPaging.getViewFields().join(","),
				share_yn : "N",
				share_group_list : [],
				share_user_list : []
			}
			
			_setDataToForm(initData);
		},
		
		_setDataToForm = function(data) {
			// 현재 보이는 필드로 변경
			var currFields = refDynPaging.getFields().toString();
			if( data.view_fields != currFields){
				data.view_fields = currFields;
				$(".chosen-choices", $form).css("box-shadow","0 0 4px #ff8400");
				$(".chosen-container", $form).parent()
					.attr("data-ui","tooltip")
					.attr("data-text","표시필드가 변경되었습니다");
				slui.attach.tooltip();
			} else {
				$(".chosen-choices", $form).css("box-shadow","");

				$(".chosen-container", $form).parent()
					.attr("data-ui","")
					.attr("data-text","")
					.off('mousemove');
			}

			_SL.setDataToForm(data, $form, {
				view_fields : {
					converter	: function(cvData, $fld) {
						if(cvData) {
							var $fieldSel 	= $("[name=view_fields]", $form);
							var pViewFields = cvData.split(",")
							
							slapp.logsearch.dlgViewField.chkUndefinedField($fieldSel, pViewFields);
							$fieldSel.setSelectionOrder(pViewFields, true);
						}
					}
				},
				share_group_list : {
					converter	: function(cvData, $fld) {
						_SL.appendToSelect(cvData, $fld, "group_id", "group_nm");
					}
				},
				share_user_list : {
					converter	: function(cvData, $fld) {
						_SL.appendToSelect(cvData, $fld, "user_id", "user_nm");
					}
				}
			});
			
			_onChangeShare();
			slui.attach.setTransformSelect(dlg);
		},
		
		_onChangeShare = function() {
			if ( $("[name=share_yn]:checked", $form).val() == "N" ){
				$("[name=user_group_list],[name=share_group_list],[name=share_user_list]", $form)
					.prop("disabled", true)
					.prop("selected", false);
				$(".btn-mini", $form).prop('disabled',true);
				$dlg.find('.tform-select').addClass('disabled');
			}else{			
				$("[name=user_group_list],[name=share_group_list],[name=share_user_list]", $form)
					.prop("disabled", false)
					.prop("selected", true);
				$(".btn-mini", $form).prop('disabled',false);
				$dlg.find('.tform-select').removeClass('disabled');
			}
		},
		
		_onClickSave = function() {
			// validation
			if(!_SL.validate($form)) return;
			
			var viewFields = $("[name=view_fields]", $form).getSelectionOrder(); 
			
			if(viewFields.length == 0) {
				_alert("표시필드를 선택하세요.");
				return;
			}
			
			var rqData = _SL.serializeMap($form);
			rqData.view_fields = viewFields.join(",");
			rqData.keywords = refQuery.getQuery();
			if(rqData.share_yn != 'Y') {
				rqData.share_group_list = rqData.share_user_list = [];
			}
			
			$('body').requestData(rqData.myfilter_id == "" ? urlInsert : urlUpdate, rqData, {
				callback : function(data, rsCd, rsMsg) {
					if(rqData.myfilter_id == "") {
						_insertElement(data);
						_eventList();
						_eventSetting();
					}
					else {
						$(listMysearch).find("[data-id="+data.myfilter_id+"] .text").text(data.myfilter_name);
						$(areaMylabel+' span').text(data.myfilter_name);
					}
					refDynPaging.changeFieldCaption(viewFields);
					_alert(rsMsg, {	onAgree : _close });
				}
			});
		},
		
		_insertElement = function(data){
			$(listMysearch).append($('<li data-id="'+data.myfilter_id+'">'+data.myfilter_name+'<span class="btns"><button type="button" class="'+classSetting+'"><i class="icon-cog"></i></button><button type="button" class="'+classDelete+'"><i class="icon-trash"></i></button></span></li>'));
		},
		
		_close = function() {
			$dlg.jqxWindow('close');
		}
		
		return {
			init : init,
			open : open,
			close : _close,
			insertElement : _insertElement
		};
		
	}();


	return {
		init : init,
		hideLabel : hideLabel
	}
}();

/**
 * date and time
 **/
slapp.logsearch.dnt = function(){
	var option = slapp.logsearch.option,

	btnDnt = '#btnSearchTimes',
	layerDnt = '#layerDateTime',

	classActive = 'active',
	classBtnActive = 'btn-active',
	classParentLayer = 'area-layer-dnt',
	classSpDnt = 'sp-dnt',
	classSpCol = 'sp-col',
	classList = 'lst',
	classBtnDnt = 'btn-dnt',
	classBtnSearch = 'btn-search',

	spPreset = layerDnt+' .sp-preset',
	spDnt = layerDnt+' .'+classSpDnt,
	btnPreset = layerDnt+' .btn-preset',
	btnClose = layerDnt+' .btn-close',
	btnNow = layerDnt+' .btn-now',

	labels = ['from', 'to'],

	userEvent = 'click',

	selectedTime = {},

	init = function(){
		// setSelectedTime
		setSelectedTime('to', slapp.logsearch.searchTime.to);
		setSelectedTime('from', slapp.logsearch.searchTime.from);
		selectedTime.isPreset = slapp.logsearch.searchTime.isPreset;

		//set dnt button
		$(btnDnt)//.text( option.textDefaultTime )
			.on(userEvent,function(){
				$(layerDnt).is(':visible') ? _hideLayer() : _showLayer();
			});
	},
	setSelectedTime = function(pos, num, index){		//console.log('set dnt senected Time!!>>>>>>>★ '+pos+' : '+num+' : '+index);
		if( arguments.length === 2){
			var times = [num.slice(0,4), num.slice(4,6), num.slice(6,8), num.slice(8,10), num.slice(10,12)];

			if(pos === labels[1]){
				selectedTime.to = times;
			} else if(pos === labels[0]){
				selectedTime.from = times;
			}
		} else if(arguments.length === 3){
			if(pos === labels[1]){
				selectedTime.to[index] = num;
			} else if(pos === labels[0]){
				selectedTime.from[index] = num;
			}
		}
	},
	getSelectedTime = function(pos, index){			//console.log('get dnt senected Time!!>>>>>>>☆ '+pos+' : '+index);
		var toTimes = selectedTime.to,
		fromTimes =  selectedTime.from,
		times;

		if(pos === labels[1]){
			times = toTimes;
		} else if(pos === labels[0]){
			times = fromTimes;
		}

		if( arguments.length === 1){
			times = times[0]+times[1]+times[2]+times[3]+times[4];
		} else if( arguments.length === 2){
			times = times[index];
		} else{
			var toTime = toTimes[0]+toTimes[1]+toTimes[2]+toTimes[3]+toTimes[4],
				fromTime = fromTimes[0]+fromTimes[1]+fromTimes[2]+fromTimes[3]+fromTimes[4];
			times = {
				to : toTime,
				from : fromTime
			}
		}

		return times;
	},
	//isPreset = function() {
	//	return selectedTime.isPreset;
	//},
	hideLayer = function(){
		_hideLayer();
	},

	_drawDnt = function($target, type, value, monthValue, yearValue){
		var i = 0, max = 0, idx = 0;

		switch(type){
			case option.dntTypes[0] :
				i = value - option.dntRecentYear +1;
				max = value;
				idx = value;
				break;
			case option.dntTypes[1] :
				i = 1;
				max = 12;
				idx = value;
				break;
			case option.dntTypes[2] :
				i = 1;
				if(yearValue != undefined){
					(yearValue%4)==0 && (yearValue%100)!=0 || (yearValue%400)==0 ? max = 29 : max = 28;
				} else if( (monthValue <= 7 && monthValue%2 == 1 ) || (monthValue >=8 && monthValue%2 == 0) ){
					max = 31;
				} else {
					max = 30;
				}
				idx = value;
				break;
			case option.dntTypes[3] :
				i = 0;
				max = 23;
				idx = value;
				break;
			case option.dntTypes[4] :
				i = 0;
				max = 59;
				idx = value;
				break;
		}

		$target.empty();

		for(; i <= max ; i++){
			var _i = i.toString();
			if(_i.length < 2 ) _i = '0'+_i;

			var $b = $('<button />')
				.attr('type','button')
				.data('value',_i)
				.data('type',type)
				.text(_i)
				.appendTo($target);

			if(_i === idx){
				$b.addClass(classActive);
			}
		}
	},
	_drawDntAllList = function(time, $target){
		var splitTimes = [time.slice(0,4), time.slice(4,6), time.slice(6,8), time.slice(8,10), time.slice(10,12)];

		for(var i=0;i < option.dntTypes.length ;i++){
			if(splitTimes[1] == '02' && i === 2){
				_drawDnt($target.find('.'+classList+':eq('+i+')'), option.dntTypes[i], splitTimes[i], splitTimes[1], splitTimes[0]);
			} else{
				_drawDnt($target.find('.'+classList+':eq('+i+')'), option.dntTypes[i], splitTimes[i], splitTimes[1]);
			}
		}
	},
	_eventInit = function(mode){
		var dntBtn = function(){
			$(spDnt).each(function(index){
				var pos = labels[index];

				$(this).find('button').each(function(){
					$(this).off().on(userEvent,function(){
						var type = option.dntTypes.indexOf($(this).data('type')),
						value = $(this).data('value'),
						diffValue = $(spPreset+' .'+classBtnActive).data('value'),
						setByPreset = function(){
							if( pos === labels[1] && $(spPreset).is(':visible') ){
								var _value = _SL.formatDate.addMin( getSelectedTime('to'), diffValue *-1);
								setSelectedTime('from', _value);
							}
						};

						$(this).siblings().removeClass(classActive);
						$(this).addClass(classActive);

						_setScrollPosition('button', $(this).parents('.nano'));

						setSelectedTime(pos, value, type);

						setByPreset();

						//year , month 일 때 month, day 초기화
						var $parentCol = $(this).parents('.'+classSpCol),
							index = $parentCol.index(),
							$target = $parentCol.next().find('.'+classList);

						if(index === 0){
							var $target2 = $parentCol.next().next().find('.'+classList);

							_drawDnt( $target, option.dntTypes[1], '01');
							_drawDnt( $target2, option.dntTypes[2], '01');
	
							_setScrollPosition('button', $target.parents('.nano'));
							_setScrollPosition('button', $target2.parents('.nano'));

							setSelectedTime(pos, '01', 1);
							setSelectedTime(pos, '01', 2);

							setByPreset();
						} else if(index ===1){
							if(value === '02'){
								var yearValue = getSelectedTime(pos,0);
								_drawDnt( $target, option.dntTypes[2], '01', value, yearValue);
							} else {
								_drawDnt( $target, option.dntTypes[2], '01', value);
							}

							_setScrollPosition('button', $target.parents('.nano'));

							setSelectedTime(pos, '01', 2);

							setByPreset();
						}

						_eventInit('dntBtn');
					});
				});
			});
		};


		if( mode == 'dntBtn'){
			dntBtn();
		} else if(mode == 'scroll'){
			$(layerDnt+' .nano').nanoScroller();
			$(layerDnt+' .nano-content').each(function(){
				slui.event.unitWheel($(this));
			});

			_setScrollPosition();
		} else {
			$(layerDnt+' .nano').nanoScroller();
			$(layerDnt+' .nano-content').each(function(){
				slui.event.unitWheel($(this));
			});

			_setScrollPosition();

			dntBtn();

			$(spPreset+' button').each(function(){
				$(this).off().on(userEvent,function(){
					$(this).addClass(classBtnActive);
					$(this).siblings().removeClass(classBtnActive);

					setSelectedTime('from', _SL.formatDate.addMin( getSelectedTime('to'), $(this).data('value') *-1) );
				});
			});

			$(btnClose).off().on(userEvent,function(){
				_hideLayer();
			});

			$(btnNow).off().on(userEvent,function(){
				var _currTime = slapp.logsearch.manager.getServerTime(),
					$target = $(spDnt).eq(1);

				_drawDntAllList(_currTime, $target);
				_eventInit('dntBtn');
				_setScrollPosition( 'unit', $target );

				setSelectedTime('to',_currTime);

				if(slapp.logsearch.searchTime.isPreset){
					var value = $(spPreset+' button.'+classBtnActive).data('value');
					setSelectedTime('from',_SL.formatDate.addMin(_currTime, value * -1));
				}
			});

			$(btnPreset).off().on(userEvent,function(){		//preset toggle
				if( $(this).hasClass(classBtnActive) ){
					$(this).removeClass(classBtnActive).blur();
					$(spPreset).hide();
					$(spDnt).eq(0).show();

					_eventInit('dntBtn');
					_eventInit('scroll');

					var value='';
					for(var i=0,len=option.dntTypes.length;i<len;i++){
						value += $(spDnt).eq(0).find('.lst:eq('+i+') .active').data('value');
					}
					setSelectedTime('from', value );
					selectedTime.isPreset = false;
				} else {
					$(this).addClass(classBtnActive);
					$(spDnt).eq(0).hide();
					$(spPreset).show();

					_eventInit('scroll');

					var val = $(spPreset).find('.'+classBtnActive).data('value');
					setSelectedTime('from', _SL.formatDate.addMin( getSelectedTime('to'), val *-1) );
					selectedTime.isPreset = true;
				}
			});

			$('body').on(userEvent, _checkAutoClose);
		}
	},
	_removeEvent = function(){
		$(layerDnt+' .nano').nanoScroller({ destroy: true });
		$(btnClose).off(userEvent);
		$(btnNow).off(userEvent);
		$(btnPreset).off(userEvent);
		$('body').off(userEvent, _checkAutoClose);
	},
	_setScrollPosition = function( mode, target ){
		var setPosition = function($target){
			var curr = $target.find('.'+classActive).index() - 2;

			if(curr == -2){
				$target.nanoScroller({ scroll : 'top' });
			} else if( curr == -1){
				var item_h = $target.find('button').outerHeight();
				$target.nanoScroller({ scrollTop : item_h });
			} else {
				var $sc = $target.find('button:eq('+curr+')');
				$target.nanoScroller({ scrollTo : $sc });
			}
		};

		if( mode == 'unit' ){
			target.find('.nano').each(function(){
				setPosition($(this));
			});
		} else if( mode== 'button'){
			setPosition(target);
		} else {
			$(spDnt+' .nano').each(function(){
				setPosition($(this));
			});
		}
	},
	_showLayer = function(){
		$(layerDnt).fadeIn(200);

		_setActive();

		_eventInit();
	},
	_setActive = function(){
		//set from time area
		if(slapp.logsearch.searchTime.isPreset){
			$(btnPreset).addClass(classBtnActive);
			$(spPreset).show();
			$(spDnt).eq(0).hide();
			$(spPreset+' button').removeClass(classActive);
		} else {
			$(btnPreset).removeClass(classBtnActive);
			$(spPreset).hide();
			$(spDnt).eq(0).show();
		}

		var toTime = slapp.logsearch.searchTime.to,
		fromTime = slapp.logsearch.searchTime.from,

		$toTime = $(spDnt).eq(1),
		$fromTime = $(spDnt).eq(0),
		$btnsPresetSelected = $(spPreset).find('[data-value='+option.valueDefaultTime+']');

		_drawDntAllList(toTime, $toTime);
		_drawDntAllList(fromTime, $fromTime);

		$btnsPresetSelected.addClass(classBtnActive);
		$btnsPresetSelected.siblings().removeClass(classBtnActive);
	},
	_hideLayer = function(){
		setSelectedTime('to', slapp.logsearch.searchTime.to);
		setSelectedTime('from', slapp.logsearch.searchTime.from);

		$(layerDnt).fadeOut(200);
		_removeEvent();
	},
	_checkAutoClose = function(){
		if(option.closeDntAuto){
			var e = event,
				isOk = !$(e.target).hasClass(classParentLayer) && !$(e.target).parents().hasClass(classParentLayer)
					&& !$(e.target).hasClass(classBtnDnt) && !$(e.target).parents().hasClass(classBtnDnt)
					&& !$(e.target).hasClass(classBtnSearch) && !$(e.target).parents().hasClass(classBtnSearch)
					&& !$(e.target).parents().hasClass('modal-alert')
					&& !$(e.target).parents().hasClass('pop-items');

			if( isOk === true ){
				_hideLayer();
			}
		}
	};

	return {
		init : init,
		selectedTime : selectedTime,
		getSelectedTime : getSelectedTime,
		setSelectedTime : setSelectedTime,
		//isPreset : isPreset,
		hideLayer : hideLayer
	};
}();


var ListSearchUi = function(){
	this.classActive = 'active';
	this.classHover = 'hover';
	this.classListEmpty = 'list-empty';
	this.classItemTitle = 'item-title'
	this.textEmpty = '검색 결과가 없습니다';
	this.element;
	this.list;
	this.origin;
};
ListSearchUi.prototype = {
	init : function(){
		var s = this;
		$(s.element).off().on('keyup', function(event){
			event.stopPropagation();
			if(event.keyCode === 13 || event.keyCode === 40 || event.keyCode === 38) return false;

			var v = $(this).val().toLowerCase().trim(),
				inst_list = [];

			if(v !==''){
				for(var i=0, len = s.origin.length; i< len ;i++){
					if(s.origin[i].text.indexOf(v) > -1){
						inst_list.push(i);
					}
				}
				s._makeList( inst_list );
			} else {
				s._makeList();
			}
		}).on('keydown',function(event){
			var $active = $(s.list+' .'+s.classActive);

			switch(event.keyCode){
				case 13:		//enter
					if($active.size() < 1) return false;
					$(this).val( $active.text().trim() );
					$active.keydown();
					return false;
					break;
				case 40:		//down
					s._movePosition(0);
					break;
				case 38:		//up
					s._movePosition(1);
					break;
			}
		});
	},

	_makeList : function(_list){
		var s = this;
		$(s.list).siblings().remove();
		$(s.list).show();
		$(s.list+' .'+s.classActive).removeClass(s.classActive);

		if(_list == undefined){
			$(s.list+' li').css('display','');

		} else if(_list != undefined && _list.length > 0){
			$(s.list+' li').hide();

			for(var i=0, len = _list.length;i <len;i++){
				var j = _list[i];
				var $item = $(s.list +' li:not(.'+s.classItemTitle+')').eq(j);
				
				if( !$item.hasClass(s.classItemTitle) ){
					$item.css('display','');
				}
			}
			$(s.list +' li:visible').eq(0).addClass(s.classActive);
		} else {
			$(s.list).hide();
			$(s.list).after('<div class="'+s.classListEmpty+'">'+s.textEmpty+'</div>');
		}
	},

	_movePosition : function(_dir){
		var s = this,
			$li = $(s.list+' li:visible'),
			index = -1,
			max = $li.size();

		for(var i=0, len=max; i<len;i++){
			if($li.eq(i).hasClass(s.classActive)) index = i;
		}

		if(_dir === 0 && index < max-1){
			index ++;
		} else if(_dir === 1 && index > 0){
			index --;
		}
		var $selected = $li.eq(index);
		if($li.eq(index).hasClass(s.classItemtitle)){
			index ++;
			$selected = $li.eq(index);
		}

		$li.removeClass(s.classHover);
		$li.removeClass(s.classActive);

		$selected.addClass(s.classActive);
		$(s.element).val( $selected.text().trim() );

		if($li.parents().hasClass('nano')){
			$li.parents('.nano').nanoScroller({ scrollTo: $li.eq(index) });
		}
	}
};

/**
 * 내 표시필드
 **/
slapp.logsearch.dlgViewField = function() {
	var
	refDynPaging,
	
	dlg				= '#windowViewFields',
	classSave		= ".btn-save",
	classDelete		= ".btn-delete",
	classOk			= ".btn-ok",
	classCancel		= ".btn-cancel",

	defaultViewNamePrefix = "[",
	
	urlList 		= gCONTEXT_PATH + "monitoring/myviewfield_list.json",
	urlInsert 		= gCONTEXT_PATH + "monitoring/myviewfield_insert.do",
	urlUpdate 		= gCONTEXT_PATH + "monitoring/myviewfield_update.do",
	urlDelete 		= gCONTEXT_PATH + "monitoring/myviewfield_delete.do",
	
	$dlg, $form, $viewId, $viewFields,
	
	init = function() {
		refDynPaging	= slapp.logsearch.dynPaging;
		
		$dlg		= $(dlg);
		$form		= $("form", $dlg);
		$viewId		= $("[name=view_id]", $form);
		$viewFields	= $("[name=view_fields]", $form);
		
		//설정 창 만들기
		$dlg.jqxWindow({
			width: 640, height: 150, autoOpen: false,
			resizable: false, isModal: true, modalOpacity: 0.5,
			cancelButton : $(dlg+' '+classCancel),
			initContent: function(){
				slui.attach.setTransformSelect(dlg);
			}
		}).on('open',function(){
			$dlg.find(".jqx-window-content").css({height:"initial", overflow:"visible"});
			slui.attach.setTransformSelect(dlg);
		});
		
		$viewFields.chosen({
			width:"100%",
			search_contains : true,
			placeholder_text_multiple :"[선택하세요]",
			max_selected_options : 50
		});
		$("ul.chosen-choices", $form).sortable({cancel : ".search-field"}).disableSelection();
		
		// Bind Event
		$viewId.on('change', _onChangeViewId);
		$(classSave, $dlg).on('click', _onClickSave);
		$(classDelete, $dlg).on('click', _onClickDelete);
		$(classOk, $dlg).on('click', _onClickOk);
		
		// 표시필드명 대화창 초기화
		mDlgViewName.init(_callbackSave);
	},
	open = function(pViewFields) {
		// 내표시필드 목록 Load
		$viewId
			.empty()
			.append(
				$("<option/>").attr({
					'value'				: "",
					'selected'			: true,
					'data-view-fields'	: pViewFields.join(",")
				})
				.text("새로 등록...")
			);
		
		_chkUndefinedField($viewFields, pViewFields);
		
		$viewFields.setSelectionOrder(pViewFields, true);
		
		$('body').requestData(urlList, {}, {callback : function(data) {
			$.each(data, function(idx, val) {
				$("<option>").attr({
					'value' 			: val.view_id,
					'title' 			: val.view_name,
					'data-view-fields'	: val.view_fields
				})
				.text(val.view_name)
				.appendTo($viewId);
			});
			
			$viewId.trigger("change");
		}});

		$dlg.jqxWindow('open');
	},
	_onChangeViewId = function() {
		var viewId = $viewId.val();
		
		if(viewId != ""){
			var pViewFields = $viewId.find(":selected").attr("data-view-fields").split(",");
			
			_chkUndefinedField($viewFields, pViewFields);
			$viewFields.setSelectionOrder(pViewFields, true);
		}
	},
	_onClickOk = function() {
		var viewFields = $viewFields.getSelectionOrder();
		
		if(viewFields.length == 0) {
			_alert("표시할 필드를 선택하세요.");
			return;
		}
		
		refDynPaging.changeFieldCaption(viewFields);
		
		$dlg.jqxWindow("close");
	},
	_onClickSave = function() {
		var data = {
			view_id		: $viewId.val(),
			view_name	: $viewId.val() == "" ? "" : $viewId.find(":selected").text(),
			view_fields	: $viewFields.getSelectionOrder().join(",")
		};
		
		if(data.view_fields.length == 0) {
			_alert("표시할 필드를 선택하세요.");
			return;
		}
		
		if(data.view_name.indexOf(defaultViewNamePrefix) == 0) {
			_save(data);
		}
		else {
			mDlgViewName.open(data.view_name);
		}
	},
	_onClickDelete = function() {
		var viewId = $viewId.val();
		var viewName = $viewId.find(":selected").text();
		
		if(viewId == "") {
			_alert("삭제할 내 표시필드를 선택하세요.");
			return false;
		}
		else if(viewName.indexOf(defaultViewNamePrefix) == 0) {
			_alert("기본 표시필드는 삭제할 수 없습니다.");
			return false;
		}
//		else if(viewName.indexOf(myFilterViewNamePrefix) == 0) {
//			_alert("내검색조건에서 선택한 필드이므로 삭제할 수 없습니다.");
//			return false;
//		}
		else {
			_confirm("삭제 하시겠습니까?", { onAgree : function(){
				$("body").requestData(urlDelete, { view_id : $viewId.val() }, {callback : function(rsData, rsCd, rsMsg){
					$viewId.find(":selected").remove();
					$viewId.val("");
					_alert(rsMsg);
					slui.attach.setTransformSelect(dlg);
				}});
			} } );
		}
	},
	_callbackSave = function(pViewName) {
		_save({
			view_id		: $viewId.val(),
			view_name	: pViewName,
			view_fields	: $viewFields.getSelectionOrder().join(",")
		});
	},
	
	_chkUndefinedField = function($fieldSel, pViewFields){
		for(var idx in pViewFields){
			if($fieldSel.find("[value="+pViewFields[idx]+"]").length == 0){
				
				if($fieldSel.find("[label=Undefined]").length == 0){
					$fieldSel.append(
						$("<optgroup/>").attr('label','Undefined')
					);
				}
				
				$fieldSel.find("[label=Undefined]").append(
					$("<option/>").attr('value',pViewFields[idx]).text(pViewFields[idx]+"[Undefined]")
				);
			}
		};
	},
	
	_save = function(rqData) {
		$('body').requestData(rqData.view_id == "" ? urlInsert : urlUpdate, rqData, {
			callback : function(rsData, rsCd, rsMsg) {
				if(rqData.view_id == "") {
					$("<option/>").attr({
						'value'				: rsData.view_id,
						'title' 			: rsData.view_name,
						'data-field-value'	: rsData.view_fields,
						'selected' : true
					})
					.text(rsData.view_name)
					.appendTo($viewId);
				}
				else {
					if(rsData.view_name) {
						$viewId.find(":selected").attr({
							'title' : rsData.view_name,
							'data-field-value' : rsData.view_fields
						})
						.text(rsData.view_name);
					}
				}
				_alert(rsMsg);
				refDynPaging.changeFieldCaption(rsData.view_fields.split(","));
				slui.attach.setTransformSelect(dlg);
			}
		});
	},
	_close = function() {
		$dlg.jqxWindow('close');
	},
	
	mDlgViewName = function() {
		var
		dlg = "#windowViewName",
		
		classSave		= ".btn-save",
		classCancel		= ".btn-cancel",
		
		defaultViewNamePrefix = "[",
		
		$dlg, $form, $viewName,
		
		init = function(callback) {
			$dlg		= $(dlg);
			$form		= $("form", $dlg);
			$viewName	= $("[name=view_name]", $form);
			
			$dlg.jqxWindow({
				height: 115, width: 300, autoOpen: false,
				resizable: false, isModal: true, modalOpacity: 0.5,
				cancelButton : $(dlg+' '+classCancel),
				initContent: function(){
					slui.attach.setTransformSelect(dlg);
				}
			});
			
			$(classSave, $dlg).on("click", function(){ _onClickSave(callback); });
		},
		open = function(viewName) {
			$viewName.val(viewName);
			
			$dlg.jqxWindow('open');
		},
		_onClickSave = function(callback) {
			var viewName = $viewName.val();
			
			if(viewName == "") {
				_alert("이름을 입력하세요.");
				return;
			}
			else if(viewName.indexOf(defaultViewNamePrefix) == 0) {
				_alert("'" + defaultViewNamePrefix + "'로 시작되는 이름은 사용할 수 없습니다.");
				return;
			}
			$dlg.jqxWindow('close');
			callback(viewName);
		}
		
		return {
			init : init,
			open : open
		};
	}();
	
	return {
		init : init,
		open : open,
		close : _close,
		chkUndefinedField : _chkUndefinedField
	};
	
}();