//# sourceURL=log_search-facet_chart.js
'use strict';

_SL.nmspc("logsearch").facetChart = function(){
	var
	// Reference Modules
	refMng,
	refDynPaging,
	refQuery,

	URL_PATH = gCONTEXT_PATH + "monitoring/",
	
	mCfg = {
		// DOM ID
		DOM : {
			chart		: "#facetChartWrapper",
			btn		: "button[data-toggle-target='#facetChartWrapper']",
			layer		: "#facetTotalList"
		},
		
		URL : {
			list			: URL_PATH + "log_search_list.json",
			totalList	: URL_PATH + "facet_list.json",
			logSearch	: URL_PATH + "log_search.html"
		},
		
		cookie : {
			isShowChartYN : "isShowfChartYN",
			facet : "sl_fa"
		},
		
		chartStyle : {
			//"animation": "0",
			"formatnumberscale": "0",
			"baseFontSize": "9",
			"bgColor": "#ffffff",
			"legendPosition" : "right",
			"legendScrollBgColor": "#cccccc",
			"legendScrollBarColor": "#999999",
			"legendItemFontColor": "#000000",
			"legendItemHoverFontColor": "#777777",
			"showLegend": "1",
			"showPercentInToolTip": "1"
		},

		chartHeight : 200,

		html : {
			empty : '<div class="area-empty" style="height:224px;padding-top:102px;">테이블 타이틀을 drag&drop하여 필드를 추가할 수 있습니다.</div>',
			guide : '<div class="area-empty" style="height:200px;padding-top:80px;">검색버튼 <span class="icon-zoom"></span> 클릭시 선택한 facet 정보를 볼 수 있습니다.</div>',
			stateExcess : '<div class="item-state item-deny"><div><span class="icon-times-circle"></span> 5개까지 추가 가능합니다</div></div>',
			stateOverlap : '<div class="item-state item-deny"><div><span class="icon-times-circle"></span> 중복된 필드가 있습니다</div></div>',
			stateOk : '<div class="item-state item-add"><div><span class="icon-plus-circle"></span> 추가</div></div>'
		}
	},
	
	m$ = {
		chart : null,
		charOnoffBtn : null,
	},

	mState = {
		facetFields : [],
		facetDatas : {},
		oChart	: null,
		isShowInit : false,
		fieldsMap : gFieldCaptions
		//rowsPerTime : null,
	},

	/*** Define Function ***/
	init = function() {
		refMng			= slapp.logsearch.manager;
		refDynPaging	= slapp.logsearch.dynPaging;
		refQuery			= slapp.logsearch.query;

		m$.chart 				= $(mCfg.DOM.chart);
		m$.charOnoffBtn	= $(mCfg.DOM.btn);
		m$.totalLayer			= $(mCfg.DOM.layer);

		mState.facetFields = $.cookie(mCfg.cookie.facet) ? $.cookie(mCfg.cookie.facet).split(',') : [];
		mState.isShowInit = $.cookie(mCfg.cookie.isShowChartYN) ? $.cookie(mCfg.cookie.isShowChartYN) : mState.isShowChart;

		$.cookie(mCfg.cookie.isShowChartYN, String( mState.isShowInit ) , {expires:30});			//접속할 때마다 쿠키 유효기간 갱신

		show(mState.isShowInit);

		m$.charOnoffBtn.on('click',function(){
			var status = String( m$.chart.is(':visible') );
			mState.isShowChart = status;
			$.cookie(mCfg.cookie.isShowChartYN, status , {expires:30});
		});
	},

	setDataCookies = function(){
		$.cookie(mCfg.cookie.facet, mState.facetFields.join(), {expires:30});
	},
	
	show = function(bShow) {
		if(bShow=='true'){
			m$.chart.show();
			m$.charOnoffBtn.removeClass('btn-inactive');
		} else {
			m$.chart.hide();
			m$.charOnoffBtn.addClass('btn-inactive');
		}
	},

	update = function(){
		var fieldsMap = mState.fieldsMap;
		var fields = mState.facetFields;
		var datas = mState.facetDatas;

		var items = function(){
			mCfg.chartStyle = $.extend({}, slui.chart.chartConfig, mCfg.chartStyle);
			if(fields.length > 2){
				mCfg.chartStyle.showLegend = "0";
			} else {
				mCfg.chartStyle.showLegend = "1";
			}

			for(var i=0, len=fields.length;i<len;i++){

				var field = fields[i];
				var fieldText = fieldsMap[field] ? fieldsMap[field] : field;
				var uid = _SL.getSHORT_UID();

				var
				$container = $('<div />')
					.addClass('item-chart')
					.attr('data-field',field)
					.attr('data-id',uid)
					.appendTo(m$.chart),
				$chartTitle = $('<div />')
					.addClass('chart-caption')
					.appendTo($container),
				$chartContainer = $('<div />')
					.addClass('chart-container')
					.height(mCfg.chartHeight+'px')
					.attr('id','facetChart'+i)
					.appendTo($container),
				$btnClose = $('<button />')
					.attr('type','button')
					.addClass('icon-times')
					.appendTo($container);

				if(mState.facetDatas){
					$chartTitle.append( $('<a />').addClass('chart-caption-link').attr('href','#').text( fieldText+'('+_SL.toComma(mState.facetDatas[field].rows)+')' ) )
						.data('rows',mState.facetDatas[field].rows);
					renderChart(i, field);
				} else {
					$chartTitle.text( fieldText+'(-)' );
					$chartContainer.append( $(mCfg.html.guide) );
				}
			}

			eventUI();
		};
		var renderChart = function(_i, field){
			var _data = getChartData(field);
			var uid = _SL.getSHORT_UID();

			$('.item-chart').eq(_i).attr('data-id',uid);

			FusionCharts.ready(function(){
				new FusionCharts({
					id: 'facetChartItem'+uid+_i,
					type: 'pie3d',
					renderAt: 'facetChart'+_i,
					width: '100%',
					height: mCfg.chartHeight,
					dataFormat: 'json',
					dataSource: {
						"chart": mCfg.chartStyle,
						"data": _data
					}
				}).render();
			});
		};

		// reset
		for (var item in FusionCharts.items) {
			if(item === 'mainTimelineChart') continue;
			FusionCharts.items[item].dispose();
			delete FusionCharts.items[item];
		}
		m$.chart.empty();

		// render html
		if(fields.length > 0){	
			items();
		} else {
			m$.chart.html( $(mCfg.html.empty) );
			eventDroppable();
		}
	},
	getChartData = function(fieldName){
		var d = mState.facetDatas[ fieldName ].datas;
		var _link ='';

		for(var i=0;i<d.length;i++){
			if(d[i].value) continue;
			d[i].value = String(d[i].count);

			var labelCode = d[i].label;

			// 공통코드 표시
			if(gFldToCodes[fieldName] && gFldToCodes[fieldName][d[i].label]) {
				d[i].label = '['+d[i].label+'] '+gFldToCodes[fieldName][d[i].label];
			}

			_link ='javascript:slapp.logsearch.query.addKeyword("'+fieldName+'","'+labelCode+'")';
			if(d[i].label == '-') _link ='javascript:slapp.logsearch.query.addKeyword("'+fieldName+'","*","NOT")';

			d[i].link = _link;

			delete d[i].count;
		}
		return d;
	},

	_showLayer = function(){
		m$.totalLayer.show();
		$('html, body').on('mousedown', _checkLayerClose);

		// prevent window mousewheel
		slui.event.unitWheel( m$.totalLayer.find('.modal-body') );
	},

	_hideLayer = function(){
		m$.totalLayer.hide();
		$('html, body').off('mousedown', _checkLayerClose);
	},

	_checkLayerClose = function(event){
		var isOk = !$(event.target).parents().hasClass('page-config-area')
				&& event.target.id != 'facetTotalList'
				&& !$(event.target).hasClass('chart-caption-link')
				&& !$(event.target).parents().hasClass('modal-alert');

		if( isOk === true ){
			_hideLayer();
		}
	},

	eventUI = function(){
		eventDroppable();
		eventDelete();
		eventTotal();

	},

	eventTotal = function(){
		var
		$layerBody,
		_load = function($element){
			var _field = $element.attr('data-field');
			if(!mState.facetDatas[_field].rows) return;

			var _index = mState.facetFields.indexOf(_field);
			var totalRows = mState.facetDatas[_field].rows;
			var perPage = 50;		//default size
			if(totalRows < perPage) perPage = 0;

			var _idx = 0, _total =0, _cnt = 1,
			rqData = {
				idx: _idx,
				per_page: perPage,
				proc_idx: refDynPaging.getProcIdx(),
				field: _field
			},
			_loadList = function(rsData){
				var d = rsData.resultList;
				_total = rsData.totalRow;

				if(_idx === 0){
					//$(mCfg.DOM.layer+' h4').text( mState.fieldsMap[_field]+'('+_SL.toComma(rsData.totalRow)+')' );
					$(mCfg.DOM.layer+' h4').text( '전체목록' );

					var
					fieldText = mState.fieldsMap[_field] ? mState.fieldsMap[_field] : _field,
					$table = $('<table />')
						.addClass('board-table-group')
						.appendTo( $layerBody.off('scroll').empty().scrollTop(0) ),
					$thead = $('<thead />')
						.append(
							$('<tr />').append('<th scope="col" width="10%">순위</th>')
								.append('<th scope="col">'+fieldText+'</th>')
								.append('<th scope="col" width="16%">건수</th>')
								.append('<th scope="col" width="16%">비율</th>')
						)
						.appendTo($table),
					$tbody = $('<tbody />')
						.appendTo($table);

					if(!d.length || d.length == null || d.length == 0){
						$tbody.append('<tr><td colspan="3" class="list-empty">결과가 없습니다.</td></tr>');
						return;
					}
				}else{
					var $tbody = $layerBody.find('table tbody');
				}

				for(var i=0,len=d.length; i<len;i++){
					if(!d[i]) break;

					var labelText = d[i].label;
					// 공통코드 표시
					if(gFldToCodes[_field] && gFldToCodes[_field][d[i].label]) {
						labelText = '['+d[i].label+'] '+gFldToCodes[_field][d[i].label];
					}

					var $tr = $('<tr />')
						.append( $('<td />').addClass('no').text(_cnt) )
						.append( $('<td />').append( 
								$('<a />')
									.attr('href','#')
									.text(labelText)
									.data('label',d[i].label)
									.data('field',_field)
							)
						)
						.append( $('<td />').addClass('cnt').text(_SL.toComma(d[i].count)) )
						.append( $('<td />').addClass('cnt').text( (d[i].count/refDynPaging.getTotal() * 100).toFixed(2) + '%') )
						.appendTo($tbody);

					_cnt++;

					$tr.find('a').on('click',function(event){
						event.preventDefault();
						openSearch( $(this).data('field'), $(this).data('label') );
					});
				}

				if(perPage!=0) $layerBody.off('scroll').on('scroll',_eventPaging);
			},
			_eventPaging = function(){
				if( (_idx+1) == Math.ceil(_total/perPage) ) return;

				if( $layerBody.find('table').height() == $(this).scrollTop() + $layerBody.height() ){
					$layerBody.off('scroll');
					_idx ++;
					rqData = {
						idx: _idx,
						per_page: perPage,
						proc_idx: refDynPaging.getProcIdx(),
						field: _field
					};
					$layerBody.requestData( mCfg.URL.totalList, rqData, { callback : _loadList, displayLoader: true } );
				}
			};

			// set layer html template
			if( document.getElementById('facetTotalList') ){
				$layerBody = m$.totalLayer.find('.modal-body').empty(); 
			} else {
				m$.totalLayer = $('<div id="facetTotalList" style="display:none;" />')
					.addClass('page-config-area')
					.append('<div class="modal-head"><div class="section-title"><h4></h4></div></div>')
					.appendTo($('body'));
				
				$layerBody = $('<div class="modal-body"></div>')
					.appendTo(m$.totalLayer);
			}

			// load data and draw
			$layerBody.requestData( mCfg.URL.totalList, rqData, { callback : _loadList, displayLoader: true } );

			// set layer position
			if( $(window).width() - $element.offset().left > m$.totalLayer.width()){
				m$.totalLayer
					.addClass('pos-left')
					.css({
						'left': $element.offset().left +'px',
						'top': $element.offset().top +'px',
						'margin-left': ''
					});
			} else {
				m$.totalLayer
					.removeClass('pos-left')
					.css({
						'left': $element.offset().left - m$.totalLayer.width() +'px',
						'top': $element.offset().top +'px',
						'margin-left': '70px'
					});
			}
			_showLayer();
		};

		m$.chart.find('.chart-caption a')
			.each(function(_index){
				$(this).on('click',function(event) {
					event.preventDefault();
					_load( $(this).parents('.item-chart') );
				});
			});
	},
	eventDelete = function(){
		m$.chart.find('.icon-times').each(function(){
			$(this).on('click',function(){
				var fields = mState.facetFields;

				var $itemWrapper = $(this).parents('.item-chart');
				var _id = $itemWrapper.attr('data-id');
				var _field = $itemWrapper.attr('data-field');

				for(var i=0, len=fields.length;i<len;i++){
					if(fields[i] === _field)
						fields.splice(i,1);
				}
				mState.facetFields = fields;
				setDataCookies();

				if(_id){
					//FusionCharts.items[_id].dispose();
					delete FusionCharts.items[_id];
				}

				$itemWrapper.remove();

				if(m$.chart.find('.item-chart, .area-empty').size() == 0){
					m$.chart.append( $(mCfg.html.empty) );
				}
			});
		});
	},
	eventDroppable = function(){
		m$.chart.droppable({
			accept : ".slui-draggable",
			scope : "dropField",
			//activeClass: "ui-state-hover",
			hoverClass: "drop-active",
			activate: function(event,ui){
				var field = ui.helper.data("field_name");

				if( mState.facetFields.length > 4){
					m$.chart.append( $(mCfg.html.stateExcess) );
				} else if(mState.facetFields.indexOf(field) != -1){
					m$.chart.append( $(mCfg.html.stateOverlap) );
				} else {
					m$.chart.append( $(mCfg.html.stateOk) );
				}
			},
			deactivate: function(event,ui){
				m$.chart.find('.item-state').remove();
			},
			drop: function( event, ui ) {
				$('.area-log-body th .icon-file.icon-stats').remove();

				var field = ui.helper.data("field_name");
				var text = mState.fieldsMap[field] ? mState.fieldsMap[field] : field;

				// check valid
				if( mState.facetFields.length > 4 || mState.facetFields.indexOf(field) != -1) return;

				//set data
				mState.facetFields.push( field );
				setDataCookies();

				//draw ui
				var emptyElement ='<div class="item-chart" data-field="'+field+'">'
					+ '<div class="chart-caption">'+text+'</div>'
					+ '<div class="chart-container" style="height:'+mCfg.chartHeight+'px;">'+mCfg.html.guide+'</div>'
					+ '<button type="button" class="icon-times"></button>'
					+ '</div>';

				m$.chart.append(emptyElement);
				$(mCfg.DOM.chart+' > .area-empty').remove();

				eventDelete();
			}
		});
	},
	openSearch = function(_field, _label){
		var query = refQuery.getQuery();

		if(_field != ""){
			if(query != "") query = "(" + query + ")";

			if (query != "") query += " AND ";
			
			if(_label == "-")
				query += "NOT " + _field + ":*";
			else
				query += _field + ":" + _SL.luceneValueEscape(_label);
		}

		$("<form>")
			.attr({
				target : "logSearchWin_" + (new Date()).getTime(),
				action : mCfg.URL.logSearch,
				method : "post"
			})
			.append( $("<input type='hidden' name='start_time'>").val( refDynPaging.getStartTime() ) )
			.append( $("<input type='hidden' name='end_time'>").val( refDynPaging.getEndTime() ) )
			.append( $("<input type='hidden' name='expert_keyword'>").val(query) )
			.append( $("<input type='hidden' name='template_id'>").val('popup') )
			.appendTo( $("body") )
			.submit()
			.remove();
	},

	DUMMY = null;

	return {
		init : init,
		update : update,
		show : show,
		getFacetFields : function(){
			return mState.facetFields
		},
		setFacetDatas : function(data){
			return mState.facetDatas = data;
		}
	};
}();
