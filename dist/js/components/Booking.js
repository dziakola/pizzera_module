/* eslint-disable no-empty */
import { settings, select, templates, classNames } from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import utils from '../utils.js';
class Booking{
  constructor(element){   
    const thisBooking = this;
    //cały kontener booking przekazujemy do thisBooking.element z app.js
    thisBooking.element = element;
    thisBooking.table = [];
    thisBooking.starters = [];
    thisBooking.render(thisBooking.element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }
  //zbieranie danych z serwera + przekazanie danych do parseData
  getData(){
    const thisBooking = this;
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.dateWidget.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.dateWidget.maxDate);
    const repeatParam = settings.db.repeatParam;
    const noRepeatParam = settings.db.notRepeatParam;
    const params = {
      bookings:[
        startDateParam,
        endDateParam,
      ],
      eventsCurrent:[
        noRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        repeatParam,
        startDateParam,
      ],
    };
    const urls = {
      booking: settings.db.url + '/' + settings.db.bookings + '?' + params.bookings.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.events + '?'+ params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.events + '?'+ params.eventsRepeat.join('&'),
    };
    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json()
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
      
      
  }
  //przetworzenie danych z serwera i wysłanie do metody makeBooked + updateDom()
  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;
    thisBooking.booked = {};
    //petla dla wszystkich wyrażen jednorazowych
    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    const minDate = thisBooking.dateWidget.minDate;
    const maxDate = thisBooking.dateWidget.maxDate;
    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    thisBooking.updateDom();   
  }
  //przekazanie danych do obiektu thisBooking.booked
  makeBooked(date, hour, duration, table){
    const thisBooking = this;
    if(typeof (thisBooking.booked[date]) == 'undefined'){
      thisBooking.booked[date] = {};
    }
    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      if(typeof (thisBooking.booked[date][hourBlock]) == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
  }
  //rezerwacja klikniętego stolika i dodanie klasy reserved
  makeTableReservation(e){
    const thisBooking = this;
    let formChange = false;
    e.preventDefault();
    //jeśli kliknę na widget wyboru daty, godziny, ilości osób
    if(e.target == thisBooking.dom.peopleAmount || e.target == thisBooking.dom.hoursAmount 
      || e.target == thisBooking.dom.datePicker || e.target == thisBooking.dom.hoursPicker ){
      formChange = true;
    }
    
    for(let table of thisBooking.dom.tables){ 
      table.classList.remove('reserved');
      
      if(formChange){
        thisBooking.table.length = 0;
        table.classList.remove('reserved');
      }
      if(e.target.dataset.table == table.dataset.table){
        thisBooking.table.length = 0;
        //zajęty wcześniej
        if(table.classList.contains('booked')){
          alert('ten stolik jest zajęty!');
          //zajęty przed chwilą
        }else if(table.classList.contains('reserved')){
          table.classList.remove('reserved');
          thisBooking.table.splice(thisBooking.table[table.dataset.table], 1);
        }
        //wolny
        else{
          table.classList.add('reserved');
          thisBooking.table.push(table.dataset.table);
          console.log(thisBooking.table);
          
        }
        
      }
      
    }
  }
  //sprawdzenie czy stolik na daną date i godzine jest zajęty i dodanie klasy CSS booked
  updateDom(){
    const thisBooking = this;
    //zebranie danych z widgetu
    thisBooking.date = thisBooking.dateWidget.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourWidget.value);
    
    let allAvailable = false;

    if
    (
      //nie ma rezerwacji na ten dzień
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
    ||
    //nie ma rezerwacji na tą godzinę
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      //wolne
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }
      if(
        //jeśli w obiekcie jest taka data i godzina
        !allAvailable
        &&
        //i obiekt zawiera dane o tym stoliku
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        //dodaj / zabierz klasę CSS
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }
  addStarters(e){
    const thisBooking = this;
    if(e.target.tagName == 'INPUT' && e.target.type == 'checkbox' && e.target.name == 'starter'){
      if(e.target.checked){
        thisBooking.starters.push(e.target.value);
      }else if(!e.target.checked){
        thisBooking.starters.splice((thisBooking.starters.indexOf(e.target.value)),1);
      }
    }
    console.log(thisBooking.starters);
    
  }
  sendOrder(e){
    e.preventDefault();
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.bookings;
    let payload = {};
    console.log(thisBooking.table);
    
    thisBooking.booked.date = thisBooking.dateWidget.value; 
    thisBooking.booked.hour = thisBooking.hourWidget.value;
    thisBooking.booked.table = parseInt((thisBooking.table[0]));
    thisBooking.booked.duration = parseInt(thisBooking.hoursWidget.value);
    thisBooking.booked.ppl = parseInt(thisBooking.peopleWidget.value);
    thisBooking.booked.phone = thisBooking.dom.phone.value;
    thisBooking.booked.address = thisBooking.dom.address.value;
    thisBooking.booked.starters = thisBooking.starters;
    //adres endpointu, z którym chcemy się połączyć
    //const url = settings.db.url + '/' + settings.db.bookings;
    if(!thisBooking.booked.table){
      alert('nie wybrałeś stolika');
    }else{
      payload  = {
        'date': thisBooking.booked.date,
        'hour': thisBooking.booked.hour,
        'table': thisBooking.booked.table,
        'duration': thisBooking.booked.duration,
        'ppl': thisBooking.booked.ppl,
        'starters': thisBooking.booked.starters,
        'phone': thisBooking.booked.phone,
        'address': thisBooking.booked.address
      };
    }
    
    console.log(payload);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
      
    fetch(url, options);
  }
  render(element){
    const thisBooking = this;
    thisBooking.dom={};
    const generateHtml = templates.bookingWidget(thisBooking);
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generateHtml;
    thisBooking.dom.peopleAmount = element.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = element.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = element.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hoursPicker = element.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = element.querySelectorAll(select.booking.tables);
    thisBooking.dom.floorPlan = element.querySelector(select.booking.floorPlan);
    thisBooking.dom.phone = element.querySelector(select.booking.phone);
    thisBooking.dom.address = element.querySelector(select.booking.address);
    thisBooking.dom.submit = element.querySelector(select.booking.formSubmit);
    thisBooking.dom.starters = element.querySelector(select.widgets.starters.wrapper);
  }
  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleWidget = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursWidget = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.dateWidget = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourWidget = new HourPicker(thisBooking.dom.hoursPicker);
    
    thisBooking.dom.peopleAmount.addEventListener('click', function(){
    });
    thisBooking.dom.hoursAmount.addEventListener('click', function(){
    });
    thisBooking.dom.datePicker.addEventListener('click', function(){
    });
    thisBooking.dom.hoursPicker.addEventListener('click', function(){
    });
    thisBooking.dom.wrapper.addEventListener('updated', function(e){
      thisBooking.makeTableReservation(e);
      thisBooking.updateDom();     
    });
    thisBooking.dom.floorPlan.addEventListener('click', function(e){
      thisBooking.makeTableReservation(e);
    });
    thisBooking.dom.submit.addEventListener('click', function(e){
      thisBooking.sendOrder(e);
    });
    thisBooking.dom.starters.addEventListener('change', function(e){
      thisBooking.addStarters(e);
    });
    
  }
}
export default Booking;