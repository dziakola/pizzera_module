class BaseWidget{
  constructor(wrapperElement, initialValue){
    const thisWidget = this;
    thisWidget.dom = {};
    thisWidget.dom.wrapper = wrapperElement;
    
    thisWidget.correctValue = initialValue;  
    //czyli settings.amountWidget.defaultValue   
  }
  get value(){
    const thisWidget = this;
    return thisWidget.correctValue;
  }
  set value(value){
    const thisWidget = this;
    const newValue = this.parseValue(value);
    /*dodanie walidacji*/
    /*zapisanie przekazanego argumentu do value*/
    if(thisWidget.correctValue!==newValue && thisWidget.isValid(newValue)){
      thisWidget.correctValue = newValue;
      /*aktualizacja wartości inputu*/
      thisWidget.dom.input.value = thisWidget.correctValue;
      thisWidget.announce();
    }
    thisWidget.renderValue();
  }
  setValue(value){
    const thisWidget = this;
    thisWidget.value = value;
  }
  parseValue(value){
    //zamieniamy na liczbe, bo to co wprowadza użytkownik jest tekstem
    return parseInt(value);
  }
  isValid(value){
    return !isNaN(value);
  }
  renderValue(){
    const thisWidget = this;
    thisWidget.dom.wrapper.innerHTML= thisWidget.value;
  }
  announce(){
    const thisWidget = this;
    const event = new CustomEvent('updated', {bubbles:true});
    thisWidget.dom.wrapper.dispatchEvent(event);
  }
}
export default BaseWidget;