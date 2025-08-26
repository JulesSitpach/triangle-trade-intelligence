/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./pages/_app.js":
/*!***********************!*\
  !*** ./pages/_app.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ App)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/router */ \"./node_modules/next/router.js\");\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! next/head */ \"next/head\");\n/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_head__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../styles/globals.css */ \"./styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_4__);\n/* harmony import */ var _styles_components_usmca_workflow_css__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../styles/components/usmca-workflow.css */ \"./styles/components/usmca-workflow.css\");\n/* harmony import */ var _styles_components_usmca_workflow_css__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_styles_components_usmca_workflow_css__WEBPACK_IMPORTED_MODULE_5__);\n\n\n\n\n\n\n// import '../lib/i18n' // Initialize proper i18n system\n// import GlobalHSCodeChat from '../components/GlobalHSCodeChat'\n// import BilingualSalesChatBot from '../components/BilingualSalesChatBot'\n// import { TriangleStateProvider } from '../lib/state/TriangleStateContext'\n// import ErrorBoundary from '../components/ErrorBoundary'\nfunction App({ Component, pageProps }) {\n    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_2__.useRouter)();\n    const [showLoading, setShowLoading] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(true);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        // Hide loading overlay when React hydrates\n        const timer = setTimeout(()=>{\n            setShowLoading(false);\n            // Ensure dark background is visible\n            document.documentElement.style.visibility = \"visible\";\n            document.body.style.visibility = \"visible\";\n        }, 100);\n        return ()=>clearTimeout(timer);\n    }, []);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)((next_head__WEBPACK_IMPORTED_MODULE_3___default()), {\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"title\", {\n                        children: \"Triangle Intelligence - Simplified\"\n                    }, void 0, false, {\n                        fileName: \"/mnt/d/bacjup/triangle-simple/pages/_app.js\",\n                        lineNumber: 31,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"meta\", {\n                        name: \"description\",\n                        content: \"Simplified tariff optimization and triangle routing intelligence for reliable operation\"\n                    }, void 0, false, {\n                        fileName: \"/mnt/d/bacjup/triangle-simple/pages/_app.js\",\n                        lineNumber: 32,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"meta\", {\n                        name: \"viewport\",\n                        content: \"width=device-width, initial-scale=1\"\n                    }, void 0, false, {\n                        fileName: \"/mnt/d/bacjup/triangle-simple/pages/_app.js\",\n                        lineNumber: 33,\n                        columnNumber: 9\n                    }, this)\n                ]\n            }, void 0, true, {\n                fileName: \"/mnt/d/bacjup/triangle-simple/pages/_app.js\",\n                lineNumber: 30,\n                columnNumber: 7\n            }, this),\n            showLoading && /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                className: \"loading-overlay\",\n                children: \"Triangle Intelligence Loading... (Simplified Mode)\"\n            }, void 0, false, {\n                fileName: \"/mnt/d/bacjup/triangle-simple/pages/_app.js\",\n                lineNumber: 38,\n                columnNumber: 9\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                ...pageProps\n            }, void 0, false, {\n                fileName: \"/mnt/d/bacjup/triangle-simple/pages/_app.js\",\n                lineNumber: 43,\n                columnNumber: 7\n            }, this)\n        ]\n    }, void 0, true);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fYXBwLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQTJDO0FBQ0o7QUFDWDtBQUNFO0FBQ2tCO0FBQ2hELHdEQUF3RDtBQUN4RCxnRUFBZ0U7QUFDaEUsMEVBQTBFO0FBQzFFLDRFQUE0RTtBQUM1RSwwREFBMEQ7QUFFM0MsU0FBU0ksSUFBSSxFQUFFQyxTQUFTLEVBQUVDLFNBQVMsRUFBRTtJQUNsRCxNQUFNQyxTQUFTTCxzREFBU0E7SUFDeEIsTUFBTSxDQUFDTSxhQUFhQyxlQUFlLEdBQUdSLCtDQUFRQSxDQUFDO0lBRS9DRCxnREFBU0EsQ0FBQztRQUNSLDJDQUEyQztRQUMzQyxNQUFNVSxRQUFRQyxXQUFXO1lBQ3ZCRixlQUFlO1lBQ2Ysb0NBQW9DO1lBQ3BDRyxTQUFTQyxlQUFlLENBQUNDLEtBQUssQ0FBQ0MsVUFBVSxHQUFHO1lBQzVDSCxTQUFTSSxJQUFJLENBQUNGLEtBQUssQ0FBQ0MsVUFBVSxHQUFHO1FBQ25DLEdBQUc7UUFFSCxPQUFPLElBQU1FLGFBQWFQO0lBQzVCLEdBQUcsRUFBRTtJQUVMLHFCQUNFOzswQkFDRSw4REFBQ1Asa0RBQUlBOztrQ0FDSCw4REFBQ2U7a0NBQU07Ozs7OztrQ0FDUCw4REFBQ0M7d0JBQUtDLE1BQUs7d0JBQWNDLFNBQVE7Ozs7OztrQ0FDakMsOERBQUNGO3dCQUFLQyxNQUFLO3dCQUFXQyxTQUFROzs7Ozs7Ozs7Ozs7WUFJL0JiLDZCQUNDLDhEQUFDYztnQkFBSUMsV0FBVTswQkFBa0I7Ozs7OzswQkFLbkMsOERBQUNsQjtnQkFBVyxHQUFHQyxTQUFTOzs7Ozs7OztBQUc5QiIsInNvdXJjZXMiOlsid2VicGFjazovL3RyaWFuZ2xlLWludGVsbGlnZW5jZS1wbGF0Zm9ybS8uL3BhZ2VzL19hcHAuanM/ZTBhZCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VSb3V0ZXIgfSBmcm9tICduZXh0L3JvdXRlcidcbmltcG9ydCBIZWFkIGZyb20gJ25leHQvaGVhZCdcbmltcG9ydCAnLi4vc3R5bGVzL2dsb2JhbHMuY3NzJ1xuaW1wb3J0ICcuLi9zdHlsZXMvY29tcG9uZW50cy91c21jYS13b3JrZmxvdy5jc3MnXG4vLyBpbXBvcnQgJy4uL2xpYi9pMThuJyAvLyBJbml0aWFsaXplIHByb3BlciBpMThuIHN5c3RlbVxuLy8gaW1wb3J0IEdsb2JhbEhTQ29kZUNoYXQgZnJvbSAnLi4vY29tcG9uZW50cy9HbG9iYWxIU0NvZGVDaGF0J1xuLy8gaW1wb3J0IEJpbGluZ3VhbFNhbGVzQ2hhdEJvdCBmcm9tICcuLi9jb21wb25lbnRzL0JpbGluZ3VhbFNhbGVzQ2hhdEJvdCdcbi8vIGltcG9ydCB7IFRyaWFuZ2xlU3RhdGVQcm92aWRlciB9IGZyb20gJy4uL2xpYi9zdGF0ZS9UcmlhbmdsZVN0YXRlQ29udGV4dCdcbi8vIGltcG9ydCBFcnJvckJvdW5kYXJ5IGZyb20gJy4uL2NvbXBvbmVudHMvRXJyb3JCb3VuZGFyeSdcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQXBwKHsgQ29tcG9uZW50LCBwYWdlUHJvcHMgfSkge1xuICBjb25zdCByb3V0ZXIgPSB1c2VSb3V0ZXIoKVxuICBjb25zdCBbc2hvd0xvYWRpbmcsIHNldFNob3dMb2FkaW5nXSA9IHVzZVN0YXRlKHRydWUpXG4gIFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIC8vIEhpZGUgbG9hZGluZyBvdmVybGF5IHdoZW4gUmVhY3QgaHlkcmF0ZXNcbiAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgc2V0U2hvd0xvYWRpbmcoZmFsc2UpXG4gICAgICAvLyBFbnN1cmUgZGFyayBiYWNrZ3JvdW5kIGlzIHZpc2libGVcbiAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnXG4gICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSdcbiAgICB9LCAxMDApXG5cbiAgICByZXR1cm4gKCkgPT4gY2xlYXJUaW1lb3V0KHRpbWVyKVxuICB9LCBbXSlcblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8SGVhZD5cbiAgICAgICAgPHRpdGxlPlRyaWFuZ2xlIEludGVsbGlnZW5jZSAtIFNpbXBsaWZpZWQ8L3RpdGxlPlxuICAgICAgICA8bWV0YSBuYW1lPVwiZGVzY3JpcHRpb25cIiBjb250ZW50PVwiU2ltcGxpZmllZCB0YXJpZmYgb3B0aW1pemF0aW9uIGFuZCB0cmlhbmdsZSByb3V0aW5nIGludGVsbGlnZW5jZSBmb3IgcmVsaWFibGUgb3BlcmF0aW9uXCIgLz5cbiAgICAgICAgPG1ldGEgbmFtZT1cInZpZXdwb3J0XCIgY29udGVudD1cIndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xXCIgLz5cbiAgICAgIDwvSGVhZD5cbiAgICAgIFxuICAgICAgey8qIExvYWRpbmcgb3ZlcmxheSAtIGhpZGRlbiB3aGVuIFJlYWN0IGh5ZHJhdGVzICovfVxuICAgICAge3Nob3dMb2FkaW5nICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJsb2FkaW5nLW92ZXJsYXlcIj5cbiAgICAgICAgICBUcmlhbmdsZSBJbnRlbGxpZ2VuY2UgTG9hZGluZy4uLiAoU2ltcGxpZmllZCBNb2RlKVxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG4gICAgICBcbiAgICAgIDxDb21wb25lbnQgey4uLnBhZ2VQcm9wc30gLz5cbiAgICA8Lz5cbiAgKVxufSJdLCJuYW1lcyI6WyJ1c2VFZmZlY3QiLCJ1c2VTdGF0ZSIsInVzZVJvdXRlciIsIkhlYWQiLCJBcHAiLCJDb21wb25lbnQiLCJwYWdlUHJvcHMiLCJyb3V0ZXIiLCJzaG93TG9hZGluZyIsInNldFNob3dMb2FkaW5nIiwidGltZXIiLCJzZXRUaW1lb3V0IiwiZG9jdW1lbnQiLCJkb2N1bWVudEVsZW1lbnQiLCJzdHlsZSIsInZpc2liaWxpdHkiLCJib2R5IiwiY2xlYXJUaW1lb3V0IiwidGl0bGUiLCJtZXRhIiwibmFtZSIsImNvbnRlbnQiLCJkaXYiLCJjbGFzc05hbWUiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./pages/_app.js\n");

/***/ }),

/***/ "./styles/components/usmca-workflow.css":
/*!**********************************************!*\
  !*** ./styles/components/usmca-workflow.css ***!
  \**********************************************/
/***/ (() => {



/***/ }),

/***/ "./styles/globals.css":
/*!****************************!*\
  !*** ./styles/globals.css ***!
  \****************************/
/***/ (() => {



/***/ }),

/***/ "next/dist/compiled/next-server/pages.runtime.dev.js":
/*!**********************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages.runtime.dev.js" ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/pages.runtime.dev.js");

/***/ }),

/***/ "next/head":
/*!****************************!*\
  !*** external "next/head" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/head");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react-dom":
/*!****************************!*\
  !*** external "react-dom" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("react-dom");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@swc"], () => (__webpack_exec__("./pages/_app.js")));
module.exports = __webpack_exports__;

})();