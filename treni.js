import moment from 'moment';

const REFRESH_TIME = 30 * 1000

let CACHED_TRAINS = {};
let CACHED_ROUTES = {};
let CACHED_NUMERO = {};

const timestamp = () => new Date().getTime();
//  let stazioniString = (d.getHours() < 10 || (d.getHours() == 10 && d.getMinutes() < 30) ? selezionata + "/2712" : "2712/" + selezionata)

export const getTratta = async (tratta) =>  {
  const route = CACHED_ROUTES[tratta];

  if (!route || moment(route.last_update).date() != moment().date())
    await fetchTratta(tratta);

  return CACHED_ROUTES[tratta].data;
}

const fetchTratta = async (tratta) => {
  let date_format_str = moment().format('YYYY-MM-DDT4:00:00');
  let response = await fetch(`http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/soluzioniViaggioNew/${tratta}/${date_format_str}`);
  let data = await response.json()

  let treni = data?.soluzioni || []

  CACHED_ROUTES[tratta] = {
    last_update: timestamp(),
    data: JSON.stringify(treni)
  }
}

export const getTrain = async (tratta, numero) => {
  const route = CACHED_TRAINS[numero];
  
  if (!route || timestamp() - route.last_update > REFRESH_TIME)
    await fetchTrain(tratta, numero);

  return CACHED_TRAINS[numero]?.data;
}

const fetchNumero = async (numero) => {
  let response = await fetch(`http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/cercaNumeroTreno/${numero}`).then(res => res.text())
  if (response == "Error" || response == "") return
  let { codLocOrig, dataPartenza } = JSON.parse(response);

  CACHED_NUMERO[numero] = {
    last_update: timestamp(),
    codLocOrig,
    dataPartenza
  }

}
const fetchTrain = async (tratta, numero) => { //2710 / 2715
  if (!CACHED_NUMERO[numero] || moment(CACHED_NUMERO[numero].last_update).date() != moment().date())
    await fetchNumero(numero);

  const { codLocOrig, dataPartenza } = CACHED_NUMERO[numero]
  
  let url = `http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/andamentoTreno/${codLocOrig}/${numero}/${dataPartenza}`

  let datiTreno = await fetch(url).then(res => res.json())
  var { stazioneUltimoRilevamento, orarioPartenza, ritardo, oraUltimoRilevamento, nonPartito, fermate } = datiTreno;

  let binario = fermate
    .find((elem) => elem.id === `S0${tratta}`)
    .binarioEffettivoArrivoDescrizione

  let rilevamento = moment(oraUltimoRilevamento).format('HH:mm')

  let avanzate = `Ultimo rilevamento: ${stazioneUltimoRilevamento} (${rilevamento}) \nRitardo: ${ritardo} min \n`
  
  let programmato = moment(orarioPartenza).subtract(1, 'hour');
  let previsto = programmato.add(ritardo, 'minutes');
  programmato = programmato.format('HH:mm');

  var statotreno = (!nonPartito && stazioneUltimoRilevamento !== "--" ) ?
    `${stazioneUltimoRilevamento} ${rilevamento}` :
    'Non ancora partito'
  
  avanzate += `Arrivo programmato: ${programmato}\n`;

  if (ritardo > 0)
    avanzate += `Arrivo previsto: ${previsto.format('HH:mm')}\n`;

  avanzate += `Treno ${datiTreno.categoriaDescrizione} ${numero}`; 

  const treniInfo = {
    programmato,
    binario: Number(binario),
    statotreno,
    avanzate,
    ritardo,
  }

  CACHED_TRAINS[numero] = {
    last_update: timestamp(),
    data: JSON.stringify(treniInfo)
  }
}


