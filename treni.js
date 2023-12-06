import moment from 'moment';

const REFRESH_TIME = 30 * 1000

let CACHED_TRAINS = {};
let CACHED_ROUTES = {};
let CACHED_NUMERO = {};

const SHORTED = {
  "VENEZIA SANTA LUCIA": "VENEZIA S. LUCIA",
  "DEVIATOIO ESTREMO CONEGLIANO": "CONEGLIANO",
  "VENEZIA PORTO MARGHERA": "P. MARGHERA",
  "DEVIATOIO ESTREMO VENEZIA": "VENEZIA S. LUCIA",
  "VENEZIA MESTRE": "ST. MESTRE",
  "CONFLUENZA UD-TS": "MESTRE",
  "MOGLIANO VENETO": "MOGLIANO",
  "S.GIOVANNI AL NATISONE": "S. GIOVANNI",
  "RONCHI DEI LEGIONARI NORD" : "RONCHI",
  "PONTE NELLE ALPI POLPET": "P. NELLE ALPI"
}

const timestamp = () => new Date().getTime();

export const getTratta = async (tratta) =>  {
  const route = CACHED_ROUTES[tratta];

  if (!route || moment(route.last_update).date() != moment().date())
    await fetchTratta(tratta);

  return CACHED_ROUTES[tratta].data;
}

const fetchTratta = async (tratta) => {
  const date_format_str = moment().format('YYYY-MM-DDT4:00:00');
  const url = `http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/soluzioniViaggioNew/${tratta}/${date_format_str}`
  const response = await fetch(url);
  const data = await response.json()

  let treni = data?.soluzioni || []

  CACHED_ROUTES[tratta] = {
    last_update: timestamp(),
    data: JSON.stringify(treni)
  }
}

const short = (val) => {
  let shorted = SHORTED[val];
  
  if (!shorted && val.length > 16)
    console.log("Stringa troppo lunga: ", val);

  return shorted || val;
}

export const getTrain = async (tratta, numero) => {

  if (Number.isNaN(numero)) {
    console.log("Numero treno non valido");
    return;
  }
    
  const route = CACHED_TRAINS[numero];

  if (!route || timestamp() - route.last_update > REFRESH_TIME)
    await fetchTrain(tratta, numero);

  return CACHED_TRAINS[numero]?.data;
}

const fetchNumero = async (numero) => {

  // if () return; //validazione input

  let response = await fetch(`http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/cercaNumeroTreno/${numero}`).then(res => res.text())
  if (response.includes("Error") || response == "") return
  let { codLocOrig, dataPartenza } = JSON.parse(response);

  CACHED_NUMERO[numero] = {
    last_update: timestamp(),
    codLocOrig,
    dataPartenza
  }   

}
const fetchTrain = async (tratta, numero) => { //2710 / 2715
  
  console.log(tratta)

  if (numero == undefined || numero == "null") {
    throw new Error(`Numero treno non valido (${numero})`); 
  }
  
  if (!CACHED_NUMERO[numero] || moment(CACHED_NUMERO[numero].last_update).date() != moment().date())
    await fetchNumero(numero);

  const { codLocOrig, dataPartenza } = CACHED_NUMERO[numero]
  
  let url = `http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/andamentoTreno/${codLocOrig}/${numero}/${dataPartenza}`
  
  console.log(url)

  let datiTreno = await fetch(url).then(res => res.json())

  var { stazioneUltimoRilevamento, ritardo, oraUltimoRilevamento, nonPartito, fermate } = datiTreno;

  let codiceStazione = tratta.substring(0, 4);

  let stazioneCorrente = fermate
    .find((elem) => elem.id === `S0${codiceStazione}`)
  
  if (stazioneCorrente == undefined) throw new Error("Impossibile ricevere informazioni fermata treno. (probabilemente soppresso)")

  let orarioPartenza = stazioneCorrente.partenza_teorica
  // console.log(moment(orarioPartenza).format("HH:mm"), codiceStazione)
  let binario = stazioneCorrente.binarioEffettivoArrivoDescrizione || stazioneCorrente.binarioProgrammatoArrivoDescrizione

  let rilevamento = moment(oraUltimoRilevamento).format('HH:mm')

  let avanzate = `Ultimo rilevamento: ${short(stazioneUltimoRilevamento)} (${rilevamento}) \nRitardo: ${ritardo} min \n`
  
  let programmato = moment(orarioPartenza)
  let previsto = moment(orarioPartenza + ritardo * 60000)
  programmato = programmato.format('HH:mm');

  var statotreno = (!nonPartito && stazioneUltimoRilevamento !== "--" ) ?
    `${short(stazioneUltimoRilevamento)} ${rilevamento}` :
    'Non ancora partito'
  
  avanzate += `Arrivo programmato: ${programmato}\n`;

  if (ritardo > 0)
    avanzate += `Arrivo previsto: ${previsto.format('HH:mm')}\n`;

  avanzate += `Treno ${numero}`; //regionale

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


