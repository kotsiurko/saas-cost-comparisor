import {
  Chart,
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  ChartDataLabels,
);

const BREAK_POINT = 1024;

const ctx = document.getElementById('myChart');

const bunnyEl = document.querySelector('.jsBunny');
const scalewayEl = document.querySelector('.jsScaleway');
const storageRangeEl = document.getElementById('storageRange');
const transferRangeEl = document.getElementById('transferRange');

const storageRangeLabelEl = document.querySelector('.storageRangeLabel');
const transferRangeLabelEl = document.querySelector('.transferRangeLabel');
const radioElems = document.querySelectorAll('input');

storageRangeEl.addEventListener('input', getStorageValue);
transferRangeEl.addEventListener('input', getTransferValue);
bunnyEl.addEventListener('click', hddOrSsd);
scalewayEl.addEventListener('click', multiOrSingle);

window.addEventListener('resize', renderCanva);


// INITIAL DATA SETTINGS
// checking if LS has data and reading it
// or writing data to LS from sliders and inputs
if (window.localStorage.getItem('chartSettings')) {
  const dataFromLS = readFromLS();
  storageRangeEl.value = dataFromLS.storageValue;
  transferRangeEl.value = dataFromLS.transferValue;
  radioElems.forEach(el => {
    if (dataFromLS.bunny === el.value) {
      el.checked = true;
    }
  });
  radioElems.forEach(el => {
    if (dataFromLS.scaleway === el.value) {
      el.checked = true;
    }
  });
} else {
  setPrepareDataToLS('storageValue', storageRangeEl.value);
  setPrepareDataToLS('transferValue', transferRangeEl.value);
  setPrepareDataToLS('bunny', 'hdd');
  setPrepareDataToLS('scaleway', 'Multi');
}



// ------------------------------------------------------------------
// CHART Initialization

let bigData = {
  plugins: [ChartDataLabels],
  datasets: [{
    data: [],
    backgroundColor: [
      '#afafaf',
      '#afafaf',
      '#c846b4',
      "#afafaf"
    ],
    borderWidth: 2,
    borderRadius: 2,
    borderColor: '#000',
    barThickness: 20,
  }],
}

let optionsX = {
  indexAxis: 'x',
  plugins: {
    datalabels: {
      color: '#000',
      anchor: 'end',
      align: 'end',
      formatter: function (value, context) {
        return `${context.chart.data.datasets[0].data[context.dataIndex]}$`;
      }
    }
  },
  aspectRatio: 2,
  scales: {
    y: {
      type: 'linear',
      grace: '10%'
    },
    x: {
      labels: ['backblaze', 'bunny', 'scaleway', 'vultr'],
      display: false,
    }
  },
  animation: false,
}

let optionsY = {
  indexAxis: 'y',
  plugins: {
    datalabels: {
      color: '#000',
      anchor: 'end',
      align: 'end',
      formatter: function (value, context) {
        return `${context.chart.data.datasets[0].data[context.dataIndex]}$`;
      }
    }
  },
  aspectRatio: 2,
  scales: {
    x: {
      type: 'linear',
      grace: '10%'
    },
    y: {
      labels: ['backblaze', 'bunny', 'scaleway', 'vultr'],
      display: false,
    }
  },
  animation: false,
}


let config = {
  type: 'bar',
  data: bigData,
  options: optionsX,
}

if (window.innerWidth >= BREAK_POINT) {
  config = {
    type: 'bar',
    data: bigData,
    options: optionsY,
  }
} else {
  config = {
    type: 'bar',
    data: bigData,
    options: optionsX,
  }
}

const myChart = new Chart(ctx, config);
// ------------------------------------------------------------------



// ------------------------------------------------------------------
// INITIALIZATION OF CHART, actually initial render
renderCanva();
storageValRender(storageRangeEl.value);
transferValRender(transferRangeEl.value);
// ------------------------------------------------------------------



// ------------------------------------------------------------------
// HELPERS
function addData(chart, data, option) {
  chart.data.datasets.forEach((dataset) => {
    dataset.data = data;
  });
  chart.options = option;
  chart.update();
}

function removeData(chart) {
  chart.data.datasets.forEach((dataset) => {
    dataset.data = [];
  });
  chart.update();
}



// ------------------------------------------------------------------
// RENDER ELEMENTS
function renderCanva() {
  // Here I specially used Math.ceil with the rest of methods
  // to get "marketing" cost for services
  const firstVal = Math.ceil(backBlazeCalculator().toFixed(3) * 100) / 100;
  const secondVal = Math.ceil(bunnyCalculator().toFixed(3) * 100) / 100;
  const thirdVal = Math.ceil(scalewayCalculator().toFixed(3) * 100) / 100;
  const fourthVal = Math.ceil(vultrCalculator().toFixed(3) * 100) / 100;
  dataArr = [firstVal, secondVal, thirdVal, fourthVal];

  if (myChart) {
    removeData(myChart);
  }

  if (window.innerWidth >= BREAK_POINT) {
    addData(myChart, dataArr, optionsY);
  } else {
    addData(myChart, dataArr, optionsX);
  }

}

function storageValRender(value) {
  storageRangeLabelEl.innerHTML = `Storage: ${value}`;
}

function transferValRender(value) {
  transferRangeLabelEl.innerHTML = `Transfer: ${value}`;
}
// ------------------------------------------------------------------



// ------------------------------------------------------------------
// PRICE calculators
function backBlazeCalculator() {
  const storageValue = readFromLS().storageValue;
  const transferValue = readFromLS().transferValue;
  const minPayment = 7;
  const storagePrice = 0.005;
  const transferPrice = 0.01;
  let finalPayment;
  calcPayment = storageValue * storagePrice + transferValue * transferPrice;
  if (calcPayment < minPayment) {
    finalPayment = minPayment;
  } else {
    finalPayment = calcPayment;
  }
  return finalPayment;
}

function bunnyCalculator() {
  const storageValue = readFromLS().storageValue;
  const transferValue = readFromLS().transferValue;
  const type = readFromLS().bunny;
  const maxPayment = 10;
  let storagePrice;
  let transferPrice = 0.01;
  if (type === 'hdd') {
    storagePrice = 0.01;
  } else {
    storagePrice = 0.02;
  }
  let finalPayment;
  calcPayment = storageValue * storagePrice + transferValue * transferPrice;
  if (calcPayment > maxPayment) {
    finalPayment = maxPayment;
    return finalPayment;
  } else {
    finalPayment = calcPayment;
    // console.log('storageValue :>> ', storageValue);
    // console.log('transferValue :>> ', transferValue);
    // console.log('bunnyCalculator finalPayment :>> ', finalPayment);
    return finalPayment;
  }
}

function scalewayCalculator() {
  const storageValue = readFromLS().storageValue;
  const transferValue = readFromLS().transferValue;
  const type = readFromLS().scaleway;
  let storagePrice;
  let transferPrice;
  let finalPayment;

  if (transferValue > 75) {
    transferPrice = 0.02;
  } else {
    transferPrice = 0;
  }


  if (type === 'Multi' && storageValue <= 75) {
    finalPayment = 0;
    return finalPayment;
  }
  if (type === 'Single' && storageValue <= 75) {
    finalPayment = 0;
    return finalPayment;
  }
  if (type === 'Multi' && storageValue > 75) {
    storagePrice = 0.06;
    finalPayment = (storageValue - 75) * storagePrice + (transferValue - 75) * transferPrice;
    return finalPayment;
  }
  if (type === 'Single' && storageValue > 75) {
    storagePrice = 0.03;
    finalPayment = (storageValue - 75) * storagePrice + (transferValue - 75) * transferPrice;
    return finalPayment;
  }
}

function vultrCalculator() {
  const storageValue = readFromLS().storageValue;
  const transferValue = readFromLS().transferValue;
  const minPayment = 5;
  const storagePrice = 0.01;
  const transferPrice = 0.01;
  let finalPayment;
  calcPayment = storageValue * storagePrice + transferValue * transferPrice;
  if (calcPayment < minPayment) {
    finalPayment = minPayment;
  } else {
    finalPayment = calcPayment;
  }
  return finalPayment;
}
// ------------------------------------------------------------------



// ------------------------------------------------------------------
// Reading INTERFACE values
function getStorageValue(e) {
  let storageValue = Number(e.target.value);
  setPrepareDataToLS('storageValue', storageValue);
  renderCanva();
  storageValRender(storageValue);
}

function getTransferValue(e) {
  let transferValue = Number(e.target.value);
  setPrepareDataToLS('transferValue', transferValue);
  renderCanva();
  transferValRender(transferValue);
}
// ------------------------------------------------------------------



// ------------------------------------------------------------------
// Getting Radio Buttons Position
function hddOrSsd(e) {
  if (e.target.nodeName !== "INPUT") {
    return;
  }
  const selectedInput = e.target.value;
  setPrepareDataToLS('bunny', selectedInput);
  renderCanva();
}

function multiOrSingle(e) {
  const multiORsingle = e.target.value;
  setPrepareDataToLS('scaleway', multiORsingle);
  renderCanva();
}
// ------------------------------------------------------------------



// ------------------------------------------------------------------
// Work with LocalStorage
function readFromLS() {
  return JSON.parse(window.localStorage.getItem('chartSettings'));
}

function setPrepareDataToLS(title, value) {
  let tempObj = readFromLS();
  tempObj = {
    ...tempObj,
    [title]: value,
  };

  let prepareData = JSON.stringify(tempObj);
  window.localStorage.setItem('chartSettings', prepareData);
}
// ------------------------------------------------------------------