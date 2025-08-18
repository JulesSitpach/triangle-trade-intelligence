"use strict";(()=>{var e={};e.id=3343,e.ids=[3343],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},7720:(e,r,t)=>{t.r(r),t.d(r,{config:()=>c,default:()=>l,routeModule:()=>u});var a={};t.r(a),t.d(a,{default:()=>handler});var n=t(1802),s=t(7153),i=t(6249),o=t(9475);async function handler(e,r){if("POST"!==e.method)return r.status(405).json({error:"Method not allowed"});try{let{question:t,sessionId:a,language:n="en"}=e.body;if(!t)return r.status(400).json({error:"Question is required"});let s=Object(function(){var e=Error("Cannot find module '../../../lib/partnership-swarm-agents'");throw e.code="MODULE_NOT_FOUND",e}())(),i={sessionId:a,language:n,timestamp:new Date().toISOString()},l=await s.handleMessage(t,i);return o.ZP.log("PARTNERSHIP_CHAT",{sessionId:a,question:t.substring(0,100),responseLength:l.length,language:n}),r.status(200).json({success:!0,response:l,sessionId:a,timestamp:new Date().toISOString(),agent:"partnership_specialist"})}catch(e){return console.error("Partnership chat error:",e),o.ZP.log("PARTNERSHIP_CHAT_ERROR",{error:e.message,stack:e.stack}),r.status(500).json({success:!1,error:"Internal server error",response:`🤝 Mexican Partnership Specialist

I'm temporarily experiencing technical difficulties. However, I can still help you with:

💰 **Commission Calculations** - Share your deal details
🎯 **Partner Matching** - Tell me the industry and location  
📊 **Performance Analytics** - Request pipeline analysis
🔍 **Lead Qualification** - Provide client information

Please try your question again, or contact technical support if the issue persists.

\xa1Estoy aqu\xed para ayudarte con partnerships mexicanos!`})}}!function(){var e=Error("Cannot find module '../../../lib/partnership-swarm-agents'");throw e.code="MODULE_NOT_FOUND",e}();let l=(0,i.l)(a,"default"),c=(0,i.l)(a,"config"),u=new n.PagesAPIRouteModule({definition:{kind:s.x.PAGES_API,page:"/api/partnership/chat",pathname:"/api/partnership/chat",bundlePath:"",filename:""},userland:a})}};var r=require("../../../webpack-api-runtime.js");r.C(e);var __webpack_exec__=e=>r(r.s=e),t=r.X(0,[4222,9475],()=>__webpack_exec__(7720));module.exports=t})();