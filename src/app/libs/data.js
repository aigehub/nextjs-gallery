"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var provinces = require("./provinces.json");
var API_URL = "https://pig.zwidi.cn/";
var navItems = {
    0: [
        { text: "首页", link: "homePage.html" },
        { text: "登录", link: "userlogin.html" },
        { text: "EXIT", link: "#" },
    ],
    1: [
        { text: "首页", link: "homePage.html" },
        { text: "用户管理", link: "userManage.html" },
        { text: "视频审核", link: "videoStateManage.html" },
        { text: "编号/工作", link: "codeJobManage.html" },
        { text: "TOP", link: "topManage.html" },
        { text: "IPBAN", link: "ipBanManage.html" },
        { text: "修改密码", link: "editPassword.html" },
        { text: "EXIT", link: "#" },
    ],
    2: [
        { text: "首页", link: "homePage.html" },
        { text: "相册管理", link: "picManage.html" },
        { text: "金币记录", link: "rmbLog.html" },
        { text: "浏览统计", link: "browseLog.html" },
        { text: "修改密码", link: "editPassword.html" },
        { text: "EXIT", link: "#" },
    ],
    3: [
        //
        { text: "首页", link: "homePage.html" },
        { text: "发单设置", link: "createGuest.html" },
        { text: "拉黑管理", link: "blockManage.html" },
        { text: "金币记录", link: "rmbLog.html" },
        { text: "修改密码", link: "editPassword.html" },
        { text: "EXIT", link: "#" },
    ],
    4: [
        { text: "首页", link: "homePage.html" },
        { text: "EXIT", link: "#" },
    ],
};
// window.LOGIN_RESTRICT_START = 3;
// window.LOGIN_RESTRICT_END = 10;
// const hostname = window.location.hostname;
// if (hostname === 'ppjimei.com') {
// 	window.API_URL = 'https://ppjimei.com';
// } else if (hostname === 'xxjimei.com') {
// 	window.API_URL = 'https://xxjimei.com';
// } else if (hostname === 'niu.mvay.cn') {
// 	window.API_URL = 'https://niu.mvay.cn';
// } else if (hostname === 'niu.oognb.cn') {
// 	window.API_URL = 'https://niu.oognb.cn';
// } else if (hostname === 'niu.pqten.cn') {
// 	window.API_URL = 'https://niu.pqten.cn';
// } else if (hostname === 'pig.zwidi.cn') {
// 	window.API_URL = 'https://pig.zwidi.cn';
// } else if (hostname === 'pig.owknm.cn') {
// 	window.API_URL = 'https://pig.owknm.cn';
// } else if (hostname === 'lisi.mvay.cn') {
// 	window.API_URL = 'https://lisi.mvay.cn';
// } else if (hostname === 'lisi.oognb.cn') {
// 	window.API_URL = 'https://lisi.oognb.cn';
// } else if (hostname === 'lisi.pqten.cn') {
// 	window.API_URL = 'https://lisi.pqten.cn';
// }
// 欢迎来到集美相册,本网站在twitter、tiktok、ins、facebook、Telegram、P站等均有推广
// 客服发单时,设置完成后请自行截图保存
// 如果发中圈就设置中圈价格,此时客人访问时只展示中圈的价格
// 如果发大圈就设置大圈价格,此时客人访问时只展示大圈的价格
// 如果同时设置中圈/大圈价格,此时客人访问时则展示对应设置的中圈/大圈价格,两者互不影响
// 为防止大家设置相同邀请码导致价格混乱,故随机生成邀请码,保存设置后务必截图(邀请码3天有效)
// 若想检验自己设置的价格,保存设置后退出或直接扫描二维码输入邀请码即可
function fetchUser() {
    return __awaiter(this, void 0, void 0, function () {
        var defaultUser, response, safeUser, user, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    defaultUser = { role: 0, username: "guest" };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("".concat(API_URL, "/api/auth/user"), {
                            method: "GET",
                            credentials: "include",
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    safeUser = _a.sent();
                    if (response.ok) {
                        user = safeUser || defaultUser;
                        sessionStorage.setItem("user", JSON.stringify(user));
                        return [2 /*return*/, user];
                    }
                    else {
                        sessionStorage.setItem("user", JSON.stringify(defaultUser));
                        return [2 /*return*/, defaultUser];
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error("获取数据错误:", error_1);
                    throw error_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 *
 * @param p_number province code
 * @param c_number city code
 * @param rangeRef 区域参考 2-中圈 3-大圈
 * @param page_number 页数
 * @param page_size 每页数量
 *
 * 返回数据格式{
    "id": 21176, // girl id
    "user_id": 5941,
    "code_ref": "M96135",
    "name": "闵行童颜巨乳",
    "age": "07",
    "height": "166",
    "weight": "45",
    "bust": "F",
    "skill": "SW#六九#萝莉#可外#可夜",
    "range_ref": 3,
    "price": 3000,
    "priceFlag": 4,
    "province": "上海",
    "p_number": 26,
    "city": "闵行",
    "c_number": 260008,
    "p_jd": "121.4737",
    "p_wd": "31.2304",
    "c_jd": "121.3758",
    "c_wd": "31.1128",
    "address": "闵行七韵美地苑",
    "vx": "",
    "qq": "",
    "xl": "0210007",
    "yn": "",
    "phone": "",
    "remarks": "不洗不冒，翘必究",
    "photo": "/images/vef449mz2174237/ln0i4bv32174238.jpg",
    "top": 0, //置顶
    "today_top": 0, // 今日已置顶
    "state_ref": 2 // 3-已认证 4-天宫
  }
 *
 */
var guest_headers = {
    accept: "*/*",
    // "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
    // "priority": "u=1, i",
    // "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Google Chrome\";v=\"139\", \"Chromium\";v=\"139\"",
    // "sec-ch-ua-mobile": "?0",
    // "sec-ch-ua-platform": "\"Windows\"",
    // "sec-fetch-dest": "empty",
    // "sec-fetch-mode": "cors",
    // "sec-fetch-site": "same-origin",
    cookie: "provinceCode=26; __verify_token=MjQwODo4MjBjOjhmOGY6MjZjMTpiMDRjOmE3OWQ6N2E0NTphNTAwOjE3NTcxNjkyODIwMDA6YTI0YjAyODU0YTUxYTIxYTgyNDM2NWY2NWNlNGEzNmMxYzhjNmNkZThkZTM0MGMxM2EzZjFiOGRiZDEyNjgyZg%3D%3D; connect.sid=s%3Afb75232143c101ed7fff70b5035e8ef5.VTlNpiv%2Fs4XxTUBbjL1FAg4ebHCCArWa9JGeoOu7vyU",
    // "Referer": "https://pig.zwidi.cn/homePage.html"
};
var master_667788_headers = {
    //客服667788
    accept: "*/*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
    "if-none-match": 'W/"30569-6yXtwWzrLpIgKgAL52HQ4h6kSKI"',
    priority: "u=1, i",
    "sec-ch-ua": '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    cookie: "provinceCode=26; connect.sid=s%3Ad0df5351210c5beaeb5b30a3dce69d61.weVqqV1rCnUnA9P5238QRQMRDbUwwRim8vJekso03PU; __verify_token=MTcyLjI0NS4xNTIuOTc6MTc1NzE4MDgwMTUzMjo5ZTI2MmUwNDRkMTkzZWU0N2U3ZjA3NjMyNDQ3NDEwMzkxOTU3YjRjMzlhMjA0OTY2ODVmNTEzYjJlZDE4YjZj",
    Referer: "https://pig.zwidi.cn/homePage.html",
};
function loadHomePageData() {
    return __awaiter(this, arguments, void 0, function (p_number, c_number, rangeRef, page_number, page_size) {
        var res, data, jsonObj, data_array, rangeRefName, filePath;
        if (p_number === void 0) { p_number = 26; }
        if (c_number === void 0) { c_number = 260008; }
        if (rangeRef === void 0) { rangeRef = 2; }
        if (page_number === void 0) { page_number = 1; }
        if (page_size === void 0) { page_size = 500; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    res = fetch("https://pig.zwidi.cn/api/girl/homePageData?p_number=".concat(p_number, "&c_number=").concat(c_number, "&rangeRef=").concat(rangeRef, "&page_number=").concat(page_number, "&page_size=").concat(page_size), {
                        headers: master_667788_headers,
                        body: null,
                        method: "GET",
                    });
                    return [4 /*yield*/, res];
                case 1:
                    data = _a.sent();
                    return [4 /*yield*/, data.json()];
                case 2:
                    jsonObj = _a.sent();
                    if (!(jsonObj.success !== true)) return [3 /*break*/, 3];
                    console.log("\"fetch error\n", jsonObj);
                    return [3 /*break*/, 5];
                case 3:
                    data_array = jsonObj.data;
                    console.log("==\u300Bpage ".concat(page_number, "\uFF0C\u6570\u636E\u6570\u91CF\uFF1A").concat(data_array.length, ":\n"), data_array[0]);
                    if (!(data_array.length > 0)) return [3 /*break*/, 5];
                    rangeRefName = "";
                    if (rangeRef == 3) {
                        rangeRefName = "大圈";
                    }
                    else {
                        rangeRefName = "中圈";
                    }
                    filePath = path.join(process.cwd(), "json", "".concat(rangeRefName, "_").concat(getProvinceNameByCode(p_number), "_").concat(getCityNameByCode(c_number), "_page").concat(page_number, ".json"));
                    if (!fs.existsSync(path.dirname(filePath))) {
                        fs.mkdirSync(path.dirname(filePath), { recursive: true });
                    }
                    fs.writeFileSync(filePath, JSON.stringify(data_array, null, 2));
                    console.log("JSON data saved to", filePath);
                    // fetch next page
                    return [4 /*yield*/, loadHomePageData(p_number, c_number, rangeRef, page_number + 1, page_size)];
                case 4:
                    // fetch next page
                    _a.sent();
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
function getProvinceNameByCode(p_number) {
    var province = provinces.province.find(function (p) { return p.p_number === p_number; });
    return province
        ? province.name.replace("/", "_").replace(" ", "_").trim()
        : null;
}
function mkdirIfNotExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
function getCityNameByCode(c_number) {
    var city = provinces.city.find(function (p) { return p.c_number === c_number; });
    return city ? city.name.replace("/", "_").replace(" ", "_").trim() : null;
}
// download images and save to local file system
var downloadImage = function (image_url) { return __awaiter(void 0, void 0, void 0, function () {
    var res, arrayBuffer, buffer, filePath;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fetch(image_url)];
            case 1:
                res = _a.sent();
                if (!res.ok) {
                    throw new Error("HTTP error! Status: ".concat(res.status));
                }
                return [4 /*yield*/, res.arrayBuffer()];
            case 2:
                arrayBuffer = _a.sent();
                buffer = Buffer.from(arrayBuffer);
                filePath = path.join(process.cwd(), "image.jpeg");
                fs.writeFileSync(filePath, buffer);
                console.log("? Image saved to", filePath);
                return [2 /*return*/];
        }
    });
}); };
var girls = [];
// download().catch(console.error);
/**
 *
 * @param id
 * 返回数据格式{
  "success": true,
  "data": {
    "code_ref": "M99688",
    "name": "普陀静静",
    "age": "04",
    "height": "175",
    "weight": "53kg",
    "bust": "36c",
    "skill": "WT#KB#SW#SM#CP#六九#长腿#可外#可夜",
    "price": 1500,
    "province": "上海",
    "p_number": 26,
    "city": "普陀",
    "c_number": 260005,
    "p_jd": "121.4737",
    "p_wd": "31.2304",
    "c_jd": "121.3983",
    "c_wd": "31.2507",
    "address": "南泉苑西乡路91弄-60号",
    "vx": "y1748277",
    "qq": "",
    "xl": "3230",
    "yn": "",
    "phone": "",
    "remarks": "wt+2可口爆",
    "photo": "/images/6pjenhkm6353600/ei4wp55a6353601.jpg",
    "state_ref": 3,
    "photo1": "/images/xqgk5ld96624517/2sjv1yxj6625388.jpg",
    "photo2": "/images/36iwrz3g1232645/cy7hjzlg1232646.jpg",
    "photo3": "/images/36iwrz3g1232645/amiztdet1232670.jpg",
    "photo4": "/images/36iwrz3g1232645/qqzj59i41233115.jpg",
    "photo5": "/images/36iwrz3g1232645/v3xkqn1d1233471.jpg",
    "photo6": "/images/36iwrz3g1232645/antpa32w1233704.jpg",
    "video1": "/images/5xzbs4rp5751353/q0o7fbyu5753140.mp4",
    "video2": "/images/amwtc1y55786413/dimmja7s5786415.mp4",
    "video": "/images/dadodidc2426746/vlsnl52c2426747.mp4"
  }
}
 */
function getGirlDetails(id_1) {
    return __awaiter(this, arguments, void 0, function (id, retryCount, maxRetries) {
        var url, res, jsonObj, data_obj, error_2;
        if (retryCount === void 0) { retryCount = 0; }
        if (maxRetries === void 0) { maxRetries = 3; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 5]);
                    url = "https://pig.zwidi.cn/api/girl/getGirlById/".concat(id);
                    return [4 /*yield*/, fetch(url, {
                            headers: {
                                accept: "*/*",
                                "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
                                priority: "u=1, i",
                                "sec-ch-ua": '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
                                "sec-ch-ua-mobile": "?0",
                                "sec-ch-ua-platform": '"Windows"',
                                "sec-fetch-dest": "empty",
                                "sec-fetch-mode": "cors",
                                "sec-fetch-site": "same-origin",
                                cookie: "provinceCode=26; __verify_token=MTcyLjI0NS4xNTIuOTc6MTc1NzE5MzEwNjcxODozOWFmNWNiZDZjODM2MTFhZjdhZmE5YjUxNDEyY2FiNGE3OWZkMjQ4OWU1ZGYyODU4ZDlmOTJlYjJiYjdiMmY4; connect.sid=s%3A16e2cb54cce37fcf067f988af0165b73.H2M50BBe7MOiJH6RM%2BC2ep9gH0IIgp4VBbhVR7JIZs0",
                                Referer: "https://pig.zwidi.cn/homePage.html",
                            },
                            body: null,
                            method: "GET",
                        })];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    jsonObj = _a.sent();
                    if (jsonObj.success !== true) {
                        console.log("\"fetch error\n", jsonObj);
                        return [2 /*return*/, null];
                    }
                    else {
                        console.log("\u2705 fetch success for url=".concat(url, " "), jsonObj);
                        data_obj = jsonObj.data;
                        console.log("girl id=".concat(id, " details:\n"), data_obj);
                        data_obj["id"] = id; // add id field
                        data_obj["api_url"] = url; // add id field
                        data_obj["web_url"] = "https://pig.zwidi.cn/girlDetails.html?id=" + id; // add id field
                        girls.push(data_obj);
                        return [2 /*return*/, data_obj];
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _a.sent();
                    console.error("Error", error_2);
                    //sleep 1 second then retry
                    if (retryCount >= maxRetries) {
                        console.error("Max retries reached for id=".concat(id, ". Skipping."));
                        return [2 /*return*/, null];
                    }
                    else {
                        console.log("Retrying... (".concat(retryCount + 1, "/").concat(maxRetries, ")"));
                    }
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 4:
                    _a.sent();
                    return [2 /*return*/, getGirlDetails(id, retryCount + 1, maxRetries)];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.default = {
    API_URL: API_URL,
    fetchUser: fetchUser,
    loadHomePageData: loadHomePageData,
    downloadImage: downloadImage,
    getCityNameByCode: getCityNameByCode,
    getProvinceNameByCode: getProvinceNameByCode,
    getGirlDetails: getGirlDetails,
    mkdirIfNotExists: mkdirIfNotExists,
    navItems: navItems,
};
/// test code load all cities data
function testLoadAllCitiesGirlsData() {
    // provinces.city.forEach((c) => {
    //   console.log(
    //     `${c.p_number}\t${getProvinceNameByCode(c.p_number)}\t${c.c_number}\t${
    //       c.name
    //     }`
    //   );
    //   loadHomePageData(c.p_number, c.c_number, 2, 1, 500); //中圈
    //   loadHomePageData(c.p_number, c.c_number, 3, 1, 500); //大圈
    // });
}
// getGirlDetails(21176); 读取json路径文件列表，然后从文件读区数据列表中获取id，然后获取详情
var p_limit_1 = require("p-limit");
function testSaveAllGirlsDetails() {
    return __awaiter(this, void 0, void 0, function () {
        var jsonDir, files, limit, allRequests, _i, files_1, file, filePath, content, data_array, requests, outputPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jsonDir = path.join(process.cwd(), "json");
                    files = fs.readdirSync(jsonDir);
                    limit = (0, p_limit_1.default)(5);
                    allRequests = [];
                    for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                        file = files_1[_i];
                        if (file.endsWith(".json")) {
                            filePath = path.join(jsonDir, file);
                            content = fs.readFileSync(filePath, "utf-8");
                            data_array = JSON.parse(content);
                            requests = data_array.map(function (item) { return limit(function () { return getGirlDetails(item.id, 0, 3).then(function () { }); }); } // 包裹请求以确保并发限制
                            );
                            allRequests.push.apply(allRequests, requests); // 将每个请求添加到请求列表中
                        }
                    }
                    // 等待所有请求完成
                    return [4 /*yield*/, Promise.all(allRequests)];
                case 1:
                    // 等待所有请求完成
                    _a.sent();
                    outputPath = path.join(process.cwd(), "json", "all", "all_girls_details.json");
                    mkdirIfNotExists(path.dirname(outputPath));
                    fs.writeFileSync(outputPath, JSON.stringify(girls, null, 2), {
                        encoding: "utf-8",
                        flag: "w",
                    });
                    console.log("\u2705 save all ".concat(girls.length, " girls details to"), outputPath);
                    return [2 /*return*/];
            }
        });
    });
}
testSaveAllGirlsDetails();
function testSumGilrs() {
    return __awaiter(this, void 0, void 0, function () {
        var outputPath, content, jsonObj, girls;
        return __generator(this, function (_a) {
            outputPath = path.join(process.cwd(), "json", "all", "all_girls_details.json");
            mkdirIfNotExists(path.dirname(outputPath));
            content = fs.readFileSync(outputPath, { encoding: "utf-8" });
            jsonObj = JSON.parse(content);
            console.log("\u2705 read girls ".concat(jsonObj.length), typeof jsonObj);
            girls = jsonObj.filter(function (girl) { return girl["province"] == "上海"; });
            console.log("\u2705 filter \u4E0A\u6D77 ".concat(girls.length));
            return [2 /*return*/];
        });
    });
}
// testSumGilrs();
