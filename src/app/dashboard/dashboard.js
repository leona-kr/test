//# sourceURL=dashboard.js

(function($){
	'use strict';
	
	$.Dashboard = {
		componentInstance : {},
		chartInstance : {},
		url : {
			dashboard_list : '/dashboard/dashboard_list.json',							//대시보드 전체 목록 조회
			dashboard_tab_update : '/dashboard/dashboard_tab_update.do',		//탭 목록 수정
			dashboard_seq_update : '/dashboard/dashboard_seq_update.do',		//대시보드 전체 목록 변경
			dashboard_detail : '/dashboard/dashboard_detail.json',					//개별 대시보드 설정값 조회
			dashboard_insert : '/dashboard/dashboard_insert.do',						//대시보드 생성
			dashboard_update : '/dashboard/dashboard_update.do',					//대시보드 변경
			dashboard_delete : '/dashboard/dashboard_delete.do',					//대시보드 삭제

			component_layout_update : '/dashboard/component_layout_update.do',	//레이아웃 변경
			component_list : '/dashboard/component_list.json',						//컴포넌트 목록 조회
			component_insert : '/dashboard/component_insert.do',					//컴포넌트 생성
			component_update : '/dashboard/component_update.do',				//컴포넌트 설정 변경
			component_delete : '/dashboard/component_delete.do',					//컴포넌트 삭제

			share_list : '/dashboard/dashboard_share_list.json',					//공유 대시보드 목록 조회

			user_list  : '/common/user_list.json',									//사용자 전체 조회 / 키워드 조회 : {"keyword":"이"} / 페이징 조회 : {"recordstartindex":0, "pagesize":100} 

			report_list : '/jws/dashboard_report.do',
			
			load : '../component/load.do'
		},
		classname : {
			groupTab : 'group-tab',
			groupTabs : 'group-tabs',
			groupSide : 'group-side',
			board : 'group-board',
			btns : 'group-topbutton',
			btnLink : 'btn-tab',
			btnDelete : 'btn-del',
			btnEdit : 'btn-edit',
			btnSave : 'btn-save',
			btnToggle : 'btn-toggle',
			btnPrev : 'btn-prev',
			btnNext : 'btn-next',
			btnAdd : 'btn-add',
			btnCancel : 'btn-cancel',
			btnNew : 'btn-new',
			iconEdit : 'icon-pencil',
			iconRemove : 'icon-trash',
			iconSave : 'icon-disk',
			iconCancel : 'icon-times-circle',
			iconClose : 'icon-times',
			iconLeft : 'icon-chevron-left',
			iconRight : 'icon-chevron-right',
			active : 'active',
			disabled : 'disabled',
			open : 'open',
			selected : 'selected',
			grid : "grid-bg",
			linecol : "line-col",
			linerow : "line-row",
			lineguide : "line-guide",
			title : 'area-title',
			areaTime : 'area-time',
			componentHead : "area-header",
			componentHeadsub : "area-header-side",
			componentClose : "btn-close",
			componentSetting : "btn-edit",
			componentBody : "area-body",
			componentInner : "inner-body",
			componentHover : "item-hover",
			modalAdd : "dashboard-add",
			emptyBoard : "empty-board"
		},
		msg : {
			empty : '생성된 대시보드가 없습니다.<br>대시보드를 생성해주세요',
			deleteDashboard : '대시보드를 삭제 하시겠습니까?',
			notAllowDelete : '한 개 이하의 대시보드는 삭제할 수 없습니다.',
			failComponent: '컴포넌트 추가에 실패하였습니다',
			inputInsertName : '추가하실 대시보드 이름을 입력해주세요',
			inputChangeName : '변경할 이름을 입력해 주세요',
			guideAddComponent : '<i class="icon-arrow2-up"></i>버튼을 클릭하여 컴포넌트를 추가하세요'
		},
		optionsDefault : {
			grid_yn : 'N',
			guide_yn : 'Y',
			grid_col : 2,
			margin: 5,
			rowHeight : 30
		},
		updateMonitoringTime : function(){
			this.refreshCount++;
			if(this.refreshCount == 6 * 24 * 10) window.location.reload();		//1주일

			this.monitoringTime = _SL.formatDate.addSec(new Date(), gTimeDiffFromServer, "yyyyMMddHHmmss");
			$('.'+this.classname.groupSide+' .'+this.classname.areaTime).text(this.getMonitoringTime("yyyy-MM-dd HH:mm:ss"));
		},
		getMonitoringTime : function(pattern) {	
			return _SL.formatDate(this.monitoringTime, "yyyyMMddHHmmss", pattern);
		},
		GRIDSTER : {},
		dashboardName : '',
		refreshTimer:{},
		refreshCount : 0,

		dashboardInsert : function(){
			var d = this,
			$btnAdd = $(".group-side .btn-new"),
			$layer = $('.'+d.classname.modalAdd),
			_autoCloseBoardadd = function(event){
				var $target = $(event.target);
				if(!$target.parents().hasClass(d.classname.modalAdd)
						&& !$target.hasClass(d.classname.modalAdd)
						&& !$target.parents().hasClass('modal-alert') ){
					_closeLayer();
				}
			},
			_openLayer = function(){
				$btnAdd.addClass(d.classname.active);
				$layer.find('input').val('');
				$layer.fadeIn(200,function(){
					$(document).on('mousedown',_autoCloseBoardadd);
				});
			},
			_closeLayer = function(){
				$btnAdd.removeClass(d.classname.active);
				$layer.fadeOut(200,function(){
					$(document).off('mousedown',_autoCloseBoardadd);
				});
			},
			_toggleDisp = function(){
				var _classActive = 'tab-item-active';

				$layer.find('.cont > div:eq(0)').css('display','block')
				.end()
				.find('.cont > div:eq(1)').css('display','none')
				.end()
				.find('.tab-group li').each(function(i){
					if(i===0){
						$(this).addClass(_classActive);
					}else if(i===1){
						$(this).removeClass(_classActive);
					}
					$(this).on('click',function(){
						$(this).addClass(_classActive).siblings().removeClass(_classActive);;
						$layer.find('.cont > div').eq(i).css({'height':'28px','display':'block'}).siblings().css('display','none');
						globalui.attach.setTransformSelect('.'+d.classname.modalAdd);
					});
				});

				$btnAdd.on('click',function(){
					if($layer.is(':hidden')){
						_openLayer();
					} else{
						_closeLayer();
					}
				});
			},
			_eventInsert = function(){
				var newname = '', rqData = {},
				isSaving = false,
				callback = function(data){
					_closeLayer();
					d.dashboardName = newname;
					d.dashboardlist(data,newname);
					d.dashboardConfig(true);
					isSaving = false;
				},
				eventsave = function(){
					isSaving = true;
					if( $layer.find('.cont > div:eq(1)').is(':visible') ){
						if( $layer.find('.cont > div:eq(1) option:selected').val() === '-1') return false;

						newname = $layer.find('.cont > div:eq(1) option:selected').text();
						rqData = {
							dashboard_id : $layer.find('.cont > div:eq(1) select').val(),
							dashboard_name : $layer.find('.cont > div:eq(1) option:selected').text()
						}
						$('body').requestData(d.url.dashboard_insert, rqData, {callback:callback});
					}else{
						newname = $layer.find('.cont > div:eq(0) input').val().trim();
						if(newname==''){
							_alert(d.msg.inputInsertName,{
								onAgree : function(){
									$layer.find('.cont > div:eq(0) input').focus();
								}
							});
							return false;
						} else {
							rqData = {
								dashboard_name : $layer.find('.cont > div:eq(0) input').val()
							}
							$('body').requestData(d.url.dashboard_insert, rqData, {callback:callback});
						}
					}
				}

				$layer.find('.button button').on('click',eventsave);
				$layer.find('input[type=text]').on('keyup',function(event){
					if(event.keyCode === 13){
						if(!isSaving) eventsave();
					}else if(event.keyCode === 27){
						_closeLayer();
					}
				});
			},
			_loadList = function(){
				var callback = function(data){
					var $select = $layer.find('select')
					.empty()
					.append('<option value="-1">선택하세요</option>');

					for(var i=0,len=data.length;i<len;i++){
						$select.append('<option value="'+data[i].dashboard_id+'">'+data[i].dashboard_name+'</option>');
					}

					_eventInsert();
				}
				$('body').requestData(d.url.share_list,{},{callback:callback});
			};

			_loadList();
			_toggleDisp();
		},

		dashboardDelete : function(id, callback){
			var d = this, isOk = true;
			if($('.'+d.classname.groupTabs+' li').size() === 1 && $('.'+d.classname.groupTab+' li[data-id='+id+']').size() === 1
				|| $('.'+d.classname.groupTab+' li').size() === 1 && $('.'+d.classname.groupTab+' li[data-id='+id+']').size() === 1){

				isOk = false;
				_alert(d.msg.notAllowDelete);
			}

			if(isOk){
				var msgCxt = "<strong>["+ $("."+d.classname.groupTabs+" [data-id="+id+"]").text() +"]</strong> "+d.msg.deleteDashboard;
				_confirm(msgCxt,{
					onAgree : function(){
						$('body').requestData(d.url.dashboard_delete,{dashboard_id:id},{callback:function(){
							$('.'+d.classname.groupTabs+' li[data-id='+id+']').remove();
							d.dashboardlistUpdate();
							if(callback != undefined){
								callback();
							}

							$('.'+d.classname.groupTab+' li[data-id='+id+']').remove().promise().done(function(){
								if( $('.'+d.classname.groupTab+' li.'+d.classname.active).size()<1 ){
									$('.'+d.classname.groupTab+' li:eq(0) .'+d.classname.btnTab).trigger('click');
								}
							});
						}});
					}
				});
			}
		},

		dashboardlist : function(_data, _newname){
			var d = this,
			toparray =[],
			allarray = [],
			$listcontent = $('.'+d.classname.groupTab+' ul'),
			data = _data,
			autoCloseTab = function(event){
				var $target = $(event.target);
				if(!$target.parents().hasClass(d.classname.groupTabs) 
						&& !$target.hasClass(d.classname.groupTab) 
						&& !$target.parents().hasClass(d.classname.groupTab)
						&& !$target.parents().hasClass(d.classname.btns)
						&& !$target.parents().hasClass('modal-alert') ){
					_closeAll();
				}
			},

			_init = function(){
				//전체 탭 랜더
				for(var i=0, len=data.length; i<len;i++){
					allarray.push({
						key : data[i].dashboard_seq,
						value : data[i]
					})
				}
				allarray = _sortByKey(allarray);
				_drawAll();

				//상단 탭 랜더
				for(var i=0, len=data.length; i<len; i++){
					if( data[i].tab_yn == 'Y' ){
						toparray.push( data[i] );
					}
				}
				var sortarray = [];
				for(var i=0, len=toparray.length; i<len;i++){
					sortarray.push({
						key : toparray[i].tab_seq,
						value : toparray[i]
					})
				}
				toparray = _sortByKey(sortarray);
				_drawTab();

				//대시보드 컨텐츠 콜백
				if(toparray.length > 0){
					var selectedTab = toparray[0].dashboard_id;
				} else {
					var selectedTab = allarray[0].dashboard_id;
				}
				_loadContent( selectedTab );

				//전체보기 탭 토글 이벤트
				$listcontent.parent().siblings('.'+d.classname.btns).find("."+d.classname.btnToggle).off('mousedown').on("mousedown",_openAll);
			},
			_loadContent = function(dashboard_id, isUpdate){
				//화면 및 데이터 초기화
				if( $('.window.dashboardsetting').is(':visible') && d.dashboard_id != dashboard_id){
					$('.window.dashboardsetting').hide();
				}

				d.chartInstance = {};
				d.componentInstance = {};

				$('body').requestData(d.url.dashboard_detail , {dashboard_id: dashboard_id},
					{callback : function(data){
						d.dashboard_id = dashboard_id;
						d.option = $.extend({}, d.optionsDefault, {
							share_yn : data.share_yn,
							user_list : data.user_list,
							group_list : data.group_list,
							grid_yn : data.grid_yn,
							grid_col : data.grid_col,
							theme : isNaN(parseInt(data.dashboard_theme))? 0 : parseInt(data.dashboard_theme),
							animate_yn : (data.animate_yn != '') ? data.animate_yn : 0
						});

						// set dashboard theme
						_setThemeStyle();

						// set dashboard contents
						d.dashboardContent( data.component_list );

						//set config ui
						d.dashboardConfig(isUpdate);
					}
				});
			},
			_setThemeStyle = function(){
				var val = d.option.theme == '' ? 'basic' : d.option.theme;
				$('#themeStyle').remove();
				if(val===1){
					$('#dashboardStyle').after('<link rel="stylesheet" href="/resources/css/theme-blue.css" id="themeStyle">');
				} else if(val ===2){
					$('#dashboardStyle').after('<link rel="stylesheet" href="/resources/css/theme-dark.css" id="themeStyle">');
				}
			},
			_sortByKey = function(array){
				array.sort(function(a,b){
					return (a.key < b.key) ? -1 : (a.key > b.key) ? 1 : 0;
				});
				var a = [];
				for(var i=0;i<array.length;i++){
					a.push( array[i].value );
				}
				return a;
			},
			_drawTab = function(_newname){
				var arr = toparray,
				active = 0;

				if(arguments.length === 0){
					$listcontent.empty();
					for(var i=0, len=arr.length;i<len ;i++){
						var $li = $('<li />')
							.attr('data-id',arr[i].dashboard_id)
							.appendTo( $listcontent ),
						$link = $('<span />')
							.addClass(d.classname.btnLink)
							.text(arr[i].dashboard_name)
							.appendTo($li),
						$del = $('<span />')
							.addClass(d.classname.btnDelete)
							.html('<i class="'+d.classname.iconClose+'"></i>')
							.appendTo($li);
	
						if(i === active) {
							$li.addClass(d.classname.active);
							d.dashboardName = arr[i].dashboard_name;
						}
					}
				} else {
					$listcontent.find('.'+d.classname.active).removeClass(d.classname.active);

					var inTab = '<li data-id="'+_data.dashboard_id+'" class="'+d.classname.active+'"><span class="'+d.classname.btnLink+'">'+_newname+'</span><span class="'+d.classname.btnDelete+'"><i class="'+d.classname.iconClose+'"></i></span></li>';
					$listcontent.prepend(inTab);
					d.dashboardlistUpdate(true);

					_loadContent(_data.dashboard_id, true);
				}
				_eventTab();

				d.dashboardlistArrow();
			},
			_eventTab = function(){
				var checkIntime;

				$listcontent.sortable({
					placeholder: "sortable-placeholder",
					axis: "x",
					stop : function(){
						d.dashboardlistUpdate(true);
					},
					disabled: true
				});

				$listcontent.find('.'+d.classname.btnLink).off('mouseenter').on('mouseenter',function(){
					checkIntime = setTimeout(function(){
						$listcontent.sortable('enable');
					},200);
				}).on('mouseleave',function(){
					clearTimeout(checkIntime);
					$listcontent.sortable('disable');
				}).on('click',function(event){
					
					var $li = $(this).parents('li');

					if(!event.isTrigger){
						clearTimeout(checkIntime);
	
						_loadContent($li.attr('data-id'), true);
	
						$li.addClass(d.classname.active)
							.siblings().removeClass(d.classname.active);
	
						d.dashboardName = $(this).text();
						d.dashboardlistArrow();
					} else {
						$li.addClass(d.classname.active);
						_loadContent($li.attr('data-id'), true);
					}
				})
				.end()
				.find('.'+d.classname.btnDelete).off('mousedown').on('mousedown',function(){
					if( $('.'+d.classname.groupTab+' li').size() < 2 || $(this).parent().hasClass(d.classname.active) ) return false;
					var $li = $(this).parents('li');
					$li.remove();
					$('.'+d.classname.groupTabs+' [data-id='+$li.attr('data-id')+']').removeClass(d.classname.disabled);

					d.dashboardlistUpdate(true);
					d.dashboardlistArrow();
				});
			},
			_drawAll = function(_newname){
				var getHtml = function(_name){
					var innerHtml = '<div class="tab-default">';
					innerHtml += '<span class="'+d.classname.btnLink+'">'+_name+'</span>';
					innerHtml += '<button type="button" class="'+d.classname.btnEdit+'"><i class="'+d.classname.iconEdit+'"></i></button>';
					innerHtml += '<button type="button" class="'+d.classname.btnDelete+'"><i class="'+d.classname.iconRemove+'"></i></button>';
					innerHtml += '</div>';
					innerHtml += '<div class="tab-edit">';
					innerHtml += '<input type="text" size="5">';
					innerHtml += '<button type="button" class="'+d.classname.btnSave+'"><i class="'+d.classname.iconSave+'"></i></button>';
					innerHtml += '<button type="button" class="'+d.classname.btnCancel+'"><i class="'+d.classname.iconCancel+'"></i></button>';
					innerHtml += '</div>';

					return innerHtml;
				};
				if(arguments.length === 0){
					var data = allarray,
						$tabs = $('<div />')
							.addClass(d.classname.groupTabs)
							.css('display', 'none')
							.appendTo( $('body') ),
						$lists = $('<ul />')
							.appendTo($tabs);

					for(var i=0, len=data.length; i<len ;i++){
						var $li = $('<li />')
							.attr('data-id',data[i].dashboard_id)
							.appendTo($lists)
							.html(getHtml(data[i].dashboard_name));

						if( data[i].tab_yn == 'Y' ){
							$li.addClass(d.classname.disabled);
						}
					}
				} else {
					var html = '<li data-id="'+_data.dashboard_id+'" class="'+d.classname.disabled+'">'+getHtml(_newname)+'</li>';
					$('.'+d.classname.groupTabs+' ul').prepend(html);
					d.dashboardlistUpdate();
				}
				_eventAll();
			},
			_eventAll = function(){
				var isResizing,
				_tablist = '.'+d.classname.groupTab+' ul',
				_updateName = function($li, _id, _name){
					if( _name.trim() == ''){
						_alert(d.msg.inputChangeName,{
							onAgree : function(){
								$li.find('input[type=text]').focus();
							}
						});
					}else{
						var rqData = {
							dashboard_id : _id,
							dashboard_name : _name
						},
						callback = function(){
							$li.find('.'+d.classname.btnLink).text(_name);
							$li.removeClass('mode-edit');
							$(_tablist+' li[data-id='+_id+']').find('.'+d.classname.btnLink).text(_name);
							d.dashboardName = _name;
						}
						$('body').requestData(d.url.dashboard_update, rqData, {callback:callback});
					}
				};

				$('.'+d.classname.groupTabs+' li').each(function(){
					var $parent = $(this),
						id = $(this).data('id');

					$(this).find('.'+d.classname.btnLink).on('click',function(){
						_loadContent(id, true);

						var disabled = d.classname.disabled,
							active = d.classname.active;

						if($parent.hasClass(disabled)){
							var $master = $('.'+d.classname.groupTab).find('[data-id='+id+']');

							$master.addClass(active);
							$master.siblings().removeClass(active);
						} else {
							var $clone = $parent.clone();

							$parent.addClass(disabled);
							$clone.html($clone.find('.'+d.classname.btnLink))
								.append('<span class="'+d.classname.btnDelete+'"><i class="'+d.classname.iconClose+'"></i></span>')
								.addClass(active);

							$(_tablist+' li').removeClass(active);
							$(_tablist).prepend( $clone );

							d.dashboardlistArrow();

							// dashboard_tab_update
							d.dashboardlistUpdate(true);

							_eventTab();
						}
					})
					.end()
					.find('.'+d.classname.btnEdit).off('click').on('click',function(){
						var _w = $parent.find('.'+d.classname.btnLink).outerWidth(),
							_name = $parent.find('.'+d.classname.btnLink).text();
						$parent.addClass('mode-edit');
						$parent.siblings().removeClass('mode-edit');
						$parent.find('input').width(_w+'px').attr('placeholder',_name).val('').focus();
					})
					.end()
					.find('.'+d.classname.btnDelete).on('click',function(){
						d.dashboardDelete(id, d.dashboardlistUpdate());
					})
					.end()
					.find('.'+d.classname.btnSave).on('click',function(){
						_updateName($parent, id, $(this).siblings('input[type=text]').val());
					})
					.end()
					.find('.'+d.classname.btnCancel).on('mousedown',function(){
						$parent.removeClass('mode-edit');
					})
					.end()
					.find('input[type=text]').on('keydown keypress',function(event){
						if(event.keyCode === 13){
							_updateName($parent, id, $(this).val());
						} else if(event.keyCode === 27){
							$parent.removeClass('mode-edit');
						}
						event.stopPropagation();
					})
				});

				$(window).on('resize',function(e){
					clearTimeout(isResizing);
					isResizing = setTimeout(function(){
						d.dashboardlistArrow();
					}, 500);
				});
			},
			_openAll = function(){
				if( $('.'+d.classname.groupTabs).is(':visible') ){
					_closeAll();
				} else {
					$('.'+d.classname.groupTabs+' li').removeClass('mode-edit');
					$('.'+d.classname.groupTabs).fadeIn(200,function(){
						$(document).on("mousedown",autoCloseTab);
					});
					$('.'+d.classname.btns+' .'+d.classname.btnToggle).addClass(d.classname.open);
				}
			},
			_closeAll = function(){
				$('.'+d.classname.groupTabs).fadeOut(300,function(){
					$(document).off("mousedown",autoCloseTab);
				});
				$('.'+d.classname.btns+' .'+d.classname.btnToggle).removeClass(d.classname.open);
			};

			
			if(arguments.length == 1){
				// 최초 로딩
				if(data.length>0){
					_init();
				}else{
					$('.'+d.classname.board).css({
						'text-align':'center',
						'padding':'100px 0'
					}).html(d.msg.empty);
				}
			}else if(arguments.length == 2){
				// 사용자 대시보드 추가
				_drawTab(arguments[1]);
				_drawAll(arguments[1]);
			}
		},
		dashboardlistUpdate : function(isTab){
			var d = this,
			url = isTab===true ? d.url.dashboard_tab_update : d.url.dashboard_seq_update,
			$lists = isTab===true ? $('.'+d.classname.groupTab+' li') : $('.'+d.classname.groupTabs+' li'),
			flag = isTab===true? 'tab_seq' : 'dashboard_seq',
			rqData = [];

			for(var i=0, len=$lists.size();i<len;i++){
				var obj = {};
				obj['dashboard_id'] =$lists.eq(i).attr('data-id');
				obj[flag] = i;
				rqData.push(obj);
			}
			$('body').requestData(url,rqData,{callback:function(){
				if( $('.'+d.classname.groupTab+' .'+d.classname.active).size() <1){
					$('.'+d.classname.groupTab+' li:eq(0) .'+d.classname.btnLink).click();
				}
			}});
		},
		dashboardlistArrow : function(){
			var d = this,
			$areaButton = $('.'+d.classname.btns),
			$areaTab = $('.'+d.classname.groupTab),
			$listcontent = $('.'+d.classname.groupTab+' ul'),
			outerSize = $areaTab.width() - $areaButton.width() - $('.'+d.classname.groupSide).width() - $('.'+d.classname.groupTab+' .'+d.classname.btnAdd).width(),
			innerSize = $('.'+d.classname.groupTab+' ul').width(),
			class_p = d.classname.btnPrev,
			class_n = d.classname.btnNext,
			w = 0,
			eventArrows = function(){
				if(innerSize > outerSize){
					if( $areaButton.find('.'+class_p).size() > 0 || $areaButton.find('.'+class_n).size() > 0) return false;

					var $btn_p = $('<button />')
						.attr('type','button')
						.prop('disabled',true)
						.html('<i class="'+d.classname.iconLeft+'"></i>')
						.addClass(class_p),
					$btn_n = $('<button />')
						.attr('type','button')
						.html('<i class="'+d.classname.iconRight+'"></i>')
						.addClass(class_n),
					isMoving = false,
					move = function(event){
						if(isMoving) return false;

						var _outerSize = $areaTab.width() - $areaButton.width() - $('.'+d.classname.groupSide).width() - $('.'+d.classname.groupTab+' .'+d.classname.btnAdd).width(),
						_innerSize = $('.'+d.classname.groupTab+' ul').width(),
						_diff = _outerSize - _innerSize,
						_left = parseInt($listcontent.css('left'));

						if(event.currentTarget.className == class_p){
							if( _left < 0 && Math.abs(_left) <= _outerSize){
								var move_size = 0;
								$btn_p.prop('disabled',true);
								$btn_n.prop('disabled',false);
							} else {
								if(_left == 0){
									$btn_n.prop('disabled',false);
								} else {
									var move_size = _outerSize;
									$btn_p.prop('disabled',false);
								}
							}
							anim(move_size * -1);

						}else if(event.currentTarget.className == class_n){
							if( Math.abs(_left) <= _outerSize ){
								if( Math.abs(_diff) - Math.abs(_left) < _outerSize ){
									var move_size = Math.abs(_diff);
									$btn_n.prop('disabled',true);
								} else {
									var move_size = _outerSize;
									$btn_n.prop('disabled',false);
								}
								anim(move_size * -1);
							}
							$btn_p.prop('disabled',false);
						}
					},
					anim = function(_dist){
						isMoving = true;
						$listcontent.animate({
							left : _dist
						},500,function(){
							isMoving = false;
						})
					};

					$areaButton.prepend($btn_n).prepend($btn_p);

					$btn_p.off('mousedown').on('mousedown',move);
					$btn_n.off('mousedown').on('mousedown',move);
				} else {
					if( $areaButton.find('.'+class_p).size() > 0 || $areaButton.find('.'+class_n).size() > 0){
						$areaButton.find('.'+class_p).remove();
						$areaButton.find('.'+class_n).remove();
					}
				}
			};

			setTimeout(function(){
				//탭 사이즈 체크후 화살표 생성
				$areaTab.find('ul > li').each(function(){
					w += $(this).outerWidth();
				});
				$areaTab.find('ul').css('min-width',w+'px');

				eventArrows();

				$(window).on('resize',function(){
					eventArrows();
				});
			},20);
		},

		dashboardContent : function(_arg){
			var _contentid = 'mainboard',
			_ga = 'gridarea'+_contentid,
			_ba = 'boardarea'+_contentid,
			d = this,
			option = d.option,
			$content, $gridarea, $contentarea,
			datas, unitsize, spare, gridMaxwidth,
			isResizing,
			_calculate = function(){
				var width = window.innerWidth;
				unitsize = parseInt( width/ 60 );
				spare = width % 60;
				gridMaxwidth = width - spare;
			},
			_init = function(){
				datas = _arg;

				// 리셋
				clearTimeout(d.refreshTimer);

				$('#'+_contentid).remove();
				$content = $('<div />')
					.addClass(d.classname.board)
					.attr('id',_contentid)
					.appendTo( $('.section-dashboard') );

				_calculate();

				// draw default structure
				var po_t = $('header').outerHeight() + $('.group-tab').outerHeight();

				$content
					.html('<div class="'+d.classname.grid+'" id="'+_ga+'"></div><div id="'+_ba+'" class="nano-content" style="right:-17px;"></div>')
					.addClass("nano")
					.css({
						'position' : 'fixed',
						'top' : po_t+'px',
						'left' : 0,
						'right' : 0,
						'bottom' : 0
					});

				$gridarea = $('#'+_ga);
				$contentarea = $('#'+_ba);

				// set grid
				if( option.grid_yn==='Y'){
					_drawGrid();
				}

				// set monitoring time and component refresh
				var _refreshTime = (typeof gDashboardRefreshSecond != 'undefined') ? gDashboardRefreshSecond : 60;
				d.updateMonitoringTime();
				d.refreshTimer = setInterval(function(){
					d.updateMonitoringTime();
					for(var i in d.componentInstance){
						d.componentInstance[i].refreshComponent();
					}
				},_refreshTime*1000);

				// set layout and component
				_drawLayout();
				_loadComponent();

				// setting component add list
				if(ComponentInfoList){
					_setComponentlist(ComponentInfoList);
				}

				// bind event resize
				$(window).off('resize',_resizeWindow).on('resize',_resizeWindow);
			},
			_resizeWindow = function(event){
				_calculate();
				if( d.option.grid_yn==='Y'){
					_drawGrid();
				}

				clearTimeout(isResizing);
				isResizing = setTimeout(function(){
					_drawLayout(true);
				}, 500);
			},
			_drawGrid = function(){
				var grid_col = d.option.grid_col,
				 $grid = $gridarea.show().empty(),

				drawRows = function(){
					for(var i=0, h= ($(window).height()-90) / option.rowHeight ; i< h ;i++){
						var $div = $("<div />")
							.addClass(d.classname.linerow)
							.css("top", option.rowHeight *i)
							.appendTo($grid);
					}
				},
				drawCols = function(){
					for(var i = 1; i< 60 ;i++){
						var $div = $("<div />")
							.addClass(d.classname.linecol)
							.css("left", unitsize * i)
							.appendTo($grid);

						if( i%(60/grid_col) === 0 && i !==60){
							for(var j=0; j<= grid_col ; j++){
								$div.addClass(d.classname.lineguide);
							}
						}
					}
				}

				$grid.css({
					'margin-left' : spare/2 +"px",
					'margin-right' : spare/2 +"px",
					'width' : gridMaxwidth +"px"
				});

				drawRows();
				drawCols();
			},
			_drawLayout = function( isResize ){
				if(isResize){
					$contentarea.css({
						'margin-left' : spare/2+'px',
						'margin-right' : spare/2 +"px"
					});

					d.GRIDSTER.resize_widget_dimensions({
						widget_base_dimensions : [unitsize - option.margin*2, option.rowHeight - option.margin*2]
					});

					setTimeout(function(){
						for(var i in d.componentInstance){
							if(d.componentInstance[i].$config.is(':visible')){
								var $config = d.componentInstance[i].$config,
								$container = d.componentInstance[i].$container;
								d.componentInstance[i].$config.css({
									left : d.getConfigPos($container, $config).left + 'px',
									top : d.getConfigPos($container, $config).top + 'px'
								});
							}
							d.componentInstance[i].$container.find('.gs-resize-handle:gt(0)').remove();
						}
					},400);
					_updateLayout();
				} else {
					var $gridster = $('<div />').addClass('gridster'),
					$ul = $('<ul />').appendTo($gridster);
				
					for(var i=0, len=datas.length ; i < len ;i++){
						$ul.append( _markupComponent(datas[i]) );
					}

					$contentarea.empty().css({
						'margin-left' : spare/2+'px',
						'margin-right' : spare/2 +"px"
					});
					$gridster.appendTo($contentarea);

					d.GRIDSTER = $ul.gridster({
						widget_base_dimensions: [unitsize - option.margin*2, option.rowHeight - option.margin*2],
						widget_margins: [option.margin, option.margin],
						max_size_x: 60,
						helper: 'clone',
						resize: {
							enabled: true,
							min_size: [12, 6],
							max_size: [60, 60],
							start: function(){
								for(var i in d.componentInstance){
									if(d.componentInstance[i].$config.is(':visible')){
										d.componentInstance[i].$config.hide();
									}
								}
							},
							stop: function(e, ui, $widget) {
								_updateData();
								if( $widget.find('.jqx-grid').size() > 0 ){
									$widget.find('.jqx-grid').resize();
								}
								_updateLayout();
								$content.nanoScroller();
							}
						},
						draggable: {
							handle: '.'+d.classname.title,
							start: function(){
								for(var i in d.componentInstance){
									if(d.componentInstance[i].$config.is(':visible')){
										d.componentInstance[i].$config.hide();
									}
								}
							},
							stop: function(e, ui) {
								_updateData();
								$content.nanoScroller();
							}
						}
					}).data('gridster');

					_eventHandle();
				}
			},
			_markupComponent = function(data){
				var $li = $('<li />')
						.attr({
							'data-col' : data.pos_x,
							'data-row' : data.pos_y,
							'data-sizex' : data.size_w,
							'data-sizey' : data.size_h,
							'data-id' : data.container_id,
							'data-label' : data.label,
							'id' : 'componentcontainer_'+data.container_id
						}),
					_title = data.container_title == undefined ? data.title : data.container_title,
					$header = $('<div />')
						.addClass(d.classname.componentHead)
						.attr('id','componentheader_'+data.container_id)
						.append('<div class="'+d.classname.title+'">'+_title+'</div>')
						.appendTo($li),
					$right = $('<div />')
						.addClass(d.classname.componentHeadsub)
						.appendTo($header),
					$close = $('<button />')
						.addClass(d.classname.componentClose)
						.attr('type','button')
						.html('<i class="'+d.classname.iconClose+'"></i>')
						.appendTo($right),
					$setting = $('<button />')
						.addClass(d.classname.componentSetting)
						.attr('type','button')
						.html('<i class="'+d.classname.iconEdit+'"></i>')
						.appendTo($right),
					$body = $('<div />')
						.attr('id','componentbody_'+data.container_id)
						.addClass(d.classname.componentBody)
						.addClass('nano')
						.appendTo($li),
					$bodyinner = $('<div />')
						.addClass("nano-content")
						.addClass(d.classname.componentInner)
						.data({
							dashboard_id: data.dashboard_id,
							container_id : data.container_id,
							compnent_id : data.component_id,
							component_type : data.component_type,
							component_path : data.component_path,
							component_title : data.component_title,
							component_param : data.component_param,
							config_param : data.config_param
						})
						.appendTo($body);

				$li.on('mouseenter',function(){
					$(this).addClass(d.classname.componentHover);
				}).on('mouseleave',function(){
					$(this).removeClass(d.classname.componentHover);
				});

				return $li;
			},
			_loadComponent = function(_arg){
				if(arguments.length === 0){
					// 전체 로드
					$('.'+d.classname.board+' .'+d.classname.componentBody+' .'+d.classname.componentInner).each(function(i){
						var _d = $(this).data();
						$(this).load(d.url.load, _d,function(){

							if(typeof slapp.component != 'undefined' && typeof slapp.component[_d.component_type] != 'undefined'){
								d.componentInstance[_d.container_id] = new Component(_d.container_id, slapp.component[_d.component_type](_d.container_id, $.parseJSON(_d.config_param), _d.component_title, _d.component_param));
							};
						});
					});
				}else if(arguments.length === 1 && typeof arguments[0] === 'object'){
					// 사용자 추가 로드
					var $element = _arg;
					var _d = $element.data();
					$element.load(d.url.load, _d, function(){
						_updateData();

						if(typeof slapp.component != 'undefined' && typeof slapp.component[_d.component_type] != 'undefined'){
							d.componentInstance[_d.container_id] = new Component(_d.container_id, slapp.component[_d.component_type](_d.container_id, $.parseJSON(_d.config_param), _d.component_title, _d.component_param));
						}
					});

					if($('.'+d.classname.emptyBoard).size()>0) $('.'+d.classname.emptyBoard).remove();
				}

				if( $contentarea.find('li').size() < 1){
					$contentarea.after( $('<div />').addClass(d.classname.emptyBoard).html(d.msg.guideAddComponent) );
				}
			},
			_updateLayout = function(){
				if($('style[generated-from="gridster"]').length>1){
					$('style[generated-from="gridster"]').eq(0).remove();
				}
			},
			_updateData = function(removedWidget){
				if(arguments[0] != undefined){
					for(var i=0, len = datas.length; i < len ;i++){
						if(datas[i].container_id === removedWidget ){
							datas.splice(i,1);
							break;
						}
					}
				}

				var serialize = d.GRIDSTER.serialize();
				if(serialize.length != datas.length) return false;

				for(var i=0, len = datas.length; i < len ;i++){
					datas[i].pos_x = serialize[i].col;
					datas[i].pos_y = serialize[i].row;
					datas[i].size_w = serialize[i].size_x;
					datas[i].size_h = serialize[i].size_y;
				}

				var url = d.url.component_layout_update,
				rqData = datas;
				for(var i=0,len = rqData.length;i<len;i++){
					delete rqData[i].component_id;
					delete rqData[i].component_param;
					delete rqData[i].component_path;
					delete rqData[i].component_title;
					delete rqData[i].component_type;
					delete rqData[i].config_param;
					delete rqData[i].dashboard_id;
					delete rqData[i].title;
					delete rqData[i].label;
				}
				$('body').requestData(url,rqData);

				_eventHandle();
			},
			_eventHandle = function(){
				$content.nanoScroller();

				// remove component
				$contentarea.find('.'+d.classname.componentClose).off('mouseup').on('mouseup',function(){
					var _this = $(this),
					_$container = _this.parents('li'),
					id = _$container.attr('data-id'),
					callback = function(){
						$('#config_'+id).remove();
						_updateData( id );
						if(typeof d.componentInstance[id].destroy != 'undefined'){
							d.componentInstance[id].destroy();
						}
						if(d.chartInstance[id] != undefined){
							delete d.chartInstance[id];
						}
						delete d.componentInstance[id];
						
						if($contentarea.find('li').size() < 1){
							$contentarea.after( $('<div />').addClass(d.classname.emptyBoard).html(d.msg.guideAddComponent) );
						}
						$content.nanoScroller();
					};

					d.GRIDSTER.remove_widget( _this.parents('li'), function(){
						_$container.requestData( d.url.component_delete, {'container_id':id},{callback: callback});
					});
				});
			},
			_setComponentlist = function(componentData){
				var $target = $('#componentaddlist').empty(),
					_data = componentData,
					len = _data.length,
					max = 0,
					arrByCols = {};

				// 데이터에 order_no가 100 이상인 것을 정상적인 값으로 여긴다.
				// 백자리에 숫자가 화면상에 col 순서
				// sort시 백자리에 숫자가 같은것 끼리 배열에 담아 객체로 만들고
				// 100미만의 데이터들은 제일 뒤에 col에 위치하도록한다.
				for(var i=0; i<len; i++){
					var index = parseInt(_data[i].order_no/100)-1;

					if(!arrByCols[index]) arrByCols[index] = [];
					arrByCols[index].push(_data[i]);
				}
				
				//목록 그리기
				for(var i in arrByCols){
					var $ul = $('<ul />').appendTo($target);
					var _arr = arrByCols[i];
					var _len = _arr.length;

					if(_len > max) max = _len;

					for(var j=0; j<_len; j++){
						if(_arr[j].component_type==='') continue;

						var _icon = _arr[j].icon ? _arr[j].icon : "icon-smile";

						$('<li />')
							.append( 
									$('<a href="#" data-index="'+_arr[j].order_no+'"><i class="'+_icon+'"></i>'+_arr[j].component_title+'</a>')
									.data(_arr[j])
									.on('click',_eventComponentadd)
							)
							.appendTo($ul);
					}
				}

				//배경 선 그리기
				var $lines = $('<div class="lines"></div>')
					.appendTo($target);
				for(var i=0;i<max-1;i++){
					$lines.append( $('<span class="line-row"></span>') );
				}

				//컴포넌트 레이어
				$("."+d.classname.btnAdd).off('click').on('click',function(){
					var _window = '.modal-dashboard.component-add',
					$btn = $(this),
					_hideComadd = function(){
						$btn.removeClass(d.classname.active);
						$(_window).hide();
						$(document).off('mousedown',_autoCloseComadd);
					},
					_showComadd = function(){
						$btn.addClass(d.classname.active);
						$(_window).show();
						$(document).on('mousedown',_autoCloseComadd);
					},
					_autoCloseComadd = function(event){
						var $target = $(event.target);
						if(!$target.parents().hasClass('component-add')
							&& !$target.hasClass('component-add')
							&& !$target.parents().hasClass('ui-datepicker')
							&& !$target.parents().hasClass('modal-alert') ){
							_hideComadd();
						}
					};

					if($btn.hasClass(d.classname.active)){
						_hideComadd();
					} else {
						_showComadd();
					}
				});

			},
			_eventComponentadd = function(event){
				event.preventDefault();

				var _w = (d.optiongrid_yn=='Y') ? d.option.grid_col : 12,
				thisdata = $(this).data(),
				url = $.Dashboard.url.component_insert,
				rqData = {
					pos_y: 1,
					pos_x: 1,
					size_w: _w,
					size_h: 12,
					dashboard_id : $.Dashboard.dashboard_id,
					component_id : thisdata.component_id,
					title : thisdata.component_title
				},
				addComponent = function(data){
					// 레이아웃 추가 위젯 설정
					var _data = {
						container_id: data.container_id,
						title : data.title,
						component_type: $(this).data('type'),
						config_param: data.config_param,
						label: data.label,
						pos_y: data.pos_y,
						pos_x:  data.pos_x,
						size_w:  data.size_w,
						size_h: data.size_h
					},
					html = _markupComponent(_data),
					min_unit = 20;		//가이드 라인 없을 때 컴포넌트 생성되는 사이즈

					datas.push(_data);

					if(option.grid_yn==='Y' && option.guide_yn==='Y'){
						min_unit = 60/option.grid_col;
					}

					var pos_y = d.GRIDSTER.container_height > 0 ? d.GRIDSTER.container_height : 1;
					d.GRIDSTER.add_widget(html, min_unit, 10, 1, pos_y);
					$contentarea.stop().animate({'scrollTop':html.position().top},700,'swing');

					// 컴포넌트 설정
					var $element = $('#componentcontainer_'+data.container_id+' .'+d.classname.componentInner).data({
						dashboard_id: data.dashbard_id,
						container_id : data.container_id,
						compnent_id : thisdata.component_id,
						component_type : thisdata.component_type,
						component_path : thisdata.component_path,
						component_title : thisdata.component_title,
						component_param : thisdata.component_param,
						config_param : data.config_param
					});
					_loadComponent($element);

					_eventHandle();
				}

				$('body').requestData(url,rqData,{callback:function(data){
					addComponent(data);
				}});
				$('.component-add').hide();
			};

			if(typeof arguments[0] == 'object'){							// 컨텐츠 전체
				_init();

			} else if(typeof arguments[0] == 'boolean'){					// 그리드 변경
				$gridarea = $('#'+_ga);
				$contentarea = $('#'+_ba);

				if(arguments[0] == true){
					_calculate();
					_drawGrid();
				}else{
					$gridarea.hide();
				}
			}
		},

		dashboardConfig : function(isrefresh){
			var d = this,
			loadUserTotal = false,				// true: 최초 전체 로드시, false: 검색시 페이지별 로드
			_ = {
				name : '#setting_name',
				theme : '#setting_theme',
				animate : '#setting_animate',
				grid : '#setting_grid',
				share : '#setting_share',
				switchOn : 'btn-switch-on',
				switchOff : 'btn-switch-off'
			},
			_loadUsers = function(_rqData, _after){
				var $listContainer = $(_.share+' .layer-search-result:eq(1) ul').empty(),
				url = d.url.user_list,
				callback = function(data){
					for(var i=0,len=data.length;i<len;i++){
						var $li = $('<li />')
							.attr('data-id',data[i].user_id)
							.attr('data-nm',data[i].user_nm)
							.text('['+data[i].group_nm+'] '+data[i].user_nm+'('+data[i].user_id+')')
							.appendTo( $listContainer );
					}
					_eventSearchLayer();
					_after();
				};
				$('body').requestData(url,_rqData,{callback:callback});
			},
			_init = function(){
				//컴포넌트 설정창
				$(".group-side .btn-setting").off('click').on('click',function(){
					var _window = '.window.dashboardsetting';

					$(_window)
						.show()
						.css({
							left: ($(window).width() - $(_window).width()) *.5 +'px',
							top: ($(window).height() - $(_window).height()) *.5 +'px',
						}).draggable({
							handle: '.modal-head',
							containment: 'body'
						});
					$(_window+' .modal-head').css('cursor','move');
					$(_window+' .btn-close').one('click',function(){
						$(_window).hide();
					});

					_refresh();
					_event();

					if(loadUserTotal){
						//공유 사용자 전체 로드
						if( $(_.shareUserLists+' .lists li').size() >0) return false;
						_loadUsers({})
					}

					globalui.attach.setSwitchToggle('.dashboardsetting');
					globalui.attach.setTransformSelect('.dashboardsetting');
					if(d.option.share_yn=='Y'){
						$('.dashboardsetting .nano').nanoScroller();
					}
					_eventSearchLayer();
				});

				// 리포트 다운로드
				$(".group-side .btn-report").off('click').on("click",function(){
					var $activeLi = $(".group-tab ul").find(".active");
					var $form = $("<form>").attr({
						action : d.url.report_list
					});

					$form
						.append( $("<input type='hidden' name='dashboard_id'>").val($activeLi.data("id")) )
						.append( $("<input type='hidden' name='dashboard_name'>").val($activeLi.find(".btn-tab").text()) )
						.appendTo("body")
						.submit()
						.remove();
				});
			},
			_refresh = function(){
				_setName();
				_setGrid();
				_setTheme();
				_setAnimate();
				_setShare();
			},
			_setName = function(){
				$(_.name+' .name').text(d.dashboardName);
				$(_.name+' .text').show();
				$(_.name+' .form').hide();
			},
			_setGrid = function(){
				var $switch = $(_.grid+' [data-switch-toggle=true]'),
					$select = $(_.grid+' select'),
					$selectUi = $(_.grid+' .tform-select');

				if(d.option.grid_yn === 'Y'){
					$switch.val('1').addClass(_.switchOn).removeClass(_.switchOff);
					$select.prop('disabled',false).val(d.option.grid_col);
					$selectUi.removeClass('disabled');
				} else {
					$switch.val('0').addClass(_.switchOff).removeClass(_.switchOn);
					$select.prop('disabled',true);
					$selectUi.addClass('disabled');
				}
			},
			_setTheme = function(){
				$(_.theme+' [name=dashboard_theme]:eq('+d.option.theme+')').prop('checked',true);
			},
			_setAnimate = function(){
				$(_.animate+' [name=animate_yn]:eq('+d.option.animate_yn+')').prop('checked',true);
			},
			_setShare = function(){
				var $switch = $(_.share+' [data-switch-toggle=true]'),
				$txt = $(_.share+' .txt-search'),
				$list = $(_.share+' .list'),
				$inputs = $(_.share+' input'),
				$btns = $(_.share+' .btn-search');

				if(d.option.share_yn === 'Y'){
					var sharedGroups = d.option.group_list,
					sharedUsers = d.option.user_list;

					$switch.val('1').addClass(_.switchOn).removeClass(_.switchOff);
					$txt.removeClass('disabled');
					$list.removeClass('disabled');
					$inputs.prop('disabled',false);
					$btns.prop('disabled',false);

					if(sharedGroups.length>0){
						for(var i=0,len=sharedGroups.length; i<len; i++){
							_appendShareElement(0, sharedGroups[i].group_cd, sharedGroups[i].group_name);
						}
					}
					if(sharedUsers.length>0){
						for(var i=0,len=sharedUsers.length; i<len; i++){
							_appendShareElement(1, sharedUsers[i].user_id, sharedUsers[i].user_nm);
						}
					}
				} else {
					$switch.val('0').addClass(_.switchOff).removeClass(_.switchOn);
					$txt.addClass('disabled');
					$list.addClass('disabled');
					$inputs.prop('disabled',true);
					$btns.prop('disabled',true);
					$(_.share).find('.nano').nanoScroller({destroy:true});
					$(_.share+' .list ul').empty();
				}
			},
			_appendShareElement = function(index,arg1,arg2){
				if($(_.share+' .list:eq('+index+') ul [data-id='+arg1+']').size()>0 || !(index == 0 || index == 1)) return false;

				var $target = $(_.share+' .list:eq('+index+') ul'),
				$li = $('<li />')
					.appendTo($target),
				$btn = $('<button />')
					.attr('type','button')
					.addClass('btn-del')
					.appendTo($li),
				$ic = $('<i />')
					.addClass('icon-trash')
					.appendTo($btn);

				if(index===0){
					$li.attr({
						'data-id':arg1,
						'data-nm':arg2
					})
					.append(arg2);
				} else if(index===1){
					$li.attr({
						'data-id':arg1,
						'data-nm':arg2
					})
					.append(arg2+'('+arg1+')');
				}

				$btn.on('click',function(){
					$(this).parent().remove();
				});
			},
			_event = function(){
				//이름변경
				var setNameDefault = function(){
					$(_.name+' .text').show();
					$(_.name+' .form').hide();
				},
				setNameEdit = function(){
					$(_.name+' .text').hide();
					$(_.name+' .form').show();
					$(_.name+' .form input').attr('placeholder',$(_.name+' .name').text()).val('').focus()
						.off('keydown').on('keydown',function(event){
							event.stopPropagation();
							if(event.keyCode == 13){
								saveName();
							}else if(event.keyCode == 27){
								setNameDefault();
							}
						});
				},
				saveName = function(){
					var new_name = $(_.name+' .form input').val().trim();
					if( new_name == ''){
						_alert(d.msg.inputChangeName,{
							onAgree : function(){
								$(_.name+' .form input').focus();
							}
						});
					} else {
						var name_callback = function(){
							setNameDefault();
							$(_.name+' .name').text(new_name);
							$('.'+d.classname.groupTab+' li[data-id='+d.dashboard_id+'] .'+d.classname.btnLink).text(new_name);
							$('.'+d.classname.groupTabs+' li[data-id='+d.dashboard_id+'] .'+d.classname.btnLink).text(new_name);
							d.dashboardlistArrow()
						}
						_update(new_name, name_callback);
					}
				};
				$(_.name+' .name').on('dblclick',setNameEdit);
				$(_.name+' .icon-pencil').on('click',setNameEdit);
				$(_.name+' .icon-trash').on('click',function(){
					d.dashboardDelete(d.dashboard_id);
				});
				$(_.name+' .icon-disk').on('click',saveName);
				$(_.name+' .icon-times-circle').on('click',setNameDefault);

				//그리드 가이드 변경
				var yn = d.option.grid_yn==='Y'? true : false,
				grid_callback = function(){
					if(yn==true) d.option.grid_col = Number($(_.grid+' select').val());
					d.dashboardContent(yn);
				};
				$(_.grid+' [data-switch-toggle=true]').off('click').on('click',function(){
					if($(this).val()==='0'){
						$(_.grid+' select').prop('disabled',false);
						$(_.grid+' .tform-select').removeClass('disabled');
						yn = true;
						d.option.grid_yn = 'Y';;
					}else if($(this).val()==='1'){
						$(_.grid+' select').prop('disabled',true);
						$(_.grid+' .tform-select').addClass('disabled');
						yn = false;
						d.option.grid_yn = 'N';
					}
					_update( yn, grid_callback);
				});
				$(_.grid+' select').on('change',function(){
					_update(Number($(this).val()), grid_callback);
				});

				//테마 선택
				$(_.theme+' [name=dashboard_theme]').each(function(){
					$(this).off('click').on('click',function(){
						var val = $(this).parents('[class*=range-]').index();
						var callback = function(){
							$('.'+d.classname.groupTab+' .'+d.classname.active+' .'+d.classname.btnLink).trigger('click');
						};
						d.option.theme = val;
						_update(val + 100, callback);
					});
				});

				//차트 애니메이션 선택
				$(_.animate+' [name=animate_yn]').each(function(){
					$(this).off('click').on('click',function(){
						var val = $(this).parents('[class*=range-]').index();
						var callback = function(){
							$('.'+d.classname.groupTab+' .'+d.classname.active+' .'+d.classname.btnLink).trigger('click');
						};
						d.option.animate_yn = val;
						_update(val + 1000, callback);
					});
				});

				//공유 변경
				$(_.share+' [data-switch-toggle=true]').off('click').on('click',function(){
					if($(this).val()==='0'){
						$(_.share).find('.txt-search, .list').removeClass('disabled');
						$(_.share).find('.btn-search, input[type=text]').prop('disabled',false);
						$(_.share).find('.nano').nanoScroller();
					}else if($(this).val()==='1'){
						$(_.share).find('.txt-search, .list').addClass('disabled');
						$(_.share).find('.btn-search, input[type=text]').prop('disabled',true);
						$(_.share).find('.nano').nanoScroller({destroy:true});
					}
				});

				// 검색
				$(_.share+' .btn-search').each(function(index){
					$(this).on('click',function(){
						_showLayer( index );
					});
				});
				$(_.share+' [type=text]').each(function(index){
					$(this).on('keydown',function(event){
						switch(event.keyCode){
							case 13:
								_showLayer( index );
								break;
							case 27:
								_hideLayer();
								event.stopPropagation();
						}
					});
				});

				$(_.share+' .btn-apply').on('click',function(){
					var share_yn = $(_.share+' [class^=btn-switch-]').val() == '1' ? 'Y' : 'N',
					share_group_list = [],
					share_user_list = [];
					$(_.share+' .list:eq(0) li').each(function(){
						share_group_list.push( String($(this).data('id')) );
					});
					$(_.share+' .list:eq(1) li').each(function(){
						share_user_list.push( String($(this).data('id')) );
					});

					var rqData = {
						share_yn : share_yn,
						share_group_list : share_group_list,
						share_user_list : share_user_list
					},
					share_callback = function(data, code, msg){
						_alert(msg);
						$(_.share+' [type=text]').val('');
					};
					_update(rqData, share_callback);
				});
			},
			_eventSearchLayer = function(){
				$(_.share+' .layer-search-result').each(function(index){
					var $layer = $(this);
					$(this).find('li').each(function(){
						$(this).off('click').on('click',function(){
							if(index === 0){
								_appendShareElement(0, $(this).data('cd'), $(this).text());
							}else if(index === 1){
								_appendShareElement(1, $(this).data('id'), $(this).data('nm'));
							}
							$layer.hide();
							$(_.share+' .nano').nanoScroller();

							event.stopPropagation();
						});
					});
				});
			},
			_showLayer = function(_i){
				var _input = $(_.share+' [type=text]').eq(_i).val(),
				$layer =  $(_.share+' .layer-search-result').eq(_i),
				$lists = $layer.find('li'),
				cnt = 0,
				_h = 22,				// **related with design

				_setafter = function(){
					if(cnt === 0){
						$layer.find('ul').append('<li class="empty">검색 결과가 없습니다</li>');
					}
	
					$layer.show()
						.find('.nano').height(cnt*_h+'px').nanoScroller();
	
					$(document).on('mousedown',_autoCloseBoardadd);
				}

				$layer.find('.empty').remove();

				if(!loadUserTotal && _i === 1){			// 사용자 키워드별 페이징 별 검색
					_loadUsers(
						{"keyword": $(_.share+' [type=text]').eq(1).val() , "recordstartindex":0, "pagesize":50},
						function(){
							cnt = $layer.find('li').size();
							_setafter();
						}
					);
				} else {			// 기본
					for(var i=0, len=$lists.size(); i<len; i++){
						if($lists.eq(i).text().indexOf(_input)!=-1){
							$lists.eq(i).css('display','block');
							cnt++;
						}else{
							$lists.eq(i).css('display','none');
						}
					}
					_setafter();
				}
			},
			_hideLayer = function(){
				$('.layer-search-result').hide();
				$(document).off('mousedown',_autoCloseBoardadd);
			},
			_autoCloseBoardadd = function(event){
				var $target = $(event.target); 
				if(!$target.parents().hasClass('layer-search-result')
					&& !$target.siblings('.layer-search-result').is(':visible')
					&& !$target.parents().hasClass('modal-alert') ){
					_hideLayer();
				}
			},
			_update = function(data, callback){
				var url = d.url.dashboard_update,
				loader = false;

				switch(typeof data){
					case 'string':
						var rqData = {
							dashboard_id : d.dashboard_id,
							dashboard_name : data
						};
						break;
					case 'number':
						if(data >= 1000){		//차트 애니메이션
							var rqData = {
								dashboard_id : d.dashboard_id,
								animate_yn : String(data - 1000)
							};
						} else if(data >= 100){		//테마
							var rqData = {
								dashboard_id : d.dashboard_id,
								dashboard_theme : String(data - 100)
							};
						} else {		//그리드
							var grid_yn = 'Y',
								rqData = {
									dashboard_id : d.dashboard_id,
									grid_yn : 'Y',
									grid_col : data
								};
						}
						break;
					case 'boolean':
						if(data == false){
							var grid_yn = 'N',
							rqData = {
								dashboard_id : d.dashboard_id,
								grid_yn : grid_yn,
								grid_col : 0
							};
						} else {
							var grid_yn = 'Y',
							rqData = {
								dashboard_id : d.dashboard_id,
								grid_yn : grid_yn,
								grid_col : Number($(_.grid+' select').val())
							}
						}
						break;
					case 'object':
						var rqData = data;
						rqData.dashboard_id = d.dashboard_id;
						loader = true;
						break;
				}

				$('body').requestData(url, rqData, {callback:callback, displayLoader: loader});
			};

			if(typeof arguments[1]==='undefined'){
				_init();
			} else if(arguments[1]===true){
				_refresh();
			}
		},

		getConfigPos : function($container, $config){
			var d = this;
			if($container.position().left === d.optionsDefault.margin && $container.width() < $config.width()){
				var _left = $container.position().left + $container.find('.'+d.classname.componentHeadsub).position().left;
				$config.addClass('pos-left');
			}else{
				var _left = $container.position().left + $container.width() - $config.width();
				$config.removeClass('pos-left');
			}
			if($container.outerHeight()+$container.position().top > $('body').height()){
				var _top = $container.position().top - $config.height();
				$config.addClass('pos-bottom');
			}else{
				var _top = $container.position().top
				$config.removeClass('pos-bottom');
			}
			return {
				top : _top,
				left : _left
			}
		},
	};



	var Component = function (container_id, params) {
		if(container_id.length === 0) return;
		var c = this, d = $.Dashboard;

		c.classname = {
			title : d.classname.title,
			config : 'page-config-area',
			confighead : 'modal-head',
			configtitle : 'section-title',
			configpalette : 'area-palette',
			configBottom : 'area-bottom',
			btnApply : 'btn-apply',
			btnCancel : 'btn-cancel',
			btnEdit : d.classname.btnEdit,
			iconCheck : 'icon-checkmark',
			uiColor : 'ui-color',
			selected : 'selected',
			hold : 'item-hold'
		};
		c.string = {
			cancel : '취소',
			apply : '설정'
		};

		c.$container = $('#componentcontainer_'+container_id);
		c.$header = $('#componentheader_'+container_id);
		c.$title = $('#componentheader_'+container_id+' .'+c.classname.title);
		c.$config = $('#config_'+container_id);
		c.container_id = container_id;
		c.refreshTimer;

		var _init = function(){
			$.extend(c, params);

			//set chart animate option
			if(d.option.animate_yn == 1){
				c.chartStyle.animation = "0";		// 없음
			} else {
				c.chartStyle.animation = "1";		// 있음
			}

			//set chart color param
			if(d.option.theme === 1){
				c.chartstyles = $.extend({}, globalui.chart.chartConfig, c.chartStyle, c.chartColors.blue);
			}else if(d.option.theme === 2){
				c.chartstyles = $.extend({}, globalui.chart.chartConfig, c.chartStyle, c.chartColors.dark);
			}else{
				c.chartstyles = $.extend({}, globalui.chart.chartConfig, c.chartStyle, c.chartColors.basic);
			}

			if(typeof c.load != 'undefined'){
				c.load();
			}
			_makeConfig();
			setTimeout(function(){
				c.$container.find('.nano').nanoScroller();
			},1000);
		},
		_makeConfig = function(){
			//make common structure
			var htmlBottom = '<div class="'+c.classname.configBottom+'">'
				+'<button type="button" class="btn-basic '+c.classname.btnApply+'">'+c.string.apply+'</button>'
				+'<button type="button" class="btn-basic '+c.classname.btnCancel+'">'+c.string.cancel+'</button></div>',
			htmlPalette = '';
			for(var i=0;i<4;i++){
				htmlPalette += '<button type="button" class="'+c.classname.uiColor+'" data-value="'+i+'"><i class="'+c.classname.iconCheck+'"></i></button>';
			}

			var $confighead = $('<div />').addClass(c.classname.confighead),
			$configtitle = $('<div />').addClass(c.classname.configtitle)
				.html('<h4>'+c.component_title+'</h4>')
				.appendTo($confighead),
			$configpalette = $('<div />').addClass(c.classname.configpalette)
				.appendTo($confighead)
				.html(htmlPalette);

			c.$config.find('.modal-body').before($confighead);
			c.$config.find('.modal-body').append(htmlBottom);

			_setConfigInit();
			_setTitle();
		},
		_setTitle = function(){
			var $title = $('#componentheader_'+container_id+' .'+c.classname.title),
			_text = c.title!= undefined ? c.title : c.component_title;
			c.$title.html( _text );
		},
		_setConfigInit = function(){
			var $btnComponentEdit = c.$header.find('.'+c.classname.btnEdit),
			$btnConfigApply = c.$config.find('.'+c.classname.btnApply),
			$btnConfigCancel = c.$config.find('.'+c.classname.btnCancel),
			$btnColorui = c.$config.find('.'+c.classname.uiColor),
			currlabel = parseInt(c.$container.attr('data-label'));

			if(c.$config.length === 0){
				$btnComponentEdit.remove();		// 설정창이 없는 경우 설정 버튼 제거
			}else{
				// config init
				c.$config.appendTo($('.gridster'));

				// config event binding
				$btnComponentEdit.on('click',function(){
					c.$config.css({
						left : d.getConfigPos(c.$container, c.$config).left + 'px',
						top : d.getConfigPos(c.$container, c.$config).top + 'px'
					}).fadeIn(200,function(){
						c.$container.addClass(c.classname.hold);
						globalui.attach.init('#config_'+c.container_id);
					});

					_showConfig();
				});

				$btnConfigApply.on('click',function(){
					_saveConfig();
				});

				$btnConfigCancel.on('click',function(){
					_hideConfig();
				});

				$btnColorui.each(function(){
					if($(this).data('value') === currlabel){
						$(this).addClass(c.classname.selected)
						.siblings().removeClass(c.classname.selected);
					} 
					$(this).on('click',function(){
						$(this).addClass(c.classname.selected)
						.siblings().removeClass(c.classname.selected);

						_saveConfig( Number( $(this).attr('data-value') ) );
					});
				});
			}
		},
		_autoCloseConfig = function(event){
			var $target = $(event.target);
			if(!$target.parents().hasClass(c.classname.config)
				&& !$target.hasClass(c.classname.config)
				&& !$target.parents().hasClass('ui-datepicker')
				&& !$target.parents().hasClass('modal-alert') ){
				_hideConfig();
			}
		},
		_showConfig = function(){
			c.isOpenConfig = true;
			if(typeof c.showConfig != 'undefined') c.showConfig();
			$(document).on('mousedown',_autoCloseConfig);
		},
		_hideConfig = function(){
			c.isOpenConfig = false;
			c.$config.fadeOut(200);
			c.$container.removeClass(c.classname.hold);
			$(document).off('mousedown',_autoCloseConfig);
			if(typeof c.cancelConfig != 'undefined') c.cancelConfig();
		},
		_saveConfig = function( _label ){
			var url = d.url.component_update;

			if(arguments.length === 1 && typeof arguments[0] === 'number'){		// ui 컬러값만 변경
				var rqData = {label:_label, container_id:container_id},
				callback = function(){
					c.$container.attr('data-label',_label);
				};

			} else {			// component config 변경
				var callback = function(){
					_hideConfig();
					c.afterSaveConfig();
					setTimeout(function(){
						c.$container.find('.nano').nanoScroller();
					},1000);
				};

				if(!! c.validateConfig){
					if(!c.validateConfig()) return false;
				} else {
					if(!_SL.validate(c.$config)) return false;
				}

				c.beforeSaveConfig();

				var rqData = {
					container_id : c.container_id,
					title : c.title,
					config_param : JSON.stringify(c.config_param)
				};
			}

			c.$container.requestData(url, rqData, {callback:callback});
		};

		_init();
	};
	Component.prototype = {
		isOpenConfig : false,
		isFrequentRefresh : false,
		beforeSaveConfig : function(){
			var serArr = this.$config.find('form').serializeArray();
			this.config_param = {};
			for(var i=0,len=serArr.length; i<len;i++){
				this.config_param[serArr[i].name] = serArr[i].value;
			}
		},
		afterSaveConfig : function(){
			var c = this;
			c.refresh(true);
		},
		refreshComponent : function(){
			var c = this;
			if( c.isOpenConfig == false && typeof c.refresh != 'undefined'){
				if(!c.isFrequentRefresh){
					c.refresh(true);
				}else{
					var _cnt = 0,
					_refresh = function(){
						c.refresh(true);
						if(_cnt == 5){
							clearInterval(c.refreshTimer);
						}
						_cnt++;
					},
					_refreshTime = (typeof gDashboardMinRefreshSecond != 'undefined') ? gDashboardMinRefreshSecond : 10;

					c.refreshTimer = setInterval(_refresh,_refreshTime*1000);
				}
			}
		},
		chartStyle : {
			"alternateHGridAlpha":"0",
			"alternateVGridAlpha":"0",
			"labelFontSize":"10",
			"plotfillalpha":"100"
		},
		chartColors : {
			basic : {
				"top5Colors": "#89cf43,#dddddd,#dddddd,#dddddd,#dddddd,#dddddd,#dddddd,#dddddd,#dddddd,#dddddd",
				"unitColor": "#89cf43",
				"baseFontColor": "#000000",
				"outCnvBaseFontColor": "#000000",
				"bgColor": "#fefefe",
				"borderColor" : "#f2f2f2",
				"canvasBgColor" : "#fefefe",
				"divLineColor" : "#f2f2f2",
				"legendBgColor" : "#fefefe",
				"plotBorderColor": "#000000",
				"toolTipColor": "#ffffff",
				"toolTipBgColor": "#000000"
			},
			dark : {
				"top5Colors": "#669933,#4b4b4b,#4b4b4b,#4b4b4b,#4b4b4b,#4b4b4b,#4b4b4b,#4b4b4b,#4b4b4b,#4b4b4b",
				"unitColor": "#669933",
				"baseFontColor": "#eeeeee",
				"outCnvBaseFontColor": "#999999",
				"bgColor": "#222222",
				"borderColor" : "#eeeeee",	
				"canvasBgColor" : "#222222",
				"divLineColor" : "#333333",
				"legendBgColor" : "#222222",
				"plotBorderColor": "#353535",
				"toolTipColor": "#ffffff",
				"toolTipBgColor": "#000000",
				"valueFontColor": "#ffffff"
			},
			blue : {
				"top5Colors": "#0099ff,#17239f,#17239f,#17239f,#17239f,#17239f,#17239f,#17239f,#17239f,#17239f",
				"unitColor": "#0099ff",
				"baseFontColor": "#0099ff",
				"outCnvBaseFontColor": "#0099ff",
				"bgColor": "#000139",
				"borderColor" : "#eeeeee",
				"canvasBgColor" : "#000139",
				"divLineColor" : "#18265e",
				"legendBgColor" : "#000139",
				"plotBorderColor": "#000d94",
				"toolTipBorderThickness": "1",
				"toolTipColor": "#ffffff",
				"toolTipBgColor": "#000000",
				"valueFontColor": "#ffffff"
			}
		}
	}
	window.Component = Component;

})(jQuery);





$(function(){
	// rendering tab
	$('body').requestData($.Dashboard.url.dashboard_list, {},
		{callback : function(data){
			$.Dashboard.dashboardlist(data);
		}
	});

	// init dashboard addlayer
	$.Dashboard.dashboardInsert();
});