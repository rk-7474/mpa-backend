import express from 'express';
import getNews from './news.js'
import { getTrain, getTratta } from './treni.js';

// const timestamp = () => new Date().getTime();

const app = express();

const PORT = 3000;

app.get("*", async (req, res) => { //http://localhost:3000/news
	switch (req.path) {
		case "/news":
			var f = getNews();
			break;
		case "/treni":
			var f = getTratta(req.query.tratta);
			break;
		case "/info":
			var f = getTrain(req.query.stazione, req.query.numero);
			break;
	}

	try {
		var data = await f;
		if (data == undefined) {
			console.log("Errore sconosciuto in", req.path, req.query?.stazione, req.query?.numero, req.query?.tratta)
			res.status(500);
			res.send()
			return
		} 
		res.send(JSON.stringify(data));
	} catch(e) {
		res.status(500);
		res.send()
		console.log(e);
	}

});

app.listen(PORT, () => console.log("Server started"));


// app.get("/news", async (req, res) => { //http://localhost:3000/news
// 	const data = await getNews();
//    	res.send(JSON.stringify(data));
// });

// app.get("/treni", async (req, res) => { //http://localhost:3000/treni?tratta=2710/2715
// 	const data = await getTratta(req.query.tratta);
//    	res.send(JSON.stringify(data));
// });

// app.get("/info", async (req, res) => { //http://localhost:3000/info?stazione=2710&numero=16801
// 	const data = await getTrain(req.query.stazione, req.query.numero);
//    	res.send(JSON.stringify(data));
// 	// console.log("/info response in: ", timestamp() - time, "ms");
// });

// app.get("/test", async (req, res) => { //http://localhost:3000/test
// 	const data = await getTest();
//    	res.send(JSON.stringify(data));
// });


// const perf = async (cb) => {
// 	const time = timestamp();
//   	await cb();
// 	console.log("/test response in: ", timestamp() - time, "ms");
// }

// export const getTest = async () => {
// 	await perf(async() =>{
// 	  // console.log(moment().date())
// 	  // let response = await fetch(`http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/cercaNumeroTreno/16701`).then(res => res.text())
// 	})
// }