// ==UserScript==
// @name         open anime comments
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  Allows access to diferent versions of comments on gogoanime
// @author       The Web
// @updateURL    https://raw.githubusercontent.com/s3theweb/open-anime-comments/main/script.user.js
// @downloadURL  https://raw.githubusercontent.com/s3theweb/open-anime-comments/main/script.user.js
// @include      http*://gogoanime.*/*
// @include      http*://*.gogoanime.*/*
// @icon         https://www.google.com/s2/favicons?domain=openanimecomments.disqus.com
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
	'use strict';
	function findOpenAnimeUrl(){
		//this generates a url for disqus that is linked to the specifics of the anime
		//for example for an anime's info page it would generate https://openanimecomments/anime/anime-name-here/about
		//and for an episode 7 page it would generate https://openanimecomments/anime/anime-name-here/7
		//or a place to post anything https://openanimecomments/shitpost
		//the anime name should have spaces replaced with minus symbols and it should be lower case
		let host = "https://openanimecomments/"
		if(location.host.indexOf("gogoanime") > -1){
			if(location.href.indexOf("category") > 0){
				let animeName = location.href.split("/").reverse()[0]
				if(animeName.length > 2){
					return {
						url:host + "anime/"+animeName+"/about",
						name:animeName.replace(/\-/g," "),
					}
				}else{
					return false
				}
			}
			var episodeIndex = location.href.indexOf("episode")
			if(episodeIndex > -1 && location.href.length - episodeIndex <= 12){
				let animeName = location.href.substring(0,episodeIndex-1).split("/").reverse()[0]
				let episode = parseFloat(location.href.substring(episodeIndex+8).replace(/\-/g,"."))
				if(animeName.length > 2 && isFinite(episode)){
					return {
						url:host + "anime/"+animeName+"/"+episode,
						name:animeName.replace(/\-/g," ")+" episode "+episode,
					}
				}else{
					return false
				}
			}
		}
	}

	function load(disqusFrame){
		let baseUrl = new URL(disqusFrame.src)
		let container = disqusFrame.parentElement
		let startingSection = GM_getValue("animeCommentSectionDefault",undefined) || "default"

		function setDomain(dusqusDomain,pageDomain,customUrl){
			let newURL = new URL(baseUrl)
			newURL.searchParams.set("f",dusqusDomain)
			if(customUrl){
				let pageUrl = new URL(newURL.searchParams.get("t_u"))
			}else{
				let pageUrl = new URL(newURL.searchParams.get("t_u"))
				pageUrl.host=pageDomain
				newURL.searchParams.set("t_u",pageUrl.toString())
			}
			disqusFrame.src=newURL.toString()
			//let countScript = document.createElement("script")
			//countScript.src="https://gogoanimetv.disqus.com/count-data.js?2="+encodeURIComponent(pageUrl.toString())
			//document.head.appendChild(countScript)
		}
		function openDefault(){
			let defaultDusqusDomain = baseUrl.searchParams.get("f")
			let defaultPageDomain = (new URL(baseUrl.searchParams.get("t_u"))).host
			setDomain(defaultDusqusDomain,defaultPageDomain)
		}
		function openOld(){
			setDomain("gogoanimetv","gogoanime.io")
		}
		var openAnimeUrl = findOpenAnimeUrl()
		function openCustom(){
			let newURL = new URL(baseUrl)
			newURL.search=""
			newURL.searchParams.set("base","default")
			newURL.searchParams.set("f","openanimecomments")
			newURL.searchParams.set("t_u",openAnimeUrl.url)
			newURL.searchParams.set("t_t",openAnimeUrl.name)
			newURL.searchParams.set("t_d",openAnimeUrl.name)
			newURL.searchParams.set("s_o","default")
			disqusFrame.src=newURL.toString()
		}
		let sections = {
			default:{
				name:"Current",
				description:"The comment section that shows up normaly",
				open:openDefault
			},
			orignal:{
				name:"Old",
				description:"The original comment section that got nuked by gogoanime",
				open:openOld
			},

		}
		if(openAnimeUrl){
			console.log(openAnimeUrl)
			sections.custom={
				name:"Custom",
				description:"A comment section that is less hevely moderated and supports images",
				open:openCustom
			}
		}
		let styles = document.createElement("style")
		styles.innerHTML = `
			.commentSectionButton{
				margin:0.2em;
				padding:0.5em;
				transition: all 0.3s linear 0s;
				background-color: #363636;
				color: #fff;
			}
			.commentSectionButton:hover{
				transition: all 0s linear 0s;
				background-color: #ffc119;
			}
			.commentSectionButtonActive{
				background-color: #ffc119;
			}
			.commentSectionTable{
				text-align:center;
				width:100%;
				font-size:1.5em;
				border-collapse: separate;
        		border-spacing: 0.5em 0.5em;
			}
		`
		document.head.appendChild(styles)
		let sectionsLength = Object.keys(sections).length
		let table = document.createElement("table")
		table.className="commentSectionTable"

		let trTitle = document.createElement("tr")
		let tdTitle = document.createElement("td")
		tdTitle.style.fontSize="1.3em"
		tdTitle.innerHTML = "Comment section selection"
		tdTitle.setAttribute("colspan",sectionsLength)
		trTitle.appendChild(tdTitle)

		let trDefault = document.createElement("tr")
		let tdDefault = document.createElement("td")
		tdDefault.style.fontSize="0.75em"
		tdDefault.style.textAlign="right"
		tdDefault.style.color="#fff"
		tdDefault.innerHTML = "Default comment section:"
		tdDefault.setAttribute("colspan",sectionsLength)
		let selectionDefault = document.createElement("select")
		selectionDefault.style.fontSize="0.9em"
		let selectionDefaultHTML = ""
		for(let x in sections){
			selectionDefaultHTML += '<option value="'+x+'">'+sections[x].name+'</option>'
		}
		selectionDefault.innerHTML=selectionDefaultHTML
		selectionDefault.value = startingSection
		selectionDefault.addEventListener("input",()=>{
			sections[selectionDefault.value].element.click()
			GM_setValue("animeCommentSectionDefault",selectionDefault.value)
		})
		tdDefault.appendChild(selectionDefault)
		trDefault.appendChild(tdDefault)

		let trSection = document.createElement("tr")
		for(let x in sections){
			let section = sections[x]
			let td = document.createElement("td")
			td.className = "commentSectionButton"
			if(startingSection == x){
				td.className += " commentSectionButtonActive"
				try{
					section.open()
				}catch(e){}
			}
			td.style.width = 100/sectionsLength+"%"
			td.innerHTML = section.name
			td.title = section.description
			td.openFunction = section.open
			td.addEventListener("click",function(){
				for(let x in sections){
					sections[x].element.className = "commentSectionButton"
				}
				this.className = "commentSectionButton commentSectionButtonActive"
				this.openFunction()
			})
			trSection.appendChild(td)
			section.element=td
		}
		table.appendChild(trTitle)
		table.appendChild(trSection)
		table.appendChild(trDefault)
		container.insertBefore(table, container.firstChild)
		console.log("gogoanime comments userscript loaded")
	}
	let findinterval = setInterval(()=>{
		let disqusFrame = document.getElementById("disqus_thread").children[0]
		if(disqusFrame){
			clearInterval(findinterval)
			load(disqusFrame)
		}
	},500)

	/*example default iframe uri from 2021-8-21
	https://disqus.com/embed/comments/
	?base=default
	&f=gogoanimetv
	&t_u=https%3A%2F%2Fgogoanime.vc%2Ftsuki-ga-michibiku-isekai-douchuu-episode-7
	&t_d=Tsuki+ga+Michibiku+Isekai+Douchuu+Episode+7+English+Subbed+at+gogoanime
	&t_t=Tsuki+ga+Michibiku+Isekai+Douchuu+Episode+7+English+Subbed+at+gogoanime
	&s_o=default#version=b13e0be07a9ecfcc7b6089b48d9956ca
	*/
})();