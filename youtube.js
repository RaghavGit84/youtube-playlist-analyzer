const fs = require("fs");
const pdf = require("pdfkit");
const puppeteer = require("puppeteer");

let link = "https://www.youtube.com/playlist?list=PLzkuLC6Yvumv_Rd5apfPRWEcjf9b1JRnq"
let cTab;

(async function () {
    try {
        let browserOpen = puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        })

        let browserInstance = await browserOpen;
        let allTabsArr = await browserInstance.pages();
        cTab = allTabsArr[0];
        await cTab.goto(link);
        await cTab.waitForSelector("h1#title");
        let name = await cTab.evaluate(function (select) { return document.querySelector(select).innerText }, 'h1#title');

        let allData = await cTab.evaluate(getData, "#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer");

        console.log(name, allData.noOfvideos, allData.noOfViews);

        let totalVideos = allData.noOfvideos.split(" ")[0];
        //console.log(totalVideos);

        let currentVideos = await getCVideosLength();
        //console.log(currentVideos);

        while (totalVideos - currentVideos >= 20) {
            await scrollToBottom();
            currentVideos = await getCVideosLength();

        }

        let finalList = await getStats();
        //console.log(finalList);

        let pdfDoc = new pdf;
        pdfDoc.pipe(fs.createWriteStream("play.pdf"));
        pdfDoc.text(JSON.stringify(finalList));
        pdfDoc.end();



    } catch (error) {
        console.log(err);
    }

})()



function getData(selector) {
    let allElements = document.querySelectorAll(selector);
    let noOfvideos = allElements[0].innerText;
    let noOfViews = allElements[1].innerText;

    return {
        noOfvideos,
        noOfViews
    }

}


async function getCVideosLength() {
    let length = await cTab.evaluate(getLength, "#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer");
    return length;

}


async function scrollToBottom() {
    await cTab.evaluate(goToBottom)
    function goToBottom() {
        window.scrollBy(0, window.innerHeight)
    }
}


async function getStats() {
    let list = await cTab.evaluate(getNameAndDuration, "#video-title", "#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer")
    return list;

}


function getLength(durationSelect) {
    let duratioElem = document.querySelectorAll(durationSelect);
    return duratioElem.length;
}


function getNameAndDuration(videoSelector, durationSelector) {
    let videoElem = document.querySelectorAll(videoSelector)
    let durationElem = document.querySelectorAll(durationSelector)

    let currentList = []

    for (let i = 0; i < durationElem.length; i++) {
        let videoTitle = videoElem[i].innerText
        let duration = durationElem[i].innerText
        currentList.push({ videoTitle, duration })

    }

    return currentList;
}





