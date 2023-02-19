import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import { select, classNames, templates } from '../settings.js';
class Product {
  constructor(id, data){
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data;
    thisProduct.renderInMenu();
    thisProduct.getElements();     
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
  }
  renderInMenu(){
    const thisProduct = this;
    /*wygenerowanie html za pomocą szablonów*/
    const generateHtml = templates.menuProduct(thisProduct.data);
    /* utworzenie elementu DOM z generateHtml */
    thisProduct.element = utils.createDOMFromHTML(generateHtml);
    /* odnalezienie kontenera produktów */
    const menuContainer = document.querySelector(select.containerOf.menu);
    /*dodajemy element do menu */
    menuContainer.appendChild(thisProduct.element);
  }
  getElements(){
    /*elementów szukamy zawsze w pojedynczym produkcie, nie całym elemencie*/
    const thisProduct = this;
    /*thisProduct.element - to każdy kolejny produkt, zawierający dane o selektorze*/
    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    /*selektor do diva z inputem i buttonami*/
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }
  initAccordion(){
    const thisProduct = this;
    /* find the clickable trigger (the element that should react to clicking) */
    /* START: add event listener to clickable trigger on event click */
    thisProduct.accordionTrigger.addEventListener('click', function(event) {
      event.preventDefault();
      /* find active product (product that has active class) */
      const activeProduct = document.querySelector(select.all.menuProductsActive);
      /* if there is active product and it's not thisProduct.element, remove class active from it */
      if((activeProduct) && activeProduct !== thisProduct.element){
        activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
      } //else w tym momencie powoduje ze sa tylko 2 opcje
      /* toggle active class on thisProduct.element */
      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
    });
  }
  initOrderForm(){
    const thisProduct = this;
    thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });
      
    for(let input of thisProduct.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }
      
    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }
  processOrder(){
    const thisProduct = this;
    // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.form);
    // set price to default price
    let price = thisProduct.data.price;
    // for every category (param)...
    for(let paramId in thisProduct.data.params) {
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];
        
      // for every option in this category
      for(let optionId in param.options) {
        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionId];
        const optImg = thisProduct.imageWrapper.querySelector(`.${paramId}-${optionId}`);
          
        if(optImg){           
          optImg.classList.remove('active');           
        }
        
        if(formData[paramId].includes(optionId)){
          if((!option['default'])){
            price = price + option['price'];}
          if(optImg){
            optImg.classList.add('active');
          }
        }
        if(!formData[paramId].includes(optionId)){
          if((option['default'])){
            price = price - option['price'];
          }
          if(optImg){
            optImg.classList.remove('active');
          }
        } 
      }
    }
    // update calculated price in the HTML
    price *= thisProduct.amountWidget.value;
    thisProduct.priceElem.innerHTML = price;
    thisProduct.priceSingle = price;
  }
  prepareCartProductParams(){
    const thisProduct = this;
    // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.form);
    const params ={};
    // for every category (param)...
    for(let paramId in thisProduct.data.params) {
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];
      params[paramId] = {
        label: param.label,
        options:{
        }
      };
      for(let optionId in param.options) {
        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionId];
        /*sprawdzenie czy opcje są wybrane*/
        if(formData[paramId] && formData[paramId].includes(optionId)){
          params[paramId].options[optionId] = option.label; 
        }
      }   
    }
    /*stworzenie obiektu z podsumowaniem*/
    return params; 
  }    
  initAmountWidget(){
    const thisProduct = this;
    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    thisProduct.amountWidgetElem.addEventListener('updated', function(){
      thisProduct.processOrder();
    });     
  }
  prepareCartProduct(){
    const thisProduct = this;
    const productSummary = {
      id:thisProduct.id,
      name:thisProduct.data.name,
      amount:thisProduct.amountWidget.value,
      priceSingle:thisProduct.data.price,
      price:thisProduct.priceSingle,
      params: thisProduct.prepareCartProductParams(),
    };
    return productSummary;
  }
  addToCart(){
    const thisProduct = this;
    /*metoda add klasy Cart*/
    /*przekazanie obiektu productSummary*/
    
    const event = new CustomEvent('add-to-cart', {
      bubbles:true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      }
    });
    thisProduct.element.dispatchEvent(event);
  }
    
}
export default Product;