var TVT = "56edfc79ecf25922b98202dd79a291aa";
const nodeHtmlParser = require("node-html-parser");
const fetch = require("@zazuko/node-fetch");
const escape = require('querystring');
var TG = require("telegram-bot-api");
const token = "5080522488:AAFwz0IPiufqQ0cksA1sQP90C**********";
const api = new TG({token: token});
const rn = "\r\n";
const like = "\u{1F44D} ";
const link = "\u{1F517} ";
const next = "\u{27A1} ";
const serchIco = "\u{1F50E} ";
const bookIco = "\u{1F4D6} ";
const scrollIco = "\u{1F4DC} ";
const screaming = "\u{1F631} ";
const close = "\u{274C} ";
const downloadsIco = "\u{2B07} ";
const comentsIco = "\u{1F4AC} ";
process.env.UV_THREADPOOL_SIZE = 128;
const requestDelay = 2000;

function sendError(){
    api.sendMessage({
        chat_id: chat_id,
        text: screaming + " Bot internal error " + screaming
    });
}

function parse(from, data, to){
    fromIndex = data.indexOf(from) + from.length;
    return data.substring(fromIndex, data.indexOf(to, fromIndex));
}

function getTVT(callback){
     fetch('https://cdn.thingiverse.com/site/js/app.bundle.js?1638457917').then(res => res.text()).then(function(data){
callback(parse("https://cdn.thingiverse.com/\",u=\"", data, "\","));
});
}

/*
getTVT((token) => {
TVT = token;
console.log("TVT: " + TVT);
});
//*/

function parseTV(text, page, callback){
        fetch('https://api.thingiverse.com/search/' + escape.escape(text) +'?page=' + page + '&per_page=10&sort=relevant&type=things', {
    headers: { 'authorization': 'Bearer ' + TVT}
}).then(res => res.json()).then(data => {
//console.log(data);
if(!data.error){
	console.log(data);
    callback(data);
    return;
}else{
    getTVT((token) => {
TVT = token
console.log("TVT: " + TVT);
});
}
}).catch(e => console.log(e));
}

function isPic(str){
	if(str.endsWith(".jpg") || str.endsWith(".JPG") || str.endsWith(".png") || str.endsWith(".PNG") || str.endsWith(".jpeg") || str.endsWith(".JPEG")) return true;
	return false;
}

function buildAlbumTV(things, callback){
    let array = [];
    //console.log("[buildAlbumTV] things");
    //console.log(things);
    for(let i = 0; i < things.hits.length; i++){
        let picture = things.hits[i].preview_image;//thumbnail
        if(!isPic(picture)){
            picture = "https://cdn.thingiverse.com/site/img/default/Gears_preview_card.jpg";
        }
        array.push({
            type: "photo",
            media: picture,
            caption: things.hits[i].name + rn + like + (things.hits[i].like_count ? things.hits[i].like_count : "0") + rn + link + things.hits[i].public_url
        })
    }
    callback(array);
}

function sendKeyboard(chat_id, text, buttons){
	api.sendMessage({
        chat_id: chat_id,
        text: text,
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [buttons]
        }
    }).catch(e => console.log(e));
}

function sendTValbum(message, chat_id, page){
    //console.log("[sendTValbum] start sending page: " + page);
    parseTV(message, page, (things) => {
    let total = things.total;
        if(typeof total === 'object'){
            api.sendMessage({
            chat_id: chat_id,
            text: 'No results found for: ' + message,
        });
        return;
        }
        const pageCount = Math.ceil(things.total / 10);
        //console.log("PAGES: " + pageCount);
        if(page > pageCount) return;
        buildAlbumTV(things, (album) => {
        //console.log("Send media group to chat_id " + chat_id);
        console.log(album);
            api.sendMediaGroup({
            chat_id: chat_id,
            media: album
        }).then((result) => {
        //console.log(result);
        //console.log("send keyboard");
		setTimeout(() => {
			sendKeyboard(chat_id, scrollIco + "Total result count: " + things.total + "\r\n" + serchIco + "Results for: " + message + ". \r\n" + bookIco + "Page |" + page + "| of " + pageCount, [{text: (page == pageCount ? close + "Close" : next + 'Next'), callback_data: (page == pageCount ? "delMsg" + album.length : "nextTV")}]);
		}, requestDelay);
        }).catch(e => console.log(e));
        })
     });
}

function parse3dt(text, page, callback){
let result = {
pages: 0,
album: []
};
fetch('https://3dtoday.ru/3d-models?search=' + escape.escape(text) + '&page=' + page).then(res => res.text()).then(data => {
    //console.log(data);
    const root = nodeHtmlParser.parse(data);
     const models = root.querySelectorAll('.threedmodels_models_list__elem__img>a');
     console.log('models count: ' + models.length);
     if(models.length == 0){
     callback(result);
     return;
     }
     const coments = root.querySelectorAll('span.threedmodels_models_list__elem__info__item.pe-7s-chat');
     //console.log('coment count: ' + coments.length);
     const downloads = root.querySelectorAll('span.threedmodels_models_list__elem__info__item.pe-7s-cloud-download');
     //console.log('download count: ' + downloads.length);
     const names = root.querySelectorAll('.threedmodels_models_list__elem__title>a');
	 const likes = root.querySelectorAll('.rating-vote-plus.pe-7s-like2 span');
     //console.log('names count: ' + names.length);
     let totalPageCount = root.querySelectorAll('.pager.centered.pager-new li>a[href]:not(.next)');
     //console.log("total page len: " + totalPageCount.length);
     if(totalPageCount.length > 0){
        totalPageCount = parseInt(totalPageCount[totalPageCount.length - 1].text);
		if (page > totalPageCount) totalPageCount++;
     }else{
        totalPageCount = 1;
     }
     console.log('totalPage count: ' + totalPageCount);
     result.pages = totalPageCount;
        for(let model = 0; model < models.length; model++){
            result.album.push({
            type: "photo",
            media: (models[model].rawAttrs.indexOf("url('');") > 0 ? "https://3dtoday.ru/img/service/bg_for_img.jpg" : 'https://3dtoday.ru' + parse('url(\'', models[model].rawAttrs, '\');')),
            caption: names[model].text.trim() + rn + like + likes[model].text + rn + comentsIco + coments[model].text + rn + downloadsIco + downloads[model].text + rn + link + parse('href="', models[model].rawAttrs, '"')
        });
        }     
callback(result);    
}).catch(e => console.log(e));
}

function send3DTalbum(message, chat_id, page){
    parse3dt(message, page, result => {
    console.log(result);
    if(result.pages == 0){
        api.sendMessage({
            chat_id: chat_id,
            text: 'No results found for: ' + message,
        }).catch(e => console.log(e));
        return;
    }
    //overflow detector
    if(result.album.length > 10){
        const middleIndex = Math.ceil(result.album.length / 2);
        const album = result.album.splice(0, middleIndex);
        const album2 = result.album.splice(-middleIndex);
        const img2del = album.length + album2.length;
        console.log("[send3DTalbum]");
        console.log(img2del);
        api.sendMediaGroup({
            chat_id: chat_id,
            media: album
        }).then((result) => {
    }).catch(e => console.log(e));
        api.sendMediaGroup({
            chat_id: chat_id,
            media: album2
        }).then((mediaresult) => {
        //console.log(result);
        //console.log("send keyboard");
		setTimeout(() => {
			sendKeyboard(chat_id, serchIco + "Results for: " + message + ". \r\n" + bookIco + "Page |" + page + "| of " + result.pages, [{text: (page == result.pages ? close + "Close" : next + 'Next'), callback_data: (page == result.pages ? "delMsg3dtx2" + img2del : "next3DTx2" + img2del)}]);
		}, requestDelay);
    }).catch(e => console.log(e));
    }else{
        api.sendMediaGroup({
            chat_id: chat_id,
            media: result.album
        }).then((mediaresult) => {
        //console.log(result);
        //console.log("send keyboard");
		setTimeout(() => {
			sendKeyboard(chat_id, serchIco + "Results for: " + message + ". \r\n" + bookIco + "Page |" + page + "| of " + result.pages, [{text: close + 'Close', callback_data: "delMsg3dt" + result.album.length}]);
		}, requestDelay);
    }).catch(e => console.log(e));
    }
});
}

function delAllMsg(chat_id, message_id, count){
    api.deleteMessage({chat_id: chat_id, message_id: message_id}).catch(e => console.log(e));
        let photoIdCounter = message_id - 1;
        for(let i = 0; i < count; i++){
            api.deleteMessage({chat_id: chat_id, message_id: photoIdCounter}).catch(e => console.log(e));
            photoIdCounter--;
        }
}

const mp = new TG.GetUpdateMessageProvider()
api.setMessageProvider(mp)
api.start()
.then(() => {
    console.log('API is started')
})
.catch(console.err)

// Receive messages via event callback
api.on('update', update => {
//console.log(update);
    if(update.callback_query){
    const chat_id = update.callback_query.message.chat.id;
    const data = update.callback_query.message.text;
    //console.log(update.callback_query);
    let img2del = 0;
    let command = update.callback_query.data;
    console.log(update.callback_query);
        if(command.indexOf("delMsg3dtx2") != -1){
            img2del = parseInt(command.substr(command.indexOf("delMsg3dtx2") + 11));
            command = command.substr(0, 11);
        }else if(command.indexOf("delMsg3dt") != -1){
            img2del = parseInt(command.substr(command.indexOf("delMsg3dt") + 9));
            command = command.substr(0, 9);
        }else if(command.indexOf("next3DTx2") != -1){
            img2del = parseInt(command.substr(command.indexOf("next3DTx2") + 9));
            command = command.substr(0, 9);
		}else if(command.indexOf("delMsg") != -1){
			img2del = parseInt(command.substr(command.indexOf("delMsg") + 6));
            command = command.substr(0, 6);
		}
    console.log("command " + command);
    console.log("img2del " + img2del);
    switch(command){
    case "nextTV":
        delAllMsg(chat_id, update.callback_query.message.message_id, 10);
        sendTValbum(parse("Results for: ", data, "."), chat_id, parseInt(parse("Page |", data, "|")) + 1);
    break;
    case "next3DTx2":
        delAllMsg(chat_id, update.callback_query.message.message_id, img2del);
		
        send3DTalbum(parse("Results for: ", data, "."), chat_id, parseInt(parse("Page |", data, "|")) + 1);
    break;
    case "delMsg3dtx2":
        delAllMsg(chat_id, update.callback_query.message.message_id, img2del);
    break;
     case "delMsg3dt":
        delAllMsg(chat_id, update.callback_query.message.message_id, img2del);
    break;
	case "delMsg":
        delAllMsg(chat_id, update.callback_query.message.message_id, img2del);
    break;
    default:
    break;
    }
    }else{
    const chat_id = update.message.chat.id;
    let message = update.message;
    //console.log("TEXT: " + message.text, "From: " + message.from.username);
    switch(message.text){
    case "/command":
    
    break;
    default:
        if(message.text.indexOf("3dt") != -1){
            send3DTalbum(message.text.substring(message.text.indexOf("3dt") + 3).trim(), chat_id, 1);
        }else{
            sendTValbum(message.text, chat_id, 1);
        }
    break;
    }
    }
})