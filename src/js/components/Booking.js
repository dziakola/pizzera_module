import { select, templates } from '../settings.js';
import AmountWidget from './AmountWidget.js';
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
  }
  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleWidget = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursWidget = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.dom.peopleAmount.addEventListener('click', function(){
    });
    thisBooking.dom.hoursAmount.addEventListener('click', function(){
    });
  }
}
export default Booking;