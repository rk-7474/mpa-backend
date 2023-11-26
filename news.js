import * as cheerio from 'cheerio' 

let CACHED_NEWS = [];
let LAST_UPDATE = 0;
const REFRESH_TIME = 60 * 60 * 1000;
const URL_SITO = "http://2.112.70.201/"

const timestamp = () => new Date().getTime();

const getNews = async () =>  {
    if (timestamp() - LAST_UPDATE > REFRESH_TIME)
        await fetchNews();

    return CACHED_NEWS;
}

const fetchNews = async () => {
    LAST_UPDATE = timestamp();

    let news = [];

    const data = await fetch(URL_SITO);
    const text = await data.text();
    const $ = cheerio.load(text);
    
    $(".slide").each((i, elem) => {
        const title = $(elem).find(".bt-row.bt-row-first > .bt-inner > .bt-title");
        const text = $(title).text();
        const url = $(title).attr('href');
        news.push({text: text, url: url});
    })
    
    CACHED_NEWS = news;
}   

export default getNews; 