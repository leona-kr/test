'use strict';


_SL.nmspc("user").list = function() {

	var
	mCfg = {
		urlList : gCONTEXT_PATH + 'system/comuser_list.json',
		urlForm : gCONTEXT_PATH + 'system/comuser_form.html',
		formId : '#searchUserList',
		gridId : '#gridUserList'
	},
	
	m$ = {
		form : $(mCfg.formId),
		grid : $(mCfg.gridId)
	},

	ctrlCookie = new slui.cookies(),

	init = function() {
		ctrlCookie.init(mCfg.gridId);
		
		var $btnAdd = m$.grid.parent().siblings('.grid-bottom').find('.btn-add');

		// 초기 화면 구성
		drawGrid(m$.grid);

		// 이벤트 설정
		m$.form.find('.form-submit').off().on('click',function(){
			refresh();
		});

		$btnAdd.off().on('click',function(){
			viewDetail(mCfg.urlForm);
		});
	},

	drawGrid = function($grid){
		var gridSource = {
			datatype: "json",
			datafields: [
				{ name: "user_id", type: "string"},
				{ name: "user_nm", type: "string"},
				{ name: "mobile_no", type: "string"},
				{ name: "mail_addr", type: "string"},
				{ name: "role_nm", type: "string"},
				{ name: "group_nm", type: "string"},
				{ name: "cust_nm", type: "string"},
				{ name: "reg_dt", type: "string"}
			],
			root: 'rows',
			beforeprocessing: function(data){
				if (data != null){
					gridSource.totalrecords = data.totalRows;
				}
			},

			cache: false,
			url: mCfg.urlList
		},

		dataadapter = new $.jqx.dataAdapter(gridSource, {
			beforeLoadComplete: function(rows) {
				for (var i in rows) {
					 rows[i].reg_dt = _SL.formatDate(rows[i].reg_dt, 'yyyyMMddHHmmss', 'yyyy-MM-dd HH:mm:ss');
				}
				return rows;
			},
			formatData : function(data) {
				var params = {}, param, flds = $(mCfg.formId).serializeArray();
				for(param in flds) {
					params[flds[param].name] = flds[param].value;
				};
				$.extend(data, params);
				
				return data;
			},
			loadError: function(xhr, status, error){
				alert(error);
			}
		});

		$grid.jqxGrid({
			source: dataadapter,
			width: '100%',
			pagesize: ctrlCookie.getValue(),
			virtualmode: true,
			rendergridrows: function(obj){
				return obj.data;
			},
			columns: [
				{
					text: 'No', columntype: 'number', width:40, cellsalign:'center',
					cellsrenderer: function (row, column, value, defaulthtml) {
						return $(defaulthtml).text(value + 1)[0].outerHTML;
					}
				},
				{ text: '아이디', datafield: 'user_id'},
				{ text: '이름', datafield: 'user_nm', cellsalign:'center', width:'10%',
					cellsrenderer: function(row, column, value, defaulthtml, columnproperties, rowdata){
						return $(defaulthtml).html('<button type="button" class="btn-link">' + value + '</button>')[0].outerHTML;
					}
				},
				{ text: '권한', datafield: 'role_nm', width:'12%' },
				{ text: '기관', datafield: 'group_nm', width:'12%' },
				{ text: '담당기관', datafield: 'cust_nm', width:'12%' },
				{ text: '휴대폰번호', datafield: 'mobile_no', cellsalign:'center', width:'12%'},
				{ text: '이메일', datafield: 'mail_addr', width:'12%'},
				{ text: '등록일', datafield: 'reg_dt', cellsalign:'center'}
			]
		});
	
		$grid.on("cellclick", function (event){
			if(event.args.datafield === 'user_nm'){
				var userid = event.args.row.bounddata.user_id;
				viewDetail(mCfg.urlForm +'?user_id='+userid);
			}
		});

		ctrlCookie.changeEvent();
	},

	refresh = function() {
		m$.grid.jqxGrid('gotopage', 0);
		m$.grid.jqxGrid("updatebounddata");
	},

	viewDetail = function(url){
		var modal = new ModalPopup(url, {
			height: 650,
			onClose : function(){
				refresh();
			}
		});
	};
	
	return {
		init : init
	};

}();

$(function(){
	slapp.user.list.init();

	//접속자현황
	$("#btnSettingConnecting").togglePage(gCONTEXT_PATH + "system/login_user_list.html");

	//권한설정
	$("#btnSettingAuth").click(function(){
		new ModalPopup(gCONTEXT_PATH + "system/auth_form.html",{width:400,height:520});
	});
});