import { select, templates } from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
class Booking{
  constructor(element){   
    const thisBooking = this;
    //cały kontener booking przekazujemy do thisBooking.element z app.js
    thisBooking.element = element;
    thisBooking.render(thisBooking.element);
    thisBooking.initWidgets();
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
  }
}
export default Booking;