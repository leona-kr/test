'use strict';

_SL.nmspc("alarm").histroyList = function(){

	var
	mCfg = {
		urlList : gCONTEXT_PATH + 'monitoring/alarm_history_list.json',
		formId 	: '#searchAlarmHistroyList',
		alarmDivId : '.group-alarm-history',
		infoPageId : '#formInfoPage'
	},
	
	m$ = {
		form 	: $(mCfg.formId),
		alarmDiv : $(mCfg.alarmDivId),
		infoPage : $(mCfg.infoPageId),
		sDay 	: $(mCfg.formId + ' [name=startDay]'),
		sHour 	: $(mCfg.formId + ' [name=startHour]'),
		sMin 	: $(mCfg.formId + ' [name=startMin]'),
		eDay 	: $(mCfg.formId + ' [name=endDay]'),
		eHour 	: $(mCfg.formId + ' [name=endHour]'),
		eMin 	: $(mCfg.formId + ' [name=endMin]')
	},
	mState = {
		totalCnt : 0,
		lastIndex : 0,
		perPage : 0
	},

	init = function() {
		// get perpage
		mState.perPage = parseInt( (screen.height - 100) / 25 * 2 );		// ( 사용자 해상도 - header 여유분 100 ) / 아이템 하나 height * 두배

		drawTree();
		
		bindEvent();
	},

	drawTree = function(){
		var startIndex, perPage,
		callback = function(rsData, rsCd, rsMsg){
			if( isNaN(rsData.totalRow) || !rsData.resultList ) return false;

			if( startIndex === 0) m$.alarmDiv.empty().removeClass('list-empty');

			mState.totalCnt = rsData.totalRow;
			mState.lastIndex += rsData.resultList.length;

			var sTime = m$.sDay.val() + m$.sHour.val() + m$.sMin.val();
			var eTime = m$.eDay.val() + m$.eHour.val() + m$.eMin.val();
			
			var diffTime = _SL.formatDate.diff(sTime, eTime) / (60 * 1000);
			var list = rsData.resultList;
			if(list.length>0){
				var chkDay = list[0].check_day;
				var strHref;
				var $areaDiv;
				var i = 0;
				
				if( $("[data-date="+chkDay+"]").size() > 0){
					$areaDiv = $("[data-date="+chkDay+"]");
				} else {
					$areaDiv = $("<div class='alarms-area'>").attr('data-date', chkDay); // 날짜별 그룹 Area
				}

				while(i < list.length){
					if(!list[i]) break;

					var data = list[i];
					// set message text
					var strTxt = "";

					for(var j=0 ; j < data.grp_cnt; j++){//같은 check_hour(분단위)에 발생한 알람히스토리 데이터를 문자열로 묶어 메세지 Area로 Append시킴
						var innerData = list[i + j];
						if(innerData.info_page != ''){
							
							if(innerData.date_param == 'Y'){
								strHref = innerData.info_page+'?start_time='+innerData.sdt+'&end_time='+innerData.ddt+' target="_blank">';
							}else{
								strHref = innerData.info_page+' target="_blank">';
							}
							
							strTxt += '<a href='+ strHref + innerData.alarm_nm + " " + innerData.alarm_deco+'</a><br>';
						}else{
							strTxt += innerData.alarm_nm + ' ' + innerData.alarm_deco+'<br>';
						}
					}
					
					//Make DOM Start
					if(i == 0 && startIndex == 0){
						m$.alarmDiv.append("<div class='date-label'>"+ _SL.formatDate(chkDay, "yyyyMMdd", "yyyy년 MM월 dd일") +"</div>");//날짜Area Draw
					}
					
					if(chkDay != data.check_day){
						chkDay = data.check_day;
						m$.alarmDiv.append("<div class='date-label'>"+ _SL.formatDate(chkDay, "yyyyMMdd", "yyyy년 MM월 dd일") +"</div>");//날짜Area Draw
						$areaDiv = $("<div class='alarms-area'>").attr("data-date",chkDay);//날짜별 그룹 Area 초기화							
					}
					
					var $messageDiv = $("<div class='message'></div>")	// 메세지 Area
					.append( $("<div class='cnt'><strong>"+ data.grp_cnt +"</strong>건 발생</div>") )	// 건수 Area
					.append( $('<div class="txt">'+ strTxt +'</div>') );	//텍스트 Area

					var $itemDiv = $("<div class='alarm-item'></div>")	 // 시간별 그룹 Area
					.append( $("<div class='time-label'><i class='icon-clock'></i>"+ _SL.formatDate(data.check_hour, "HHmm", "HH:mm") +"</div>") )	 // 시간 Area
					.append($messageDiv)
					.appendTo($areaDiv);			
					
					m$.alarmDiv.append($areaDiv);//날짜별 그룹 Area Draw
					//Make DOM End
					
					i += data.grp_cnt;//다른 check_hour(분단위)에 발생한 알람히스토리 index로 jump
				}
			}else{
				if(startIndex === 0){
					m$.alarmDiv.addClass('list-empty').text('알람이 없습니다');
				}
			}
		};
		var load = function(){
			startIndex = mState.lastIndex;
			perPage = mState.perPage;
			var params = $.extend({startIndex:startIndex, per_page:perPage}, _SL.serializeMap(m$.form));

			$('body').requestData(mCfg.urlList, params, {
				beforeSend : eventPaging.off,
				afterSend : eventPaging.on,
				displayLoader : true,
				callback : callback
			});
		};
		var eventPaging = {
			on : function(){
				$(window).on('scroll',function(){
					if($('header').outerHeight() + $('body > .container').outerHeight() == $(window).scrollTop() + $(window).height()
							&& mState.totalCnt > mState.lastIndex)
						load();
				});
			},
			off : function(){
				$(window).off('scroll', this.on);
			}
		};

		load();
	},
	
	bindEvent = function(){
		m$.form.find('.form-submit').off().on('click',function(){
			
			var sTime = m$.sDay.val() + m$.sHour.val() + m$.sMin.val();
			var eTime = m$.eDay.val() + m$.eHour.val() + m$.eMin.val();
			
			if(sTime > eTime){
				_alert("시작일이 종료일보다 큽니다.");
				return;
			}
			
			if(!_SL.validate(m$.form)) return;

			mState.totalCnt = 0;
			mState.lastIndex = 0;
			drawTree();
		});
		
		m$.form.find('[name=timeSet]').change(function(){
			var setMin = this.value;
			
			if (setMin == 0) {
				return;
			}
			
			var setDateUI = function( $obj, _value ){
				var $select = $obj.siblings('.tform-select');
				$select.find('.tform-select-t').text(_value).end()
					.find('.tform-select-option[data-value='+_value+']').addClass('selected').end();
				$obj.val(_value);
			}

			var startTime = _SL.formatDate.addMin(m$.form.find("[name=endDay]").val() + m$.form.find("[name=endHour]").val() + m$.form.find("[name=endMin]").val(), -setMin);
			setDateUI(m$.form.find("[name=startDay]"),startTime.substring(0,8));
			setDateUI(m$.form.find("[name=startHour]"),startTime.substring(8,10));
			setDateUI(m$.form.find("[name=startMin]"),startTime.substring(10,12));
		});

		
		// Date,Time change 이벤트 설정
		m$.form.find("[name=startDay],[name=startHour],[name=startMin],[name=endDay],[name=endHour],[name=endMin]").change(function(){
			var $obj = m$.form.find("[name=timeSet]"),
				t = $obj.siblings('.tform-select').find('[data-value=0]').text();
			$obj.val(0)
				.siblings('.tform-select').find('.tform-select-t').text(t);
		});
	};
	
	return {
		init : init
	};

}();

$(function(){
	slapp.alarm.histroyList.init();
});