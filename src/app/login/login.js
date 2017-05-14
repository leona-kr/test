//# sourceURL=login.js

'use strict';

_SL.nmspc("login").form = function() { 
	var
	// Config 정의
	mCfg = {
		form		: '[name=formLogin]',
		userId		: '[name=userId]',
		userPswd	: '[name=userPswd]',
		checkSave	: '[name=checkSave]',
		btnLogin	: '.btn-login',
		
		cookieUserId : 'saveUserId',
		
		urlLogin		: gCONTEXT_PATH + 'login/login.do',
		urlGetKey		: gCONTEXT_PATH + 'login/get_key.json'
	},
	
	// JQuery 객체 변수
	m$ = {
		form			: $(mCfg.form),
		userId		: $(mCfg.userId),
		userPswd	: $(mCfg.userPswd),
		checkSave	: $(mCfg.checkSave),
		btnLogin	: $(mCfg.btnLogin)
	},
	
	// 현재 상태 변수
	mState = { },
	
	init = function() {
		var cookieId;
		
		// 라이선스 체크
		globalui.notices.licence();
		
		// Bind Event
		m$.userId.on("keyup", onKeyupEnter);
		m$.userPswd.on("keyup", onKeyupEnter);
		m$.btnLogin.on("click", checkForm).on("keyup", onKeyupEnter);
		
		if(m$.userId.val() == "") {
			if(cookieId = $.cookie(mCfg.cookieUserId)) {
				m$.userId.val(cookieId);
				m$.checkSave.prop("checked", true);
			}
			else {
				m$.userId.focus();
				return;
			}
		}

		m$.userPswd.focus();
	},
	
	onKeyupEnter = function(event) { 
		if(event.keyCode==13) checkForm(); 
	},
		
	checkForm = function(event) {
		if (!_SL.validate()) return;
		
		if(m$.checkSave.prop("checked")) {
			$.cookie(mCfg.cookieUserId, m$.userId.val(), {expires:30});
		}
		else {
			$.cookie(mCfg.cookieUserId, "");
		}
		AESUDologin(false);
	},
	
	AESUDologin = function(bForceLogin){
		
		$('body').requestData(mCfg.urlGetKey, {}, { callback : function(rsJson) {
			var rsa = new RSAKey();
			rsa.setPublic(rsJson.publicKeyModulus, rsJson.publicKeyExponent); 
			
			var securedUsername = rsa.encrypt(m$.userId.val());
			var securedPassword = rsa.encrypt(m$.userPswd.val());				
				
			doLogin(bForceLogin, securedUsername, securedPassword);
		} });
		
	},
	
	doLogin = function(bForceLogin, securedUsername, securedPassword) {
		var
		rqData = {
			userId 		: securedUsername,
			userPswd	: securedPassword,
			forceLogin	: bForceLogin ? "Y" : "N"
		};
		
		$('body').requestData(mCfg.urlLogin, rqData, {callback : function(rsJson, rsCd, rsMsg) {
			var strUrl;
		
			switch(rsCd) {
			case "INF_LI_0001" :
				/////////로그인시 첫화면 경로설정rsJson.loginOpt
				strUrl = $.cookie(mCfg.cookieUserId);
				if(!!rsJson.loginUrl && rsJson.loginUrl != ""){
					strUrl = rsJson.loginUrl;  //로그인시 첫화면 설정
				}else {
					strUrl = gCONTEXT_PATH;
				}
				
				//공지사항 여부 설정
				if(rsJson.popupNotice) {
					strUrl += (strUrl.indexOf("?") == -1 ? "?" : "&") + "popupNotice=Y";
				}
				
				location.href = strUrl;
				break;
				////////
			case "INF_LI_0010" :
				_confirm(rsJson.rsMsg, {onAgree : function() { AESUDologin(true); } });
				break;
			default :
				_alert(rsMsg);
				break;
			}
		}} );
	};

	init();
}();
