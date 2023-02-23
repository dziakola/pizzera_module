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
    thisBooking.render(thisBooking.element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }
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
  updateDom(){
    const thisBooking = this;
    thisBooking.date = thisBooking.dateWidget.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourWidget.value);
    
    let allAvailable = false;

    if
    (
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
    ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }
      if(
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
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
    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDom();
    });
  }
}
export default Booking;