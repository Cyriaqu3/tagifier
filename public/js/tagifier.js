var app=angular.module("tagifier",["ui.router","ui.bootstrap","youtube-embed","ngSanitize","pascalprecht.translate"]);app.config(["$stateProvider","$urlRouterProvider",function($stateProvider,$urlRouterProvider){$urlRouterProvider.otherwise("/"),$stateProvider.state("main",{url:"/",templateUrl:"views/index.html",reload:!0}).state("about",{url:"/about",templateUrl:"views/about.html"}).state("file",{url:"/{fileUrl:.*?}",templateUrl:"views/file.html",controller:"fileCtrl",reload:!0})}]),app.config(["$translateProvider",function($translateProvider){$translateProvider.useSanitizeValueStrategy("sanitize"),$translateProvider.useStaticFilesLoader({prefix:"../locales/",suffix:".json"}),$translateProvider.preferredLanguage("en")}]),app.filter("trustUrl",["$sce",function($sce){return function(recordingUrl){return $sce.trustAsResourceUrl(recordingUrl)}}]),app.controller("mainCtrl",["$scope","$http","$rootScope","$translate","$window","$location",function($scope,$http,$rootScope,$translate,$window,$location){$scope.docReady=!1,$(window).load(function(){$window.ga("create","UA-48635201-13","auto"),$scope.docReady=!0,$scope.$apply()}),$scope.socket=io.connect(),$scope.socket.on("connect",function(){console.log("Socket connected !")}),$(document).hover(function(){$("#youtube-url").focus()}),$(document).click(function(){$("#youtube-url").focus()}),$scope.lastCommit="Tagifier",$http({method:"GET",url:"https://api.github.com/repos/CYRIAQU3/tagifier/commits"}).then(function(response){$scope.lastCommit=response.data[0].sha.substring(0,8),$scope.lastUser=response.data[0].author.login}),"denied"===Notification.permission&&"default"!==Notification.permission||isMobile.any||(console.log("notMobile"),Notification.requestPermission()),$rootScope.$on("$stateChangeStart",function(event,toState,toParams,fromState,fromParams){$(".toast").remove()}),$rootScope.$on("$stateChangeSuccess",function(event){$window.ga("send","pageview",$location.path())})}]),app.directive("targetBlank",function(){return{restrict:"A",link:function(scope,element,attrs){element.href;element.attr("target","_blank")}}});

app.controller("fileCtrl",function($scope,$state,$http,$stateParams,$translate,$location){$scope.canStartProcess=!1,$scope.processing=!1,$scope.canEditTags=!1,$scope.fileAvailable=!1,$scope.singleFile=!0,$scope.files={},$scope.currentFileIndex=0,$scope.exportFiles={},$scope.progress=0,$scope.progressStatus="waiting",$scope.captchatActive=!1,$scope.notified=!1,$scope.requestUrl=decodeURI($location.url().substr(1)).replace(/~2F/g,"/");var date=new Date;$http({method:"GET",url:"/api/infos/"+$scope.requestUrl}).then(function(response){parseFileData(response.data),$scope.canEditTags=!0,$scope.canStartProcess=!0,$scope.fileAvailable=!0},function(response){$scope.retreiveInfoError()});var parseFileData=function(data){if(data.constructor===Object)$scope.setFileVars(0,data);else{$scope.singleFile=!1;for(var i=0;i<data.length;i++)$scope.setFileVars(i,data[i])}};$scope.retreiveInfoError=function(){$scope.canEditTags=!1,$scope.canStartProcess=!1,alert($translate.instant("error.unableToRetreiveFileData")),$state.go("^.main")},$scope.requestFile=function(){$scope.processing=!0,$scope.socket.emit("fileRequest",{file:$scope.exportFile})},$scope.reloadPage=function(){location.reload()},$scope.requestProcess=function(){$scope.captchatActive?$scope.checkCaptchat():(console.log($translate.instant("file.pleaseEnterCaptchat")),$scope.generateCaptchat(),$("#captchat-modal").modal("show"))},$scope.generateCaptchat=function(){$scope.captchatActive=!0,ACPuzzle.create("buxt.317r8uls-ge9STPl6ilzpmYgl8G","solve-media-container","")},$scope.setCurrentFile=function(i){$scope.currentFileIndex=i},$scope.checkCaptchat=function(){var resp=$("#adcopy_response").val(),chal=$("#adcopy_challenge").val();$http({method:"POST",url:"/checker",data:{chal:chal,resp:resp}}).then(function(r){$("#captchat-modal").modal("hide"),$scope.captchatActive=!1,$scope.processing=!0,$scope.canEditTags=!1,$scope.canStartProcess=!1,$scope.requestFile()},function(r){$("#captchat-modal").modal("show"),$scope.processing=!1,alert($translate.instant("error.invalidCaptchat")),$scope.generateCaptchat()})},$scope.socket.on("yd_event",function(ev){if(console.log(ev),"file_infos"==ev.event&&console.log(ev.data),"progress"==ev.event&&ev.data.videoId==$scope.exportFiles.id){$scope.processing=!0,$scope.canEditTags=!1,$scope.canStartProcess=!1;ev.data;$scope.progress=ev.data.progress.percentage,$scope.progressStatus="processing",$scope.$apply()}"error"==ev.event&&($scope.buttonLabel="Download",$scope.processing=!1,$scope.canEditTags=!0,$scope.canStartProcess=!0,alert($translate.instant("error.internalError"))),"finished"==ev.event&&ev.data.id==$scope.exportFile.id&&($scope.progressStatus="ready",$scope.processing=!1,$scope.canEditTags=!0,$scope.canStartProcess=!0,$scope.exportFile.url=ev.data.url.replace("./exports/","musics/"),$scope.exportFile.fullUrl=$scope.exportFile.url+"?name="+$scope.exportFile.artist+" - "+$scope.exportFile.title,$scope.tgfDownload()),$scope.$apply()}),$scope.setFileVars=function(index,data){$scope.files[index]=data,$scope.exportFiles[index]={lockedAttrs:[]},$scope.exportFiles[index].image=$scope.files[index].thumbnail,$scope.exportFiles[index].year=date.getFullYear(),data.upload_date&&($scope.exportFiles[index].year=data.upload_date.substr(0,4)),$scope.exportFiles[index].track=index+1;var pt=$scope.files[index].fulltitle.split(" - ");pt.length>1?($scope.exportFiles[index].tagPattern="%artist% - %title%",$scope.exportFiles[index].fileNamePattern="%artist% - %title%"):($scope.exportFiles[index].tagPattern="%title%",$scope.exportFiles[index].fileNamePattern="%title%"),$scope.genPattern(index)},$scope.overrideProp=function(propName,sourceIndex,isPattern){for(var file in $scope.exportFiles){var targetIndex=parseInt(file);sourceIndex==file||$scope.propIsLocked(propName,targetIndex)||($scope.exportFiles[targetIndex][propName]=$scope.exportFiles[sourceIndex][propName],setAnimation("tag-updated",$(".file-"+targetIndex))),sourceIndex!=file&&$scope.propIsLocked(propName,targetIndex)&&setAnimation("tag-locked",$(".file-"+targetIndex)),isPattern&&$scope.genPattern(targetIndex)}console.log('The tag "'+$scope.exportFiles[sourceIndex][propName]+'" ('+propName+") from the track "+sourceIndex+" has been applyed to all tracks")},$scope.togglePropLock=function(propName,sourceIndex){if(isInArray(propName,$scope.exportFiles[sourceIndex].lockedAttrs)){var index=$scope.exportFiles[sourceIndex].lockedAttrs.indexOf(propName);$scope.exportFiles[sourceIndex].lockedAttrs.splice(index,1)}else $scope.exportFiles[sourceIndex].lockedAttrs.push(propName)},$scope.propIsLocked=function(propName,sourceIndex){return!!isInArray(propName,$scope.exportFiles[sourceIndex].lockedAttrs)},$scope.genPattern=function(index){console.log("Generating pattern for "+$scope.files[index].fulltitle+"...");for(var fileData=$scope.exportFiles[index],pattern=fileData.tagPattern.replace(/%([a-zA-Z0-9])\w+%/g,"(.*)"),fileVars=fileData.tagPattern.match(/%([a-zA-Z0-9])\w+%/g),i=0;i<fileVars.length;i++)fileVars[i]=fileVars[i].replace("%","").replace("%","");var extrData=$scope.files[index].fulltitle.match(new RegExp(pattern));if(extrData){for(var i=0;i<fileVars.length;i++)extrData[i+1]&&(fileData[fileVars[i]]=extrData[i+1]);if(!fileData.fileNamePattern)return void(fileData.fileName=fileData.artist+" - "+fileData.title);for(var fileVars=fileData.fileNamePattern.match(/%([a-zA-Z0-9])\w+%/g),fnp=fileData.fileNamePattern,i=0;i<fileVars.length;i++){var tag=fileVars[i].replace("%","").replace("%","");fnp=fnp.replace(fileVars[i],fileData[tag])}fileData.fileName=fnp}},$scope.tgfDownload=function(){var notification,nOptions={title:"File Ready",body:"Your file is ready to download, click on this notification to download it !",icon:"img/tgf/icon_circle.png"};if("granted"!==Notification.permission||$scope.notified||isMobile.any)console.log("Your file is ready");else{$scope.notified=!0;var notification=new Notification(nOptions.title,nOptions);notification.onclick=function(){window.open($scope.exportFile.fullUrl,"_blank"),notification.close()}}}});var YTDurationToSeconds=function(duration){var match=duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/),hours=parseInt(match[1])||0,minutes=parseInt(match[2])||0,seconds=parseInt(match[3])||0;return 3600*hours+60*minutes+seconds},getBestThumbnail=function(t){return t.maxres?t.maxres.url:t.high?t.high.url:t.medium?t.medium.url:t.standard?t.standard.url:""},isInArray=function(value,array){return array.indexOf(value)>-1},setAnimation=function(animation,target){target.addClass(animation),setTimeout(function(){target.removeClass(animation)},500)};
app.controller("mainInputCtrl",function($scope,$state,$translate){$scope.currentUrl,$scope.goodUrl=!1,$scope.playlist=!1,$scope.currentId,$scope.checkUrl=function(){$scope.goodUrl=!0},$scope.miSubmit=function(){var convertUrl=encodeURI($scope.currentUrl);console.log(convertUrl),$scope.goodUrl?$state.go("file",{fileUrl:convertUrl}):alert($translate.instant("error.invalidLink"))}});
app.controller("youtubeCtrl",function($scope,$state,$http,$stateParams,$translate){$scope.baseStr,$scope.userPattern,$scope.pattern,$scope.canStartProcess=!1,$scope.processing=!1,$scope.canEditTags=!1,$scope.file={},$scope.progress=0,$scope.progressStatus="waiting",$scope.captchatActive=!1,$scope.notified=!1,$scope.exportFile={},$scope.retreiveInfoError=function(){$scope.canEditTags=!1,$scope.canStartProcess=!1,Materialize.toast($translate.instant("error.unableToRetreiveFileData"),1e4),$scope.$apply()},$scope.requestFile=function(){$scope.processing=!0,$scope.socket.emit("fileRequest",{file:$scope.exportFile})},$scope.requestProcess=function(){$scope.captchatActive?$scope.checkCaptchat():(Materialize.toast($translate.instant("file.pleaseEnterCaptchat"),4e3),$scope.generateCaptchat())},$scope.generateCaptchat=function(){$scope.captchatActive=!0,ACPuzzle.create("buxt.317r8uls-ge9STPl6ilzpmYgl8G","solve-media-container","")},$scope.checkCaptchat=function(){var resp=$("#adcopy_response").val(),chal=$("#adcopy_challenge").val();$http({method:"POST",url:"/checker",data:{chal:chal,resp:resp}}).then(function(r){$scope.captchatActive=!1,$scope.processing=!0,$scope.canEditTags=!1,$scope.canStartProcess=!1,$scope.requestFile()},function(r){$scope.processing=!1,Materialize.toast($translate.instant("error.invalidCaptchat"),4e3),$scope.generateCaptchat()})},$scope.socket.on("yd_event",function(ev){console.log(ev),"progress"==ev.event&&ev.data.videoId==$scope.exportFile.id&&($scope.processing=!0,$scope.canEditTags=!1,$scope.canStartProcess=!1,$scope.progress=ev.data.progress.percentage,$scope.progressStatus="processing",$scope.$apply()),"error"==ev.event&&($scope.buttonLabel="Download",$scope.processing=!1,$scope.canEditTags=!0,$scope.canStartProcess=!0,Materialize.toast($translate.instant("error.internalError"),4e3)),"finished"==ev.event&&ev.data.id==$scope.exportFile.id&&($scope.progressStatus="ready",$scope.processing=!1,$scope.canEditTags=!0,$scope.canStartProcess=!0,$scope.exportFile.url=ev.data.url.replace("./exports/","musics/"),$scope.tgfDownload()),$scope.$apply()}),$scope.tgfDownload=function(){var notification,nOptions={title:"File Ready",body:"Your file is ready to download, click on this notification to download it !",icon:"img/tgf/icon_circle.png"};if("granted"!==Notification.permission||$scope.notified||isMobile.any)Materialize.toast("Your file is ready",4e3);else{$scope.notified=!0;var notification=new Notification(nOptions.title,nOptions);notification.onclick=function(){window.open($scope.exportFile.url+"?name="+$scope.exportFile.artist+" - "+$scope.exportFile.title,"_blank"),notification.close()}}},$scope.YTDurationToSeconds=function(duration){var match=duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/),hours=parseInt(match[1])||0,minutes=parseInt(match[2])||0,seconds=parseInt(match[3])||0;return 3600*hours+60*minutes+seconds},$scope.getBestThumbnail=function(t){return t.maxres?t.maxres.url:t.high?t.high.url:t.medium?t.medium.url:t.standard?t.standard.url:""}});